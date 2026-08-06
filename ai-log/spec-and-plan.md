# 仕様書 / 実装予定書 — コトハコビ

- 作成日: 2026-07-26
- 対象ブランチ: `Gallery`
- スコープ: **展示 03「コトハコビ」を実装しきる**ための仕様と手順。
  サイト土台（SvelteKit / Focus / dive-rise トランジション）は実装済み。本書はその上に
  **Icon・Focus Main・音・ギミック** を載せることに集中する。
- 元資料:
  - `docs/kotohakobi.md`（発想段階のメモ）
  - **コトハコビ本体** `D:\0.projects\hackz-allo-cup`（GitHub: `henohenon/hackz-allo-cup`、`allo-app/`）
    ＝ 荷物一覧・音・ビジュアルの**実装の正**。Main は原則これを移植する（§3）。
- 位置づけ: 判断が要る未確定点は `TBD` を置き、末尾「要確認事項」に集約する。

---

## 0. コトハコビとは（展示データ）

`src/lib/exhibits/data.ts` の `id: 'kotohakobi'`（No.03）が対象。登録済み。

- title: **コトハコビ**
- about（detail）: ガラパゴス的通信アプリ
- description: ハックツハッカソンアロカップで制作・最優秀賞を受賞しました。裏側のロジックの整備と、荷物一覧画面の作成を行いました。
- used（tech）: Electron / (React) / Pixi.js / IndexedDB / Node.js / BLE通信
- more: ナシ
- link: https://topaz.dev/projects/c2bfcbeb9b1c5fd0e0ec （リンクボタン＝トップ遷移のハコ、リズムに乗る）

モチーフ = **ハコ**（荷物を運ぶ＝コトハコビ）。Icon も Main もギミックも「ハコ」で統一する。
本体のビジュアル指針（`allo-app/src/ui/theme.ts`）＝**モノクロ2色**（白地 `paper` / 黒線 `ink`）のワイヤーフレーム、
**3DS 相当の 5:3 比率**（論理 1920×1152）レターボックス、フォント **M PLUS 1p**。これを Main に踏襲する。

---

## 1. 実装済みの土台（前提・造り直さない）

- **Focus 画面**（`src/routes/focus/[id]/+page.svelte`）: `details-caption`(右上) / `focus-main`(中央) / `title-caption`(左下) の固定 1 枚。現状 Main は**リンクのみ**のプレースホルダ。
- **Icon**（`IndexView.svelte` の `.icon` 空 `<div>`）: 未実装。全展示共通の空枠。
- **トランジション**（`src/lib/transition.ts`）: Gallery↔Focus を Icon 中心の **dive/rise ズーム**（View Transitions）で繋ぐ。VT 非対応は即時遷移。
  - → kotohakobi.md「トランジション: 例の上下」は dive/rise が該当。**基本は流用**（§5）。

---

## 2. Icon（Gallery のハコ）

**モチーフ: ハコ。** Gallery 一覧に置く、押したくなるアイコン（`docs/kotohakobi.md` §アイコン）。

- **【決定】** **本体ロゴ由来のハコ SVG**。出典＝`allo-app/src/assets/kotohakobi-icon.svg`＝「開いた段ボール箱」（鋭角の正方形＋上両角から splay したフタ＋中の「コ」、黒線・塗りなし）。実座標をそのまま流用して faithful に。実装 `src/lib/components/HakoIcon.svelte`。
  - **現状**: 箱は閉じた四角（上辺常設）＋コ常時表示。上辺の上に 2 枚のフタ（帯・長さは上辺の半分で中央合わせ）。閉＝上辺に重なって隠れ、**ホバーで各上角を蝶番に「斜め上・外へ」跳ね上げ**（左 rotate −120° / 右 +120°・buildButton 準拠）。上ぶちは開いても残る。コの出入り・箱ビクンは今は無し。
    - 経緯: ロゴ忠実の下 splay／上→斜め下の大回転も試したが、いったんトップボタン（buildButton）と同じ斜め上に。
  - 予定（後で再開可）: hover でコが顔を出す／click でコ定位置＝ロゴ完成＋箱ビクン。
- **【決定】** 吹き出し（💭）ではなく **荷物タグ**（本体 listBoxDrop の荷札と統一）で見せる。
- **【決定】** **ホバーでフタが開いて「コ」が顔を出す。**
- **【決定】** **クリックで「コ」が飛び出てアイコン完成。ハコ自体もちょっとビクンとなる。** そのまま Focus へ遷移（既存 dive／Icon 中心ズーム）。
- **【決定】** **ホバー時から例の音が鳴る**（§4・音の連続ギミックの起点）。
- TBD: 音を v1 で鳴らすか（§4 `TBD-audio-scope`）。

実装メモ: SVG/CSS で自作（フタ・本体・「コ」）。`.icon` 枠は残す（`transition.ts` の `setOrigin` が中心取得に使う）。root ズームに含まれる。

---

## 3. Focus Main（荷物一覧＝本体 `listScene` の移植）

Focus 中央に、へのへのん担当の**荷物一覧画面**を再現する。**方針 B（実物移植）**。

### 3.1 実物の中身（`allo-app/src/ui/scenes/listScene.ts` ほか）
- 白いプレーン画面に「荷物一覧」タイトル。**上中央から荷物箱が拍に合わせて 1 個ずつ落ち**、matter-js の物理で画面四辺の見えない壁・箱同士とぶつかって積もる。
- 各箱は `content` テキストを持ち、**ホバーで荷札タグ**（紐＋ハトメ＋角丸カードに中身テキスト）がポップアップ。
- 箱の一辺は文字数で 90〜230px に伸縮（質量も面積比で連動）。同時上限 28 個。
- コア API は綺麗に分離済み: `buildListBoxDrop(texts: string[])` と、音の `getSequence().addListGroove()`。

### 3.2 データ（実物との相違・重要）
- **【決定】** 本体は訪問者の IndexedDB `kotohakobi.sessions`（`{session_id, content, created_at}`）を `getRecent(50)` で読むが、**公開 Web の訪問者にそのDBは無い**。→ Main の箱テキストは **`e.tech`（使用技術）** を渡す（`KotohakobiMain` の `texts` prop＝Focus から `e.tech`）。※以前はコトバのデモ文字列だったが「箱＝使用技術」に変更。

### 3.3 移植方針 B（自己完結の Pixi アイランド）
- `/focus/kotohakobi` でのみ**動的 import** する `PixiListIsland.svelte` を新設。Gallery index は従来どおり軽いまま（遅延ロード）。
- やること:
  - Pixi `Application` を Focus Main 内に生成。論理 1920×1152 を**レターボックススケール**（本体 `designToScreen.ts` 相当を移植 or 簡易実装）。
  - `buildListBoxDrop(demoTexts)` の `view`＋`overlay` を載せる。タイトル「荷物一覧」は任意（Focus 側キャプションがあるため省略可）。
  - `getSequence().addListGroove()` を購読、`onunmount` で解除＋`dispose()`。
- **捨てるもの**: `SceneManager` / React / `@capacitor/core`（Android 加速度センサー分岐）/ BLE / 共通「戻るボタン」（Focus の `CloseButton` を使う）。
- **持ってくるもの**: `listBoxDrop.ts` / `sequence.ts`（`addListGroove` 周辺）/ `wireframe.ts`(`label`/`wireRect`) / `theme.ts` / letterbox スケーラ。
- 追加依存（portfolio 側 `package.json`）: `pixi.js` `matter-js` `tone`（+ `@types/matter-js`）。`pixi-filters`・`@capacitor/*`・`react` は不要。目安 **~270KB gzip（遅延ロード）**。
- SSR/prerender 対策: アイランドは `browser` ガード＋`onMount`＋動的 import。プリレンダ HTML には canvas を出さない。

### 3.4 リンクボタン
- **【決定】** リンク（§0 の topaz URL）を**ハコ型ボタン**で配置（kotohakobi.md §リンクボタン「トップ遷移のハコ」）。
- **【決定】** このハコは **音のリズムに乗って動く**（`addListGroove` の拍に同期）。

---

## 4. 音（本体 `audio/sequence.ts` の移植）

- 実物 = Tone.js。**BPM110 固定、起動で一度だけ Transport を開始しシーン遷移でリセットしない**設計＝ kotohakobi.md「ここで途切れさせない！」は**本体で実現済みの思想**。移植でそのまま活かす。
- 荷物一覧の音 = `addListGroove()`（ファンクベース＋シンコペチャイム＋2/4 スタブ＋16 分ハット＋スウィング 0.12）＝「あのリズム」。
- **【決定】** 音量調整 UI は作らない（v1）。kotohakobi.md「音量調整は作らない（強気）」に従う。
- 自動再生制約: Focus はクリック遷移で到達＝ユーザー操作後なので `Tone.start()` を入場時に呼べる。ホバー音（Icon）は初回操作後のみ。
- **【決定・§6 ギミック】** **トップの Icon ホバー音と Focus 画面の音が途切れずつながる**のが本作の見せ場。Icon ホバー〜Focus 遷移〜荷物一覧グルーヴを、Transport をリセットせず 1 本の時間軸で繋ぐ。
- TBD: v1 で音を入れるか（`addListGroove` の移植・Tone 追加を伴う）。`TBD-audio-scope`

---

## 5. トランジション

- **【決定】** コトハコビの「例のトランジション（上下）」＝**本体 SceneManager の“上下の黒い蓋”遷移**（`allo-app/src/ui/scenes/SceneManager.ts` の `drawFlaps`）。上端から下りる蓋＋下端から昇る蓋が中央で合わさり画面を黒く覆う→覆い中に差し替え→開いて次を見せる。片道 `FLAP_MS=220ms`・easeInOutQuad、覆い中は入力遮断（`MIN_HOLD_MS`）。上下の蓋＝ロゴのハコのフタと世界観が繋がる。
- **✅ 実装済み**（`transition.ts` の `flapTransition`）: `onNavigate` で、コトハコビの Gallery↔Focus のときだけ VT ではなく**上下 2 枚の黒オーバーレイ**（`position:fixed`・`scaleY` を各辺蝶番に）を WAAPI で **閉じ 220ms →（最低保持 560ms と mount 完了の両待ち）→ 開き 220ms**（本家の `FLAP_MS=220` / `MIN_HOLD_MS=560` / 計 1000ms に一致）。他 2 作品は従来の dive/rise ズームのまま（`focusId === 'kotohakobi'` で分岐）。覆い中に island の mount / 音 enter が走るので canvas 初期化のチラつきも隠れる。
  - **蓋の幅は 5:3 レターボックス矩形に一致**。矩形計算は Pixi キャンバスの fit と共通化した（`src/lib/kotohakobi/screen.ts` の `letterbox()` を `layoutFlaps` と `KotohakobiMain.fit` の両方が参照）＝画面と蓋の幅が必ず一致。ビューポートが 5:3 より横長なら**横に余白が残る**＝本家の「横に白余白」を再現（余白はページの白地）。※余白を確実に白で塗る mask は必要なら後追い。
  - 差し替え順は**本家準拠**: 閉じる → 覆い中に差し替え → 最低保持と mount の両待ち → 開く（一泊は入れない）。
  - ただし Focus のカード（details/title）は 5:3 外の余白隅に出て蓋に覆われないため、**入場(dive)時のみ覆い中は隠し（`html.koto-covering`＋CSS opacity）、蓋が開くのと同時にフェードで現す**。戻り(rise)は隠さない。

---

## 6. ギミック（音の連続）

- **【決定】** ギミック＝**音がつながっていること**（`docs/kotohakobi.md` §ギミック）。トップの Icon ホバーで鳴り始めた音と、Focus（荷物一覧）画面の音が**途切れずつながっている**。
- 実現の鍵: Tone の Transport をアプリ寿命の singleton（`sequence.ts`）に置く。鳴らすのは「Icon ホバー中」または「Focus 中」だけ。
- 再生方式は試行錯誤中。**現状＝“頭からリセット”だが、ホバー連打の激しいリセットは猶予で抑制**：
  - 全音源をマスター `Tone.Gain` に束ねる。立ち上がり/立ち下がりは**極短デクリック（8ms）のみ**＝滑らかさは足さず、クリックノイズだけ除去。
  - `enter` は「完全停止からの新規ホバー」だけ `stop`→`start` で頭出し。`leave` はほぼ即無音にしつつ、**stop（頭出し）を 500ms 猶予**。猶予内の再 `enter` は巻き戻さず継続＝**素早い出入りでは激しくリセットしない**。本当に離れてからの再ホバーだけ頭出し。
  - ※既に試した「pause/resume で位置保持」「mute で楽譜進めっぱなし」「毎回即リセット」「フェードで角丸め」は微妙だったため差し替え。`TBD-audio-feel`
- ※旧案（プレゼント/exe/ローカル IndexedDB 探索）は doc から削除されたため**廃止**。

---

## 7. 実装フェーズ計画

- **Phase A: Icon（ハコ）** ／ ✅ 済（`HakoIcon.svelte`。ロゴ準拠・ホバーでフタ開閉。コの出入り/ビクンは保留）
- **Phase B: Focus Main（listScene 移植）** ／ ✅ B1・B2 済
  - B1/B2 済: pixi/matter 追加、`KotohakobiMain.svelte`（動的 import・letterbox・dispose）＋ `boxDrop.ts`/`wireframe.ts`/`theme.ts` 移植。`demoTexts` で箱降らし＋ホバー荷札。
  - B3: ✅ 中央に本家トップと同じ段ボール箱ボタン「見に行く」（`linkButton.ts`＝buildButton 移植、ホバーで蓋開閉）を配置、押下で作品リンク（topaz）を別タブで開く。※リズム同期は未（任意）。
- **Phase C: 音（sequence 移植）＝ギミック本体** ／ ✅ 済
  - `sequence.ts`（Transport シングルトン＝非リセット）移植。Icon ホバーで start（Tone 遅延 import）→ Focus で `addListGroove()` ＋箱を **onBeat 同期**で落とす。離脱で groove のみ解除（Transport は生存＝連続）。音量 UI なし。
- **Phase D: 上下の蓋トランジション** ／ ✅ 済（`flapTransition`。コトハコビ行き来を上下の黒い蓋に差し替え。§5）

---

## 8. 要確認事項（TBD 一覧）

| ID | 内容 | 影響 |
|---|---|---|
| ~~`TBD-demo-texts`~~ | 解決：箱テキスト＝`e.tech`（使用技術）。将来 IndexedDB 風の別テキストにするかは任意 | Phase B |
| `TBD-trans-box` | コトハコビ行き来を上下の蓋トランジションに差し替えるか（§5・Phase D） | Phase D |

- 解決済み: クリック挙動＝コ飛び出し＋ビクン / 喋る→荷物タグ / リンクのリズム乗り / ギミック＝音の連続（exe 案は廃止）/ `TBD-audio-scope`＝音は入れる（Icon ホバー〜Focus をつなぐ、Phase C 実装済み）。
- 残実装: Icon の「コ出入り/ビクン」演出の復帰（保留中）、リンクボタンのリズム同期（任意）。
- フォント: ✅ M PLUS 1p を**サブセット同梱**（`scripts/subset-mplus.mjs`＝`subset-font`/harfbuzz WASM で data.ts の tech＋「見に行く」の使用文字だけ woff2、各 ~4KB）。`font.ts` が FontFace で登録し、Pixi Text 生成前に `await loadFont()`（焼き込み対策）。箱テキスト（tech）を変えたら `pnpm subset:fonts` で再生成（元 ttf は本体 allo-app から読む・非同梱）。
- ひねり: ✅ 中央「見に行く」ボタンを**ビートに乗せて揺れ＋呼吸**（本家トップの `animateLogo` 同様・kotohakobi.md「リズムに乗る」）。※要否は要確認。
