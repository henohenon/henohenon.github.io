# 仕様書 / 実装予定書

- 作成日: 2026-07-22
- 対象ブランチ: `Gallery`
- 位置づけ: `docs/` の設計メモ（探索的で未確定な記述を含む）を、**確定仕様**と**実装フェーズ計画**に落とし込んだもの。
  判断が必要で未確定の点は本文中に `TBD` として残し、末尾の「要確認事項」に集約する。
- 元資料: `docs/frame.md`(全体), `docs/introduction.md`(導入/About), `docs/GlobeXplore.md` / `docs/MwP.md` / `docs/kotohakobi.md`(各展示品)

---

## 1. コンセプト

- キャッチ: **わくわくさせる**
- テーマ: **展示 (Gallery)**
- 本サイトの体験のキモは、**画面遷移時のトランジション**（`frame.md`）。作品そのものより「見せ方・動き・遊び心」に主眼を置く。
- ポートフォリオを兼ねた、へのへのん本人の作品展示空間。

---

## 2. 現状 (2026-07-22 時点)

- スタック: **Vite + TypeScript + pnpm ＋ Svelte**（詳細は §7）。デプロイは GitHub Pages。
- 実装済み: 展示 3 件のデータ（`src/exhibits/data.ts`）。docs 用語で統一したレイアウト/命名。
- 未着手: SvelteKit への移行、Focus 演出、Icon 中身、About、会話、トランジション。

### 用語とクラス/コンポーネントの対応
`docs` の用語を正とし、以降も同じ用語で統一する。

| docs 用語 | クラス/コンポーネント | 備考 |
|---|---|---|
| Introduction | `introduction` | 最初の展示品 |
| Icon | `icon` | 作品本体（抽象化された概念） |
| text-caption | `text-caption` | 自己紹介 |
| Gallery | `gallery` | 展示品が並ぶ場所 |
| Exhibit | `exhibit` | Icon + title-caption 一式 |
| title-caption | `title-caption` | 作品名 + 番号 |
| Focus | `focus` | 展示 1 点を集中して見る画面 |

---

## 3. 用語定義（`frame.md` 準拠）

- **Gallery**: 展示品が並ぶ場所（index のメイン）。
- **Focus**: 展示 1 点を集中して見る画面。Exhibit クリックで遷移。
- **Introduction**: 導入。最初の展示品。Gallery の先頭に置かれる。
- **Exhibit**: Icon + キャプション一式の「展示品」単位。
- **Icon**: Gallery における作品本体。作品現物やロゴを貼るのではなく、**適切に抽象化した概念**として表現する。
- **About**: Introduction の Icon（顔タイポ）またはヘッダーの About ボタンで遷移する、自己紹介ページ。

---

## 4. 画面 / 情報構造

### 4.1 index (Gallery)
```
<body>
  <header/>                     … 右上 About（Introduction 通過後のみ表示・fixed）
  <introduction>                … 最初の展示品
    <icon/>                     … 顔タイポ（へ へ / の の / ん）
    <text-caption/>             … 自己紹介
  </introduction>
  <gallery>
    <exhibit><icon/><title-caption/></exhibit>  … 作品名 + 番号
    <exhibit>…</exhibit>
    …
  </gallery>
  <footer/>                     … コピーライト + X リンク（index のみ）
</body>
```

### 4.2 Focus
```
<body>
  <details-caption/>   … 閉じるボタン / コンセプト短文 / 自分の作業 / 使用技術 / More ボタン
  <main/>              … 作品の主役（リンクボタン + 写真・動画など紹介要素）
  <title-caption/>     … 作品名 + 番号（固定表示）
</body>
```
- Exhibit → Focus 遷移が体験のキモ。**トランジション演出**を各作品ごとに用意する（§6）。
- Focus は原則スクロールもクリックも不要。**何もしなくても完成している状態**で世界観がミニマルに伝わることを狙う（`frame.md` 演出）。

### 4.3 About
- index とほぼ同構造だが、**Introduction の内容だけが変化**する（`introduction.md`）。
- About 側 Introduction の情報:
  - 顔タイポグラフィ（できれば数種類作って「じゃぎらせる」＝ゆらぎ表現）
  - 右上テキスト: 自己紹介 / X・GitHub リンク / のへ(More)リンク / 資格・Skills
  - `click me!` `about…` などの吹き出しが**たまに**出る（作品優先なので最初から全開にはしない）
  - タイポグラフィと**会話ができる**（下 or 右下に入力欄、タイポからは返答吹き出し）

---

## 5. 展示品カタログ

**【決定】** 当面の展示は **3 件**（GlobeXplore / Make with Puppet / コトハコビ）。`main.ts` のプレースホルダ 6 枚は 3 枚に減らす。各展示の **Icon・Main は当面「仮 or 空」で可**（データ枠と遷移を先に通し、中身は後から差し込む）。

### 5.1 Introduction（0 番 / 最初の展示品）
- Icon: 顔タイポ `へ へ / の の / ん`。複数バリエーションでゆらぎ表現（`じゃぎらせたい`）。
- Caption(左下): 「初めまして、へのへのんと申します。ここではポートフォリオを兼ねて、自分の作品を展示しています。興味を持っていただけたり、ワクワクしていただければ幸いです。」
- クリック → About 遷移（Introduction 内容が差し替わる）。

### 5.2 GlobeXplore（`docs/GlobeXplore.md`）
- Icon: **ドローン**。ホバーで浮く / 傾いて喋る / 宙返り等の激しい回転。
- 詳細: PLATEAU を活用したドローンシミュレーター。
- 担当: 初期〜GlobeXplore'Pro リリースまで、Unity での開発全般と Steam 公開・運用を主導。
- 使用技術: Unity, Cesium for Unity, Figma
- Main: 飛行中の動画背景。
- トランジション: 「ワープっぽいやつ」。

### 5.3 Make with Puppet（`docs/MwP.md`）
- Icon: **人形＋操る手**。ホバーで片手を上げる / クリックで手を振る / 首をかしげて喋る。
- 詳細: XR Puppet ゲーム。BitSummit GameJam で制作・受賞。
- 担当: 4 人チームでプログラミングを主に、一部モデリング・企画まで。コードの 9 割は人の手書き。
- 使用技術: Unity, UniTask, VContainer, R3, Blender
- More: 未（`まだない`）
- Main: リンク先は itch 想定。中央にロゴボタン、左上に動画・右下にスクショ複数。
- トランジション: 左右(+上?)から幕が閉まる／開く。

### 5.4 コトハコビ（`docs/kotohakobi.md`）
- Icon: **ハコ**。ホバーで開いて「コ」がのぞく / 顔を出して喋る / クリックで飛び出して表に出る（or 閉じる/跳ねる）。
- 詳細: コトバでつながる、ハコべる。ガラパゴス的通信アプリ。ハックツハッカソン アロカップで最優秀賞。
- 担当: 裏側ロジックの整備と、荷物一覧画面の作成。
- 使用技術: Electron, (React), Pixi.js, IndexedDB, Node.js, BLE 通信
- Main: リンク先 https://topaz.dev/projects/c2bfcbeb9b1c5fd0e0ec 。音・スクショ・3DS 的な見せ方など構想中（未確定）。

> 各作品の Icon 演出・Main の見せ方・トランジションは docs で発想段階の記述が多い。実装時は本仕様の記述を出発点に、Phase 4 以降で個別詰め。

---

## 6. 機能要件

### 6.1 トランジション（最重要）
- Exhibit ↔ Focus の遷移を、作品ごとに凝った演出で行う。SPA ナビゲーション（DOM を保持したまま遷移）で連続性を担保する。
- 制約（`frame.md`）: **わくわくする / 長すぎない / 戻る用も用意（逆再生でも可）**。
- 作品別の方向性: GlobeXplore=ワープ / MwP=幕の開閉 / コトハコビ=ハコの開閉・飛び出し。
- 実装の二段構え（デバイス非依存を担保）:
  - **劇場型の派手な演出（ワープ / 幕 / ハコ）** … Svelte の `transition:`/`animate:`（FLIP）や自前オーバーレイ、必要なら GSAP。**全環境で動く**。
  - **共有要素モーフ（Gallery Icon → Focus への連続移動）** … Svelte の `crossfade`／FLIP で実現。ブラウザ標準 View Transitions を併用してもよい（対応環境のみの enhancement）。
- シェーダ演出（例: GlobeXplore のワープ）は、消えない常駐 `<canvas>` 島＋rAF＋GLSL で実装（Threlte or PixiJS/OGL/生 WebGL。§7）。

### 6.2 Icon 演出（Gallery 内）
- 一覧として適切な解像度、アイコンとして適切な抽象度。
- 「押したくなる」強調（吹き出しなど）。
- ホバー時リアクション（スマホは対象要素が画面中央に来たとき）。
- クリック時リアクション（トランジションと絡めても別でも可）。
- 遊び心・自由であること。

### 6.3 About / 会話
- タイポとの会話機能。将来的に LLM を絡め、のへ本人の md や Skills と接続したい（`introduction.md`）。
- **【決定】LLM 会話は別スコープ**。v1 では入力に対し **ランダムな単語を返す程度**の仕組み（吹き出し UI ＋ 応答語の配列からランダム選択）を作れれば十分。LLM 連携は後続フェーズ（Phase 6）。

### 6.4 ヘッダー / フッター
- ヘッダー: 右上 About。Introduction を通過（スクロール等）した後のみ表示、`fixed`。
- フッター: index のみ。コピーライト表記 + X リンク。

---

- スタック: **Vite + TypeScript + pnpm ＋ Svelte（Svelte 5）**。デプロイは **GitHub Pages**。
- **器（ビュー/ルーター）**: **SvelteKit ＋ `adapter-static`**。
  - 各ルートを実 `.html` に**静的プリレンダ**し、**クリーンパス**（`/focus/:id` 等）を Pages で `404.html` ハックなしに提供。
  - クライアントルーターの SPA ナビゲーション（DOM 保持）で遷移し、トランジションの連続性を得る。深いリンク/リロードはプリレンダ済み HTML が応答。
  - サイトは `henohenon.github.io`（ユーザーサイト・ルート）なので base パスは `/`。
- **演出（エンジン）レイヤー**（器と分離して考える）:
  - DOM 遷移 … Svelte transitions（`crossfade`/FLIP/`transition:`）、必要に応じ GSAP。
  - シェーダ/WebGL … 消えない常駐 `<canvas>` 島＋rAF＋GLSL。宣言的にやるなら **Threlte**、軽量に生でやるなら **PixiJS/OGL/生 WebGL**。
- **ルーティング/遷移モデル**: **URL 分離＝クリーンパス（静的プリレンダ）**。SPA ナビゲーションで DOM 保持。
- 命名整合: §2 の対応表どおり docs 用語で統一。
- ディレクトリ構成（SvelteKit・案）:
  ```
  src/
    lib/
      exhibits/data.ts       展示データ
      components/            Header / Footer / Caption / Icon 等
      transitions/           crossfade 定義・遷移オーケストレーション
      shaders/               GLSL・canvas 島（ワープ等）
    routes/
      +layout.svelte         共通レイアウト（header/footer, ClientRouter 相当）
      +page.svelte           / … Gallery（Introduction 含む）
      about/+page.svelte     /about
      focus/[id]/+page.svelte  /focus/:id … Focus
    app.css                  共通スタイル
  svelte.config.js           adapter-static
  ```

---

## 8. 実装フェーズ計画

- **Phase 1: Svelte 土台**
  - SvelteKit ＋ `adapter-static` をセットアップ（Pages 向けクリーンパス）。
  - ルートを `/`(Gallery) / `/about` / `/focus/[id]` で構成。
  - `exhibits/data.ts` から Gallery を **3 件**生成（Icon/Main は仮 or 空）。
- **Phase 2: Focus 画面 + 基本遷移**
  - Focus のレイアウト（details-caption / main / title-caption）を component 実装。
  - Exhibit → Focus → 戻る を、Svelte transitions で包んだプレーンな遷移でまず通す（作品別演出は Phase 5）。
- **Phase 3: ヘッダー/フッター + Introduction 挙動**
  - About ボタン（Introduction 通過後 fixed 表示）、フッター（X リンク）。
  - Introduction → About の内容差し替え。
- **Phase 4: 演出（Icon の動き / ホバー・クリック）**
  - 各作品 Icon のアイドル・ホバー・クリック演出。吹き出し。
- **Phase 5: トランジション作り込み**
  - 作品別トランジション（ワープ / 幕 / ハコ）。戻り再生。
- **Phase 6: About の会話**（v1 はランダム単語応答。LLM 連携は将来）。
- **Phase 7: 各 Focus の Main 作り込み**（動画背景・スクショ・埋め込み等）と仕上げ。

---

## 9. 決定事項 / 残 TBD

### 決定済み（2026-07-22）
1. **展示枚数**: 当面 **3 件**。Icon・Main は当面「仮 or 空」で可。
2. **フレームワーク**: **Svelte（Svelte 5）採用**。器は **SvelteKit ＋ `adapter-static`**。
3. **遷移モデル**: **URL 分離＝クリーンパス（`/focus/:id`、静的プリレンダ）**。SPA ナビゲーションで DOM 保持し遷移の連続性を確保。
4. **演出エンジン**: DOM 遷移＝Svelte transitions（`crossfade`/FLIP）＋必要に応じ GSAP。シェーダ＝常駐 canvas 島＋GLSL（Threlte or PixiJS/OGL/生 WebGL）。
5. **LLM 会話**: 別スコープ。v1 は**ランダム単語応答**まで。
6. **デプロイ**: **GitHub Pages**（`henohenon.github.io` ルート、base=`/`）。
7. **命名整合**: docs 用語で統一（対応済み）。

### 残 TBD（後続で詰める）
- 各作品の未確定演出: コトハコビ Main（3DS 的表現/音）、MwP の More 文言、Icon の具体アニメ等。→ Phase 4 以降で個別に。
- WebGL レイヤーの具体選定（Threlte / PixiJS / OGL / 生 WebGL）。→ 最初のシェーダ演出（ワープ）着手時に判断。

---

> メモ: README はユーザー主筆のため本仕様では触れない。本ドキュメントは実装の合意形成用の下敷きであり、確定した内容は随時 docs 側へ反映していく想定。
