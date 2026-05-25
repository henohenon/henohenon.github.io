# 直近の CSS 機能 — 表現の幅を広げる技術

> 2025-2026 周辺の CSS で広範対応された / これから普及する機能の整理。
> Claude が CSS を書く時の "使える道具" の引き出し。
> Baseline 2024/2025 のものを中心に、まだ実験段階のものもメモ。

---

## 1. View Transitions API

### 同一ページ (same-document)
- 既存要素の状態変化をブラウザがスナップショット撮って補間
- 既に Baseline 2024 (主要ブラウザ対応)

```css
::view-transition-old(brand) { animation: fade-out 0.3s; }
::view-transition-new(brand) { animation: slide-in 0.3s; }
.brand { view-transition-name: brand; }
```

### クロスドキュメント (MPA)
- 静的サイトでもページ間遷移を SPA 風にできる
- Chrome / Safari 対応、Firefox は実装中
- `@view-transition { navigation: auto; }` を入れるだけで全ページ遷移に補間

本プロジェクト適用観点: **機構導入だけは Base.astro の改修 (Astro `<ClientRouter />`)。
個別演出は theme.css で `view-transition-name` を任意の要素に付ければ Claude が自由に。**

---

## 2. Container Queries (`@container`)

要素自身のコンテナサイズに応じてスタイルを変える (メディアクエリは viewport)。

```css
.card-wrapper { container-type: inline-size; }

@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 1fr 2fr; }
}
```

Baseline 2023 (Chrome/Safari/Firefox 対応)。

### スタイルクエリ (限定対応)
```css
@container style(--theme: dark) {
  .card { background: black; }
}
```

本プロジェクトでは: 記事一覧の card レイアウトを **コンテナ幅で切替** できる。
レイアウトテンプレ複数化なしでも CSS で吸収できる範囲が広がる。

---

## 3. `@scope`

CSS のスコープを宣言的に区切る (BEM / CSS Modules の代替候補)。

```css
@scope (.article) to (.no-prose) {
  p { line-height: 1.8; font-family: serif; }
}
```

`.article` 内で、`.no-prose` 要素より外側にだけ適用。

Baseline 2024 (Safari/Chrome)、Firefox 対応進行中。

本プロジェクトでは: 記事本文だけ装飾を強める、Footer 内は別ルール、等の用途。

---

## 4. `@layer` (Cascade Layers)

スタイルの **優先順位を層で制御**。

```css
@layer base, theme, overrides;

@layer base {
  /* base.css */
}
@layer theme {
  /* theme.css */
}
@layer overrides {
  /* ad-hoc */
}
```

順序が後の layer ほど強い。詳細度の戦争を回避。

本プロジェクトでは: `base.css` と `theme.css` の上書き関係を明示化できる。
ただし複雑度上がるので、必要になってからで OK。

---

## 5. 色関連: `color-mix()`, OKLCH, `light-dark()`

### color-mix()
```css
background: color-mix(in oklch, var(--bg), black 30%);
```
**OKLCH 空間で混ぜると知覚的に自然**。

### oklch()
```css
:root { --accent: oklch(0.7 0.2 30); }
```
明度・彩度・色相を直接指定。`color-mix` と組み合わせて自然な派生色。

### light-dark()
```css
:root { color-scheme: light dark; }
body {
  color: light-dark(black, white);
  background: light-dark(white, black);
}
```
1 つの値で light/dark 両対応。
Baseline 2024 後半。

本プロジェクトでは: 「曲調が暗い」judgement で color-mix で dim 派生したり、
時刻分岐で light/dark 切替したり。

---

## 6. `@property` (アニメーション可能なカスタムプロパティ)

CSS 変数をアニメーション可能にする宣言。

```css
@property --grad-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.bg {
  background: linear-gradient(var(--grad-angle), red, blue);
  animation: spin 10s linear infinite;
}
@keyframes spin { to { --grad-angle: 360deg; } }
```

Baseline 2024。
本プロジェクトでは: グラデの方向や色変数を**滑らかにアニメ**できる。

---

## 7. Scroll-driven animations

スクロール量に応じてアニメ進行 (JS 不要)。

```css
.progress {
  animation: grow linear;
  animation-timeline: scroll(root);
  animation-range: 0 100%;
}
@keyframes grow {
  to { transform: scaleX(1); }
}
```

Chrome / Edge は対応、Firefox / Safari は実装中 (2026)。

本プロジェクト的には UX 視点で慎重 (スクロール体験を変えるリスク)。
"読了バー" 程度の控えめな利用なら OK。

---

## 8. `:has()` (relational selector)

「ある子要素を含む親」を選択。

```css
article:has(img) { padding-bottom: 0; }
.card:has(.tag-featured) { border-color: gold; }
```

Baseline 2024 (主要ブラウザ対応)。
本プロジェクトでは: 「メイン画像がある記事だけ余白を変える」等が CSS だけで完結。

---

## 9. Anchor Positioning

要素を他の要素に "アンカー"。ポップオーバーやツールチップが CSS だけで書ける。

```css
.tooltip {
  position-anchor: --target;
  top: anchor(--target bottom);
  left: anchor(--target center);
}
.target { anchor-name: --target; }
```

Chrome 対応、他は実装中。
本プロジェクトでは将来の隠し要素や popover に効くが、まだ全ブラウザ揃ってない。

---

## 10. Popover API + `<dialog>`

`<dialog popover>` + `popovertarget` 属性で、JS なしでモーダル / ポップオーバー。

```html
<button popovertarget="info">i</button>
<div id="info" popover>解説</div>
```

Baseline 2024。
本プロジェクトでは: 隠し要素や注釈 popover に有効 (Claude が必要と判断したら)。

---

## 11. `text-wrap: balance` / `pretty`

見出しの改行を視覚的にバランス良く / 段落を自然に。

```css
h1 { text-wrap: balance; }
p { text-wrap: pretty; }
```

Baseline 2025。日本語にも効く。

---

## 12. Subgrid

親 grid に子 grid を揃える。

```css
.outer { display: grid; grid-template-columns: 1fr 2fr; }
.inner { display: grid; grid-template-columns: subgrid; }
```

Baseline 2024。複雑な揃えが楽に。

---

## 13. `field-sizing: content`

input/textarea のサイズを中身に追従。

```css
textarea { field-sizing: content; }
```

Chrome 対応、他は実装中。
本プロジェクトには直接関係ないが、フォーム導入なら役立つ。

---

## 14. `mix-blend-mode` + `backdrop-filter`

### mix-blend-mode
```css
.spotlight { mix-blend-mode: difference; }
```
カーソル追従要素を `difference` で重ねると "色反転 spotlight" になる (Tier 3 カーソル)。

### backdrop-filter
```css
.glass { backdrop-filter: blur(20px) saturate(180%); }
```
ガラス質感 / frosted glass。

Baseline 2024。
本プロジェクトでは: 装飾要素の重ねに使える。

---

## 15. CSS Nesting (native)

Sass 不要でネスト書ける。

```css
.card {
  padding: 1rem;
  & h2 { font-weight: bold; }
  &:hover { background: var(--accent); }
}
```

Baseline 2024。
本プロジェクトでは Claude が書きやすくなる (記述量減)。

---

## 16. 印刷 / メディア / 環境 query

- `@media (prefers-reduced-motion)` — 必須として既に対応
- `@media (prefers-color-scheme)` — light/dark で `light-dark()` と協調
- `@media (prefers-contrast)` — high contrast モード
- `@media (forced-colors)` — Windows ハイコントラスト
- `@media print` — 印刷用スタイル
- `@media (pointer: fine|coarse)` — マウス vs タッチ
- `@media (hover: hover|none)` — hover 可否

本プロジェクトでは: `prefers-reduced-motion` は強制済。
他は Claude が必要と判断した時の引き出し。

---

## 17. 試験段階 / 不安定 (参考)

- `interpolate-size` (`auto` 値のアニメ)
- `scroll-state()` 関連
- `transition-behavior: allow-discrete`
- `if()` 関数 (条件分岐)
- `@scope` の to bound
- CSS Houdini Paint API (worklets 登録要)

採用は対応状況次第。

---

## 18. このプロジェクトでの選別

| 機能 | 採用観点 |
|---|---|
| View Transitions | 機構導入で表現の幅広がる (TODO D1、catalog 整理後に再評価) |
| Container Queries | レイアウトテンプレ複数化の代替手段 |
| @scope | 当面不要 (詳細度ない) |
| @layer | 当面不要 (base/theme 2層で済んでる) |
| color-mix + oklch | ◎ 派生色生成で使いどころ多い |
| @property | グラデアニメ等で活きる |
| Scroll-driven anim | 慎重 (UX 配慮) |
| :has() | 良い、Claude の表現力上がる |
| Anchor Positioning | 将来 |
| Popover | 注釈や隠し要素で活きる可能性 |
| text-wrap: balance | 見出しに気持ちよく効く |
| Subgrid | 複雑レイアウト時 |
| mix-blend-mode | カーソル / 装飾で活きる |
| backdrop-filter | ガラス装飾 |
| Native nesting | 記述短くなる |

---

## Sources

- [Interop 2026 — CSS-Tricks](https://css-tricks.com/interop-2026/)
- [2026 CSS Features You Must Know — Riad Kilani](https://blog.riadkilani.com/2026-css-features-you-must-know/)
- [The Modern CSS Toolkit 2026 — Nick Paolini](https://www.nickpaolini.com/blog/modern-css-toolkit-2026)
- [What's New in CSS — modern-css.com](https://modern-css.com/whats-new/)
- [CSS Recently In All Browsers — nerdy.dev](https://nerdy.dev/CSS-recently-in-all-browsers)
- [20 Modern CSS Features You Need to Know in 2026 — Frontend Master](https://allahabadi.dev/blogs/css/20-modern-css-features/)
- [CSS Snapshot 2026 — W3C](https://www.w3.org/TR/css-2026/)
- [New to the web platform in March — web.dev](https://web.dev/blog/web-platform-03-2026)
