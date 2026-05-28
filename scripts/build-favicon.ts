/**
 * build-favicon.ts
 *
 * `public/favicon.template.svg` の `{{BG}}` / `{{FG}}` を theme.css の
 * `--color-bg` / `--color-accent` で置換して `public/favicon.svg` に書き出す。
 *
 * - `bun run dev` (predev) と `bun run build` (prebuild) の両方で走る
 * - `public/` 配下に置くことで dev server と Astro 本番ビルドの双方が拾える
 * - 出力先 `public/favicon.svg` は .gitignore (生成物)
 *
 * テンプレ or theme.css が無い場合は何もしない (静かに失敗)。
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const FAVICON_TEMPLATE_PATH = path.resolve("public/favicon.template.svg");
const FAVICON_OUTPUT_PATH = path.resolve("public/favicon.svg");
const THEME_CSS_PATH = path.resolve("src/styles/theme.css");

/** theme.css から `--color-xxx: value;` の値を取り出す (簡易パース) */
function extractCssVar(css: string, name: string, fallback: string): string {
  const re = new RegExp(`${name}\\s*:\\s*([^;]+);`);
  const m = css.match(re);
  return m?.[1]?.trim() ?? fallback;
}

/** XML / SVG 用の最小エスケープ */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main(): Promise<void> {
  if (!existsSync(FAVICON_TEMPLATE_PATH)) {
    console.warn(`[build-favicon] ${FAVICON_TEMPLATE_PATH} not found — skip`);
    return;
  }
  if (!existsSync(THEME_CSS_PATH)) {
    console.warn(`[build-favicon] ${THEME_CSS_PATH} not found — skip`);
    return;
  }

  const template = await readFile(FAVICON_TEMPLATE_PATH, "utf8");
  const themeCss = await readFile(THEME_CSS_PATH, "utf8");
  const bg = extractCssVar(themeCss, "--color-bg", "#fafafa");
  const fg = extractCssVar(themeCss, "--color-accent", "#1a1a1a");

  const svg = template
    .replace(/\{\{\s*BG\s*\}\}/g, xmlEscape(bg))
    .replace(/\{\{\s*FG\s*\}\}/g, xmlEscape(fg));

  await writeFile(FAVICON_OUTPUT_PATH, svg, "utf8");
  console.log(`[build-favicon] wrote ${FAVICON_OUTPUT_PATH} (bg=${bg}, fg=${fg})`);
}

main().catch((err) => {
  console.error("[build-favicon] failed:", err);
  process.exitCode = 1;
});
