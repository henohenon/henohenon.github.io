# 形 / 深度 / 階層の語彙

> 角丸 / 影 / 立体感 / 重なり = ビジュアル階層の表現。
> DESIGN.md の Shapes / Elevation & Depth セクションに対応。

---

## 1. 角丸 (corner radius)

### スケール例
```css
:root {
  --radius-none: 0;
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 9999px;  /* 完全ピル */
  --radius-circle: 50%;
}
```

### 性格との対応
| 角丸 | 雰囲気 |
|---|---|
| 0 | 硬派、brutalist、editorial、industrial |
| 2-4px | 控えめ整い、UI 系 |
| 8-12px | モダン web 標準、親しみ |
| 16-24px | ポップ、ふんわり、ボリュームある印象 |
| pill | フレンドリー、タグ・ボタン |
| 50% (circle) | アバター、装飾点 |

### 部分角丸
```css
border-radius: 16px 0 16px 0;  /* 対角だけ角丸 */
border-radius: 50% 20% 50% 20%; /* 葉っぱ形 */
```

### 滑らかな曲線 (squircle)
- `border-radius: 50%` は楕円
- iOS 風の "squircle" は SVG / CSS clip-path で実現
- `border-radius: 32px / 16px;` で楕円弧
- `corner-shape: superellipse(...)` (CSS 仕様、まだ実験)

---

## 2. 影 (shadow) システム

### 階層的シャドウスケール
```css
:root {
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
  --shadow-2xl: 0 25px 50px rgba(0,0,0,0.25);
}
```

### スタイル別
- **Soft / Diffused**: 大きい blur、薄い alpha → 上品、上に浮いてる感
- **Hard / Offset**: blur 0、はっきりした offset → デザイン系、neobrutalism
- **Inset**: 内側影 → 凹んだ感じ、押し込まれ感
- **Glow / Neon**: 色付き影、blur 大 → 発光、cyberpunk
- **Multi-layer**: 複数 box-shadow を重ね → 細密表現

### 例: Neobrutalist hard shadow
```css
.card {
  border: 2px solid black;
  box-shadow: 6px 6px 0 black;
}
.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 black;
}
```

### 例: Neumorphism
```css
.card {
  background: #e0e0e0;
  box-shadow:
    8px 8px 16px #bebebe,
    -8px -8px 16px #ffffff;
}
```
(現代では accessibility 観点で非推奨気味)

### filter: drop-shadow
透明部分にも影が落ちる (box-shadow は矩形のみ):
```css
img { filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); }
```

---

## 3. 深度 / 階層 (elevation) の表現方法

影だけが手段じゃない:

### A. 影
最も一般的、Material Design 由来

### B. 罫線
```css
.card { border: 1px solid var(--color-fg); }
```
brutalism / editorial では罫線で階層を作る

### C. 背景色の差
```css
.layer-1 { background: var(--color-bg); }
.layer-2 { background: color-mix(in oklch, var(--color-bg), white 10%); }
```
zen な階層、影なしで深さを出す

### D. 余白の差
要素間に大きい余白を取ることで、視覚的にレイヤー化

### E. 位置オフセット
```css
.card { transform: translateY(-4px) rotate(-1deg); }
```
雑誌風 / 紙の重なり

### F. 透明度
```css
.background-element { opacity: 0.4; }
```
奥行きを暗示

### G. ぼかし (`filter: blur`)
背景要素をぼかすことで前景を強調

### H. backdrop-filter
```css
.glass { backdrop-filter: blur(20px) saturate(180%); background: rgba(255,255,255,0.5); }
```
ガラス質感

---

## 4. 重なり / レイヤリングのパターン

### Stack
要素を縦に積む。CSS grid の `grid-area` を全て同じにすれば重ねられる。

### Z-index 階層
```css
:root {
  --z-base: 0;
  --z-elevated: 10;
  --z-overlay: 100;
  --z-modal: 1000;
  --z-toast: 10000;
}
```
名前付き z-index で散らかりを防ぐ。

### Isolation
```css
.card { isolation: isolate; }  /* 子要素の blend-mode を局所化 */
```

---

## 5. 形 (shape) の語彙

### 基本形
- 矩形 / 円 / 三角 / 多角形 / 楕円 / 自由曲線

### CSS clip-path で任意形状
```css
.diamond { clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }
.hexagon { clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); }
.blob { clip-path: path("M..."); }  /* SVG path */
```

### CSS shapes (`shape-outside`)
テキストを画像周りに回り込ませる:
```css
.float-image { shape-outside: circle(50%); float: left; }
```

### Mask による形作り
```css
.element { mask-image: radial-gradient(circle, black 30%, transparent 70%); }
```

---

## 6. 性格マッピング

| 形・深度の選択 | 性格 |
|---|---|
| 角丸 0 + 罫線 + 余白詰める | brutalist / editorial / industrial |
| 角丸大 + soft shadow + ゆったり | friendly / modern app |
| 角丸 4-8 + 控えめ影 | UI 標準 / 業務系 |
| Hard offset shadow + 太罫線 | neobrutalism / playful |
| 影なし + 背景色差のみ | zen / minimalist |
| 円形多用 | playful / kawaii / ボリューム |
| 多角形 / 不規則 clip-path | experimental / art |
| Glass + backdrop-filter | modern OS / fashion |
| Neon glow | cyberpunk / 80s |

---

## 7. 本プロジェクト視点

### 現状
- 既存テーマで多様 (airmail テーマでは破線・hard shadow が使われてた)
- shape / radius / shadow の語彙は theme.css に直書きで、規約化されていない

### 棚卸時の確認
- theme.css に radius / shadow の変数を入れるか、Claude が直値で書くか
- 統一感のために `--radius-*` / `--shadow-*` を base.css に置く? それとも自由?
- Claude にこの分類を知識として渡せると判断幅が広がる

---

## Sources

- [Material Design — Elevation](https://m3.material.io/styles/elevation/overview)
- [Refactoring UI — Shadows](https://www.refactoringui.com/) (書籍)
- [Neobrutalism design — examples](https://www.neobrutalism.dev/)
- [clip-path — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path)
