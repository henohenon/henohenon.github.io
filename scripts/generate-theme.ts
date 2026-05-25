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
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const THEME_PATH = path.resolve("src/styles/theme.css");
const THEME_SOURCE_PATH = path.resolve("src/data/theme-source.json");
const VOCADB_BASE = "https://vocadb.net/api";
/** 「直近の人気曲」を取る上限ウィンドウ。前回生成からの日数とこの値の長い方を採る */
const MAX_WINDOW_DAYS = 14;
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

const SongListSchema = z.object({
  items: z.array(SongSummarySchema),
});

const LyricSchema = z.object({
  value: z.string(),
  cultureCodes: z.array(z.string()).default([]),
});

const SongDetailSchema = SongSummarySchema.extend({
  lyrics: z.array(LyricSchema).default([]),
});

const ThemeSourceSchema = z.object({
  songId: z.number().nullable(),
  songName: z.string().nullable(),
  artist: z.string().nullable(),
  generatedAt: z.string().nullable(),
});

type SongSummary = z.infer<typeof SongSummarySchema>;
type SongDetail = z.infer<typeof SongDetailSchema>;

async function readLastGeneratedAt(): Promise<Date | null> {
  try {
    const raw = await readFile(THEME_SOURCE_PATH, "utf8");
    const parsed = ThemeSourceSchema.parse(JSON.parse(raw));
    return parsed.generatedAt ? new Date(parsed.generatedAt) : null;
  } catch {
    return null;
  }
}

function resolveWindowStart(last: Date | null): Date {
  const cap = new Date();
  cap.setUTCDate(cap.getUTCDate() - MAX_WINDOW_DAYS);
  if (!last) return cap;
  // last と cap の遅い方 (= 短いウィンドウ) を採用
  return last > cap ? last : cap;
}

/**
 * `[前回生成 or 14日前, now]` の範囲で RatingScore 最上位の 1 曲を取る。
 * ランダム選定はしない (情報量を担保したいので、確実に人気のある曲を狙う)。
 */
async function fetchLatestTopSong(): Promise<SongSummary> {
  const last = await readLastGeneratedAt();
  const start = resolveWindowStart(last);
  const afterDate = start.toISOString().slice(0, 10);

  const url = new URL(`${VOCADB_BASE}/songs`);
  url.searchParams.set("sort", "RatingScore");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("songTypes", "Original");
  url.searchParams.set("fields", "Tags");
  url.searchParams.set("lang", "Default");
  url.searchParams.set("afterDate", afterDate);

  console.log(`    window: [${afterDate}, now] (last=${last?.toISOString() ?? "null"})`);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`VocaDB fetch failed: ${res.status}`);

  const list = SongListSchema.parse(await res.json());
  const top = list.items[0];
  if (!top) throw new Error(`no songs found in window since ${afterDate}`);
  return top;
}

async function fetchSongDetail(id: number): Promise<SongDetail> {
  const url = new URL(`${VOCADB_BASE}/songs/${id}`);
  url.searchParams.set("fields", "Lyrics,Tags");
  url.searchParams.set("lang", "Default");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`VocaDB song fetch failed: ${res.status}`);

  return SongDetailSchema.parse(await res.json());
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

type Backend = "sdk" | "cli";

function pickBackend(): Backend {
  const explicit = process.env.THEME_BACKEND?.toLowerCase();
  if (explicit === "sdk" || explicit === "cli") return explicit;
  return process.env.ANTHROPIC_API_KEY ? "sdk" : "cli";
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

async function generateThemeCss(detail: SongDetail): Promise<string> {
  const backend = pickBackend();
  console.log(`    using backend: ${backend}`);
  const user = buildUserMessage(detail);
  const raw =
    backend === "sdk"
      ? await callClaudeSdk(SYSTEM_PROMPT, user)
      : await callClaudeCli(SYSTEM_PROMPT, user);
  return sanitizeCss(raw);
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
  console.log("[1/3] picking latest top song from VocaDB...");
  const picked = await fetchLatestTopSong();
  console.log(
    `    picked: "${picked.name}" / ${picked.artistString} (score=${picked.ratingScore})`,
  );

  const detail = await fetchSongDetail(picked.id);
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

  // bot コミット用の情報を stdout に流す (CI で読む)
  console.log("[3/3] wrote", THEME_PATH, "and", THEME_SOURCE_PATH);
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
