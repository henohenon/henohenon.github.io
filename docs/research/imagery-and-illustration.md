# 画像とイラストレーションの語彙

> 写真の扱い / イラストスタイル / 装飾画像 / メディア戦略。
> 画像が中核ではないこのプロジェクトでも、語彙として持っておく。

---

## 1. 写真 (photography) のスタイル

### 撮影手法
- **Editorial** — 雑誌っぽい構図、人物多め
- **Documentary** — ありのまま、加工少なめ
- **Product / Studio** — 商品中心、白背景
- **Lifestyle** — シーン全体
- **Macro** — クローズアップ
- **Aerial / Drone** — 俯瞰
- **Film / Analog** — 粒子、フィルム調

### 処理
- **Color grading** — トーンを統一
- **Duotone / Tritone** — 2-3 色で再着色
- **Sepia / Black & White**
- **Filter overlay** — ノイズ / grain / scratch
- **Vignette** — 周辺暗くする
- **Cinematic letterbox** — 上下黒帯

### CSS で画像処理
```css
.photo {
  filter: grayscale(100%);
  filter: sepia(50%) hue-rotate(20deg);
  filter: blur(2px) brightness(0.9);
  mix-blend-mode: multiply;
}
```

---

## 2. イラストレーション (illustration) のスタイル

### 線
- **Outline** (細い線) — minimalist
- **Bold outline** (太い線) — graphic novel / kawaii
- **No outline** (塗りのみ) — flat / modern
- **Hand-drawn** (ラフ線) — 手書き感
- **Brush stroke** — 筆勢、墨絵

### 塗り
- **Flat** — 単色塗り
- **Gradient** — グラデで奥行き
- **Textured** — 紙 / 水彩 / 油絵
- **Pixel** — ドット絵
- **3D-ish** — Y2K, isometric, voxel

### スタイル例
- **Flat illustration** (Material Design 系)
- **Isometric** (3D っぽい平面)
- **Memphis** (1980s 不規則幾何)
- **Cottagecore** (花 / 葉 / アーシー)
- **Cyberpunk** (neon + 漢字)
- **Kawaii** (大きな目 / 丸い形)
- **Brutalist** (ラフな手描き + テキスト)
- **Y2K** (gradient + 3D bevel + chrome)
- **Vaporwave** (Greek statues + 80s 装飾)

---

## 3. SVG イラストの強み (本プロジェクト的)

### 軽い + テーマ追従
- ファイルサイズ小、CSS で色制御
- 解像度独立、Retina 等で綺麗
- アニメーション可能

### Hand-drawn 風 SVG
- 線にわずかな揺れを付けて手描き感
- stroke の dasharray でラフ感
- SVG filter (turbulence) で線を歪ませる

---

## 4. プレースホルダー / ローディング

### 静的サイトでも:
- 画像が読み込まれるまでの blur-up placeholder
- `loading="lazy"` 属性で遅延読み込み
- `aspect-ratio` CSS でレイアウトシフト防止

```html
<img src="thumb.jpg" alt="..." loading="lazy" decoding="async" />
```

---

## 5. 装飾画像 (decoration) の使い方

### 角飾り
左上 / 右下に小さな SVG / 絵文字を配置

### Bullet / Marker
リストマーカーをカスタム
```css
ul { list-style-image: url(/bullet.svg); }
```

### Divider
セクション間に装飾的な区切り
- 罫線 + アクセント
- SVG curve
- ASCII 罫線

### Watermark
背景に薄い装飾
```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url(/watermark.svg);
  opacity: 0.03;
  pointer-events: none;
}
```

---

## 6. 画像 → mood の翻訳

写真 / イラストから読み取れる mood:

| 視覚要素 | mood |
|---|---|
| 高 contrast / sharp | 力強い / 鋭い |
| Low contrast / soft | 穏やか / 内省 |
| 暖色 + 自然光 | ノスタルジー / 温かさ |
| 寒色 + 直線 | 未来 / 清潔 |
| 粒子 / ノイズ | 古い / 親しみ |
| 鮮やか pastel | playful / kawaii |
| Monochrome | 文学的 / 静謐 |
| Neon + dark | cyberpunk / 派手 |

---

## 7. 著作権 / ライセンス

無料で使える素材源:

- [Unsplash](https://unsplash.com/) — 写真 (CC0 似ライセンス)
- [Pexels](https://pexels.com/) — 写真
- [Pixabay](https://pixabay.com/) — 写真 / イラスト
- [unDraw](https://undraw.co/) — flat illustration、色変更可
- [Open Doodles](https://www.opendoodles.com/) — 手描き
- [Storyset](https://storyset.com/) — illustration セット
- [DrawKit](https://www.drawkit.com/) — 一部無料

VocaDB の MainPicture も曲によっては存在、ただし権利は要慎重。

---

## 8. 性格マッピング

| 画像戦略 | 性格 |
|---|---|
| 写真大胆使用 | editorial / fashion / 商業 |
| 写真控えめ + 装飾 | personal / blog 標準 |
| イラストのみ | playful / friendly / SaaS |
| ASCII / Unicode 装飾のみ | brutalist / minimalist / tech |
| 装飾なし | pure minimalist / writing-focused |
| 写真 + 強いフィルター (duotone 等) | branding 強い |
| 手描き SVG 多用 | hand-made / cottagecore |

---

## 9. 本プロジェクト視点

### 現状
- 写真は使ってない (記事に必要なら手動添付)
- イラストは henoheno.png (ブランドマーク) と OGP の負荷
- VocaDB の MainPicture を取り込む案は未着手

### 棚卸時の確認
- 画像系の語彙を Claude に渡すか (現状ほぼ画像なし、必要性低い)
- 装飾用 SVG を theme.css に data URI で埋める手は活きるか
- アバター / 視覚的シンボルを増やす方向は要検討

---

## Sources

- [Unsplash](https://unsplash.com/)
- [unDraw](https://undraw.co/)
- [Open Doodles](https://www.opendoodles.com/)
- [filter — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/filter)
- [mix-blend-mode — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode)
