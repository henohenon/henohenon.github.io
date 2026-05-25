# TODO

プロジェクト概要は [README.md](README.md)。技術ノートは [docs/](docs/)。

完了済みの大物 (Astro 初期セットアップ / generate-theme / GHA / レイアウト等) は `git log` 参照。

---

## 1. ローカルスケジュール化 (脱 API キー / 脱 GHA cron)

API 課金を回避するため、`claude -p` (CLI = Pro/Max サブスク認証) でローカル実行に一本化する方針。

- [ ] launchd か cron で毎朝 `bun run generate-theme && git add ... && git commit && git push` を回す
  - bun の PATH / CLAUDE_BIN を明示する必要あり
  - 失敗時のログをどこに残すか (`~/Library/Logs/henohenon-theme/` あたり?)
- [x] `.github/workflows/daily.yml` を削除
- [x] `deploy.yml` は残す (main push → Pages デプロイ)
- [x] CLAUDE.md / docs から `ANTHROPIC_API_KEY` 前提の記述を整理 (SDK バックエンドは残置)

## 2. 生成部分の構造化

- [ ] 任意の曲でテーマ生成できる CLI オプション
  - `bun run generate-theme --song-id 1501`
  - `bun run generate-theme --song "ローリンガール"` (検索)
  - ランダム選定をスキップして手動 1 曲指定
- [ ] LLM 呼び出しを差し替えやすい形にリファクタ
  - 今: `callClaudeSdk` / `callClaudeCli` の 2 関数が直書き
  - 案: `interface ThemeGenerator { generate(input): Promise<string> }` で抽象化
  - 別 AI (Gemini / OpenAI / ローカル) を将来差し込めるように
- [ ] プロンプト調整は当面据え置き (「まぁ一旦いいかなぁ」判断)

## 3. 表現の拡充

毎日の差分を CSS だけでなく、もっと幅広いレイヤーで表現する。
**選択肢のカタログを持つ** → LLM がそこから選ぶ → 出力が安定しつつ表現は広がる、というのが狙い。

採否と探索の一覧は [docs/expression-catalog.md](docs/expression-catalog.md)。
方針判断のログは [docs/decisions.md](docs/decisions.md)。

**方針: 自由度優先**。静的アセット + ID 選択のカタログ式ではなく、
**技法を記述した md を Claude に inspire 用として渡す** 形で実装する。
Claude は md を参考にしてもいいし、独自に書いてもいい (詳細: [docs/decisions.md](docs/decisions.md))。

### techniques inspiration docs (Claude へのレファレンス)

- [ ] **C-α** 注入機構 — `docs/techniques/` 配下の md を generate-theme.ts が
  読んで prompt に組み込む (system prompt に入れるか user message かは追って判断)
- [ ] **C-bg** `docs/techniques/backgrounds.md` 作成 (背景の手法例)
- [ ] **C-dec** `docs/techniques/decorations.md` 作成 (装飾の手法例)
- [ ] **C-type** `docs/techniques/typography.md` 作成 (タイポの手法例)
- [ ] **C-motion** `docs/techniques/motion.md` 作成 (transition + @keyframes まとめて)
- [ ] **C-vt** `docs/techniques/view-transitions.md` 作成 (D1 完了後に活きる)

### 機構系 (1 回仕込めば自由が広がる)

- [ ] **C5** `color-mix` 曲調ダーク modifier (暗い曲調なら自動 dim — 自動 modifier、Claude 生成ではない)
- [ ] **D1** View Transitions 導入 (Astro `<ClientRouter />` を Base.astro に)

### メタ表現

- [ ] **E1** mood ラベル → `theme-source.json` に追加 → Footer に「今日は: 〜」表示

### 棚上げ

- 🟡 **欧文 / 日本語フォントの自前 bundle** — 当面 system stack のみ。再開時は
  **日本語フォント中心に curation** する方針 (2026-05-25 判断、装飾・見出し系を集める)
- 🟡 **レイアウトテンプレ複数化** (`BaseBlog` / `BaseMagazine` / `BaseTerminal` / `BasePoster` 等) —
  CSS だけで類似の見た目を作れる前提で様子見。足りないと判明したら復活

### 継続タスク

- [ ] **更なる探索** — 上記 techniques md を継続的に拡充 (CSS 新機能 / 他サイト事例 / 静的で効く新しい手法を)
  [docs/expression-catalog.md](docs/expression-catalog.md) と合わせて更新

## 4. ロゴ・アイコン

- [x] X アイコンが白で、明るいテーマだと見えない問題
  - Header に SVG をインライン化し `fill="currentColor"` で `--color-fg` 追従に
- [x] 個人アイコンを `archive/ar` の henohenos 系から発掘して使えないか調査
  - `archive/ar:ar/henohenos/negi.png` を採用 → `public/negi.png`
  - Header のブランド名左に CSS mask + currentColor で配置
- [x] `public/logo*.png` 削除 (未使用)
- [x] `public/icons/` 配下も合わせて削除 (Header インライン化で外部参照不要に)
- [x] favicon は OK (`Base.astro` で使用中)

## 5. docs 整備 / 活動ログ

- [x] md ファイル整理
  - `blog-ssg-brief.md` → README.md に統合して削除
  - `vocadb-api-note.md` → `docs/vocadb-api.md` に移動
  - 結果: ルートに `README.md` (人向け) / `CLAUDE.md` (AI 向け) / `TODO.md`、技術ノートは `docs/` 配下
- [x] 活動ログ → 候補 c (git log + bot コミットで十分) を採用、設備実装はしない
  - Conventional Commits + `chore(theme): YYYY-MM-DD (song)` の bot コミットで日次の差分は十分追える
  - 必要になったら CHANGELOG.md / journal を後付け

## 7. メタ UX / 周辺機構

サイト本体の体験を支える脇役群。即手で進められる軽量タスク。

### 即手 (1ファイル系)

- [ ] **A1** 404 ページ (`src/pages/404.astro`、案A 「ここには何もない」+ `/` リンク。Base 経由でテーマ自動反映)
- [ ] **A2** OGP テキストタグを `Base.astro` head に (`og:title` / `description` / `type` / `url` / `image` / `twitter:card`)
- [ ] **A3** `scrollbar-color` / `::selection` を theme.css 規約に追加 (色追従)

### メタ脇役

- [ ] **B1** OGP 画像 — ハイブリッド 2 call (CSS 渡し) で `public/og.svg` 生成、ビルド時に `scripts/build-og.ts` で `dist/og.png` にラスタライズ (`@resvg/resvg-js`)
- [ ] **B2** 時刻色シフト (`<html data-tod>` をインライン JS で属性付与 + theme.css で `color-mix` 微シフト)
- [ ] **B3** favicon 色追従 — SVG テンプレに theme accent 色 inject、`public/favicon.svg` を Base から参照

詳細・方針は [docs/decisions.md](docs/decisions.md) / [docs/expression-catalog.md](docs/expression-catalog.md)。

## 6. 選曲ロジック / 入力の重み付け

「人気上位からランダム」→「直近の中で一番人気の 1 曲」に切替。情報量を担保したい
(歌詞・タグが薄いマイナー曲を引きたくない)。

- [ ] 前回タイムスタンプを永続化 (既存の `theme-source.json` の `generatedAt` を読めば OK)
- [ ] 選曲ロジック変更
  - クエリ範囲: `[lastGeneratedAt, now]` を `afterDate` に渡す
  - 上限: 範囲が広がりすぎないよう最大日数を設ける (例: 7 日 / 14 日)
  - 初回 (lastGeneratedAt が null) はその最大日数を使う
  - `maxResults=1` + `sort=RatingScore` で 1 曲だけ取る (ランダムやめる)
- [ ] プロンプト/入力データの重み付け
  - **曲名 + 歌詞を優先**、タグは補助扱いに
  - `buildUserMessage` の順序と表現を見直し
  - 歌詞は今 1500 字で切ってる → 増やすか、サビ抽出するか検討
- [ ] 将来 (まだ着手しない): リリック構造解析 / 映像 (PV) 解析を入力に加える

---

## 後回し: スタイル系規約 (継続)

実装で触る段になったら方針を固めてから着手。

- [ ] `theme.css` の CSS 変数契約定義 (`--color-fg` / `--color-bg` / `--spacing-unit` / `--ease-default` 等、canonical な一覧を決める)
- [ ] `base.css` と `theme.css` の役割分担確定 (リセット/レイアウトは base、色/装飾/アニメは theme)
- [ ] WCAG コントラスト制約 (AA 4.5:1 をどう担保するか — tool スキーマ強制 or 生成後検証)
- [ ] フォント戦略の詳細 (上 #3 と一体)
- [ ] CSS アニメーション仕様 (上 #3 と一体)
- [ ] `prefers-reduced-motion` ブロックの強制方法 (プロンプト + 検証)

## 後回し: prompt 整備 (継続)

- [ ] system prompt / tool スキーマ設計 (`emit_theme({ css, font_family, mood })` の雛形)
- [ ] prompt caching の境界決定 (system: ルール+変数契約 = cached / user: 曲データ = 可変)
- [ ] 失敗時フォールバック (前日 `theme.css` を温存) の挙動を CLI 経路でも検証

## 後回し: TS / Astro の細かい規約 (継続)

- [ ] TS strict 設定の選定 (`noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` / `verbatimModuleSyntax` を有効化するか)
- [ ] 外部 API レスポンスの zod パース方針 (現状 generate-theme で zod 使用済)
- [ ] 画像は `astro:assets` 経由
- [ ] View Transitions 導入の判断 (当面は入れない)
