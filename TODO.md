# TODO

「まず動かす」を優先して後回しにしている設計・規約タスク。実装で触る段になったら、先にここで方針を固めてから着手する。

---

## 実装作業 (動かす最小セット)

- [ ] Astro 5 プロジェクトの初期セットアップ (`.nvmrc` で Node 22 LTS / Biome)
- [ ] `archive/strune` から favicon・ロゴ・SNS アイコン取り出し、サイト名 `へのへのんのの` をレイアウトに組み込む
- [ ] VocaDB API エンドポイント選定・動作確認 ([vocadb-api-note.md](vocadb-api-note.md))
- [ ] `scripts/generate-theme.ts` の最小実装 (VocaDB → Claude → `theme.css` 書き出し)
- [ ] GitHub Actions ワークフロー (`actions/setup-node@v4` で `.nvmrc` 参照)
- [ ] デプロイ先 (GitHub Pages) の設定

---

## 後回し: スタイル系規約

- `theme.css` の CSS 変数契約定義 (`--color-fg` / `--color-bg` / `--spacing-unit` / `--ease-default` 等、canonical な一覧を決める)
- `base.css` と `theme.css` の役割分担確定 (リセット/レイアウトは base、色/装飾/アニメは theme)
- WCAG コントラスト制約 (AA 4.5:1 をどう担保するか — tool スキーマ強制 or 生成後検証)
- フォント戦略の詳細
  - 欧文フォントの選定 (`public/fonts/` に何を置くか)
  - フォールバックフォントのメトリクス調整 (`size-adjust`, `ascent-override`)
  - `font-display: swap` + `local()` 経由のレイアウトシフト抑制
  - 日本語システムスタックの確定 (`'Hiragino Sans', 'Yu Gothic', sans-serif` 等)
- CSS アニメーション仕様
  - エントリーアニメーション / ホバーエフェクト / 背景アニメーションの粒度
  - アニメーションを生成しない日の判断ロジック (静けさも表現)
  - `prefers-reduced-motion` ブロックの強制方法

## 後回し: prompt 整備

- system prompt / tool スキーマ設計 (`emit_theme({ css, font_family, mood })` の雛形と description)
- prompt caching の境界決定 (system: ルール+変数契約 = cached / user: 曲データ = 可変)
- モデル選定方針 (`claude-sonnet-4-6` 既定 / `claude-opus-4-7` は質を上げたい時)
- `prefers-reduced-motion` 必須をプロンプト + ツールスキーマで強制する書き方
- 失敗時フォールバック (前日 `theme.css` を温存、Issue は立てない) の実装方法

## 後回し: TS / Astro の細かい規約

- TS strict 設定の選定 (`noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` / `verbatimModuleSyntax`)
- 外部 API レスポンスの zod パース方針
- Astro Content Layer API のスキーマ定義 (`glob` loader + zod)
- 画像は `astro:assets` 経由
- View Transitions 導入の判断 (当面は入れない)

## 後回し: 運用

- `generate-theme.ts` のローカル実行手順
- 生成結果が気に入らない時のロールバック手順
- API キー (`ANTHROPIC_API_KEY`) のシークレット登録手順
- `daily.yml` の cron 時刻最終決定 (`0 0 * * *` UTC = JST 9 時)
- `workflow_dispatch` での手動実行
