# タイポグラフィの語彙

> 書体分類 / ペアリング / スケール / 日本語特性 の辞書。
> Claude が今より精緻なタイポグラフィ判断をするための引き出し。

---

## 1. 書体分類 (引き出しとしての辞書)

### Serif 系
- **Old-style** (Garamond, Caslon) — 軸斜め、書籍向き
- **Transitional** (Baskerville, Times) — 軸垂直化、汎用
- **Modern / Didone** (Bodoni, Didot) — 極端な太細、エディトリアル / ファッション
- **Slab serif** (Rockwell) — 力強さ
- **Humanist serif** (Lora, Source Serif) — 長文 web 向き

### Sans-serif 系
- **Grotesque** (Akzidenz, Bebas) — 無骨で機械的
- **Neo-grotesque** (Helvetica, Inter) — 汎用 UI 標準
- **Humanist sans** (Open Sans, Public Sans) — 温かさ、可読性
- **Geometric** (Futura, DM Sans) — モダン・主張強め
- **Neo-humanist** (Geist, Manrope) — 2020s 主流

### Mono / Display
- Typewriter mono (Courier) — ノスタルジック
- Programmer mono (Fira Code, JetBrains Mono) — 開発者向け
- Display mono (Space Mono) — 装飾用 / Y2K
- Pixel (Press Start 2P, DotGothic16) — レトロゲーム
- Script (Pacifico, Caveat) — 手書き風

### 日本語
- **明朝体** (Hiragino Mincho, Yu Mincho, Noto Serif JP) — 書籍向き
- **ゴシック体** (Hiragino Sans, Yu Gothic, Noto Sans JP) — UI 標準
- **丸ゴシック** (Hiragino Maru, Yusei Magic) — 柔らかさ
- **手書き** (Klee, Hachi Maru Pop) — 親しみ
- **装飾 / ディスプレイ** (Reggae One, Dela Gothic One) — 見出し専用

---

## 2. ペアリング原則

- **対立で組む**: 異なる分類で対比 (Serif 見出し + Sans 本文)
- **調和で組む**: 同じファミリーの weight 差 / 同じ humanist 系で揃える
- **一書体で通す**: 1 family で weight と size 差だけで階層 (Brutalism / Editorial)
- **日本語 × 欧文**: 欧文を見出しに、本文は日本語ベース。`line-height` 共通でもベースライン差に注意

---

## 3. モジュラースケール

見出しと本文のサイズ比率。`calc()` または `clamp()` で実装。

| 名前 | 比率 | 用途 |
|---|---|---|
| Minor third | 1.2 | UI / アプリ |
| Major third | 1.25 | ブログ本文 |
| Perfect fourth | 1.333 | 一般 web |
| Perfect fifth | 1.5 | LP / ポスター系 |
| Golden ratio | 1.618 | 編集物・高級 |
| Octave | 2.0 | ポスター / 全画面ヒーロー |

```css
:root { --type-base: 1rem; --type-ratio: 1.5; }
h2 { font-size: calc(var(--type-base) * pow(var(--type-ratio), 2)); }
/* または fluid */
h1 { font-size: clamp(2rem, 5vw + 1rem, 5rem); }
```

---

## 4. 行送り / 字間 / 段落幅

- `line-height`: 1.0-1.2 (見出し) / 1.4-1.6 (UI) / 1.7-1.9 (日本語本文) / 2.0+ (ZINE 風意図的)
- `letter-spacing`: -0.02em (見出し詰め) / 0 (標準) / 0.05-0.2em (装飾)
- 段落幅: 45-75 文字 (`ch`)、`width: min(75ch, 100%)` が定番。日本語は約 40 文字が読みやすい
- 本プロジェクト現状: [base.css](../../src/styles/base.css) で `min(72ch, ...)` を固定

---

## 5. 日本語タイポグラフィの注意点

### 約物 / 禁則
- `font-feature-settings: "palt"` でかな詰め
- `text-spacing-trim` (CSS 新仕様) で約物自動詰め
- `line-break: strict` で行頭・行末禁則

### 縦書き
- `writing-mode: vertical-rl` で右→左の縦書き
- 数字 / 英字の縦中横は `text-combine-upright: all`

### システムフォントスタック
```css
font-family: -apple-system, "Hiragino Sans", "Yu Gothic", "Meiryo", system-ui, sans-serif;
font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS PMincho", serif;
```
`system-ui` は macOS で San Francisco、Windows で Segoe UI、Android で Roboto。

---

## 6. ムード → 書体タイプ の翻訳

| 雰囲気 | 書体タイプ |
|---|---|
| クラシック / 文学的 | Old-style serif / Garamond 系 |
| モダン / 知的 | Neo-grotesque sans / IBM Plex 系 |
| 力強い / 攻撃的 | Slab serif / Bebas / 極太 grotesque |
| 高級感 | Modern Didone (Bodoni) |
| カジュアル / 親しみ | Humanist sans |
| 子供向け / ポップ | Display 丸書体 / 手書き系 |
| 技術的 / レトロ未来 | Mono / Pixel font |
| ノスタルジック | Typewriter mono / 手書き serif |
| アンダーグラウンド | システムフォント裸 / brutalist |
| 和的 / 伝統 | 明朝 / 行書系 |

---

## 7. 本プロジェクト視点

### 現状
- 欧文フォントは public/fonts に同梱 (システム + 任意追加可)
- 日本語は **システムフォント縛り** (decisions.md `自由度優先` で当面システム維持)
- 規約: `--font-heading` / `--font-body` を Claude が定義

### 棚卸時の確認
- system prompt に書体分類の語彙を Claude に渡す価値があるか
- 「装飾フォントの見出し + システムフォントの本文」の対立構造を Claude が引き出せているか
- 縦書き ([css-only-boundary.md](css-only-boundary.md) §4 に該当) を採る日があるなら system prompt で例示するか

---

## Sources

- [Practical guide to modular scale type — UX Republic](https://www.ux-republic.com/en/practical-guide-to-creating-a-modular-scale-type-for-your-interfaces/)
- [Type Scale Generator — FastTool](https://fasttool.app/tools/type-scale-calculator)
- [Cieden — Type Scale Types](https://cieden.com/book/sub-atomic/typography/different-type-scale-types)
