# Backgrounds

背景の手法カタログ。サイトの "雰囲気の地" を作る、最大面積の表現領域。

`body` / `html` / `body::before` / `body::after` / `.site-header::before` 等の擬似要素を駆使。CSS-only で書ける範囲。

---

## 1. 多層 Radial Gradient (Glow Field)

**コンセプト**: 複数の `radial-gradient` を重ね、画面に "光の溜まり" を作る。ネオン / ディスコ / 夜景。

**CSS**:
```css
body {
  background: 
    radial-gradient(circle at 15% 20%, rgba(255, 61, 240, 0.28), transparent 45%),
    radial-gradient(circle at 85% 10%, rgba(54, 227, 255, 0.22), transparent 50%),
    radial-gradient(circle at 50% 95%, rgba(255, 216, 77, 0.18), transparent 55%),
    var(--color-bg);
  background-attachment: fixed;
}
```

**合う**: 夜系 / ネオン / electronic / 鮮やかな曲

---

## 2. Conic Gradient (放射・回転)

**コンセプト**: 中心から放射状の色、または時計の文字盤的な分割。回転 animation でミラーボール / プリズム化。

**CSS**:
```css
.site-header::before {
  content: "";
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 61, 240, 0.18) 60deg,
    transparent 120deg,
    rgba(54, 227, 255, 0.18) 200deg,
    transparent 260deg
  );
  animation: spin 14s linear infinite;
  pointer-events: none;
  z-index: -1;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

**合う**: 祝祭 / disco / 70s リバイバル / 派手系

---

## 3. Repeating Linear Gradient (Stripes / Halftone)

**コンセプト**: 縞模様、ハーフトーン、紙焼け感。retro / print / 老舗感。

**CSS**:
```css
body {
  background: 
    repeating-linear-gradient(
      45deg,
      transparent 0 2px,
      rgba(255, 255, 255, 0.04) 2px 4px
    ),
    var(--color-bg);
}
```

**合う**: ノスタルジー / 印刷物 / 文房具 / 紙の質感

---

## 4. SVG Pattern (Data URL)

**コンセプト**: 細かい紋様 / ドット / 幾何パターン。SVG `<pattern>` を base64 で background-image に。

**CSS**:
```css
body {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='1' fill='%23ffffff' opacity='0.1'/%3E%3C/svg%3E");
  background-color: var(--color-bg);
}
```

**合う**: textile / 和柄 / 装飾的な曲

---

## 5. Box-Shadow Particle Field

**コンセプト**: 1 要素の `box-shadow` を複数積み、星空 / 雪 / 粒子に。要素全体を transform で動かす。

**CSS**:
```css
.particles {
  position: fixed;
  top: 0; left: 0;
  width: 2px; height: 2px;
  background: white;
  box-shadow:
    10vw 20vh 0 white,
    40vw 60vh 0 white,
    80vw 30vh 0 0.5px white,
    /* ... 30-100 個 */;
  animation: drift 60s linear infinite;
  pointer-events: none;
}
@keyframes drift { to { transform: translateY(100vh); } }
```

**合う**: 宇宙 / 夜 / ambient / 静謐

---

## 6. Mesh Gradient (CSS Hougang 風)

**コンセプト**: 滑らかな多色グラデ。柔らかい春 / instagrammy / pastel。

**CSS**:
```css
body {
  background: 
    radial-gradient(at 0% 0%, #ffd1dc 0%, transparent 50%),
    radial-gradient(at 100% 0%, #b5ead7 0%, transparent 50%),
    radial-gradient(at 0% 100%, #c7ceea 0%, transparent 50%),
    radial-gradient(at 100% 100%, #ffdac1 0%, transparent 50%),
    #fff;
}
```

**合う**: pastel / 春 / 透明感 / pop

---

## 7. Noise Texture (CSS で生成)

**コンセプト**: ザラついた質感、film grain。SVG `<feTurbulence>` で生成、低 opacity で重ねる。

**CSS**:
```css
body::after {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
  opacity: 0.15;
  mix-blend-mode: overlay;
  pointer-events: none;
}
```

**合う**: lofi / vinyl / VHS / film / アナログな曲

---

## 8. Single Solid + Vignette

**コンセプト**: 単色 + 周辺の暗いビネット。劇場 / 映画 / 集中。

**CSS**:
```css
body {
  background: 
    radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%),
    var(--color-bg);
}
```

**合う**: cinematic / drama / シリアスな曲

---

## 9. Dance Floor (Checker / Grid Floor)

**コンセプト**: 床を引いた感じ。perspective + grid lines で disco floor / vaporwave。

**CSS**:
```css
body::after {
  content: "";
  position: fixed;
  inset: 50vh 0 0 0;
  background-image: 
    linear-gradient(to right, var(--color-accent) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-accent) 1px, transparent 1px);
  background-size: 60px 60px;
  transform: perspective(400px) rotateX(60deg);
  transform-origin: top;
  opacity: 0.3;
  pointer-events: none;
}
```

**合う**: vaporwave / 80s / synthwave / disco

---

## 10. Scanlines (CRT 風)

**コンセプト**: 水平の細い線を repeat、CRT モニター風。glitch / retro tech。

**CSS**:
```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0 2px,
    rgba(0, 0, 0, 0.15) 2px 4px
  );
  pointer-events: none;
  z-index: 100;
}
```

**合う**: tech / cyberpunk / glitch / retro game / lo-fi

---

## 組み合わせの指針

- **2-3 を重ねる** のが基本 (e.g., glow field + noise + scanlines)
- **動 + 静** を混ぜる (動: spin / drift。静: solid / pattern)
- **z-index 管理**: 背景は `z-index: -1` or `body::before`, ノイズ overlay は `z-index: 100`
- **mix-blend-mode** で深みを出す (`overlay` / `multiply` / `difference`)
- 過剰に重ねない (3-4 層が限界、それ以上は重さと汚さ)

---

## 注意

- `pointer-events: none;` を装飾要素に必ず付ける (クリック奪わない)
- `prefers-reduced-motion: reduce` で animation を切る
- mobile では `background-attachment: fixed` が効かないことがある (iOS Safari 等) — 影響薄いなら無視、気になるなら `background-attachment: scroll`
