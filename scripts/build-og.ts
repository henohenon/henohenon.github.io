/**
 * build-og.ts
 *
 * OGP 画像をビルド時にラスタライズして `dist/og/` 配下に出力する。
 * `astro build` の後に呼ぶ (package.json の build を参照)。
 *
 * - `public/og.svg` → `dist/og.png` (サイト全体のシェアカード、Claude 生成 SVG をそのまま)
 * - `public/og.article-template.svg` + 各記事の frontmatter title + theme.css の色
 *   → `dist/og/{slug}.png` (記事ページ用、色追従テンプレ)
 *
 * SVG / theme.css / 記事が無い場合はスキップ (静かに失敗、前回ビルドのまま)。
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const SITE_SVG_PATH = path.resolve("public/og.svg");
const ARTICLE_TEMPLATE_PATH = path.resolve("public/og.article-template.svg");
const THEME_PATH = path.resolve("src/styles/theme.css");
const POSTS_DIR = path.resolve("src/content/posts");
const DIST_DIR = path.resolve("dist");
const SITE_PNG_PATH = path.join(DIST_DIR, "og.png");
const ARTICLE_PNG_DIR = path.join(DIST_DIR, "og");

function rasterize(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: true },
  });
  return resvg.render().asPng();
}

/** theme.css から `--color-bg: #xxx;` の値を抽出 */
function extractCssVar(css: string, name: string, fallback: string): string {
  const re = new RegExp(`${name}\\s*:\\s*([^;]+);`);
  const m = css.match(re);
  return m?.[1]?.trim() ?? fallback;
}

/** Markdown frontmatter の title フィールドを取り出す (簡易パース) */
function extractTitle(md: string, fallbackSlug: string): string {
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return fallbackSlug;
  const titleMatch = fmMatch[1]?.match(/^title\s*:\s*(.+)$/m);
  return titleMatch?.[1]?.trim().replace(/^["']|["']$/g, "") ?? fallbackSlug;
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

async function buildSiteOg(): Promise<void> {
  if (!existsSync(SITE_SVG_PATH)) {
    console.warn(`[build-og] ${SITE_SVG_PATH} not found — skip site og.png`);
    return;
  }
  const svg = await readFile(SITE_SVG_PATH, "utf8");
  const png = rasterize(svg);
  await writeFile(SITE_PNG_PATH, png);
  console.log(`[build-og] wrote ${SITE_PNG_PATH} (${png.length} bytes)`);
}

async function buildArticleOgs(): Promise<void> {
  if (!existsSync(ARTICLE_TEMPLATE_PATH)) {
    console.warn(`[build-og] ${ARTICLE_TEMPLATE_PATH} not found — skip article OGs`);
    return;
  }
  if (!existsSync(POSTS_DIR)) {
    console.warn(`[build-og] ${POSTS_DIR} not found — skip article OGs`);
    return;
  }

  const themeCss = existsSync(THEME_PATH) ? await readFile(THEME_PATH, "utf8") : "";
  const bg = extractCssVar(themeCss, "--color-bg", "#fafafa");
  const fg = extractCssVar(themeCss, "--color-fg", "#1a1a1a");
  const accent = extractCssVar(themeCss, "--color-accent", "#555");

  const template = await readFile(ARTICLE_TEMPLATE_PATH, "utf8");
  await mkdir(ARTICLE_PNG_DIR, { recursive: true });

  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const md = await readFile(path.join(POSTS_DIR, file), "utf8");
    const title = extractTitle(md, slug);

    const svg = template
      .replace(/\{\{BG\}\}/g, xmlEscape(bg))
      .replace(/\{\{FG\}\}/g, xmlEscape(fg))
      .replace(/\{\{ACCENT\}\}/g, xmlEscape(accent))
      .replace(/\{\{TITLE\}\}/g, xmlEscape(title));

    const png = rasterize(svg);
    const out = path.join(ARTICLE_PNG_DIR, `${slug}.png`);
    await writeFile(out, png);
    console.log(`[build-og] wrote ${out} (${png.length} bytes, "${title}")`);
  }
}

async function main(): Promise<void> {
  await mkdir(DIST_DIR, { recursive: true });
  await buildSiteOg();
  await buildArticleOgs();
}

main().catch((err) => {
  console.error("[build-og] failed:", err);
  process.exitCode = 1;
});
