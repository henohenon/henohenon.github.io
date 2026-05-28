# research/

外部視点・語彙・慣習を集めるリファレンス。設計判断 ([../decisions.md](../decisions.md)) や拡張可能性 ([../feature-expansion-ideas.md](../feature-expansion-ideas.md)) の元ネタ。

役目を終えたものは [../log/research-archive/](../log/research-archive/)。

---

## 在中

### 境界・哲学
- [css-only-boundary.md](css-only-boundary.md) — CSS だけで描ける範囲と機構を要求する範囲の境界
- [prompt-and-generation.md](prompt-and-generation.md) — Claude への渡し方 / 出力検証 / 安定化の引き出し
- [accessibility.md](accessibility.md) — WCAG / 色覚 / モーション / セマンティック

### 表現の語彙 (将来 techniques/ に統合予定)
- [color-systems.md](color-systems.md) — 色 (→ techniques/color-application.md)
- [typography.md](typography.md) — タイポ (→ techniques/typography.md + F1)
- [layout-and-spacing.md](layout-and-spacing.md) — レイアウト (→ techniques/layout-patterns.md)
- [shapes-and-depth.md](shapes-and-depth.md) — 形 / 奥行き (→ techniques/decorations.md)
- [motion-and-easing.md](motion-and-easing.md) — モーション (→ techniques/motion.md)
- [svg-and-iconography.md](svg-and-iconography.md) — SVG / アイコン
- [modern-css-techniques.md](modern-css-techniques.md) — 直近 CSS 機能 (Baseline 2024-2026)

### ドメイン
- [vocaloid-aesthetic.md](vocaloid-aesthetic.md) — Vocaloid 文化の視覚語彙 (techniques/ 用に翻訳予定 = D8)

---

## 使い方

- 設計判断や prompt 改修で「このカテゴリの語彙が要る」と思ったら参照
- 新しい知見・事例が出たら追記
- 役目を終えたものは [../log/research-archive/](../log/research-archive/) に移す
- 将来 `docs/techniques/` (Claude への inspire 用) として再編予定

---

## 関連

- [../direction.md](../direction.md) — 北極星
- [../decisions.md](../decisions.md) — 個別判断のログ
- [../feature-expansion-ideas.md](../feature-expansion-ideas.md) — 拡張可能性カタログ
- [../log/](../log/) — 過去スナップショット
- [../../TODO.md](../../TODO.md) — タスク
- [../../CLAUDE.md](../../CLAUDE.md) — AI 向け運用規約
