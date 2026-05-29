# Decorations

装飾の手法カタログ。背景 ([backgrounds.md](backgrounds.md)) と区別して、**フォアグラウンドの "添え物" 要素**を扱う。

罫線、引用枠、リンクの強調、見出し装飾、icon 風要素、リスト marker、引用符などの小物。

---

## 1. 引用枠 (Blockquote Styles)

### 1a. 紙焼け blockquote
```css
blockquote {
  margin: 2em 0;
  padding: 1em 1.5em;
  background: linear-gradient(180deg, rgba(255, 244, 217, 0.06), transparent);
  border-left: 3px solid var(--color-accent);
  font-style: italic;
  color: var(--color-fg-muted);
}
```

### 1b. 巨大引用符
```css
blockquote {
  position: relative;
  padding-left: 3em;
  font-size: 1.3em;
}
blockquote::before {
  content: """;
  position: absolute;
  left: 0; top: -0.3em;
  font-size: 5em;
  font-family: serif;
  color: var(--color-accent);
  opacity: 0.4;
  line-height: 1;
}
```

### 1c. カード型 (depth)
```css
blockquote {
  background: var(--color-bg-elev);
  padding: 1.5em 2em;
  border-radius: 0.5em;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transform: rotate(-0.5deg);
}
```

---

## 2. 罫線・区切り (HR / Dividers)

### 2a. グラデ罫線
```css
hr {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  margin: 3em 0;
}
```

### 2b. 点線 (Dash 装飾)
```css
hr {
  border: none;
  border-top: 2px dashed var(--color-accent);
  opacity: 0.5;
}
```

### 2c. 装飾文字 hr
```css
hr {
  border: none;
  text-align: center;
  &::after {
    content: "❋ ❋ ❋";
    color: var(--color-accent);
    letter-spacing: 1em;
  }
}
```

(or `* * *`、`✦ ✧ ✦`、`― ― ―` 等)

---

## 3. リンク強調 (Link Decorations)

### 3a. 下線 animation
```css
a {
  position: relative;
  color: var(--color-accent);
  text-decoration: none;
  background-image: linear-gradient(to right, var(--color-accent), var(--color-accent));
  background-size: 0% 1px;
  background-repeat: no-repeat;
  background-position: 0 100%;
  transition: background-size 0.3s;
}
a:hover {
  background-size: 100% 1px;
}
```

### 3b. ペン書きアンダーライン
```css
a {
  background: linear-gradient(transparent 80%, var(--color-accent) 80%);
}
```

(蛍光ペン風)

### 3c. ハッシュ前置
```css
a::before {
  content: "→ ";
  color: var(--color-accent);
}
```

---

## 4. List Markers (`::marker` / カスタム)

### 4a. カスタム marker
```css
li::marker {
  color: var(--color-accent);
  content: "▶ ";
}
```

(`▷` / `◇` / `※` / `№` / `―` 等)

### 4b. 番号付きで強調
```css
ol {
  counter-reset: item;
  list-style: none;
}
ol li::before {
  counter-increment: item;
  content: counter(item, decimal-leading-zero);
  font-family: monospace;
  color: var(--color-accent);
  margin-right: 1em;
}
```

(`01`, `02`, `03` 形式)

---

## 5. 見出し装飾 (Heading Embellishments)

### 5a. ハイライト
```css
h1 {
  display: inline-block;
  padding: 0 0.3em;
  background: linear-gradient(transparent 50%, var(--color-accent) 50%);
}
```

### 5b. 影 / アウトライン
```css
h1 {
  color: transparent;
  -webkit-text-stroke: 1px var(--color-fg);
  text-shadow: 4px 4px 0 var(--color-accent);
}
```

### 5c. 番号付き
```css
h2 {
  counter-increment: section;
  &::before {
    content: "§" counter(section) " ";
    color: var(--color-accent);
    font-weight: normal;
  }
}
```

---

## 6. Badge / Pill / Chip

```css
.theme-credit, time {
  display: inline-block;
  padding: 0.2em 0.8em;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--color-accent);
  font-size: 0.85em;
  letter-spacing: 0.1em;
}
```

---

## 7. Drop Cap (大文字装飾)

```css
article.post .content > p:first-of-type::first-letter {
  font-size: 4em;
  font-family: serif;
  float: left;
  line-height: 0.85;
  margin: 0.1em 0.15em 0 0;
  color: var(--color-accent);
}
```

(紙の本のような冒頭装飾)

---

## 8. Code Block (Pre / Code)

```css
pre {
  background: var(--color-bg-elev);
  border: 1px solid var(--color-accent);
  border-radius: 0.3em;
  padding: 1em;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
  &::before {
    content: "$ ";
    color: var(--color-accent);
    opacity: 0.5;
  }
}
code:not(pre code) {
  background: rgba(255, 255, 255, 0.06);
  padding: 0.1em 0.3em;
  border-radius: 0.2em;
  font-size: 0.9em;
}
```

---

## 9. Selection ::selection

```css
::selection {
  background-color: var(--color-accent);
  color: var(--color-bg);
  text-shadow: none;
}
```

(`base.css` で既に default 提供、theme.css で上書き OK)

---

## 10. Brand mark / icon 装飾

```css
.brand-mark {
  /* base.css でマスク適用済、theme.css では色とサイズと animation だけ */
  filter: drop-shadow(0 0 8px var(--color-accent));
  animation: pulse 4s ease-in-out infinite;
}
@keyframes pulse {
  50% { filter: drop-shadow(0 0 16px var(--color-accent)); }
}
```

---

## 注意

- 装飾は **付け足しすぎない**。1 ページに 2-3 個までが基本
- `opacity` で控えめに
- 全部の見出しに装飾を付けるとうるさい — 重要なものだけ
- `prefers-reduced-motion: reduce` で animation 切る
- 引用元は印刷物 (本 / 雑誌 / 新聞)、音楽文化 (CD ジャケ / レコード帯)、Web の良い実装事例
