# CSS-only の境界線 — 何が描けて、何が描けないか

> 本プロジェクトの最大制約は **「HTML / Astro コンポーネントは触らない、`theme.css` の差し替えだけで日替わり」**。
> この制約のもと **CSS だけで何が表現可能か** を整理する。棚卸 → ギャップ確認 (= 「機構が要る」と分類) の起点になる辞書。

---

## 1. 触れる / 触れないの分類

### 触れる
- `src/styles/theme.css` — 日次で **Claude が全置換** する。色 / フォント / 余白 / 装飾 / モーション / 既存セレクタの上書き

### 触れない (Claude は手を出さない / 設計者がレアに触る)
- HTML 構造 (`*.astro` の DOM)
- `src/styles/base.css` — リセット / レイアウト構造 / 既存クラス名定義
- ルーティング / page 構成

### 触れる中間 (人間が判断して触る)
- 機構の追加 (例: `<ClientRouter />`, JS リスナー, データ属性): **これは Claude には許していない**。catalog 整理を経た後で人間が決める範囲

---

## 2. theme.css が必ず満たすべき contract

[scripts/generate-theme.ts](../../scripts/generate-theme.ts) の `validateCss` と `SYSTEM_PROMPT` から導ける制約:

### 変数 (`:root` で必須)
- `--color-fg` / `--color-bg` / `--color-accent`
- `--spacing-unit`
- `--font-heading` / `--font-body`
- `--line-height-body` / `--line-height-heading`
- `--ease-default`

### ブロック必須
- `@media (prefers-reduced-motion: reduce)` — animation / transition を `none !important` に

### 慣習 (system prompt 内、強制ではないが守る期待)
- WCAG AA コントラスト (4.5:1)
- 日本語システムフォントを `--font-body` に含める
- ファイル先頭にコメントで「曲名 / アーティスト / 一言ムード」

### 禁止
- `@import` 等の外部リソース
- `!important` の濫用 (`prefers-reduced-motion` ブロック以外)
- HTML 構造の変更を前提とするセレクタ (例: `body > div > div:nth-child(3)`)

---

## 3. base.css が固定している前提

[src/styles/base.css](../../src/styles/base.css) を読み解くと、Claude が前提として乗っかるべきクラス名 / 構造:

### レイアウトクラス (固定)
- `.site` — 全体 grid (`grid-template-rows: auto 1fr auto`)
- `.container` — `width: min(72ch, 100% - 2 * var(--spacing-unit, 1rem))`
- `.site-header` / `.site-footer` / `.site-main`

### ヘッダー (固定構造)
- `.brand` (リンク, `inline-flex`, gap)
- `.brand-mark` (`mask` + `currentColor` で henoheno.png を色追従)
- `.icon-link svg` (X / GitHub アイコン)

### 一覧 / 記事 (固定構造)
- `.post-list` / `.post-list a` / `.post-list time` / `.post-list h2`
- `article.post header` / `article.post .content > * + *`

### 404
- `.not-found` / `.not-found-mark` / `.not-found-msg`

**含意**: Claude は **これらのクラスに色や装飾を「上書き」する** ことはできるが、構造を変えるセレクタを書いても効かない。例えば `.post-list { display: grid; grid-template-columns: 1fr 1fr; }` で 2 カラム化はできる。が、`.post-list > li::after { content: "..."; }` で追加要素相当を出すことはできても、「ヘッダーの中にメニューを追加」は不可。

---

## 4. CSS-only で描ける表現 (★ 余裕あり)

### 配色 / トーン
- 全変数の置換 (色相 / 明度 / 配色スキーム)
- `color-mix()` / `oklch()` で派生色 → [color-systems.md](color-systems.md), [modern-css-techniques.md](modern-css-techniques.md)
- `prefers-color-scheme` で light/dark 二態

### タイポ
- フォント切替 (system stack 内)
- modular scale (`calc()` / `clamp()`)
- `writing-mode: vertical-rl` で縦書き (`<html>` 単位の切替は HTML 改変なので不可だが、`.container` 内だけ縦書きは可能)
- `text-wrap: balance` / `pretty`

### 背景 / 装飾
- gradient (linear / radial / conic / mesh)
- CSS-only パターン (dots / stripes / grid)
- SVG パターンの `data:` URI 埋め込み
- noise: SVG filter ファイルを参照可 (現状 public/ にはないが置けば使える)
- 多層 `background-image` + `mix-blend-mode`
- `backdrop-filter: blur()` で frosted glass
- `clip-path` で任意形状

### レイアウト変化
- `.post-list` の grid 化 (1col / 2col / bento)
- `.container` の `max-width` 変更
- `column-count` でマルチカラム (本文側)
- `:has()` で「画像のある記事だけ余白変更」等の条件分岐

### 状態
- `:hover` / `:focus-visible` / `:visited` / `::selection`
- `:has(:checked)` で擬似トグル

### モーション
- `transition` / `@keyframes`
- `@property` でアニメ可能なカスタムプロパティ
- `animation-timeline: scroll(root)` (Chrome/Edge のみ、慎重に)
- Disney 原理レベルの振付は [motion-and-easing.md](motion-and-easing.md)

### メタ要素
- `::selection` の色変更
- `scrollbar-color` / `scrollbar-width`
- `caret-color`
- `accent-color`
- `cursor: url(/*.svg), auto`

---

## 5. CSS-only で描けない表現 (= 機構を要求するもの)

### 完全に描けない (HTML / JS 必須)
- View Transitions API の **クロスドキュメント**: `@view-transition { navigation: auto; }` は CSS だが、Astro の `<ClientRouter />` 機構が要る (HTML 側)
- ページ間遷移の SPA 化全般
- JS リスナー前提のもの (mousemove bridge / scroll position tracking 等)
- 時刻シフト (data-tod 属性を `<html>` に立てる類): 属性が無いと CSS は条件分岐できない
- 動的 favicon (favicon 変更には JS が必要)
- localStorage 依存ギミック

### CSS でも描けるが現状の HTML だと限界
- 「ヘッダーに新しいメニュー項目を追加」: 既存 DOM を弄れない以上、`::after` で文字を出すしかない (リンクや SVG は出せない)
- 「サイドバー追加」: `.container` の中の構造は変えられないが、`position: fixed` で別レイヤーとして装飾なら可能
- 「`<dialog popover>` を使った注釈」: HTML タグそのものが要る (装飾の見せ方は CSS で自由)

### CSS で描けるが "詰め込み" 警戒で却下されてきたもの
[decisions.md](../decisions.md) と `session-2026-05-25.md` に蓄積された制約:
- 自動再生される音 (HTML5 audio + autoplay)
- ホイール乗っ取り (scroll-snap で擬似的にできるが酔うので不可)
- 大型 hero アニメ (重い)
- 過去テーマの可視化 (儚さ違反)

---

## 6. "機構を入れずに済む" 延命策

Claude は自由度を持つが、現状 HTML 不可侵。**機構を増やさずに CSS だけで近い体験を作る** 引き出し:

| やりたいこと | 機構を要求するナイーブ実装 | CSS-only 代替 |
|---|---|---|
| ページ遷移演出 | View Transitions (Astro `<ClientRouter />`) | `@keyframes` の `body { animation: fade-in 0.3s; }` で各ページ独立にフェードイン |
| 時刻による色変化 | `data-tod="morning"` 属性 | (現状不可。CSS には時刻知識がない。`@media` の dark scheme で代替できる範囲のみ) |
| マウス追従カーソル | JS `mousemove` | `cursor: url()` で見た目だけ変える / `:hover` で範囲反応 |
| 隠し要素の出現 | JS toggle | `<details>` (HTML 既存) + CSS / `:target` (URL hash) + CSS |
| 動的なテーマ切替 | JS toggle | `prefers-color-scheme` / `prefers-contrast` の機構を借りる |

---

## 7. 棚卸時の確認ポイント

- [src/styles/base.css](../../src/styles/base.css) で `min(72ch, ...)` 等が theme.css での自由を阻害していないか
- `validateCss` の required tokens が欠けても気付ける構造か
- system prompt の「禁止」節が現状の制約を全部書いているか (例: `@import` はあるが `expression-references.md` の「ない」節相当は書かれていない)
- 機構なしで描けることが充分 Claude に伝わっているか (= ナイーブ実装に走らない)

---

## 8. ギャップ確認フェーズ (catalog 整理 §2) との接続

[README.md](README.md) `使い方` で言う「機構が要る / prompt が要る / 規約緩和が要る」の分類は、ここの **§5 = 機構を要求するもの** から導かれる。逆に **§4 = CSS-only で描ける** に分類されたものが「prompt の語彙が足りないだけで本来描けるはず」のものになる。

つまり棚卸の手順は概ね:
1. 表現案を §4 と §5 に分類
2. §4 のうち実際に Claude が出していないものは **prompt 側のギャップ**
3. §5 のうち欲しいものは **機構の追加判断** (適切性ファースト原則と照合)

---

## 9. 関連

- [src/styles/base.css](../../src/styles/base.css) — 触れない既存スタイル
- [scripts/generate-theme.ts](../../scripts/generate-theme.ts) — contract / validate / sanitize
- [modern-css-techniques.md](modern-css-techniques.md) — 何が技術的に可能か
- [prompt-and-generation.md](prompt-and-generation.md) — 制約を Claude にどう伝えるか
- [../decisions.md](../decisions.md) — "詰め込み禁止" / "儚さ" の判断履歴

---

## Sources

- 本プロジェクトのコード (`base.css`, `theme.css`, `generate-theme.ts`)
- [Astro `<ClientRouter />`](https://docs.astro.build/en/guides/view-transitions/) — クロスドキュメント View Transitions の実装機構
- [MDN — Container queries / `:has()` / `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS) (§4 の各機能)
