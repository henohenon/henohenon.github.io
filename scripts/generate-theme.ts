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
    console.log(`[1/4] fetching song by id=${n}...`);
    return fetchSongDetail(n);
  }

  const query = cliArgs.song;
  if (query) {
    console.log(`[1/4] searching VocaDB for "${query}"...`);
    return searchSong(query);
  }

  console.log("[1/4] fetching pool from VocaDB...");
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

  console.log("[2/3] calling Claude...");
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

  // bot コミット用の情報を stdout に流す (CI で読む)
  console.log("[3/3] wrote theme.css, theme-source.json, used-songs.json");
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
