# コンポーネントとパターン

> Atom レベル (button, input, card) から compound パターンまで。
> DESIGN.md の Components セクションに対応。

---

## 1. Atomic Design

Brad Frost の分類:

| 層 | 例 |
|---|---|
| **Atoms** | ボタン、入力、ラベル、アイコン、見出し |
| **Molecules** | フォーム行 (label + input)、検索バー、ナビアイテム |
| **Organisms** | ヘッダー、カード、リスト、フォーム全体 |
| **Templates** | レイアウト構造 |
| **Pages** | 実コンテンツ入りページ |

本プロジェクトは規模小で Organism までで十分:
- Atoms: 見出し、リンク、本文
- Organisms: Header / Footer / 記事カード / 記事本文

---

## 2. Atom 別の語彙

### Button
- **Primary** (アクションを促す、最も目立つ): 充填色 + 高コントラスト
- **Secondary** (代替アクション): 罫線 + 透明背景
- **Tertiary / Ghost**: 罫線も色も控えめ
- **Destructive**: 赤系で警告
- **Icon button**: アイコンのみ
- **Link button**: 下線付きテキスト

属性軸: size (sm/md/lg) / weight (normal/bold) / shape (rectangle/pill/icon)

### Link (本プロジェクトの主役)
- **Inline link**: 本文中、下線 + アクセント色
- **Navigation link**: メニュー内、最小装飾
- **External link**: target=_blank、外部マーク
- **Icon link**: SNS アイコン等

スタイル例:
```css
a { color: var(--color-accent); text-decoration: underline; text-underline-offset: 2px; text-decoration-thickness: 1px; }
a:hover { text-decoration-thickness: 2px; }
```

### Input / Form
本プロジェクトには現状なし。将来コメント等で必要なら:
- text input / textarea / select / checkbox / radio / file
- focus ring の意匠 (アクセシビリティ必須)
- error state / disabled state

### Heading
- h1 → h6 の階層 (modular scale で size 制御)
- 見出しの装飾 (下線 / 縁取り / アクセント色)
- 番号付き見出し (counters CSS で `counter-increment`)

### List
- ul / ol / dl
- マーカーのカスタム (`::marker`)
- `list-style-image` で SVG マーカー

### Image (本プロジェクトは少ない)
- ratio 維持 (`aspect-ratio` CSS)
- placeholder / lazy loading
- 装飾枠 (フィルム枠、額装)

---

## 3. Molecule / Organism 別の語彙

### Card
- **Standard card**: 画像 + タイトル + 説明 + リンク
- **Quote card**: 引用 + 引用元
- **Stat card**: 大数字 + 説明
- **Action card**: タイトル + CTA ボタン
- **Image card**: 画像が主、テキストは下部

属性軸: shape / shadow / hover反応 / 配置 (横並び/縦)

### Navigation
- **Top nav**: ヘッダー水平
- **Sidebar nav**: 縦配置 (本プロジェクトでは未使用)
- **Bottom nav**: モバイル下部
- **Breadcrumb**: 階層位置
- **Tab**: 切替可能
- **Pagination**: ページ送り

### Header / Footer (本プロジェクトの主役)
- **Header**: ブランド / ナビ / メタ要素
- **Footer**: コピーライト / クレジット / リンク

### Empty State
404 / no result / コンテンツなし の表現
本プロジェクトでは 404 page で実装済

### Loading state
- spinner / skeleton / progress bar
- 本プロジェクトは静的サイトなので不要

### Modal / Popover
- 注釈 / 詳細表示
- HTML `<dialog popover>` で JS なしで実現可能 (新仕様)

---

## 4. 状態 (state) の表現

各 atom が持つ可能性のある state:

- **default** (通常)
- **hover** (マウス乗せ)
- **focus** (キーボードフォーカス、a11y 必須)
- **focus-visible** (キーボードのみ focus を可視化)
- **active** (押されてる瞬間)
- **disabled** (押せない)
- **loading** (処理中)
- **selected** (選択済)
- **error** (エラー)
- **visited** (リンク既訪)

各状態の視覚差は、ユーザーへの feedback として重要。
本プロジェクトでは主に hover / focus / visited をどう扱うかが要。

---

## 5. パターン (compound) の語彙

### Hero
ページ冒頭の "顔" 領域。タイトル + sub + CTA。

### Feature list / grid
特徴を並べる。3-4 列のグリッド or アイコン + テキスト。

### Testimonial / Quote
引用を見せる。
本プロジェクトでは曲名引用が footer に出るのが類似パターン。

### Timeline
時系列の表現。本プロジェクトでは過去テーマ非可視化なので使わない。

### Article / Long-form
本文中心、行幅最適化、見出し階層、引用、コード。
本プロジェクトの記事ページの形。

### Index / Archive
一覧表示。
本プロジェクトのトップページ。

---

## 6. 規約化のレベル感

DESIGN.md 的なアプローチで、コンポーネントを **どこまで定義しておくか**:

### A. Token のみ (現状本プロジェクト)
色 / 余白 / フォントの変数だけ定義、レイアウトは個別

### B. Atom スタイル定義
button / link / heading の class まで定義
```css
.btn-primary { ... }
.btn-secondary { ... }
```

### C. Organism + variant
card-magazine / card-minimal / card-zine 等のスタイル別 variant を用意

### D. Component framework
Astro component に props で variant 切替

本プロジェクトは **A → 軽い B (link / heading のみ)** が現実的。Claude の自由度を保ちつつ最低限の規約。

---

## 7. 本プロジェクト視点

### 現状のコンポーネント
- Header.astro (brand-mark + brand-text + nav)
- Footer.astro (theme-credit + copyright)
- pages/index.astro (post-list)
- pages/[slug].astro (article)
- pages/404.astro

### 棚卸時の確認
- Header / Footer の class 命名が theme.css で再現性ある形か
- link の hover / focus 状態を Claude が個別に書いてるか規約化されてるか
- post-list の card 構造に Claude が自由に装飾足せる余地はあるか

---

## Sources

- [Atomic Design — Brad Frost](https://atomicdesign.bradfrost.com/chapter-2/)
- [Material Design — Components](https://m3.material.io/components)
- [Refactoring UI — Component patterns](https://www.refactoringui.com/)
- [Popover API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
