# TODO

仕様の一次情報は [blog-ssg-brief.md](blog-ssg-brief.md)。

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

- [ ] 背景画像 (生成パターン / 既製 SVG パターンカタログ)
- [ ] フォントカタログ (欧文 / 日本語、`public/fonts/` 配下に複数)
- [ ] レイアウトのバリエーション (現状 1 カラムのみ — グリッド / 寄せ / 行間で大きく雰囲気変える案)
- [ ] アニメーション (現状 theme.css 内のみ。エントリ / ホバー / アンビエント背景の各カタログ)
- [ ] カーソルジャック / カスタムカーソル (`cursor: url(...)` + CSS で発光させたり)
- [ ] それぞれ「種類 + 説明」を持って LLM が選びやすい形に揃える

## 4. ロゴ・アイコン

- [x] X アイコンが白で、明るいテーマだと見えない問題
  - Header に SVG をインライン化し `fill="currentColor"` で `--color-fg` 追従に
- [ ] 個人アイコンを `archive/ar` の henohenos 系から発掘して使えないか調査
  - `git ls-tree -r archive/ar` で中身確認
- [x] `public/logo*.png` 削除 (未使用)
- [x] `public/icons/` 配下も合わせて削除 (Header インライン化で外部参照不要に)
- [x] favicon は OK (`Base.astro` で使用中)

## 5. docs 整備 / 活動ログ

- [ ] md ファイルが増えてきた (`CLAUDE.md` / `blog-ssg-brief.md` / `vocadb-api-note.md` / `TODO.md` / `README.md`) — 整理方針を決める
  - 案: `docs/` ディレクトリに技術ノート (vocadb 等) を集約
  - 案: brief と README を統合 (人向け / AI 向けの 2 枚体制に)
- [ ] 活動ログ (= ここまでやったこと、これからやることを残す設備)
  - 候補 a: `CHANGELOG.md` (人手で書く)
  - 候補 b: `docs/journal.md` (日付ベース)
  - 候補 c: 既存の git log + bot コミット で十分 → 何もしない
  - 自動化案: deploy.yml から PR 説明 / リリースノートを生成

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
