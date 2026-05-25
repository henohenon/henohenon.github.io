# 色の語彙

> 配色スキーム / 色空間 / 文化的連想 の辞書。
> Claude が色を選ぶときに引き出せる knowledge base。
> WCAG / 色覚配慮は [accessibility.md](accessibility.md) 側に寄せている。

---

## 1. 配色スキーム (引き出し)

色相環上の関係から組み合わせを作る古典的アプローチ。

| 名前 | 構成 | 雰囲気 |
|---|---|---|
| **Monochromatic** | 同じ色相で明度・彩度差 | 落ち着き、洗練、minimalism (リスク: 単調) |
| **Analogous** | 色相環で隣り合う 2-3 色 | 調和、自然、穏やか |
| **Complementary** | 補色 | 高コントラスト、強い (面積比注意) |
| **Split-complementary** | 補色の両隣 2 色 | 補色の鋭さを和らげる |
| **Triadic** | 色相環を 3 等分 | ポップ、バランスの取れた鮮やか |
| **Tetradic / Square** | 4 色 (補色ペア 2 組) | 扱いが難しい |

### 60-30-10 ルール
- 60% 支配色 (背景・大面積) / 30% 副次色 (UI 要素・見出し) / 10% アクセント (CTA・強調)
- 本プロジェクトはこの 3 軸が `--color-bg / --color-fg / --color-accent` に大体対応

---

## 2. 色空間 / CSS color modules

### OKLCH / OKLab (推奨、`color-mix` と相性 ◎)
- `oklch(L C H)` — 人間の知覚に基づく
- 同 L (明度) の色は知覚的に同じ明るさ
- Hue を回すだけで同明度の異なる色

```css
:root {
  --base: oklch(0.7 0.2 30);     /* 朱色系 */
  --analog: oklch(0.7 0.2 60);   /* 同明度・隣の色相 */
  --darker: oklch(0.4 0.2 30);   /* 同色相・暗い */
}
```

### color-mix() (派生色の生成)
```css
background: color-mix(in oklch, var(--color-bg), black 30%);
```
OKLCH 空間で混ぜると知覚的に自然。

### light-dark() (1 値で light/dark 両対応)
```css
:root { color-scheme: light dark; }
color: light-dark(black, white);
```
Baseline 2024 後半。

### Display P3 (広色域)
- `color(display-p3 r g b)` — 鮮やかな色域
- 未対応端末で fallback 必須

---

## 3. 文化的・象徴的連想

### 日本の色彩語彙
- **朱 (しゅ)** — 神社、生命、警告
- **紺 (こん)** — 武士、深い夜空、信頼
- **藤色** — 高貴、フェミニン、儚さ
- **山吹** — 秋、豊穣
- **若草** — 初春、新生
- **錆** — 古びた美、wabi-sabi
- **墨** — 書、品格
- **金赤白** — 祝い、千代紙、晴れの色
- **白黒朱** — 神社、伝統印刷

### 西洋の象徴
- 赤 = 情熱・危険、青 = 信頼・憂鬱、緑 = 自然・嫉妬、紫 = 高貴・神秘、黒 = 力・喪

### 文化を越えて使える基準
- 暖色 = 活動的・近い / 寒色 = 沈静・遠い
- 高彩度 = 注意・若さ / 低彩度 = 落ち着き・上質

---

## 4. パレット参考

- [Nipponcolors](https://nipponcolors.com/) — 日本の伝統色
- [Coolors](https://coolors.co/) — palette generator
- [Adobe Color](https://color.adobe.com/) — color wheel + harmony rules
- [Color Hunt](https://colorhunt.co/) — curated palettes

### 写真からの抽出 (現状未利用)
VocaDB の MainPicture から取れる可能性あり ([input-and-vocadb.md](input-and-vocadb.md) §3 参照)。
権利と "曲を信じる" 原則とのバランスは要検討。

---

## 5. 本プロジェクトでの実践

### 現状
- `--color-bg / --color-fg / --color-accent` の 3 変数 ([scripts/generate-theme.ts](../../scripts/generate-theme.ts) `validateCss`)
- 既存テーマで `--color-accent-soft`, `--color-stamp` 等の派生変数を追加するケースあり

### 棚卸時の確認
- OKLCH / `color-mix` を Claude に積極的に使わせるか (system prompt の引き出し)
- パレット種別 (mono / triadic 等) を mood に応じて選ぶ余地が Claude に伝わるか
- アクセシビリティ (WCAG AA) の自動検証は将来トピック ([prompt-and-generation.md](prompt-and-generation.md) §6)

---

## Sources

- [What is Color Harmony — IxDF](https://ixdf.org/literature/topics/color-harmony)
- [OKLCH in CSS — Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [Adobe Color Wheel](https://color.adobe.com/create/color-wheel)
- [Nippon colors](https://nipponcolors.com/)
