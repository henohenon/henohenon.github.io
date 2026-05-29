# Motion

動きの手法カタログ。CSS-only で書ける範囲 (JS 当面禁止)。

`transition` (状態間補間) + `@keyframes` animation (ループ・自走) + `scroll-driven` animation + `@starting-style` (出現時) + `view-transition` (画面遷移、C1 後) で構成。

**最重要原則**: `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }` で抑制を必ず書く (SYSTEM_PROMPT で強制済)。

---

## 1. Transition (状態間補間)

### 1a. 基本
```css
a {
  color: var(--color-fg);
  transition: color 0.25s var(--ease-default), text-shadow 0.25s var(--ease-default);
}
a:hover {
  color: var(--color-accent);
  text-shadow: 0 0 8px var(--color-accent);
}
```

### 1b. Hover lift
```css
.post-list li {
  transition: transform 0.3s var(--ease-default), box-shadow 0.3s;
}
.post-list li:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
```

### 1c. Cubic-bezier (springy)
```css
:root {
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
button {
  transition: transform 0.4s var(--ease-bounce);
}
button:hover { transform: scale(1.05); }
```

---

## 2. @keyframes (自走 animation)

### 2a. Pulse / Breathing
```css
.brand-mark {
  animation: breathe 4s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 4px var(--color-accent)); }
  50% { opacity: 1; filter: drop-shadow(0 0 12px var(--color-accent)); }
}
```

### 2b. Drift / Slow Float
```css
.bg-decoration {
  animation: drift 60s linear infinite;
}
@keyframes drift {
  to { transform: translate(-100vw, 100vh); }
}
```

### 2c. Spin (回転)
```css
.mirror-ball {
  animation: spin 14s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

### 2d. Neon flicker
```css
h1 {
  animation: flicker 6s linear infinite;
}
@keyframes flicker {
  0%, 19.9%, 22%, 62.9%, 64%, 64.9%, 70%, 100% {
    opacity: 1;
    text-shadow: 0 0 8px var(--color-accent), 0 0 18px var(--color-accent);
  }
  20%, 21.9%, 63%, 63.9%, 65%, 69.9% {
    opacity: 0.4;
    text-shadow: none;
  }
}
```

### 2e. Color shift
```css
h1 {
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-2), var(--color-accent));
  background-size: 200% 100%;
  -webkit-background-clip: text;
  color: transparent;
  animation: hueShift 8s linear infinite;
}
@keyframes hueShift {
  to { background-position: 200% 0; }
}
```

---

## 3. Scroll-Driven Animation (Baseline 2024)

スクロール位置に連動する animation。JS 不要。

### 3a. Progress bar
```css
.progress {
  position: fixed;
  top: 0; left: 0;
  height: 3px;
  background: var(--color-accent);
  transform-origin: left;
  animation: scroll-progress linear;
  animation-timeline: scroll(root);
}
@keyframes scroll-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

### 3b. Element reveal (in-view animation)
```css
article.post .content > * {
  animation: reveal linear;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;
}
@keyframes reveal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 3c. Parallax (sticky based)
```css
.bg-layer {
  position: sticky;
  top: 0;
  animation: parallax linear;
  animation-timeline: scroll(root);
}
@keyframes parallax {
  to { transform: translateY(-20vh); }
}
```

---

## 4. @starting-style (出現時アニメ、Baseline 2024)

要素が DOM に出現した瞬間に animation を発火。

```css
article.post {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s, transform 0.6s var(--ease-default);
}
@starting-style {
  article.post {
    opacity: 0;
    transform: translateY(20px);
  }
}
```

---

## 5. View Transition Names (C1 機構あれば)

C1 (`@view-transition`) 実装後に使える。

```css
@view-transition { navigation: auto; }

.site-header .brand { view-transition-name: brand; }
article.post header h1 { view-transition-name: article-title; }
.post-list h2 a { view-transition-name: article-title; }

::view-transition-old(brand),
::view-transition-new(brand) {
  animation-duration: 400ms;
  animation-timing-function: var(--ease-default);
}
```

(C1 未実装の現在は書かない、機構待ち)

---

## 6. Stagger (連続要素を時間差で animate)

```css
.post-list li {
  animation: slide-in 0.5s var(--ease-default) backwards;
}
.post-list li:nth-child(1) { animation-delay: 0.1s; }
.post-list li:nth-child(2) { animation-delay: 0.2s; }
.post-list li:nth-child(3) { animation-delay: 0.3s; }
.post-list li:nth-child(n+4) { animation-delay: 0.4s; }
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-20px); }
}
```

---

## 7. Hover Group (1 要素 hover で複数 react)

```css
.post-list:has(li:hover) li:not(:hover) {
  opacity: 0.5;
  filter: blur(2px);
  transition: 0.3s;
}
```

(`:has()` で親が子の hover を検知、他の兄弟を dimm)

---

## 8. CSS Cursor (Custom Cursors)

```css
body {
  cursor: default;
}
article.post {
  cursor: text;
}
a:hover {
  cursor: pointer;
}
button {
  cursor: pointer;
}
.special-link {
  cursor: url('data:image/svg+xml,...') 12 12, pointer;
}
```

---

## 9. Easing 語彙

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
  --ease-snap: cubic-bezier(0.85, 0, 0.15, 1);
}
```

用途:
- `ease-out`: 入る / 自然 / 標準
- `ease-in-out`: 出入りどちらも
- `ease-bounce`: 弾む / playful
- `ease-elastic`: 行きすぎて戻る (注意: 酔うこともある)
- `ease-snap`: 一気に動く / 機械的

---

## 注意

- **`prefers-reduced-motion: reduce`** を必ず尊重:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
- 同じ要素に 5+ 個 animation を重ねない (GPU 負荷)
- 派手な flicker は seizure trigger になり得る、頻度 3Hz 以下を意識
- 自走 animation は `infinite` で持続するので CPU 食う、必要な間だけ
- mobile では `animation-duration` を控えめに (バッテリー)
- 「動きすぎない」が美徳の日もある — 静かな曲には animation ゼロでよい
