# 色の語彙

> 配色スキーム / 色空間 / アクセシビリティ / 文化的連想 の辞書。
> Claude が色を選ぶときに引き出せる knowledge base。

---

## 1. 配色スキーム (color schemes)

色相環上の関係から組み合わせを作る古典的アプローチ。

### Monochromatic (単色)
- 同じ色相で明度・彩度を変えて組む
- 雰囲気: 落ち着き、洗練、minimalism
- リスク: 単調になりがち

### Analogous (隣接色)
- 色相環で隣り合う 2-3 色 (例: 青 + 青緑 + 緑)
- 雰囲気: 調和、自然、穏やか
- 背景・大面積に向く

### Complementary (補色)
- 色相環で正反対 (例: 青 + 橙)
- 雰囲気: 高コントラスト、ダイナミック
- リスク: 強すぎると目が疲れる、面積比に注意

### Split-complementary
- ある色 + その補色の両隣 2 色 (例: 青 + 赤橙 + 黄橙)
- 補色の鋭さを和らげる

### Triadic (三色)
- 色相環を 3 等分 (例: 赤・青・黄)
- 雰囲気: ポップ、バランスのよい鮮やか
- 60-30-10 ルールで支配色を決める

### Tetradic / Square
- 4 色 (補色ペア 2 組)
- 高度、扱いが難しい

---

## 2. 配色比率 (60-30-10 ルール)

- **60%**: 支配色 (主に背景・大面積)
- **30%**: 副次色 (UI 要素、見出しなど)
- **10%**: アクセント (CTA、強調、リンク)

ナビゲーション可能性と視覚的階層が両立しやすい黄金比。

このプロジェクトでは:
- 60% = `--color-bg`
- 30% = `--color-fg` (文字・borders)
- 10% = `--color-accent` (リンク・装飾要素)

の3変数で大体カバーできてる。

---

## 3. 色空間 / CSS color modules

### sRGB (古典)
- `#rrggbb` / `rgb()` / `hsl()`
- web 標準、互換性最高

### OKLCH / OKLab (新世代、推奨)
- `oklch(L C H)` — 人間の知覚に基づく
- 同じ L (明度) を持つ色は知覚的に同じ明るさに見える
- `color-mix(in oklch, #abc, #def 30%)` で**自然なグラデや色派生**ができる
- Hue を回すだけで同明度の異なる色に展開できる

```css
:root {
  --base: oklch(0.7 0.2 30);  /* 朱色系 */
  --analog-1: oklch(0.7 0.2 60);  /* 同明度・隣の色相 */
  --analog-2: oklch(0.7 0.2 0);
  --darker: oklch(0.4 0.2 30);  /* 同色相・暗い */
}
```

### Display P3 (広色域)
- `color(display-p3 r g b)` で広い色域
- 鮮やかな色を表現できるが、未対応端末で fallback 必須

### color-mix() / color-contrast()
- `color-mix(in oklch, var(--a), var(--b) 50%)` で混色
- `color-contrast(var(--bg) vs white, black)` で背景にコントラストする色を自動選出 (新仕様)

---

## 4. アクセシビリティ (WCAG)

### コントラスト比 (本文 vs 背景)
- **AA**: 4.5:1 (normal text), 3:1 (large text 18pt+ / 14pt bold+)
- **AAA**: 7:1 (normal text), 4.5:1 (large)

### ツール
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- ブラウザ DevTools の "contrast ratio" 表示
- Color Oracle (色覚異常シミュレーター)

### CSS 側のガード
```css
@media (prefers-contrast: more) {
  :root { --color-fg: black; --color-bg: white; }
}
```

### 本プロジェクトでの扱い
- `theme.css` 生成 prompt に「WCAG AA (4.5:1) を意識する」と既に記述済
- ただし強制ではなく、Claude の判断に委ねる
- 将来は自動検証 (CSS 生成後にコントラスト計算) もあり得る

---

## 5. 色覚の多様性

- 約 5% が何らかの色覚特性 (P型, D型, T型)
- 赤緑識別困難なケースが多い
- 「色だけで意味を伝えない」(形・位置・テキストでも示す)
- Color Oracle 等で見え方を確認

このプロジェクトでは:
- リンクは色だけでなく `text-decoration` (underline) も推奨
- アクセント色 ≠ 唯一の手がかり

---

## 6. 文化的・象徴的連想

### 日本の色彩語彙
- **朱 (しゅ)** — 神社、生命、警告
- **紺 (こん)** — 武士、深い夜空、信頼
- **藤色** — 高貴、フェミニン、儚さ
- **山吹 (やまぶき)** — 秋、豊穣
- **若草** — 初春、新生
- **錆 (さび)** — 古びた美、wabi-sabi
- **墨** — 書、品格、定番
- **金赤白** — 祝い、千代紙、晴れの色
- **白黒朱** — 神社、伝統印刷

### 西洋の象徴
- 赤 = 情熱・危険、青 = 信頼・憂鬱、緑 = 自然・嫉妬、紫 = 高貴・神秘、黒 = 力・喪

### 文化を越えて使える基準
- 暖色 = 活動的・近い・前進
- 寒色 = 沈静・遠い・後退
- 高彩度 = 注意・若さ・刺激
- 低彩度 = 落ち着き・成熟・上質

---

## 7. 配色アイディアの泉

### パレット参考
- [Coolors](https://coolors.co/) — palette generator
- [Adobe Color](https://color.adobe.com/) — color wheel + harmony rules
- [Color Hunt](https://colorhunt.co/) — curated palettes
- [Nipponcolors](https://nipponcolors.com/) — 日本の伝統色
- [Pantone of the Year](https://www.pantone.com/articles/color-of-the-year) — 流行色

### 写真からの抽出
- 曲のジャケット / アーティスト写真からカラーパレット抽出する手もあり (本プロジェクトでは VocaDB の MainPicture が候補)
- ただし権利・"曲を信じる" 原則とのバランスは要検討

---

## 8. このプロジェクトでの実践

### 現状
- `--color-bg / --color-fg / --color-accent` の 3 変数
- 既存テーマで色派生変数 (`--color-accent-soft`, `--color-stamp` 等) を追加してたケースもある

### 改善余地
- OKLCH 採用で `color-mix` による派生がスムーズになる
- パレット種別 (mono / triadic 等) を mood に応じて選ぶ余地
- アクセシビリティの自動検証は将来トピック

---

## Sources

- [Color Theory in Web Design — Clay](https://clay.global/blog/web-design-guide/color-theory-in-web-design)
- [What is Color Harmony — IxDF](https://ixdf.org/literature/topics/color-harmony)
- [Colour Theory Strategic Guide 2026 — Inkbot Design](https://inkbotdesign.com/colour-theory/)
- [Adobe Color Wheel](https://color.adobe.com/create/color-wheel)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [OKLCH in CSS — Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [Nippon colors](https://nipponcolors.com/)
