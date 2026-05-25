# SVG とアイコノグラフィ

> SVG の表現技法 / アイコンシステム / 装飾用 SVG パターン。
> DESIGN.md には明示セクションはないが、AI 生成テーマで活用余地大きい。

---

## 1. SVG の基本構成要素

### 描画要素
- `<rect>` / `<circle>` / `<ellipse>` / `<line>` / `<polyline>` / `<polygon>`
- `<path>` (汎用、d 属性に SVG path 構文)
- `<text>` (文字)
- `<image>` (ラスター画像埋込)

### グルーピング
- `<g>` (グループ)
- `<defs>` (定義のみ、描画されない)
- `<use href="#id">` (再利用)
- `<symbol>` (再利用可能なシンボル定義)

### グラデーション / パターン
- `<linearGradient>` / `<radialGradient>` / `<conicGradient>`
- `<pattern>` (繰り返しパターン)

### フィルター / マスク
- `<filter>` (blur, displacement, turbulence 等多数)
- `<mask>` / `<clipPath>`

---

## 2. SVG での表現語彙

### 幾何パターン
- ドット (`<circle>` を grid に配置)
- ストライプ (`<line>` 繰り返し or `<pattern>`)
- グリッド
- ハニカム (六角形)
- 三角タイル
- 波線 (`<path>` で sin 風カーブ)

### 抽象 / 有機
- blob (不規則 closed path)
- waveform
- isobars (等高線風)
- mesh / mandala
- ノイズ ( `<feTurbulence>` フィルター)
- 雲 / 煙 (turbulence + displacement)

### 装飾
- 罫線 (`<path>` で実線 / 破線 / 装飾線)
- 角飾り (4 隅に装飾)
- フレーム (額装、リボン)
- スタンプ (回転 + 半透明)
- アイコン (記号化された絵)

---

## 3. currentColor の活用

SVG 内で `fill="currentColor"` / `stroke="currentColor"` にすると、
親 CSS の `color` プロパティに追従する。

```html
<svg viewBox="0 0 24 24" style="color: red;">
  <path d="..." fill="currentColor" />
</svg>
```

本プロジェクトでは X / GitHub アイコンで採用済。
theme.css の `--color-fg` 等に追従させられる。

---

## 4. インライン SVG vs `<img>` vs アイコンフォント

### インライン SVG
- CSS で色変えられる (currentColor)
- アニメーション可能
- DOM size 増える

### `<img src="*.svg">`
- 単純、キャッシュ効く
- currentColor 効かない (外部参照のため)
- CSS で色変更不可

### CSS mask + background-color (今の brand-mark の手法)
- 外部 SVG を mask として使える
- 背景色で色制御 → currentColor 代用
```css
.icon {
  mask: url(/icon.svg) center / contain no-repeat;
  -webkit-mask: url(/icon.svg) center / contain no-repeat;
  background-color: currentColor;
}
```

### アイコンフォント (非推奨気味)
- font-family で読み込む
- 古典的だがアクセシビリティ問題、SVG が主流

---

## 5. パターン生成テクニック

### CSS-only background patterns
```css
.dots {
  background-image: radial-gradient(currentColor 1px, transparent 1px);
  background-size: 16px 16px;
}
.stripes {
  background: repeating-linear-gradient(
    45deg, transparent, transparent 10px,
    rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px
  );
}
.grid {
  background-image:
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### SVG パターン (data URI)
```css
.pattern {
  background-image: url("data:image/svg+xml;utf8,<svg ...>...</svg>");
}
```
URL エンコード必要 (特に `<`, `>`, `#`)。

### ジェネレーター
- [Hero Patterns](https://heropatterns.com/) — 無料 SVG パターン集
- [SVG Backgrounds](https://www.svgbackgrounds.com/)
- [Pattern Monster](https://pattern.monster/)
- [Doodad pattern generator](https://doodad.dev/pattern-generator/)

---

## 6. SVG フィルター (feTurbulence など)

### ノイズテクスチャ
```html
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" />
  </filter>
  <rect width="100%" height="100%" filter="url(#noise)" opacity="0.1" />
</svg>
```

CSS から SVG フィルターを呼ぶ:
```css
.grain { filter: url(/filters.svg#noise); }
```

### Displacement (歪み)
- `<feDisplacementMap>` で他の要素を歪ませる

### Glow
```html
<filter id="glow">
  <feGaussianBlur stdDeviation="4" />
  <feMerge>
    <feMergeNode />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

---

## 7. アイコンシステムの設計

### サイズスケール
- 16 / 20 / 24 / 32 / 48 / 64 px
- ストロークの太さ (1.5-2px が標準)

### スタイル選択
- **Outlined** (Feather, Lucide) — 細い線、汎用
- **Filled** (Material) — 塗り、強調
- **Duotone** — 2 色で奥行き
- **Hand-drawn** — 手書き感
- **Pixel** — レトロゲーム

### 整合性
- ストローク太さを統一
- 角丸を統一 (rounded / sharp)
- 余白 (padding) を統一
- グリッドに揃える

### 本プロジェクトでの現状
- X / GitHub のみインライン SVG
- 必要に応じて Lucide / Feather から拾う案あり (OFL ライセンス)
- 装飾的なアイコン (時計、星、矢印 etc.) は未使用

---

## 8. ジェネレーティブ SVG

LLM (Claude) が SVG を生成する場合:

### 強み
- パターン / 抽象画は得意
- 色は theme.css の変数に揃えやすい

### 弱み
- 複雑な path は不正確になりがち
- アイコンとして整合性のあるシリーズを描くのは難しい
- フォントレンダリングは環境依存

### 本プロジェクトでの実例
- OGP の og.svg は Claude 生成 (validateOgSvg で構文ガード)
- 記事 OGP のテンプレも SVG (テンプレ置換)
- decoration として theme.css 内に SVG data URI を埋め込むのも可能

---

## 9. 性格マッピング

| SVG 選択 | 性格 |
|---|---|
| 幾何パターン (dots/stripes) | minimalist / modern / industrial |
| ノイズテクスチャ | film / vintage / 紙質感 |
| グラデメッシュ | dreamy / Y2K / 流行寄り |
| 手書き SVG | 親しみ / cottagecore / casual |
| Outlined icon | clean / UI 系 |
| Filled icon | 強調 / ポップ |
| 装飾的 SVG (フレーム/罫線) | editorial / Victorian / 装飾的 |

---

## 10. 本プロジェクト視点

### 現状
- インライン SVG (Header の X/GH icon)
- CSS mask (brand-mark)
- OGP SVG (Claude 生成)
- 記事 OGP (テンプレ置換)

### 棚卸時の確認
- decoration を Claude が SVG で書ける余地があるか (data URI 推奨か?)
- アイコンを追加するなら統一感のあるセットをどう curate するか
- noise / grain を効果的に使うサンプルがあると Claude が引き出しやすい

---

## Sources

- [SVG — MDN](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [Hero Patterns](https://heropatterns.com/)
- [SVG Backgrounds](https://www.svgbackgrounds.com/)
- [CSS-Tricks — A Complete Guide to SVG](https://css-tricks.com/snippets/svg/)
- [Lucide Icons](https://lucide.dev/) (Feather successor, ISC ライセンス)
