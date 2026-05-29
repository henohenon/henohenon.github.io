# Layout Patterns

レイアウトの型カタログ。[ai-flow.md](../ai-flow.md) の生成フローで Claude に inspire として渡し、今日の曲と照合して採用 / 改変 / 自由作成を判断するための母体。

**使い方** (Claude 向け):
1. 今日の曲を読み取り、palette / typography / mood の方向を決める (theme.css 冒頭コメント)
2. 下記パターンのいずれかが合いそうなら、それを base に書く
3. 部分的に合うなら拡張・改変。合わなければ自由に書く
4. 「ぴったり」を探す必要はない。参考にして自分のセンスで書いてよい

すべて HTML 構造は触れない (CSS Mode 3 dress)。`base.css` の reset と最小限の構造に乗せて theme.css で書く。

---

## 1. アルバムジャケット型 (Cover Spread)

**狙い**: 1 つの巨大な装飾領域 (= アートワーク) が画面の主役、記事は下部に track listing 風の細い行で並ぶ。

**適合する曲**:
- アートワークが強い印象を持つ曲
- 装飾的・視覚的・派手系 (DJ ミックス、エレクトロ、ボカロ系 MV 想起)
- リスナーが "ジャケ買い" する系統

**避けるとき**: 静かで内省的な曲、長文を読ませる主旨の日

**CSS のヒント**:
- `body` を grid 2 行に分け、上部 50-60% に巨大な装飾 (`::before` で fixed background)
- `.post-list` を `grid-template-columns: auto 1fr; gap: 0;` で track listing 化
- 各 `li` の `time` を track number 風 (etc. `01`, `02`) に表示
- 装飾は radial-gradient / conic-gradient / 多層 SVG pattern
- 文字は monospaced or display font が映える

---

## 2. ライナーノーツ型 (Liner Notes / Magazine Spread)

**狙い**: 雑誌の見開きページ。写真と本文が交互、引用が大きく、余白が呼吸する。記事は "読み物" として扱う。

**適合する曲**:
- 物語性のある曲 (歌詞に narrative)
- ジャズ / シティポップ / フォーク / アンビエント
- 「腰を据えて読みたい」気分の曲

**避けるとき**: ハイテンションでスピード感ある曲、装飾優先の日

**CSS のヒント**:
- `.container` の `width` を広め (`min(90ch, 100%)`)
- 記事本文を `column-count: 2; column-gap: 3em;` で 2 カラム
- `blockquote` を大きく (`font-size: 1.5em; border-left: 4px solid; padding-inline: 2em;`)
- 見出しは serif、本文は sans-serif、行間広め (`line-height: 1.8;`)
- 余白多め、`padding-block: 4em;`

---

## 3. コンサートチラシ型 (Gig Flyer)

**狙い**: ライブハウスのチラシ / ポスター。typography が暴れる、情報が積層、コントラスト強め、装飾満載。

**適合する曲**:
- ロック / パンク / ハードコア / プログレ
- ライブ感、熱量、宣伝チラシ的なエネルギー
- 派手な装飾を盛りたい曲

**避けるとき**: 繊細・静か・透明感のある曲

**CSS のヒント**:
- 見出しを `font-size: clamp(3rem, 8vw, 6rem); letter-spacing: -0.03em;` で巨大化
- `transform: rotate(-2deg)` で要素を斜めに
- `mix-blend-mode: difference` / `multiply` で色を重ねる
- 罫線 (`border-style: dashed / dotted`) を装飾的に
- date / venue / titles を不揃いに配置 (grid + manual positioning)

---

## 4. ターミナル型 (Terminal / CLI)

**狙い**: コマンドラインインタフェース。monospace 主体、`$ prompt`、cursor 風点滅、緑 or アンバーの単色、限定色数。

**適合する曲**:
- テクノ / IDM / vaporwave / electronic
- nerdy, retro-computing, hacker culture
- 機械的・無機質・冷たい曲

**避けるとき**: 温かみのある曲、アコースティック、自然系

**CSS のヒント**:
- `font-family: 'JetBrains Mono', monospace;` 全部
- 色は ~3 色 (`--color-bg: #0a0e1a; --color-fg: #4af626; --color-accent: #fff;`)
- 各 `h2` の前に `> ` or `$ ` を `::before` で
- `.site-header .brand::after { content: ' / ~';}` でディレクトリ風
- カーソル風点滅: `animation: blink 1s step-end infinite;`
- 全部左寄せ、grid 整然

---

## 5. Asymmetric 型 (非対称・崩し)

**狙い**: 計算された崩し。中央寄せでなく、片側に寄ったレイアウト。余白の量がコンテンツ間で大きく違う、視線誘導が斜め。

**適合する曲**:
- アート系 / 実験的 / オルタナティブ
- インディー、レフトフィールド
- 不安定・揺れる感じ

**避けるとき**: 安定感を求める曲、王道ポップス

**CSS のヒント**:
- `.container` の `margin-left: 0;` で左寄せ、`max-width: 60%;`
- 1 つの要素だけ画面外にはみ出させる (`margin-right: -10vw;`)
- `transform: translateY(...)` で各要素を不揃いに
- `.post-list > :nth-child(odd)` と `:nth-child(even)` で別 layout
- 行送り (`line-height`) を意図的に不揃いに

---

## 6. Vertical 型 (縦書き)

**狙い**: 縦書き、和の感覚。`writing-mode: vertical-rl;` で全体が右から左に流れる。装飾は引き算、行頭の余白が呼吸する。

**適合する曲**:
- 和風 / 民謡 / 日本語の歌詞が美しい曲
- ゆったり、静謐、瞑想的
- 古典文学・短歌・俳句に通じる気分

**避けるとき**: 横書き前提のラテン語混じり、欧米感の曲

**CSS のヒント**:
- `body { writing-mode: vertical-rl; }`
- フォントは明朝系 (`'Zen Old Mincho', serif;`)
- `.post-list` を `grid-auto-flow: column;` で右から並べる
- 句読点を `text-emphasis` 系で
- 余白多め、行間広め、文字大きめ
- 漢数字を意識的に (`time::before` で和暦変換は overkill だが、`月日` 表記化はあり)

---

## 7. Single Hero 型 (1 Article Takeover)

**狙い**: 1 つの記事 (例: 最新) を画面いっぱいに表示し、他の記事リストを最小化 (footer ノート的) する。今日の主役を 1 つ決める日。

**適合する曲**:
- 「1 曲だけを言いたい」気分の曲
- 強いステートメント、シングルカット感
- 装飾より曲そのものを主役にしたい日

**避けるとき**: フラットなリスト的気分、複数記事を平等に見せたい日

**CSS のヒント**:
- `.post-list > :first-child { font-size: 3em; min-height: 80vh; display: grid; place-content: center; }` で巨大化
- `.post-list > :not(:first-child) { font-size: 0.7em; opacity: 0.5; }` で他を縮小
- 最新記事の `time` を「今日」「昨日」表記に (CSS だけでは難しいので class 依存しなくてもよい)
- 装飾は最小限、文字の重さで主役感を作る

---

## 8. (補欠) Collage 型

**狙い**: スクラップブック / コラージュ。要素が transform で回転、重なり、複数のフォントが混在、layered。

**適合する曲**: 雑食的、ジャンルレス、文化混合 (kawaii metal / experimental pop / mash-up)

**避けるとき**: 静かで一貫した曲

**CSS のヒント**:
- 各 `li` を `transform: rotate(-3deg + random)` で不揃いに
- `box-shadow` で写真風の枠
- `font-family` をクラスごとに変える
- `z-index` で重ね順を操作
- mixed-fonts (明朝 + sans + ディスプレイ を 1 ページ内で)

---

## 注意

- 上記はあくまで **inspiration**。今日の曲が「これじゃない別の何か」と感じるなら、自由に書いてよい
- HTML 構造は変えられない (CSS Mode 3 制約)。スタイル / 配置 / 装飾でやれる範囲で表現する
- 適切性ファースト: 「静かな曲の日に Gig Flyer」みたいな mismatch は避ける
- 詰め込まない: 1 つのパターンに集中、他の要素は控えめに
