# research/

設計判断・棚卸・補助情報整備の前段として、外部視点・語彙・慣習を集めるディレクトリ。

特定の実装に直結する判断のためではなく、**判断の母集団を広げる** ためのリファレンス。
catalog 整理 (棚卸 → ギャップ → 補助情報) フェーズ全般で参照する。

---

## 構成

### 0. 起点
- [expression-references.md](expression-references.md) — 表現の幅 (ジャンル / 軸 / ムード翻訳)
- [design-doc-conventions.md](design-doc-conventions.md) — DESIGN.md / ADR / 設計ドキュメント慣習

### 1. DESIGN.md 各セクションに対応する語彙

| ファイル | 対応セクション (DESIGN.md) |
|---|---|
| [color-systems.md](color-systems.md) | Colors |
| [typography.md](typography.md) | Typography |
| [layout-and-spacing.md](layout-and-spacing.md) | Layout / Spacing |
| [shapes-and-depth.md](shapes-and-depth.md) | Shapes / Elevation & Depth |
| [components-and-patterns.md](components-and-patterns.md) | Components |
| [motion-and-easing.md](motion-and-easing.md) | (拡張) Motion |
| [svg-and-iconography.md](svg-and-iconography.md) | (拡張) Iconography |
| [imagery-and-illustration.md](imagery-and-illustration.md) | (拡張) Imagery |

### 2. 横断的・哲学的軸

- [accessibility.md](accessibility.md) — WCAG / 色覚 / モーション / セマンティック (=「壊れない最低限」の規律)
- [brand-voice-and-mood.md](brand-voice-and-mood.md) — Overview (人格・声・mood の articulation)

### 3. プロジェクト固有 / 環境固有

- [vocaloid-aesthetic.md](vocaloid-aesthetic.md) — Vocaloid 文化の視覚語彙 (本プロジェクト固有の翻訳辞書)
- [modern-css-techniques.md](modern-css-techniques.md) — 直近 CSS 機能 (Baseline 2024-2026)

---

## 使い方

### 棚卸フェーズ
- 現状の `theme.css` 規約 / generate-theme prompt / Astro 構造を、各リサーチの観点から見直す
- 「これは抜けてる」「これは緩い」をリストアップ

### ギャップ確認フェーズ
- 表現として可能なのに本プロジェクトで採れていないもの (catalog 各カテゴリ参照)
- 「機構が要る」「prompt が要る」「規約緩和が要る」を分類

### 補助情報確立フェーズ
- system prompt の改善
- techniques 系 md (本プロジェクト用) の整備
- DESIGN.md 形式の採用検討 (`docs/research/design-doc-conventions.md` の議論を参照)

### 継続更新
- 新しい知見・事例が出たら各 md に追記
- catalog の "棚" は育てていくもの

---

## 関連 (横参照)

- [../decisions.md](../decisions.md) — 設計判断のログ
- [../session-2026-05-25.md](../session-2026-05-25.md) — 振り返り (なぜここまで進めたか)
- [../../TODO.md](../../TODO.md) — 保留タスク含む現状
- [../../CLAUDE.md](../../CLAUDE.md) — AI 向けプロジェクト規約
