# 表現の参考事例とトレンドリサーチ (2026-05-25)

> 表現拡充の "棚" を整える前段の外部調査メモ。
> このサイトに直接 import するものではなく、視野と語彙を広げ判断材料を増やすため。
> 新しく発見したら追記していく。

---

## 1. ギャラリー / ショーケース (横断で「今これが評価されてる」を見る場)

| サイト | 特徴 |
|---|---|
| [Awwwards](https://www.awwwards.com/) | 老舗。Sites of the Day / Collections。技術 + 表現の派手寄りが多い |
| [CSS Design Awards](https://www.cssdesignawards.com/) | WOTD (Website of the Day) 中心。200+ 国際審査員 |
| [CSS Winner](https://www.csswinner.com/) | CSS Award 系、規模はやや小さめ |
| The FWA | テック寄りの大規模展示 (歴史長い) |
| Godly | キュレーション。静的・特化、ノイズ少ない |
| One Page Love | personal / single-page 中心、個人サイト系に近い |
| siteinspire | クリーンな選定、UI 系 |

**本サイトの位置取り感**:
- 個人ブログ + AI 日替わり = One Page Love / Godly 系の "落ち着き" を土台に、
  Awwwards 系の "表現の振れ幅" を日替わりで重ねるイメージが近い

---

## 2. 2026 のトレンド観測

### 2-1. 反「AI 過剰研磨」への揺り戻し
ハンドドローイング・手書きフォント・コラージュ素材・テクスチャ感の再評価。
個性と人間味を取り戻す動きとして 2025-2026 に強まった。

> **示唆**: AI 生成テーマがあるからこそ「手の感じ」も語彙にあると効く (相反する要素の併置)。

### 2-2. ネオブルータリズム + Cute-alism
ブルータリズム (raw / unpolished / アンチデザイン) は復権し、もはや provocation でなく
"legitimate choice" として定着。
さらに **Cute-alism** (= 粗い × カワイイ) のハイブリッドが出現。

- 非対称グリッド・素のシステムフォント・極端な装飾
- + パステル / カートゥーンアイコン / ソフトシェイプ

> **示唆**: Vocaloid シーンと相性が良い (アングラ感 × キュートが共存する文化)。

### 2-3. ベントーグリッド (Japanese 文脈)
Apple が popularize した、お弁当箱由来の modular カード系レイアウト。
サイズの異なるカードをグリッドに並べる。

> **示唆**: 記事一覧の表現の選択肢として直接導入可能。

### 2-4. 非線形ナビゲーション / Hidden Layer
ラジアルメニュー、隠しドロワー、地図状ナビ、非直線的ジャーニー。
ナビゲーションが "情報設計" から "探検" に近づく。

> **示唆**: 儚さ + 隠し要素好きの本プロジェクトと地続き。
> ただし「常駐機構の決定」になる場合は詰め込みリスク → 慎重に評価。

### 2-5. ハイパー minimalism × maximalism の両極
中間が消え、両極に振れる傾向。

> **示唆**: 日替わりの仕組みは、両極を行き来できる稀な体験を提供できる可能性。

### 2-6. 音 UX (sound design)
微音 (click / hover / 音 feedback) の復権。

> **示唆**: 本プロジェクトでは却下済 (UX 阻害 + 自動再生ポリシー)。
> もし将来 opt-in の形で取り入れるなら検討の余地はあるが、現状 ❌。

### 2-7. View Transitions API の普及
ページ間遷移を CSS で記述可能になり、SPA 並の遷移演出が静的サイトで実現。
Chrome / Edge / Firefox 対応済。

> **示唆**: 既に TODO D1 として候補入り。catalog 棚卸後に再評価。

---

## 3. 表現の構成要素 (= 語彙の棚 / 一覧)

ジャンル横断で表現の "原子" を整理。catalog 棚卸の参考軸として。

### 色彩
モノクロ / 単一アクセント / グラデーション / デュオトーン / アースカラー / ネオン / パステル / 高彩度

### タイポグラフィ
serif / sans / mono / display / hand-drawn / 縦書き / 巨大見出し / 縦組コラム

### 背景
単色 / グラデ / 幾何パターン / テクスチャ (紙 / 布 / 印刷) / 写真 / SVG 抽象 / ノイズ

### 構図
1 カラム / Bento / asymmetric / 斜め / 反転 / column-count / 雑誌見開き

### 装飾
border / shadow / マーカー / ステッカー / シール / 罫線 / フィルム枠 / コラージュ要素

### モーション
完全静 / hover 微反応 / View Transitions / ambient drift / scroll-driven (注意)

### メタ要素
favicon / scrollbar / ::selection / cursor / OGP / title / og 動的画像

### 体験ジャンル参照
雑誌風 / 教科書風 / 新聞風 / ポスター風 / 巻物風 / Terminal 風 / ZINE 風 /
紙ノート風 / 印刷物風 / CRT 風 / Y2K / vaporwave / brutalist / kawaii brutal

---

## 4. 「集約 vs 分散」軸での位置取り

ウェブデザインのスペクトラムを「同一性 (集約) ↔ 多様性 (分散)」で見ると、
**「AI が日替わり」は極めて分散側**。

分散側で破綻しない条件:

- **土台が頑健** (= theme.css の規約 / base.css の構造 / generate-theme の仕組み)
- **Claude に渡す参考材料が豊富** (= 本リサーチの続き、語彙の辞書)
- **判断基準が明確** (= "適切性ファースト" 等の原則が prompt まで届いてる)

→ 棚卸の出口は、この 3 要素の見直しに収斂すると思われる。

---

## 5. このプロジェクトへの示唆 (要旨)

1. **個人 + AI + 日替わり** という組合せは観測範囲だと先頭集団に近い (= 参照すべき他事例が少ない)
2. **手の感じ / brutalism + cute / bento / 非線形ナビ** は本サイトと感性的に相性が良く、語彙として持つ価値がある
3. **音 / 重いアニメ / カーソル乗っ取り** は採用済の制約と整合させて選別する
4. **表現の振れ幅** を確保するには、Claude に "意味の言語" (語彙の辞書) を渡すこと
5. **棚卸の次の工程 (補助情報の確立)** で、本リサーチの語彙を翻案して system prompt や techniques 系 docs に反映する

---

## Sources

- [Top Web Design Trends for 2026 — Figma](https://www.figma.com/resource-library/web-design-trends/)
- [Web Design Trends 2026 — Wix](https://www.wix.com/blog/web-design-trends)
- [Web Design Trends 2026 — Line25](https://line25.com/articles/web-design-trends-2026/)
- [Web Design Trends — Fireart Studio (Tactile Brutalism)](https://fireart.studio/blog/the-best-web-design-trends/)
- [21 Web Design Trends 2026 (Human in AI-First Web) — UI/UX Showcase](https://uiuxshowcase.com/blog/21-web-design-trends-2026-design-for-humans-ai-first-web/)
- [Top 15 Best Websites for Web Design Inspiration in 2026 — Fuel Results](https://fuelresults.com/best-websites-for-web-design-inspiration-2026/)
- [Best Japanese Web Design of 2026 — My Codeless Website](https://mycodelesswebsite.com/japanese-web-design/)
- [Sites Of The Day — Awwwards](https://www.awwwards.com/websites/sites_of_the_day/)
- [CSS Design Awards](https://www.cssdesignawards.com/)
