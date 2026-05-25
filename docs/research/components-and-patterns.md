# コンポーネントとパターン

> DESIGN.md の Components セクションに対応。
> 本プロジェクトの規模 (Header / Footer / 一覧 / 記事 / 404 のみ) に絞り、
> 出てくる atom / pattern の語彙を Claude が選べる引き出しとして整理。

---

## 1. 本プロジェクトに存在する要素 (現状)

[src/styles/base.css](../../src/styles/base.css) と [components/](../../src/components/) から:

| 要素 | クラス / セレクタ | 装飾の余地 (CSS-only) |
|---|---|---|
| ブランドマーク | `.brand-mark` (`mask` + `currentColor`) | サイズ・色追従の調整 |
| ブランドテキスト | `.brand` | フォント / 字間 / 装飾 |
| ヘッダーナビ | `.site-header nav`, `.icon-link svg` | アイコン色 / 配置 / hover |
| 記事一覧 | `.post-list`, `.post-list a`, `.post-list h2`, `.post-list time` | grid / card 化 / 装飾 |
| 記事本文 | `article.post header`, `article.post .content` | typography 強化 / 罫線 / drop cap |
| フッター | `.site-footer`, `.theme-credit` | 配置 / 字間 / 区切り装飾 |
| 404 | `.not-found`, `.not-found-mark`, `.not-found-msg` | 表現の遊び場 |

[css-only-boundary.md](css-only-boundary.md) に詳細あり。**HTML を変えない以上 atom の追加はできない** — 既存要素の "見せ方" を変えるのが本プロジェクトの全範囲。

---

## 2. Atom 別の表現語彙

### Link (本プロジェクトの主役)
- **Inline link**: 本文中、下線 + アクセント色
- **Navigation link**: メニュー内、最小装飾
- **Icon link**: SNS アイコン (`.icon-link svg` で `currentColor`)
- 状態: `:hover` / `:focus-visible` / `:visited`

```css
a { color: var(--color-accent); text-decoration: underline; text-underline-offset: 2px; }
a:hover { text-decoration-thickness: 2px; }
```

### Heading
- h1-h6 階層 (modular scale で size 制御 → [typography.md](typography.md))
- 装飾: 下線 / 縁取り / アクセント色 / counter (`counter-increment`)
- 番号付き見出し: CSS counter で実装可能

### List
- ul / ol / dl
- `::marker` でマーカー装飾
- `list-style-image: url(/bullet.svg)` で SVG マーカー

### Time / Date
- `<time datetime="...">` (記事一覧と本文)
- `font-variant-numeric` で数字表現

### Image (現状ほぼ未使用)
- 装飾枠 / `aspect-ratio` / フィルター

---

## 3. Pattern (compound) の語彙

### List → Card 化
`.post-list` を grid 化して 2-col bento や masonry にできる:
```css
.post-list { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.post-list > li { padding: 1rem; border: 1px solid var(--color-fg); }
```

### Hero (記事ページの header)
`article.post header h1` を大判タイポにして hero 化する余地。

### Empty State
404 ページが該当。`decisions.md` で「ここには何もない + / へのリンクのみ」と確定済。表現の遊び場として残る。

### Index / Archive
トップページ。`.post-list` の構成次第で magazine 風 / minimal index 風に振れる。

### Article / Long-form
記事ページ。行幅 (`min(72ch, ...)`) は base.css で固定だが、内側装飾 (drop cap / 引用 / 見出し階層) は theme.css で自由。

---

## 4. 状態 (state) の表現

`:hover` / `:focus-visible` / `:visited` / `::selection` / `:has()` が現実的に使える。

`:focus-visible` は a11y 必須なので Claude が省略すると微妙 — `base.css` で default を持たせるか、prompt で要求するかは棚卸事項。

---

## 5. 規約化のレベル感

| レベル | 内容 | 本プロジェクトの位置 |
|---|---|---|
| A | Token のみ (色 / 余白 / フォントの変数) | **現状** |
| B | atom クラス定義 (`.btn-primary` 等) | 不要 (button が無い) |
| C | variant 用意 (`.card-magazine` 等) | Claude の自由度を縛るので不採用 |
| D | Astro component で props 切替 | HTML 改変、本プロジェクト非対象 |

A のままが本プロジェクトの精神 ([decisions.md](../decisions.md) 「自由度優先」) と一致。

---

## 6. 棚卸時の確認

- Header / Footer の class 命名が theme.css で再現性ある形か
- `.post-list` を Claude が grid 化する選択肢を持っているか
- link の `:hover` / `:focus-visible` を Claude が個別に書くか、base.css に default を持たせるか
- 記事本文の typography (drop cap / 引用) を Claude が触る余地が伝わっているか

---

## Sources

- [Atomic Design — Brad Frost](https://atomicdesign.bradfrost.com/chapter-2/) (一般慣習として)
- [src/styles/base.css](../../src/styles/base.css) — 触れない既存スタイル
- [Popover API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (HTML 改変が許せば使える)
