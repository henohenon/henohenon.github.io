# レイアウトと余白の語彙

> グリッドシステム / 余白スケール / レスポンシブ / 構図原理。
> DESIGN.md における Layout & Spacing セクションに対応する辞書。

---

## 1. グリッドシステム

### 古典的 grid
- **12 column grid**: bootstrap 由来、12 は 2/3/4/6 で割れて柔軟
- **16 column grid**: 出版業界の伝統 (5/8 で黄金比近似)
- **8pt grid**: Material Design 由来、すべての寸法を 8 の倍数で
- **4pt sub-grid**: より細かい調整用に 8pt を半分にした補助 grid

### Modern web の grid
- **Bento grid** (お弁当箱型): Apple 系。異なるサイズのカードを揃える
- **Asymmetric grid**: 不均等な列幅、リズム感を持たせる
- **Subgrid** (CSS): 親 grid に子 grid を揃える
- **Container queries** で grid を要素単位に変える

### 構図パターン (印刷から流用)
- **Single column** — 読み物中心、シンプル
- **2 column**: 本文 + サイドバー、または見開き的
- **3 column**: 新聞風、密度を出す
- **Multi-column** (`column-count` CSS): 1 要素内で自動マルチカラム
- **Magazine**: 大見出し + 不規則 column / 写真混在
- **Hero + cascade**: 最初の 1 つだけ巨大、以降小さく
- **Scattered**: 意図的にバラバラ (zine 風)
- **Diagonal grid**: 斜めの罫線・並び (transform: rotate)

---

## 2. 余白 (spacing) のスケール

### 倍数ベース
- 4px step (4, 8, 12, 16, 20, 24, ...)
- 8px step (8, 16, 24, 32, 40, 48, ...)
- 黄金比 step (8 → 13 → 21 → 34 → 55 → 89)

### t-shirt サイズ
- xs / sm / md / lg / xl / 2xl

### rem ベース (推奨)
```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 1rem;     /* 16px */
  --space-4: 1.5rem;   /* 24px */
  --space-5: 2rem;     /* 32px */
  --space-6: 3rem;     /* 48px */
  --space-7: 5rem;     /* 80px */
  --space-8: 8rem;     /* 128px */
}
```

タイポスケールと連動させる場合は同じ比率を使う (1.5x / 1.618x 等)。

### 単一の `--spacing-unit` 方式 (本プロジェクトの現状)
```css
:root { --spacing-unit: 1rem; }
.container { padding: calc(var(--spacing-unit) * 2); }
.card { gap: calc(var(--spacing-unit) * 1.5); }
```

簡潔だが、繊細な調整がしづらい。日替わりテーマには却って良いかも。

---

## 3. 余白の哲学

### 詰める vs ゆったり
- **詰める** (低 line-height / 少ない padding) → 密度感、雑誌風、urgent
- **ゆったり** (高 line-height / 多い padding) → 落ち着き、editorial、premium

### Macro space vs Micro space
- Macro: section 間、page 全体の余白 (大)
- Micro: 文字間、行間、要素内 padding (小)

### Negative space (Japanese: 間)
- 余白そのものを表現の一部に
- 何もない空間が "鳴る" デザイン (wabi-sabi)
- Helvetica + 大量余白 = Swiss style

---

## 4. 本文幅 (measure)

行幅の最適化は読みやすさの根幹:

- **45-75 文字 (`ch` 単位)** が推奨
- `width: min(75ch, 100%);` が定番
- 日本語は約 40 文字前後が読みやすい
- 詰めて 40ch → 密度感、ZINE 風
- 広げて 90ch+ → 視線移動長い (避ける)

---

## 5. ブレイクポイント

### 古典 (Bootstrap 系)
- sm: 640px / md: 768px / lg: 1024px / xl: 1280px / 2xl: 1536px

### container query 時代
- 親要素のサイズで切り替えるので固定 breakpoint への依存が減る
- `@container (min-width: 400px)` 等

### 本プロジェクトでは
- 個人ブログ規模なら 2-3 breakpoint で十分
- モバイル → タブレット → デスクトップの 3 段階
- `@container` でカード単位に切り替えると柔軟

---

## 6. 構図原理 (composition)

### 視線誘導
- **F パターン**: 左→右、上→下 (情報量多い系)
- **Z パターン**: 左上→右上→左下→右下 (ヒーロー系)
- **黄金螺旋**: 中心から外へ、editorial 系
- **対称軸**: 中央寄せで安定感
- **非対称バランス**: 視覚的重量で釣り合いを取る

### Rule of thirds
- 画面を 3x3 に分割し、交点に重要要素を置く
- 写真の構図原理、web の hero にも応用

### グリッドからの逸脱
- 一部要素を grid からはみ出させて視線を引く
- "breaking the grid" は意図的にやればドラマチック

---

## 7. レスポンシブ戦略

### Mobile First
- 小さい viewport を default として書き、必要に応じて拡張
- 制約から出発する思考、シンプルに収まる

### Container Queries First (2025-2026 の主流に)
- viewport ではなく要素のサイズで切り替え
- コンポーネントの再利用性が上がる

### Fluid (intermediate values)
- `clamp(min, preferred, max)` で連続的に変化
- `font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem)` 等
- breakpoint なしに滑らかに対応

---

## 8. 本プロジェクト視点

### 現状
- `.container { width: min(72ch, 100% - 2 * spacing); }` で本文幅
- 1 カラム固定
- グリッド・bento は未使用
- `--spacing-unit` 1 つで全体調整

### 改善余地
- Bento や multi-column を Claude が選べる選択肢として
- 余白スケールを step 制にすれば Claude の判断材料増える
- ブレイクポイント / container queries の本格採用は今後

### 棚卸時に確認すべき
- 現状の base.css で `min(72ch, ...)` 等が theme.css での自由を阻害してないか
- Claude が「今日は雑誌風」と判断した時に grid を組み直せる余地があるか

---

## Sources

- [Material Design — Layout](https://m3.material.io/foundations/layout/understanding-layout/overview)
- [8pt Grid System — Bryn Jackson](https://spec.fm/specifics/8-pt-grid)
- [Subgrid — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid)
- [Bento Grid — UX trend articles](https://www.smashingmagazine.com/2024/03/) (検索ベース)
- [Container Queries — web.dev](https://web.dev/blog/container-queries)
