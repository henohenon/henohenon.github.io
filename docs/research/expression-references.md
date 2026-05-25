# 表現の幅 — 語彙の棚

> 「何が表現として可能か」を網羅的に列挙して、視野と判断の母集団を広げるための辞書。
> 時間軸 (今 trendy か否か) には依存しない、時代を超えた語彙を集める。
> 思いついたら追記。

---

## 1. ジャンル / 様式 (timeless)

長く存在し続ける "世界観 + visual language" のパターン。
それぞれが装幀・タイポ・余白・色・装飾の固有セットを持つ。

### 編集物 系
- **Magazine / Editorial** — 大胆な見出し / コラム / 写真 + キャプション / 余白で見せる
- **Newspaper / Journal** — multi-column / 細い罫線 / serif 本文 / 見出しの段階差
- **Zine / DIY** — コラージュ / 雑な切り抜き / タイプライター / 手書き混在 / モノクロコピー感
- **Book / Manuscript** — 読み物としての行間 / ドロップキャップ / 章番号 / 装飾なし
- **Letter / Stationary** — 紙質 / 罫線 / インク色 / スタンプ / "airmail" 系 (今の theme の系統)
- **Poster** — 1 ページ完結 / 巨大タイポ / 余白多 / アクセント色 1 つ

### スクリーン / メディア 系
- **Terminal / Console** — 等幅 / `>` プロンプト / 緑 or 琥珀単色 / cursor blink / ASCII罫線
- **CRT / Old Monitor** — 走査線 / グロー / 滲み / 文字の縁取り / 暗色基調
- **Bulletin Board / 個人 HP 90s** — table layout 風 / gif 風 (静止で) / `<hr>` 多用 / blink 体

### 商業デザイン 系
- **Catalog / Lookbook** — 整然と並ぶ製品 / 余白で価値感を演出
- **Menu / Bill of Fare** — 装飾された見出し / 行内点線 / serif と装飾の組合せ
- **Ticket / Receipt** — 等幅 / バーコード風 / 切取線 / 印鑑 / 色少なく情報密度高
- **Card / Postcard** — 1 画面で完結 / 表裏のメタファー / 余白の使い方が要

### 建築・運動由来
- **Bauhaus / Constructivist** — 1919-30s / 幾何 / primary colors / sans-serif / grid / 機能美
- **Swiss / International Style** — 1950s / Helvetica / 左寄せ / グリッド / white space
- **Memphis** — 1980s / 不規則幾何 / neon + pastel / 線とドット / 遊び心
- **Brutalist (建築 → web 再評価)** — 素のシステムフォント / 太罫線 / 詰めない grid / raw / 反デザイン
- **Cute-alism** — Brutalist + Kawaii (粗さに soft shape / pastel / cartoon を併置)
- **Minimalist** — 装飾削ぎ落とし / タイポと余白 / 単色〜2色
- **Maximalist** — 全部入り / 過剰装飾 / 高密度 / 視覚的疲労を恐れない

### サブカル・地域・時代
- **Punk / DIY** — 1970s-80s 英米 / コラージュ / 切り抜き / 太い黒マーカー / アナーキー記号
- **Y2K / Cyber** — 1999-2004 / metallic / frosted / chrome / 3D bevel / blue tint
- **Vaporwave / Mall Aesthetic** — 2010s ネット文化 / 80s neon / 日本語 retro / ピンクとシアン / Greek 彫像
- **Cottagecore** — 自然テクスチャ / hand-drawn / soft pastel / 木 / 花 / レース
- **Kawaii (日本)** — 丸いシェイプ / pastel / kaomoji / sticker icons / 過剰可愛い
- **Cyberpunk** — neon on black / glitch / terminal / 漢字装飾 / 重密度
- **Noir / Film** — 黒基調 / 単一光源 / serif / 重い影 / 緊張感ある余白
- **江戸 / 浮世絵** — 余白 / 縦書き / 朱と黒 / 木版テクスチャ / 江戸文字
- **千代紙 / 和柄** — 規則的幾何 / 金赤白 / 季節モチーフ / 整然

---

## 2. 表現の軸 (variables, 実装で動かせるもの)

各ジャンルを構成する "原子" を軸別に。Claude が theme.css で動かせる範囲。

### 色彩
- **モード**: 単色 / モノクロ / デュオトーン / 3色制限 / フルカラー
- **温度**: 暖色 / 寒色 / 中間 / mix
- **彩度**: pastel / muted / 鮮やか / fluorescent / monochrome
- **gradient**: linear / radial / mesh / conic
- **contrast**: high / mid / low
- **モチーフ色**: アースカラー / metallic / neon / 単一アクセント

### タイポグラフィ
- **family**: serif / sans / mono / display / hand-drawn (system stack 内で)
- **scale 比**: 1.2x / 1.5x / 2.0x / 3.0x (見出し対本文)
- **weight**: 100-900 の振れ幅
- **spacing**: kerning / letter-spacing / word-spacing
- **orientation**: 横書き / 縦書き (writing-mode)
- **装飾**: outline / shadow / stroke / gradient text / underline 装飾
- **読みやすさ**: 高 / 中 / 低 (装飾優先で低を選ぶ日も可)

### 背景
- solid / linear / radial / mesh gradient
- pattern: geometric (dots / stripes / grid) / organic (blob / wave)
- texture: paper / cloth / print / noise / grain / scratch
- composite: 多層 / blend mode / overlay
- 静動: 完全静 / 微 drift (慎重に)

### 構図 / レイアウト
- grid: 1-col / 2-col / multi-col / bento (お弁当箱型) / asymmetric / collage
- alignment: 中央 / 左 / 右 / justified / scattered
- 余白: 詰める / 標準 / ゆったり / 過剰
- 比率: vertical / horizontal / square
- 縦組コラム / 雑誌見開き

### 装飾
- border: 実線 / 破線 / 二重 / 波線 / 罫線 / brushストローク
- shadow: hard offset / soft / inset / multi-layer
- accents: スタンプ / シール / 罫線 / フィルム枠 / コーナー装飾 / ASCII罫線
- texture overlay: noise / grain / scratch
- 印刷的要素: ハーフトーンドット / 紙端効果 / 切取線

### モーション (使うも使わないも自由)
- entry: fade / slide / scale / typewriter (静かなのも価値)
- hover: micro / 強い反応 / なし
- ambient: 完全静 / 微 drift / pulse (派手は注意)
- transition: instant / smooth / dramatic
- view-transitions (ページ間)

### メタ要素 (脇役)
- favicon / scrollbar / ::selection / cursor / title prefix / OGP

---

## 3. ムード → デザイン語彙 翻訳の引き出し

このプロジェクト固有の課題 = 曲ムードからデザインへの翻訳。
**固定の対応表ではなく**、Claude が想起できる引き出しの例。

| 曲のムード傾向 | 引き出せるジャンル / 軸 |
|---|---|
| アコースティック / ノスタルジック | Cottagecore / 紙 / 手書き / アースカラー / serif / hand-drawn |
| ロック / 攻撃的 | Brutalist / Punk / monochrome / 太罫線 / 大文字 / 詰めない |
| エレクトロニック / 未来的 | Cyberpunk / Y2K / chrome / neon / mono font |
| メランコリック / 内省 | Minimalist / 余白多 / 単色 / fade / serif |
| カラフル / ポップ | Memphis / Kawaii / 鮮やか / 不規則 |
| ダーク / 重い | Noir / 黒基調 / 重い影 / 緊張感ある余白 / 大判タイポ |
| ジャズ / 都会 | Swiss / 整列 / monochrome + accent / sans |
| 童謡 / 子供向け | Cottagecore / Kawaii / clay-like / soft pastel |
| 80s/90s J-Rock | Y2K / Memphis / 高彩度 / 太枠 |
| ヒーリング / アンビエント | Minimalist / pastel / soft gradient / sans-serif |
| 民謡 / 和的 | 江戸 / 千代紙 / 縦書き / 朱と黒 / 木目 |
| Vocaloid 王道 / オタク文化 | Kawaii / Vaporwave / Cyberpunk の交点 |
| ボカロロック (wowaka 系) | Brutalist + 高彩度 / 詰めない grid / 文字ハイライト |
| ハイテンポ EDM | Vaporwave 暗め / Cyberpunk / glitch 装飾 |
| 沈鬱ボカロ | Noir / minimalist / serif / 黒〜深紫 / 行間広 |

---

## 4. 横断的な「強度」の軸

ジャンルとは別に「**どれくらい主張するか**」も独立した軸:

- **静謐 ⇄ うるさい** (装飾密度)
- **整然 ⇄ 乱雑** (配置の規則性)
- **既製 ⇄ 手作り感** (mechanical vs hand-made)
- **モノクロ ⇄ 多色**
- **コンテンツ尊重 ⇄ 装飾優先** (読みやすさ重視 / 雰囲気重視)

これも Claude が日替わりで振れる軸として持っておく価値あり。

---

## 5. 本プロジェクトへの示唆

- **個人 + AI + 日替わり** という組合せは観測範囲では先頭集団に近く、参照すべき他事例が少ない
  → 自分で語彙を集めて持つ価値が大きい
- ジャンル群を **Claude が想起する辞書** として持てると、毎日の翻訳の幅が一気に広がる
- 軸群は **theme.css の規約 / system prompt が表現できる範囲** に対応する
  → 棚卸の照合軸として使える
- 翻訳引き出しは **system prompt に "例として渡す"** 形で組み込める可能性 (詰め込みじゃなく inspire)

---

## Sources

実装・歴史側の参照:

- [Custom properties (--*): CSS variables — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/--*)
- [Best Japanese Web Design of 2026 — My Codeless Website](https://mycodelesswebsite.com/japanese-web-design/)
- [Sites Of The Day — Awwwards](https://www.awwwards.com/websites/sites_of_the_day/)
- [CSS Design Awards](https://www.cssdesignawards.com/)
- [The FWA](https://thefwa.com/)
- [Godly](https://godly.website/)
- [One Page Love](https://onepagelove.com/)

ジャンル / 様式の歴史 (継続調査メモ):

- Bauhaus / Swiss / Memphis / Punk / Y2K / Vaporwave / Brutalism 各々
- 日本のグラフィック (江戸 / 千代紙 / 90s 個人 HP 文化 / 同人カルチャー)
- → 必要に応じて深掘り、各々ジャンルごとに sources を追加
