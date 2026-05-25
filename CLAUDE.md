# CLAUDE.md

仕様の一次情報は [blog-ssg-brief.md](blog-ssg-brief.md)。後回し項目は [TODO.md](TODO.md)。

## プロジェクト概要

VocaDB API から毎日 Vocaloid 曲を1曲選び、その情報を Claude に渡して `theme.css` を生成 → main に push → GitHub Pages デプロイ。

HTML / Astro コンポーネントは触らない。CSS の差し替えだけで日々の見た目を更新する。

**スケジュール実行はローカル側に集約予定** (launchd / cron で `bun run generate-theme` を回す)。
GitHub Actions の `daily.yml` は廃止予定 — 詳細は [TODO.md](TODO.md) の「1. ローカルスケジュール化」。
GHA は `deploy.yml` (main push → Pages) のみ残す。

## スタック

Astro 5.x (SSG) / TypeScript / `@anthropic-ai/sdk` / GitHub Actions / GitHub Pages / Node 22 LTS (`.nvmrc`) / Biome / **bun** (パッケージマネージャ & TS ランナー)

Agent SDK は使わない (一発呼び出しでよい)。

## ディレクトリ規約

```
src/
  content/posts/        # Markdown 記事 (人間が手書き)
  styles/
    base.css            # 固定スタイル
    theme.css           # 日替わり生成 — 手で編集しない
  pages/                # / (一覧) と /[slug] (記事) の 2 種類のみ
  components/
public/
  favicon.ico, logo.png # archive/strune から流用
  pattern.svg           # stretch: 日替わり背景
  fonts/                # 欧文のみ。日本語は同梱しない
scripts/
  generate-theme.ts     # VocaDB → Claude → theme.css
.github/workflows/
  daily.yml             # cron でテーマ更新
  deploy.yml            # main push でビルド & Pages デプロイ
```

旧 Rust + Strune 版は `archive/strune`、WebAR 資産は `archive/ar`。コード規約は引きずらない。

## 過去資産の流用

サイトの "顔" は旧 Strune 版から引き継ぐ。**Claude が勝手に決めない**。

| 引き継ぐもの | 出所 (`archive/strune` 内) | 配置先 |
| --- | --- | --- |
| サイトタイトル `へのへのんのの` | `src/config.yml` の `brand_title` | レイアウトコンポーネント / `<title>` |
| favicon | `src/static/favicon.ico` | `public/favicon.ico` |
| ヘッダーロゴ | `src/static/logo.png` / `logo-white.png` | `public/logo.png` |
| X / GitHub アイコン | `src/static/x-logo/`, `src/static/github-mark/` | `public/icons/` 配下 |
| SNS リンク | `src/config.yml` の `menu` (`https://x.com/henohenon_8282`, `https://github.com/henohenon`) | ヘッダーにハードコード可 |

取り出しは `git show archive/strune:<path> > <dest>` または `git checkout archive/strune -- <path>`。

## コミット規約

Conventional Commits 風。日本語可、命令形・現在形。

- `feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `style:`
- `chore(theme): YYYY-MM-DD ({song title})` — **bot 専用**。人間は使わない

## generate-theme のバックエンド

`scripts/generate-theme.ts` は 2 系統の Claude 呼び出しを内蔵する。
**主たる実行系は CLI 経路 (ローカル launchd/cron)**。SDK 経路は将来の保険として残置。

| 環境 | 既定 | 仕組み |
| --- | --- | --- |
| ローカル (本番) | `cli` | `claude -p` を子プロセス起動。Pro/Max サブスク認証を流用 (API 課金なし) |
| SDK 経路 (休眠) | `sdk` | `@anthropic-ai/sdk` で API 直叩き (`ANTHROPIC_API_KEY` 必須)。今は使わない |

`THEME_BACKEND=sdk` / `THEME_BACKEND=cli` で明示指定可。`ANTHROPIC_API_KEY` が
セットされていれば SDK、なければ CLI が自動選択される。

CLI バイナリは PATH の `claude` を見る。見つからない時は `CLAUDE_BIN` で上書き:

```sh
# 例: VSCode 拡張に同梱の binary を使う
export CLAUDE_BIN=~/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude
bun run generate-theme
```

または `curl -fsSL https://claude.ai/install.sh | bash` で CLI を入れて
`/usr/local/bin/claude` に通す。

## エージェント指針

- 仕様判断で迷ったら [blog-ssg-brief.md](blog-ssg-brief.md)。それでも不明なら**実装前に質問する**
- 細かい規約 (CSS / TS strict / Claude プロンプト / フォント等) は [TODO.md](TODO.md) で後回し中。実装で必要になったら先に方針を相談
- 1 PR / 1 コミット = 1 トピック
- `archive/*` ブランチは過去資産。現行コードの規約として参照しない
- 動作確認: `bun run dev` / `bun run build` が通る / `bun run check` (astro check) で型エラーゼロ
- 依存追加は `bun add` / `bun add -d`。`npm` / `yarn` / `pnpm` は使わない
- UI 変更は実ブラウザで確認
- リスクの高い操作 (履歴書き換え、ブランチ削除、本番デプロイ設定変更) はユーザーに確認
