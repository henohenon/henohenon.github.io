/**
 * generate-theme.ts
 *
 * VocaDB から直近の人気 Vocaloid 曲をランダムに 1 曲選び、
 * その曲のタグ・歌詞を Claude API に投げて `src/styles/theme.css` を上書きする。
 *
 * 失敗時は既存の theme.css を温存する (前日のテーマが残る = 仕様)。
 */

import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const { values: cliArgs } = parseArgs({
  options: {
    "song-id": { type: "string" },
    song: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  strict: true,
  allowPositionals: false,
});

const HELP = `usage: bun run generate-theme [options]

選曲モード (どれか 1 つ。指定なしなら blacklist + lyrics ベースの自動選曲):
  --song-id <id>     VocaDB の曲 ID を直接指定 (例: --song-id 1501)
  --song <query>     クエリ検索の先頭ヒットを採用 (例: --song "ローリンガール")
  -h, --help         このヘルプを表示

環境変数:
  THEME_BACKEND      cli | sdk (デフォルト: ANTHROPIC_API_KEY あれば sdk、なければ cli)
  CLAUDE_BIN         claude バイナリパス (CLI モード)
  ANTHROPIC_API_KEY  API キー (SDK モード)
`;

if (cliArgs.help) {
  console.log(HELP);
  process.exit(0);
}
if (cliArgs["song-id"] && cliArgs.song) {
  console.error("--song-id と --song は同時指定できません");
  process.exit(2);
}

const THEME_PATH = path.resolve("src/styles/theme.css");
const THEME_SOURCE_PATH = path.resolve("src/data/theme-source.json");
const USED_SONGS_PATH = path.resolve("src/data/used-songs.json");
const OG_SVG_PATH = path.resolve("public/og.svg");
const OG_ARTICLE_TEMPLATE_PATH = path.resolve("public/og.article-template.svg");
const VOCADB_BASE = "https://vocadb.net/api";
/** 「直近の人気曲」を取るローリングウィンドウ (日数) */
const WINDOW_DAYS = 30;
/** VocaDB から一度に取る候補数。blacklist で消しても余る程度の余裕を持つ */
const POOL_SIZE = 50;
const MODEL = "claude-sonnet-4-6";

const TagSchema = z.object({
  tag: z.object({
    name: z.string(),
    categoryName: z.string().nullish(),
  }),
});

const SongSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  artistString: z.string(),
  ratingScore: z.number(),
  tags: z.array(TagSchema).default([]),
});

const LyricSchema = z.object({
  value: z.string(),
  cultureCodes: z.array(z.string()).default([]),
});

const SongDetailSchema = SongSummarySchema.extend({
  lyrics: z.array(LyricSchema).default([]),
});

const SongListSchema = z.object({
  items: z.array(SongDetailSchema),
});

const UsedSongsSchema = z.object({
  songIds: z.array(z.number()),
});

type SongDetail = z.infer<typeof SongDetailSchema>;

async function readUsedSongIds(): Promise<number[]> {
  try {
    const raw = await readFile(USED_SONGS_PATH, "utf8");
    return UsedSongsSchema.parse(JSON.parse(raw)).songIds;
  } catch {
    return [];
  }
}

async function appendUsedSongId(id: number): Promise<void> {
  const current = await readUsedSongIds();
  if (current.includes(id)) return;
  current.push(id);
  await writeFile(USED_SONGS_PATH, `${JSON.stringify({ songIds: current }, null, 2)}\n`, "utf8");
}

/**
 * 直近 WINDOW_DAYS 日で RatingScore 上位 POOL_SIZE 曲を、歌詞付きで取得する。
 * 1 回の API コールで歌詞・タグ含む詳細が全部返ってくる。
 */
async function fetchPool(): Promise<SongDetail[]> {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - WINDOW_DAYS);
  const afterDate = start.toISOString().slice(0, 10);

  const url = new URL(`${VOCADB_BASE}/songs`);
  url.searchParams.set("sort", "RatingScore");
  url.searchParams.set("maxResults", String(POOL_SIZE));
  url.searchParams.set("songTypes", "Original");
  url.searchParams.set("fields", "Lyrics,Tags");
  url.searchParams.set("lang", "Default");
  url.searchParams.set("afterDate", afterDate);

  console.log(`    window: [${afterDate}, now] (size=${POOL_SIZE})`);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`VocaDB fetch failed: ${res.status}`);

  return SongListSchema.parse(await res.json()).items;
}

type PickResult = { song: SongDetail; tier: "fresh+lyrics" | "stale+lyrics" | "fresh-no-lyrics" };

/**
 * pool から「未使用 × 歌詞あり」を最優先で 1 曲選ぶ。
 * フォールバック順:
 *   1. fresh+lyrics   blacklist 外で歌詞ありの最上位
 *   2. stale+lyrics   blacklist 内でも歌詞ありの最上位 (= 過去ピック済の再利用)
 *   3. fresh-no-lyrics blacklist 外で歌詞なしも許容して最上位
 */
function pickFromPool(pool: SongDetail[], blacklist: Set<number>): PickResult {
  const hasLyric = (s: SongDetail) => pickLyric(s) !== null;
  const notUsed = (s: SongDetail) => !blacklist.has(s.id);

  const freshLyric = pool.find((s) => notUsed(s) && hasLyric(s));
  if (freshLyric) return { song: freshLyric, tier: "fresh+lyrics" };

  const staleLyric = pool.find(hasLyric);
  if (staleLyric) return { song: staleLyric, tier: "stale+lyrics" };

  const freshAny = pool.find(notUsed);
  if (freshAny) return { song: freshAny, tier: "fresh-no-lyrics" };

  throw new Error("pool is empty");
}

async function fetchSongDetail(id: number): Promise<SongDetail> {
  const url = new URL(`${VOCADB_BASE}/songs/${id}`);
  url.searchParams.set("fields", "Lyrics,Tags");
  url.searchParams.set("lang", "Default");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`VocaDB song fetch failed: ${res.status}`);

  return SongDetailSchema.parse(await res.json());
}

async function searchSong(query: string): Promise<SongDetail> {
  const url = new URL(`${VOCADB_BASE}/songs`);
  url.searchParams.set("query", query);
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("fields", "Lyrics,Tags");
  url.searchParams.set("lang", "Default");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`VocaDB search failed: ${res.status}`);

  const first = SongListSchema.parse(await res.json()).items[0];
  if (!first) throw new Error(`no song matched query: "${query}"`);
  return first;
}

function pickLyric(detail: SongDetail): string | null {
  // 日本語 → 英語 → 最初に見つかったもの の優先で 1 言語ぶん使う
  const jp = detail.lyrics.find((l) => l.cultureCodes.includes("ja"));
  if (jp) return jp.value;
  const en = detail.lyrics.find((l) => l.cultureCodes.includes("en"));
  if (en) return en.value;
  return detail.lyrics[0]?.value ?? null;
}

function buildUserMessage(detail: SongDetail): string {
  const tagNames = detail.tags
    .map((t) => t.tag.name)
    .filter((n) => n.length > 0)
    .slice(0, 15);
  const lyric = pickLyric(detail)?.slice(0, 1500) ?? "(歌詞なし)";

  // 曲を信じる。曲名と歌詞を主役に置き、タグは補助情報として末尾に。
  return [
    "# 今日の曲",
    `${detail.name} / ${detail.artistString}`,
    "",
    "## 歌詞 (抜粋)",
    lyric,
    "",
    "## 補助タグ (参考程度)",
    tagNames.join(", ") || "(タグなし)",
  ].join("\n");
}

const SYSTEM_PROMPT = `あなたはこのブログ "へのへのんのの" の毎日の見た目を CSS だけで翻訳するデザイナーです。
ユーザーから渡される今日の Vocaloid 曲 (曲名 / アーティスト / 歌詞 + 補助タグ) の雰囲気を読み取り、
\`src/styles/theme.css\` の中身を生成してください。

**曲名と歌詞を主に読み取ること。タグはあくまで補助情報** (タグだけに引っ張られない)。

## 必ず守ること

- 出力は **純粋な CSS のみ**。説明文・コードフェンス (\`\`\`) は禁止
- 以下の CSS 変数を \`:root\` で全部定義する (base.css がこれに依存):
  - \`--color-fg\`, \`--color-bg\`, \`--color-accent\`
  - \`--spacing-unit\` (rem 単位推奨)
  - \`--font-heading\`, \`--font-body\` (システムフォントスタックでよい)
  - \`--line-height-body\`, \`--line-height-heading\`
  - \`--ease-default\`
- \`@media (prefers-reduced-motion: reduce)\` ブロックを必ず含める
  (中で animation と transition を none !important にする)
- 本文と背景は WCAG AA (コントラスト比 4.5:1 以上) を意識する
- 日本語のシステムフォントを \`--font-body\` に含める ('Hiragino Sans', 'Yu Gothic' など)
- ファイル先頭にコメントで「曲名 / アーティスト / 一言ムード」を残す

## 自由に決めてよいこと

- 配色 (曲の雰囲気に合わせて大胆に)
- フォント選択 (欧文)
- セレクタを追加してアニメーション・装飾を盛る
- \`.site-header\`, \`.site-footer\`, \`.post-list\`, \`article.post\` といったクラスへの色付け

## 禁止

- HTML 構造の変更を前提とするセレクタ
- 外部リソースの \`@import\`
- \`!important\` の濫用 (\`prefers-reduced-motion\` ブロック以外)`;

/**
 * LLM 呼び出しの抽象。別 AI に差し替えたいときは新しい ThemeBackend を作って
 * pickBackend に足すだけで済む。
 */
interface ThemeBackend {
  readonly name: string;
  generate(system: string, user: string): Promise<string>;
}

async function callClaudeSdk(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text block");
  }
  return textBlock.text;
}

/**
 * Claude Code CLI (`claude -p`) を子プロセスで起動して呼び出す。
 * ローカル開発時の API 課金回避用。CLI 認証 (Pro/Max サブスク) を流用する。
 *
 * - cwd は tmpdir に固定し、プロジェクトの CLAUDE.md が auto-discovery されないようにする
 * - 全ツールをブロック (純粋にテキスト生成だけしてほしい)
 * - バイナリは PATH の `claude` か、`CLAUDE_BIN` 環境変数で上書き可
 */
async function callClaudeCli(system: string, user: string): Promise<string> {
  const binary = process.env.CLAUDE_BIN ?? "claude";

  return new Promise((resolve, reject) => {
    const proc = spawn(
      binary,
      [
        "--print",
        "--output-format",
        "text",
        "--system-prompt",
        system,
        "--disallowed-tools",
        "Bash,Edit,Write,Read,WebFetch,WebSearch,Agent,TodoWrite,NotebookEdit",
      ],
      { stdio: ["pipe", "pipe", "inherit"], cwd: tmpdir() },
    );

    let out = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      out += chunk.toString("utf8");
    });
    proc.on("error", (err) => {
      reject(
        new Error(
          `failed to spawn '${binary}'. install Claude Code CLI or set CLAUDE_BIN. (${err.message})`,
        ),
      );
    });
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`claude exited with code ${code}`));
      else resolve(out);
    });
    proc.stdin.write(user);
    proc.stdin.end();
  });
}

const sdkBackend: ThemeBackend = { name: "sdk", generate: callClaudeSdk };
const cliBackend: ThemeBackend = { name: "cli", generate: callClaudeCli };

function pickBackend(): ThemeBackend {
  const explicit = process.env.THEME_BACKEND?.toLowerCase();
  if (explicit === "sdk") return sdkBackend;
  if (explicit === "cli") return cliBackend;
  return process.env.ANTHROPIC_API_KEY ? sdkBackend : cliBackend;
}

const OG_SYSTEM_PROMPT = `あなたはこのブログ "へのへのんのの" のサイト全体用 OGP カード (1200x630) を SVG 1枚で描くデザイナーです。

ユーザーから今日の曲情報と、生成済みの \`theme.css\` が渡されます。
**theme.css の配色 / 雰囲気と整合する OGP** を作ってください。

## 優先度 (重要)

このカードは「サイトの顔」です。情報の主従はこの順:

1. **主役: サイト名 "へのへのんのの"** — カードの中で一番目を引く位置・サイズに配置 (画面中央〜上半分、\`font-size\` 100〜150 程度の大見出し相当)
2. **副題: 今日の曲名** — サイト名の下や脇に控えめに添える (\`font-size\` 28〜44 程度、サイト名より明確に小さく)
3. アーティスト名・タグ等の追加情報は副題よりさらに小さく / 任意

曲名がサイト名より大きく / 目立つレイアウトにはしないこと (曲はあくまで「今日の見た目を引っ張ってきた出典」であり、シェアされた人が見るのはサイトそのもの)。

## 必須

- ルート要素は \`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">\`
- 背景全面塗り (theme.css の \`--color-bg\` と同じ色)
- サイト名 "へのへのんのの" を主役として大きく配置 (theme.css の \`--color-fg\` 系の色)
- 今日の曲名は副題として含める (\`--color-accent\` 等で控えめに)
- 出力は **純粋な SVG のみ**。説明文・コードフェンス (\`\`\`) 禁止

## 禁止

- \`<script>\`, \`<foreignObject>\`, \`<image href="http...">\`, \`@import\` 等の外部参照
- \`font-family\` は \`'serif'\` / \`'sans-serif'\` / \`'monospace'\` のいずれかのみ
- width / height / viewBox の値を変える

## 自由

- 装飾 (パターン / 図形 / グラデ / 罫線 等) は曲調に合わせて自由
- サイト名の位置・タイポ・装飾も曲調に合わせて自由 (主役である限り)`;

function sanitizeSvg(text: string): string {
  return text
    .replace(/^```(?:svg|xml)?\s*\n/, "")
    .replace(/\n```\s*$/, "")
    .trim();
}

function validateSvgBase(svg: string): void {
  if (!/^<svg\b/.test(svg)) throw new Error("not an svg");
  if (!/width=["']1200["']/.test(svg)) throw new Error("missing width=1200");
  if (!/height=["']630["']/.test(svg)) throw new Error("missing height=630");
  if (/<script\b/i.test(svg)) throw new Error("<script> forbidden");
  if (/<foreignObject\b/i.test(svg)) throw new Error("<foreignObject> forbidden");
  if (/@import|<image[^>]+href=["']https?:/i.test(svg)) {
    throw new Error("external resource forbidden");
  }
  const fonts = [...svg.matchAll(/font-family=["']([^"']+)["']/g)];
  for (const m of fonts) {
    const fam = (m[1] ?? "").trim().toLowerCase();
    if (fam !== "serif" && fam !== "sans-serif" && fam !== "monospace") {
      throw new Error(`unsafe font-family: ${m[1]}`);
    }
  }
}

function validateOgSvg(svg: string): void {
  validateSvgBase(svg);
}

function validateArticleTemplateSvg(svg: string): void {
  validateSvgBase(svg);
  if (!/\{\{\s*TITLE\s*\}\}/.test(svg)) {
    throw new Error("missing {{TITLE}} placeholder");
  }
  // {{TITLE}} 以外のプレースホルダ記法は build 時に置換されないので拒否
  const extras = [...svg.matchAll(/\{\{\s*([A-Z_][A-Z0-9_]*)\s*\}\}/g)]
    .map((m) => m[1])
    .filter((n): n is string => typeof n === "string" && n !== "TITLE");
  if (extras.length > 0) {
    throw new Error(`unknown placeholders: ${[...new Set(extras)].join(", ")}`);
  }
}

async function generateOgSvg(detail: SongDetail, themeCss: string): Promise<string> {
  const backend = pickBackend();
  console.log(`    using backend: ${backend.name}`);
  const user = [
    "# 今日の曲",
    `${detail.name} / ${detail.artistString}`,
    "",
    "# 生成済みの theme.css (これと整合する OGP を作って)",
    "```css",
    themeCss,
    "```",
  ].join("\n");
  const raw = await backend.generate(OG_SYSTEM_PROMPT, user);
  return sanitizeSvg(raw);
}

const OG_ARTICLE_TEMPLATE_SYSTEM_PROMPT = `あなたはこのブログ "へのへのんのの" の **記事ページ用 OGP テンプレート** (1200x630 SVG) を描くデザイナーです。

ユーザーから「今日の曲情報」と「生成済み theme.css」が渡されます。
theme.css の配色 / 雰囲気と整合する**テンプレート**を作ってください。
このテンプレートは複数の記事ページで使い回され、\`{{TITLE}}\` 部分だけビルド時に各記事のタイトルへ差し替えられます。

## 必須

- ルート要素は \`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">\`
- 背景全面塗り (theme.css の \`--color-bg\` と同じ色)
- サイト名 "へのへのんのの" をどこかに含める (\`--color-fg\` 系の色で)
- **記事タイトルが入る位置に、文字列 \`{{TITLE}}\` をそのまま書く**
  - 例: \`<text x="60" y="320" font-family="serif" font-size="80" fill="...">{{TITLE}}</text>\`
  - これがビルド時に各記事の実タイトル (XML エスケープ済み) に置換される
  - グラデ塗り + ストローク overlay 等で同じ位置に 2 回書くのは OK (全 \`{{TITLE}}\` は同じ文字列に置換される)
  - 文字列を分解して \`{{TITLE}}\` を別々の \`<text>\` に分けるのは禁止 (例: 半分ずつに割らない)
  - \`{{TITLE}}\` 以外のプレースホルダ (\`{{XXX}}\`) は使わないこと
- 出力は **純粋な SVG のみ**。説明文・コードフェンス (\`\`\`) 禁止

## デザインの指針

- 今日の曲の雰囲気 (theme.css の配色 / ムード / ジャンル感) を反映した装飾を入れる
  (背景パターン / 図形 / グラデ / 罫線 など、サイト全体の og.svg と同じトーン)
- ただし **曲名・アーティスト名は入れない** (それはサイト全体の og.svg の役割)
- 記事タイトルは 30 文字程度の日本語が 1〜2 行で収まるフォントサイズで配置
  (\`font-size\` 60〜84 あたりが目安。テンプレなので長文には完全対応しなくてよい)
- タイトル領域は画面の主役にする (余白を確保、装飾で潰さない)

## 禁止

- \`<script>\`, \`<foreignObject>\`, \`<image href="http...">\`, \`@import\` 等の外部参照
- \`font-family\` は \`'serif'\` / \`'sans-serif'\` / \`'monospace'\` のいずれかのみ
- width / height / viewBox の値を変える
- \`{{TITLE}}\` を文字単位で分解する (例: 「タ」と「イトル」に分ける)`;

async function generateOgArticleTemplate(detail: SongDetail, themeCss: string): Promise<string> {
  const backend = pickBackend();
  console.log(`    using backend: ${backend.name}`);
  const user = [
    "# 今日の曲",
    `${detail.name} / ${detail.artistString}`,
    "",
    "# 生成済みの theme.css (これと整合する記事 OGP テンプレートを作って)",
    "```css",
    themeCss,
    "```",
    "",
    "# 注意",
    "記事タイトルの位置には必ず文字列 `{{TITLE}}` を 1 つだけ書く (ビルド時に置換される)。",
  ].join("\n");
  const raw = await backend.generate(OG_ARTICLE_TEMPLATE_SYSTEM_PROMPT, user);
  return sanitizeSvg(raw);
}

async function generateThemeCss(detail: SongDetail): Promise<string> {
  const backend = pickBackend();
  console.log(`    using backend: ${backend.name}`);
  const raw = await backend.generate(SYSTEM_PROMPT, buildUserMessage(detail));
  return sanitizeCss(raw);
}

async function pickSong(): Promise<SongDetail> {
  const id = cliArgs["song-id"];
  if (id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error(`--song-id must be a positive integer: ${id}`);
    }
    console.log(`[1/5] fetching song by id=${n}...`);
    return fetchSongDetail(n);
  }

  const query = cliArgs.song;
  if (query) {
    console.log(`[1/5] searching VocaDB for "${query}"...`);
    return searchSong(query);
  }

  console.log("[1/5] fetching pool from VocaDB...");
  const pool = await fetchPool();
  console.log("    picking (filter: 未使用 × 歌詞あり)...");
  const blacklist = new Set(await readUsedSongIds());
  const { song, tier } = pickFromPool(pool, blacklist);
  console.log(`    tier=${tier}`);
  return song;
}

function sanitizeCss(text: string): string {
  // 念のためコードフェンスが付いてきたら剥がす
  return text
    .replace(/^```(?:css)?\s*\n/, "")
    .replace(/\n```\s*$/, "")
    .trim();
}

function validateCss(css: string): void {
  const required = [
    "--color-fg",
    "--color-bg",
    "--spacing-unit",
    "--font-body",
    "prefers-reduced-motion",
  ];
  const missing = required.filter((tok) => !css.includes(tok));
  if (missing.length > 0) {
    throw new Error(`generated CSS is missing required tokens: ${missing.join(", ")}`);
  }
}

async function main(): Promise<void> {
  const detail = await pickSong();
  console.log(`    "${detail.name}" / ${detail.artistString} (score=${detail.ratingScore})`);

  console.log("[2/5] calling Claude for theme.css...");
  const css = await generateThemeCss(detail);
  validateCss(css);

  await writeFile(THEME_PATH, `${css}\n`, "utf8");

  const source = {
    songId: detail.id,
    songName: detail.name,
    artist: detail.artistString,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(THEME_SOURCE_PATH, `${JSON.stringify(source, null, 2)}\n`, "utf8");
  await appendUsedSongId(detail.id);
  console.log("[3/5] wrote theme.css, theme-source.json, used-songs.json");

  console.log("[4/5] generating OGP svg (site)...");
  try {
    const ogSvg = await generateOgSvg(detail, css);
    validateOgSvg(ogSvg);
    await writeFile(OG_SVG_PATH, `${ogSvg}\n`, "utf8");
    console.log("    wrote", OG_SVG_PATH);
  } catch (err) {
    console.error("    OGP generation failed, keeping yesterday's og.svg:", err);
  }

  console.log("[5/5] generating OGP article template...");
  try {
    const articleSvg = await generateOgArticleTemplate(detail, css);
    validateArticleTemplateSvg(articleSvg);
    await writeFile(OG_ARTICLE_TEMPLATE_PATH, `${articleSvg}\n`, "utf8");
    console.log("    wrote", OG_ARTICLE_TEMPLATE_PATH);
  } catch (err) {
    console.error(
      "    article template generation failed, keeping yesterday's og.article-template.svg:",
      err,
    );
  }

  // bot コミット用の情報を stdout に流す (CI で読む)
  console.log("META=", JSON.stringify({ songId: detail.id, songName: detail.name }));
}

main().catch(async (err) => {
  console.error("theme generation failed:", err);
  // 既存ファイルが残っていることを確認だけして 0 で抜ける (= 静かに失敗)
  try {
    await readFile(THEME_PATH, "utf8");
    console.error("existing theme.css is preserved.");
  } catch {
    console.error("WARNING: no existing theme.css found.");
  }
  process.exitCode = 1;
});
