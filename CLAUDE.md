# CLAUDE.md

Claude Code が会話開始時に自動で読み込むプロジェクト指針。
仕様の一次情報は [blog-ssg-brief.md](blog-ssg-brief.md)。判断に迷ったらまずそちらを読む。

---

## プロジェクト概要

VocaDB API から毎日の人気 Vocaloid 曲 (トップ10〜30) を取得 → ランダムに1曲を選定 → その曲のタグ・歌詞を Claude API に渡して `theme.css` (と stretch で `pattern.svg`) を生成 → main に直 push → GitHub Actions が反応してビルド・Pages デプロイ。

**設計の核**：HTML / Astro コンポーネントは触らない。CSS の差し替えだけで日々の見た目を更新する。記事内容は変わらず、装いだけが日替わりで変わる。

---

## スタック

- **Astro** (Content Collections, SSG)
- **TypeScript** (strict)
- **`@anthropic-ai/sdk`** — テーマ生成用。Agent SDK は使わない (一発呼び出しでよい)
- **GitHub Actions** — daily cron でテーマ更新、push トリガでビルド & デプロイ
- **GitHub Pages** — デプロイ先 (`henohenon.github.io`)
- **npm** + **Node.js LTS**

---

## ディレクトリ規約

```
src/
  content/posts/        # Markdown 記事 (人間が手書き)
  styles/
    base.css            # 固定スタイル — 変更は慎重に
    theme.css           # 日替わり生成対象 — 手で編集しない
  pages/                # Astro ページ
  components/           # Astro コンポーネント
public/
  pattern.svg           # stretch: 日替わり背景
  fonts/                # 欧文フォントのみ。日本語は同梱しない
scripts/
  generate-theme.ts     # VocaDB → Claude → theme.css 生成
.github/workflows/
  daily.yml             # cron: 00:00 UTC にテーマ更新を main に push
  deploy.yml            # main push 時にビルド & Pages デプロイ
```

旧 Rust + Strune 版は `archive/strune` ブランチに、WebAR 資産は `archive/ar` に退避済み。今のコード規約には引きずらない。

---

## TypeScript 規約

`tsconfig.json` で以下を必須：
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `verbatimModuleSyntax: true`

書き方：
- ESM 一択 (`"type": "module"`)
- `any` 禁止。外部 API レスポンスは `zod` などで実行時パース → 型導出
- ファイル名は kebab-case、型/コンポーネントは PascalCase、関数/変数は camelCase
- 副作用のあるトップレベル import は避ける

---

## Astro 規約

- ページ構成は企画書通り `/` (一覧)、`/[slug]` (記事)、`/tags/[tag]` (タグ別) の 3 種類
- Content Collections の `defineCollection` で frontmatter を zod スキーマ化する
- コンポーネントは状態を持たない。クライアント JS は `client:*` ディレクティブを最小限
- 画像は `astro:assets` 経由でビルド時最適化する

---

## CSS 規約

責務の分離が最重要。

- **base.css**
  - リセット、ボックスモデル、タイポグラフィの土台、レイアウトのグリッド構造
  - 色や装飾は持たない (持つなら CSS 変数のフォールバックのみ)
- **theme.css**
  - 色、フォント選択、余白の数値、アニメーション、装飾全般
  - `:root` の CSS 変数で base.css と接続 (`--color-fg`, `--color-bg`, `--spacing-unit`, `--ease-default` など)
- **必ず `@media (prefers-reduced-motion: reduce)` ブロックを含める**

フォント方針：
- 日本語はシステムスタックに任せる (`'Hiragino Sans', 'Yu Gothic', sans-serif`)
- 欧文だけ `public/fonts/` に数種類置き、theme.css で `@font-face` 宣言
- `font-display: swap` + `local()` 経由のメトリクス調整 (`size-adjust`, `ascent-override`) でレイアウトシフトを抑える

---

## scripts/generate-theme.ts の規約

### 入出力契約
- 入力: VocaDB API のトップ10〜30曲プール
- ランダム選定 → 1曲のタイトル / アーティスト / タグ / 歌詞を抽出
- 出力: `src/styles/theme.css` を上書き (stretch で `public/pattern.svg`)
- **失敗時は既存ファイルを温存** (前日のテーマが残る = 仕様)

### Claude API 呼び出し
- モデル: `claude-sonnet-4-6` を既定。質を上げたい時のみ `claude-opus-4-7`
- **prompt caching 必須**: システムプロンプト・ガードレール・ルール記述部分には `cache_control: { type: "ephemeral" }` を付ける。曲データだけが日々変わる入力
- 出力フォーマットは「純粋な CSS のみ」と明示。マークダウンの ` ```css ` で囲うのも禁じる
- `prefers-reduced-motion` ブロックを必ず生成するようプロンプトで強制
- API キーは `process.env.ANTHROPIC_API_KEY`。コードに直書きしない

### 副作用
- 1 回の実行で変更するのは `theme.css` (と stretch で `pattern.svg`) のみ
- それ以外のファイルには手を出さない (記事・コンポーネント・base.css 等)

---

## GitHub Actions

- **シークレット**: `ANTHROPIC_API_KEY` をリポジトリシークレットに登録
- **daily.yml**: cron `0 0 * * *` (UTC 0:00 = JST 9:00)、`workflow_dispatch` で手動実行も可
- **deploy.yml**: main push でビルド & `actions/deploy-pages@v4`
- テーマ生成失敗時は **Issue を立てない**。静かに失敗して前日のテーマを維持する

---

## コミット規約

Conventional Commits 風。日本語可、命令形・現在形。

- `feat: 〜` 新機能
- `fix: 〜` バグ修正
- `chore: 〜` 雑務
- `docs: 〜` ドキュメント
- `refactor: 〜` 動作を変えないリファクタ
- `style: 〜` フォーマットのみ
- `chore(theme): YYYY-MM-DD ({song title})` — **bot 専用**。人間は使わない

bot コミットは GitHub Actions の default actor 名義で main に直 push。

---

## 禁則

- `theme.css` を手で編集しない (次の生成で上書きされる)
- `base.css` を触る時は理由をコミットメッセージに残す
- 記事 (`src/content/posts/`) を Claude が勝手に追加しない
- HTML / Astro コンポーネントを「日々の変化」のために変えない
- 外部依存の追加は必然性を述べる。標準で書ける処理にライブラリを足さない
- 日本語 Web フォントを self-host しない (パフォーマンス劣化と毎日のキャッシュ無効化を招く)

---

## エージェントとして作業するときの指針

- 仕様判断で迷ったら [blog-ssg-brief.md](blog-ssg-brief.md) を読む。それでも不明なら**実装前に質問する**
- 1 PR / 1 コミット = 1 トピック。複数の関心事を混ぜない
- `archive/*` ブランチは過去資産。現行コードの規約として参照しない
- 動作確認の最低限：
  - `npm run dev` でローカル表示
  - `npm run build` が通る
  - `astro check` で型エラーゼロ
- UI 変更は実ブラウザで確認すること。`npm run build` が通っただけで「完成」と言わない
- リスクの高い操作 (履歴の書き換え、ブランチ削除、本番デプロイ設定の変更) はユーザーに確認してから
