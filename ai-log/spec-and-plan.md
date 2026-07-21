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

### 実装済み (skeleton のみ)
- スタック: **Vite 8 + TypeScript 6 + pnpm**、フレームワーク無し（バニラ TS で `#app` に innerHTML を注入）。
- `src/main.ts`: 3 セクションの静的マークアップのみ。
  - `.top` … 顔タイポグラフィ `.face` ＋ 自己紹介キャプション `.card`
  - `.pieces` … `.piece`(=`.content` + `.name-card`) を **6 枚** 並べたプレースホルダ
  - `.footer` … コピーライト表記
- `src/style.css`: 上記のレイアウトのみ。演出・トランジション・遷移は未実装。
- Icon 中身・Focus 画面・About・会話・トランジションはすべて **未着手**。

### 命名の不整合（要整理）
`docs` の用語と現行コードのクラス名が食い違っている。本仕様では **docs の用語を正**とし、コードを寄せる（Phase 1 でリネーム）。

| docs 用語 | 現行コード | 備考 |
|---|---|---|
| Introduction | `.top` | 最初の展示品 |
| Icon | `.face` / `.content` | 作品本体（抽象化された概念） |
| text-caption | `.card` | 自己紹介 |
| Gallery | `.pieces` | 展示品が並ぶ場所 |
| Exhibit | `.piece` | Icon + title-caption 一式 |
| title-caption | `.name-card` | 作品名 + 番号 |
| Focus | (未実装) | 展示 1 点を集中して見る画面 |

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
- Exhibit ↔ Focus の遷移を、作品ごとに凝った演出で行う。
- 制約（`frame.md`）: **わくわくする / 長すぎない / 戻る用も用意（逆再生でも可）**。
- 作品別の方向性: GlobeXplore=ワープ / MwP=幕の開閉 / コトハコビ=ハコの開閉・飛び出し。

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

## 7. 技術方針

- スタック: **Vite + TypeScript + pnpm**（現状維持）。**【決定】デプロイは GitHub Pages**。
- **【決定】フレームワークは導入せず、バニラ TS を継続。**
  - 理由: 本サイトの核心「作品ごとの凝ったトランジション」は結局どの FW でも自前アニメーションになる。素の DOM を全握りするほうが演出を作りやすく、規模も小さいため FW の定型コストが割に合わない。
  - 土台の組み合わせ:
    - **ハッシュルーター（自前 or 極小）** … `#/`, `#/focus/globexplore` 等。
    - **View Transitions API（ブラウザ標準）** … `document.startViewTransition()` で DOM 差し替えを包み、ルート間トランジション＋戻りの逆再生を実現。作品別演出は `::view-transition-*` の命名で分岐。
  - 将来コンポーネントの書き味が欲しくなった場合の次点は Svelte（今回は不要と判断）。
- **【決定】ルーティング/遷移モデルは URL 分離。まずはハッシュ方式**（`#/focus/:id`）。
  - GitHub Pages でサーバ設定なしに動作するため。将来クリーンパス（`/focus/:id`）にしたい場合は `index.html` を `404.html` にコピーする SPA フォールバックで移行可能。
- 命名整合: §2 の対応表に従い、コードのクラス/構造を docs 用語へリネーム。
- ディレクトリ構成（案）:
  ```
  src/
    main.ts            エントリ
    style.css          共通スタイル
    router.ts          ハッシュルーター（#/ , #/focus/:id , #/about）
    exhibits/          作品ごとのデータ + Icon/Focus/トランジション
    components/        header, footer, caption 等の共通片
    transitions/       View Transitions 用の遷移エフェクト
  ```

---

## 8. 実装フェーズ計画

- **Phase 0: 本仕様の確定** ← 完了（主要方針は §9 で決定済み）。
- **Phase 1: 命名整合とデータ化 + ルーター**
  - クラス名/構造を docs 用語へリネーム（Introduction/Gallery/Exhibit/Icon/…）。
  - 展示品を配列データ（id, 番号, 作品名, 詳細, 担当, 使用技術, More, リンク）として分離し、Gallery を **3 件**で動的生成（Icon/Main は仮 or 空）。
  - ハッシュルーター（`#/`, `#/focus/:id`, `#/about`）を導入。
- **Phase 2: Focus 画面 + 基本遷移**
  - Focus のレイアウト（details-caption / main / title-caption）実装。
  - Exhibit → Focus → 戻る を、View Transitions API で包んだプレーンな遷移でまず通す（作品別演出は Phase 5）。
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
2. **フレームワーク**: 導入しない。**バニラ TS + ハッシュルーター + View Transitions API**。
3. **遷移モデル**: **URL 分離（ハッシュ `#/focus/:id`）**。
4. **LLM 会話**: 別スコープ。v1 は**ランダム単語応答**まで。
5. **デプロイ**: **GitHub Pages**。
6. **命名整合**: docs 用語へコードを寄せる（本仕様前提）。

### 残 TBD（後続で詰める）
- 各作品の未確定演出: コトハコビ Main（3DS 的表現/音）、MwP の More 文言、Icon の具体アニメ等。→ Phase 4 以降で個別に。
- クリーンパス（`/focus/:id`）へ将来移行するか。→ 当面ハッシュで進め、必要になれば判断。

---

> メモ: README はユーザー主筆のため本仕様では触れない。本ドキュメントは実装の合意形成用の下敷きであり、確定した内容は随時 docs 側へ反映していく想定。
