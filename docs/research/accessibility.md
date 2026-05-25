# アクセシビリティの語彙

> WCAG / 色覚 / モーション / セマンティック HTML / フォーカス管理。
> AI 生成テーマでも崩してはいけない最低限の規律。

---

## 1. WCAG (Web Content Accessibility Guidelines)

### バージョン
- WCAG 2.0 (2008)
- WCAG 2.1 (2018) — モバイル / 認知配慮追加
- WCAG 2.2 (2023) — フォーカス可視性 / ドラッグ操作等
- WCAG 3.0 (策定中) — より柔軟・包括的に

### 4 つの原則 (POUR)
1. **Perceivable** (知覚可能) — 全感覚で受け取れる
2. **Operable** (操作可能) — 全入力デバイスで操作できる
3. **Understandable** (理解可能) — 内容と動作が明瞭
4. **Robust** (堅牢) — 様々な技術 (支援技術含む) で動く

### 適合レベル
- A (最低限)
- AA (実用的、法的要件として多い)
- AAA (上級、すべて達成は現実的でない)

---

## 2. コントラスト

### 比率の最低基準
| 要素 | AA | AAA |
|---|---|---|
| 本文 (normal text) | 4.5:1 | 7:1 |
| 大文字 (18pt+ or 14pt bold+) | 3:1 | 4.5:1 |
| UI コンポーネント / グラフィカル | 3:1 | — |

### 計算ツール
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- DevTools の "contrast ratio"
- [APCA](https://www.myndex.com/APCA/) (WCAG 3.0 候補の新方式)

### 本プロジェクトの規約
- system prompt に「WCAG AA を意識」を含めているが強制ではない
- 将来は生成後の自動検証 (CSS パース + コントラスト計算) もあり得る

---

## 3. 色覚多様性

### 色覚特性の種類
- P 型 (Protanopia) — 赤の知覚弱
- D 型 (Deuteranopia) — 緑の知覚弱
- T 型 (Tritanopia) — 青の知覚弱 (稀)

### 設計原則
- **色だけで意味を伝えない** (アイコン / 形 / 位置 / テキストでも示す)
- 例: エラーは赤 + 形 + メッセージ
- 例: リンクは色 + underline

### ツール
- [Color Oracle](https://colororacle.org/) — シミュレーター
- ブラウザ DevTools で色覚エミュレーション可能

---

## 4. フォーカス管理

### キーボード操作
- Tab で要素を辿れる
- Enter / Space でアクティブ化
- Escape でモーダル閉じ等
- フォーカス順序が論理的

### `:focus-visible` (推奨)
キーボード操作時のみフォーカスリングを表示:
```css
button:focus { outline: none; }
button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

マウスクリックでは表示しないが、Tab 移動では表示。

### フォーカスリングの意匠
- 太さ 2-3px が標準
- offset (要素の外側に少し離す) で見やすく
- アクセントカラーを使うとデザインと統合

### Focus trap (モーダル等)
- モーダル内で Tab がループするように JS で制御
- HTML `<dialog>` 要素は自動でやる

---

## 5. セマンティック HTML

### 重要なタグ
- `<header>` / `<nav>` / `<main>` / `<article>` / `<aside>` / `<footer>` — ランドマーク
- `<h1>` から `<h6>` — 階層 (1 ページに 1 つの h1 が推奨)
- `<ul>` / `<ol>` / `<dl>` — リスト
- `<figure>` / `<figcaption>` — 画像 + キャプション
- `<time datetime="...">` — 日時
- `<button>` (アクション) vs `<a>` (遷移) の使い分け

### 本プロジェクトでは
- ランドマークタグは Base.astro で使用済
- `<article>` を記事ページに使用
- `<time>` でフロントマターの日付
- 規律は概ね守られてる

---

## 6. ARIA (避けるべき場合とそうでない場合)

### "No ARIA is better than bad ARIA"
- セマンティック HTML で済むなら ARIA 不要
- 既存の HTML 要素を使うべき

### 必要な場面
- `aria-label` (アイコンボタン等、視覚にラベルがない時)
- `aria-hidden="true"` (装飾要素、SR から除外)
- `role` (semantic HTML で表現できない構造)
- `aria-live` (動的更新の通知)

### 本プロジェクトの実例
- X / GitHub アイコンの親 `<a>` に `aria-label`
- SVG に `aria-hidden="true"`

---

## 7. モーション配慮

### `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### vestibular disorder (前庭障害) への配慮
- パララックス / 大きな動き / カメラ移動風アニメは酔いを引き起こす
- 自動再生される animation は短く / opt-out 可能に

---

## 8. その他の preferences クエリ

- `prefers-color-scheme: light | dark` — OS の light/dark mode
- `prefers-contrast: more | less | no-preference` — 高コントラスト要求
- `prefers-reduced-transparency` — 透明効果を減らす要求
- `prefers-reduced-data` — データ節約要求
- `forced-colors: active` — Windows のハイコントラストモード

各 query に応じて適切な fallback / 強化を提供。

---

## 9. 読みやすさ

### Typography
- 本文サイズは 16px 以上を推奨 (1rem)
- 行間 1.5+ (日本語は 1.7+)
- 行幅 45-75 文字 (`ch`)
- font weight 400 以上の本文 (細すぎは読めない)
- ハイフネーション / `text-wrap: pretty` で改行を自然に

### 日本語特有
- 約物の自動調整 (`text-spacing-trim`)
- 行頭・行末禁則 (`line-break`)
- ルビ (`<ruby>` 要素)
- 縦書き対応 (`writing-mode`) — 視覚特性考慮

---

## 10. screen reader 配慮

### 画像
- `alt` 属性必須 (装飾なら `alt=""`)
- 複雑図表は `aria-describedby` で長い説明

### リンク
- 「ここをクリック」など曖昧なリンクテキスト避ける
- 文脈なしで意味が通るリンクテキストに

### 動的コンテンツ
- 更新通知に `aria-live` を使う
- フォーカス移動は予測可能に

---

## 11. cognitive accessibility (認知配慮)

- 簡潔な文章
- 一貫したナビゲーション
- 明確な見出し階層
- エラーメッセージは具体的に
- タイマーや時間制限は避けるか延長可能に

---

## 12. テスト方法

### 自動
- axe DevTools / Lighthouse / WAVE
- pa11y (CI 統合可能)

### 手動
- キーボードのみで全機能を使ってみる
- スクリーンリーダー (VoiceOver / NVDA / JAWS) で読ませる
- 200% ズームで使ってみる
- 色覚エミュレーターで確認

---

## 13. 本プロジェクト視点

### 現状の良いところ
- セマンティック HTML を概ね使ってる
- prefers-reduced-motion を必須として規約化
- WCAG AA を system prompt で意識
- フォーカスリングは theme.css 次第 (Claude が書くかどうか)

### 改善余地
- `:focus-visible` を base.css の default に入れるか
- WCAG コントラストの自動検証 (CSS 生成後)
- スクリーンリーダーで実際に読ませてみる検証 (まだ未実施)
- 認知配慮: 文章はシンプルか? (記事は人手なので別問題)

---

## Sources

- [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)
- [WebAIM — Web Accessibility In Mind](https://webaim.org/)
- [a11y-project — Checklist](https://www.a11yproject.com/checklist/)
- [APCA — Accessible Perceptual Contrast Algorithm](https://www.myndex.com/APCA/)
- [Inclusive Components — Heydon Pickering](https://inclusive-components.design/)
- [Color Oracle](https://colororacle.org/)
