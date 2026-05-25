# タイポグラフィの語彙

> フォント分類 / ペアリング / スケール / 行送り / 日本語特性 の辞書。
> Claude が今より精緻なタイポグラフィ判断をするための参照軸。

---

## 1. 書体分類 (Type classification)

### Serif 系
- **Old-style** (Garamond, Caslon) — 軸が斜め、コントラスト低、書籍向き
- **Transitional** (Baskerville, Times) — 軸が垂直化、コントラスト中、汎用
- **Modern / Didone** (Bodoni, Didot) — 軸垂直、極端な太細コントラスト、エディトリアル / ファッション
- **Slab serif** (Rockwell, Roboto Slab) — セリフが太く板状、ラフ / 力強さ
- **Humanist serif** (Lora, Source Serif) — 手書き由来の柔らかさ、長文 web 向き

### Sans-serif 系
- **Grotesque** (Akzidenz, Bebas) — 19世紀発、やや無骨で機械的
- **Neo-grotesque** (Helvetica, Inter, Arial) — グロテスクの整理版、汎用 UI 標準
- **Humanist sans** (Verdana, Open Sans, Public Sans) — 手書き由来の温かさ、読みやすい
- **Geometric** (Futura, Avenir, DM Sans) — 円・三角・四角から構成、モダンで主張強め
- **Neo-humanist** (Geist, Manrope) — 2020s 以降の "modern web" 主流、コンパクト

### Mono
- **Typewriter mono** (Courier, Special Elite) — タイプライター由来、ノスタルジック
- **Programmer mono** (Fira Code, JetBrains Mono, JetBrains Mono) — 開発者向け、可読性
- **Display mono** (Space Mono, Major Mono) — 装飾用 mono、Y2K 系

### Display
- **Decorative** (Bungee, Lobster) — タイトル専用、本文には使わない
- **Script** (Pacifico, Caveat, Permanent Marker) — 手書き風、装飾
- **Pixel** (Press Start 2P, DotGothic16) — レトロゲーム / 8bit

### 日本語
- **明朝体** (Hiragino Mincho, Yu Mincho, Noto Serif JP) — 横細・縦太、書籍向き
- **ゴシック体** (Hiragino Sans, Yu Gothic, Noto Sans JP) — 均一太さ、UI 標準
- **丸ゴシック** (Hiragino Maru, Yusei Magic) — 角を丸めた柔らかさ
- **手書き** (Klee, Hachi Maru Pop, Kosugi) — 親しみやすさ
- **装飾 / ディスプレイ** (Reggae One, Dela Gothic One, Train) — 見出し専用

---

## 2. ペアリング原則

### 対立で組む
- 異なる分類 (Serif + Sans / Mono + Display) で対比
- 例: Playfair Display (見出し) + Source Sans (本文)
- 例: Special Elite (見出し) + Helvetica (本文)

### 調和で組む
- 同じファミリーの異なる weight (Inter Bold + Regular)
- 同じ humanist 系で揃える (Lora Serif + Open Sans Humanist)

### 一書体だけで通す
- 1 family で weight と size 差だけで階層を作る (Brutalism / Editorial の手)

### 日本語 × 欧文の組合せ
- 欧文 display + 日本語 system stack
- 欧文を見出しに使い、本文は日本語ベースで欧文混在
- フォント切替時の "ベースライン" の違いに注意 (`line-height` 共通でも見え方が違う)

---

## 3. モジュラースケール

見出しと本文のサイズ比率。音階由来の数値が定番。

| 名前 | 比率 | 雰囲気 | 用途 |
|---|---|---|---|
| Minor third | **1.2** | 控えめ階層 | UI / アプリ |
| Major third | **1.25** | 標準 | ブログ本文 |
| Perfect fourth | **1.333** | 明快 | 一般 web |
| Augmented fourth | 1.414 | やや強い | バランス重視 |
| Perfect fifth | **1.5** | 強い階層 | LP / ポスター系 |
| Golden ratio | **1.618** | 古典的・優雅 | 編集物・高級 |
| Octave | 2.0 | 極端 | ポスター / 全画面ヒーロー |

### 適用例
- base 1rem、比率 1.5 (perfect fifth):
  - h6: 1rem / h5: 1.5rem / h4: 2.25rem / h3: 3.375rem / h2: 5.06rem / h1: 7.6rem
- base 1rem、比率 1.2 (minor third):
  - h6: 1rem / h5: 1.2rem / h4: 1.44 / h3: 1.73 / h2: 2.07 / h1: 2.49

### CSS で実装
```css
:root {
  --type-base: 1rem;
  --type-ratio: 1.5;
  --type-h6: var(--type-base);
  --type-h5: calc(var(--type-base) * var(--type-ratio));
  --type-h4: calc(var(--type-h5) * var(--type-ratio));
  /* ... */
}
```

または直接 `clamp()` で fluid type scale:
```css
h1 { font-size: clamp(2rem, 5vw + 1rem, 5rem); }
```

---

## 4. 行送り / 字間 / 段落幅

### 行間 (`line-height`)
- 1.0-1.2: 見出し / 詰めた印象 / ポスター
- 1.4-1.6: UI / 読みやすさ
- 1.7-1.9: 長文本文 / ゆったり (日本語向きでは 1.7+ 推奨されることも)
- 2.0+: 過剰、ZINE 風や Editorial で意図的に

### 字間 (`letter-spacing`)
- ネガティブ (-0.02em〜-0.05em): 見出しで詰めて密度感
- ゼロ近辺: 標準
- 緩め (0.05em〜0.2em): 控えめ装飾
- 強め (0.3em以上): 大文字キャプション、ポスター調

### 段落幅 (一行あたりの文字数)
- 推奨は **45-75 文字** (`ch` 単位で測れる)
- `width: min(75ch, 100%)` が定番
- 詰めると (40ch) 読みやすさを軽く犠牲にした密度感
- 広げると (90ch+) 視線移動が長くなる

---

## 5. 日本語タイポグラフィの注意点

### 等幅と非等幅
- 日本語の漢字・かなは伝統的に正方形だが、現代フォントは非等幅 (proportional) もある
- `font-feature-settings: "palt"` で約物・かな詰め
- `text-spacing-trim` (CSS 新仕様) で約物の自動詰め

### 行頭・行末禁則
- 句読点が行頭に来ない / 開き括弧が行末に来ない
- `line-break: strict` で強制 (default は緩い)

### 縦書き
- `writing-mode: vertical-rl` で右→左の縦書き
- 数字や英字の縦中横は `text-combine-upright: all` (要 unicode-range 指定で部分適用)

### システムフォントスタック (日本語)
```css
font-family: -apple-system, "Hiragino Sans", "Yu Gothic", "Meiryo", system-ui, sans-serif;
font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS PMincho", serif;
```

`system-ui` は macOS で San Francisco、Windows で Segoe UI、Android で Roboto を選ぶ。

---

## 6. 表現上の "性格" マッピング (参考)

| 雰囲気 | おすすめ書体タイプ |
|---|---|
| クラシック / 文学的 | Old-style serif + Italic / Garamond 系 |
| モダン / 知的 | Neo-grotesque sans / IBM Plex 系 |
| 力強い / 攻撃的 | Slab serif / Bebas / 極太 grotesque |
| 高級感 | Modern Didone (Bodoni) / 高コントラスト serif |
| カジュアル / 親しみ | Humanist sans + 適度な line-height |
| 子供向け / ポップ | Display 丸書体 / 手書き系 |
| 技術的 / レトロ未来 | Mono / Pixel font |
| ノスタルジック | Typewriter mono / 手書き serif |
| アンダーグラウンド | システムフォント裸 / brutalist |
| 和的 / 伝統 | 明朝 / 行書系 |

---

## Sources

- [Practical guide to modular scale type — UX Republic](https://www.ux-republic.com/en/practical-guide-to-creating-a-modular-scale-type-for-your-interfaces/)
- [What the Font are Vertical Rhythm and Modular Scale — Bounteous](https://www.bounteous.com/insights/2018/03/26/what-font-are-vertical-rhythm-and-modular-scale/)
- [Type Scale Generator — FastTool](https://fasttool.app/tools/type-scale-calculator)
- [Typographic Scale in Web Design — B12](https://www.b12.io/glossary-of-web-design-terms/typographic-scale/)
- [Cieden — Type Scale Types](https://cieden.com/book/sub-atomic/typography/different-type-scale-types)
