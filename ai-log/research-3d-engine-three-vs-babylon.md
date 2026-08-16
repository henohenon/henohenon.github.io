# 技術調査 — three.js vs Babylon.js（物理＋シェーダー＋多数モデルの新ビュー向け）

- 作成日: 2026-08-16
- 対象ブランチ: `Gallery`
- 動機: 「多少の物理演算 + そこそこ頑張ったシェーダー + 無数のモデル」のビューを追加したい。
  ギークにギリギリまでチューンする前提で、**ユーザー体験の最大化**を目的にエンジンを選ぶ。
- 記法: **`【決定】`＝実測で確定した事実、`【提案】`＝本書で置いた判断（要承認）**。未確定は `TBD` に集約。

## 評価から明示的に除外したもの

ユーザー指示により、以下は**判断材料に含めない**。

- 既存実装が何を使っているか（main に three が入っている等）
- ドキュメント量・チュートリアルの多さ・学習コスト・エコシステムの大きさ

---

## 0. 結論（先に）

> **【提案】WebGL2 に割り切るなら three、WebGPU に張るなら Babylon。中間（TSL でフォールバック）が一番おいしくない。**

| あなたの決断 | 勝つ方 | 理由 |
|---|---|---|
| WebGL2 で出す | **three** | バンドル 129 KB（Babylon の約半分）、生GLSL、`BatchedMesh` |
| WebGPU に張る | **Babylon** | three の WebGPU は公式に experimental + 未解決の4倍遅いバグ |
| WebGPU + 大半が静止 | **Babylon** | Snapshot Rendering が桁違い（後述） |
| WebGPU + 全部動く | ほぼ互角、やや three | TSL と `BatchedMesh` のぶん |
| 生のシェーダーテキストが譲れない | **Babylon** | three は WebGPU で生シェーダー非対応 |

**現時点の推奨: three + WebGL2 + `ShaderMaterial` + `InstancedMesh`/`BatchedMesh` + 軽量物理。**
理由は GitHub Pages 制約下で総量 165 KB に収まるのがこの構成だけだから（§5）。

---

## 1. バンドルサイズ【決定】

### 測定条件

- 自マシン、Vite 8 + rolldown、`minify: true`、同一シーン（カスタムシェーダー + 2000インスタンス）
- three `0.185.1` / `@babylonjs/core` `9.21.2` / `@babylonjs/lite` `1.21.0`
- 再現用スクリプトはスクラッチパッドの `tsl-bench/`（揮発。必要なら再作成）

### 結果（gzip）

| 構成 | gzip | 備考 |
|---|---:|---|
| three **WebGL2 + ShaderMaterial** | **130 KB** | 最小の実用構成 |
| three **WebGPU + TSL** | **233 KB** | |
| `@babylonjs/core` | **246 KB** | 自動で 17〜39 チャンクに分割 |
| `@babylonjs/core`（バレルimport） | 1,479 KB | 副作用宣言のせいで丸ごと入る |
| `@babylonjs/lite` | **25 KB** | WebGPU専用 |

### 空シーンの床【決定】— 最重要の発見

| | 空シーン | 実シーン | 差 |
|---|---:|---:|---:|
| three WebGL2 | 128.75 KB | 129.74 KB | **+1.0 KB** |
| three WebGPU + TSL | 209.89 KB | 233.0 KB | **+23 KB** |

**シェーダーを書いて 2000 インスタンス置いても 1 KB しか増えない。約99%はエンジンの床。**
→ 「機能を絞れば軽くなる」という期待は成立しない。エンジンと経路の選択でほぼ決まる。

### 落とし穴【決定】

- **three で `three/src/**` の深いパス個別importは逆効果**（barrel 124 KB < deep import 133 KB）。
  あれは webpack 時代の作法。Rollup/Vite では barrel が正しくツリーシェイクされる。
- **Babylon はバレルimportすると 1.48 MB 入る。** ファイル単位の import 規律が必須。

---

## 2. なぜ床がここまで違うのか【決定】

### three r185 の src 構成

| ディレクトリ | サイズ | ファイル数 |
|---|---:|---:|
| **`nodes`（TSL本体）** | **1,088 KB** | **216** |
| `renderers/common`（共有層） | 475 KB | 67 |
| `renderers/webgpu` | 347 KB | 40 |
| `renderers/webgl`（旧レンダラー） | 308 KB | 30 |
| `renderers/webgl-fallback` | 226 KB | 11 |
| `materials` | 284 KB | 38 |
| `math` | 335 KB | 29 |

理由は3つ。

1. **TSL は実質シェーダーコンパイラ。** `nodes/` 単体が他のどのサブシステムより大きい。
   GLSL と WGSL の2つのコードジェネレータ + 200超のノードクラス + 両言語パーサを実行時に配ることになる。
2. **`three@0.185.1` の `sideEffects` は `["./src/nodes/**/*"]` の1エントリのみ。**
   = nodes 以外は綺麗にツリーシェイクできるが、**TSL は丸ごと落ちてくる**。
3. **`WebGPURenderer` はバックエンドを2つ同梱**（`webgpu` + `webgl-fallback`）。
   自動フォールバックの便利さは両方バンドルして買っている。

### Babylon 側

- **`@babylonjs/core@9.21.2` の `sideEffects` は 682 エントリ**（three は1）。
  `Shaders/**`、`ShadersWGSL/**`、`**/index.js`、`**/*pbrMaterial.js` 等が「消すな」と宣言されている。
- Babylon 9 の `.pure.js` リファクタ（712ファイル）はこの682個を減らす作業の途中。

### Babylon Lite が 25 KB な理由

最適化の成果ではなく**捨てたものの量**。バックエンド1つ（WebGPU専用・フォールバック無し）、
シェーダー言語1つ（WGSLのみ、GLSLパーサもトランスパイラも不要）、レガシー互換ゼロ。

---

## 3. 描画性能

### 構造的な機能差【決定】

| | three r185 | Babylon 9.21 |
|---|---|---|
| 同一ジオメトリの大量描画 | `InstancedMesh` | thin instances |
| **異なるジオメトリを1ドローコール** | **`BatchedMesh`** | **等価物なし**（`.d.ts` を `multiDraw` で grep して0ヒット） |
| compute が書いたバッファを描画引数に | `setIndirect()` + `IndirectStorageBufferAttribute` | 内部APIのみ・JSから書く |
| GPUカリング framework | 無し（DIY） | 無し（DIY） |

### 実測（Babylon 側、Playground、WebGPU、5,000メッシュ、JS ms/frame）

| | ms |
|---|---:|
| 個別 Mesh | 19.0 |
| InstancedMesh | 2.46 |
| **thin instances** | **0.014** |
| **Snapshot Rendering fast** | **0.013** |

thin instances は 20,000個で 0.006 ms、**100万個でも 0.32 ms**（N にほぼ非依存）。

### Snapshot Rendering の罠【決定】— 物理と衝突する

同じ 5,000 メッシュで、毎フレーム `updateMesh` する数を変えた実測:

| 動かす数 | ms/frame |
|---:|---:|
| 0 | 0.08 |
| 1,000 | 0.77 |
| **5,000（全部）** | **17.86** |
| （SR無効で5,000動かす） | 32.0 |

→ **「大半が静止・一部だけ動く」なら圧勝、「全部動く」なら優位は消える。**
さらに SR は draw call を焼くので、メッシュの追加/削除・可視性変更は再録画が必要。

### `performancePriority = Aggressive` の罠【決定】

| 5,000メッシュ | BackwardCompatible | Aggressive |
|---|---:|---:|
| 全部画面内 | 19.10 ms | **11.94 ms**（−37%） |
| 55%が画面外 | **7.99 ms** | 12.69 ms（**+59% 悪化**） |

`skipFrustumClipping` が立つ＝**カリングを捨てて全部描く**ことで CPU を稼ぐ設計。
広い空間に散らばるシーンでは逆効果。**しかもメッシュ生成より前に設定しないと大半が適用されない**（ソース確認済、ドキュメント未記載）。

### 既知の未解決バグ【決定】

- three [#30560](https://github.com/mrdoob/three.js/issues/30560)（open, High priority, 2026-03更新）
  **2万メッシュで WebGL 60fps / WebGPU 15fps。** 本件の用途に直撃。
- three [#28776](https://github.com/mrdoob/three.js/issues/28776)（open, 2024-07〜）
  **`BatchedMesh` が10万ジオメトリで 20fps、素の Mesh が 60fps** と逆転。
  原因は `onBeforeRender` 内のJS製カリング＆ソートループ。
  第一手は `perObjectFrustumCulled = false` / `sortObjects = false`、本命は `@three.ez/batched-mesh-extensions`（BVHカリング、公式exampleが依存）。

### ベンチマークについての注意【決定】

**three vs Babylon の信頼できる3Dヘッドトゥヘッドベンチは存在しない。**
検索上位の「Babylon 56 FPS で最速」は全て**2Dスプライトの bunnymark** が3D文脈に流用されたもの。
両エンジンのコア開発者が揃って「同じシーンを同じ機能で組めば同じ性能」と述べており、
実測された差はどれも修正可能な既定値かバグに帰着している。

---

## 4. シェーダー

### three は生シェーダーを将来から切り捨てた【決定】

公式マニュアル（threejs.org/manual/en/webgpurenderer.html）の原文:

> "Custom materials based on `ShaderMaterial`, `RawShaderMaterial` and modifications of built-in
> materials via `onBeforeCompile()` are **not supported** in `WebGPURenderer`."

> （WebGLRenderer について）"there are **no plans to add larger new features** to the renderer"

> "The renderer itself is still in an **experimental state**"

`wgslFn` / `glslFn` という逃げ道はあるが、パーサがバックエンド固定（`GLSLNodeParser`/`WGSLNodeParser`）なので、
**生コードを挿した瞬間クロスバックエンド性を失う**。

→ **three では「WebGL2 + 生GLSL」か「WebGPU + TSL」の二択で、混ぜられない。**

### TSL とは

JS でシェーダーをノードグラフとして組む DSL。`three/tsl` から import。

```js
import { uv, vec4, sin, time, Fn } from 'three/tsl'
const mat = new MeshBasicNodeMaterial()
mat.colorNode = Fn(() => vec4(uv().mul(sin(time)).fract(), 0, 1))()
```

利点:
- 1ソースから GLSL と WGSL の両方を生成（`GLSLNodeBuilder` / `WGSLNodeBuilder`）
- `ShaderMaterial` と違い**部分上書きができる**（`MeshStandardNodeMaterial` の `colorNode` だけ差し替えて PBR と影は残す）。`onBeforeCompile` の文字列 `.replace()` の構造化された正式版
- compute も同じ語彙で書ける
- ただの JS なので合成・import できる

サイズ: `three.tsl.min.js` 単体は 6.6 KB gzip（薄い）。重いのは同梱される `three/webgpu`（185 KB）。

### Babylon 側【決定】

- **WGSL を直接書ける。** GLSL を1セット書いて両対応も可能だが、実行時に **2.6 MB の WASM トランスパイラ**（glslang + twgsl）を落とす代償。
- `MaterialPlugin` は uniform/sampler/define を宣言的に登録して名前付きフックに挿す仕組み。`onBeforeCompile` より明確に堅牢。
- NodeMaterial/NME は `shaderLanguage: WGSL` でネイティブに両方生成（トランスパイラ不要）。
- `CustomMaterial`/`PBRCustomMaterial` は GLSL専用。NME の `CustomBlock` も GLSL専用に見える（ソース確認、実行時未検証）。

### まとめ

**「生のシェーダーテキストを1セット書いて両バックエンドで動かす」ができるのは Babylon だけ。**
three で1ソース両対応をやるなら TSL（＝DSL）に乗るしかない。

---

## 5. フォールバックの実態【決定】— 本調査で最も意外だった点

### three には WebGL 実装が2つあり、バンドルレベルで排他

```
three.module.js   →  WebGLRenderer ✓   WebGPURenderer ✗   WebGLBackend ✗
three.webgpu.js   →  WebGLRenderer ✗   WebGPURenderer ✓   WebGLBackend ✓
```

**TSL に乗った瞬間、2013年から鍛えられた `WebGLRenderer` はバンドルに入らない。**
WebGL2 ユーザーが通るのは `WebGLBackend`（`webgl-fallback/`、11ファイル）という**新しい別実装**。
「three の WebGL は枯れている」という評判は TSL 経路には引き継がれない。

> 補足: r185 の `WebGLRenderer.js` に `_nodesHandler` フックが入っており（`material.isNodeMaterial` の分岐が2箇所）、
> マニュアルが言及していた「WebGLRenderer への限定的な node material サポート」が実装に入り始めている。
> 完成すれば本項の弱点は消えるが、現時点で賭ける対象ではない。

### ただし「小さい＝弱い」は誤り

`webgl-fallback` が `webgl` より小さいのは機能を削っているからではなく、
共有ロジックが `renderers/common/`（475 KB）と `nodes/`（1,088 KB）に上がっているから。
旧 `WebGLShadowMap` / `WebGLLights` / `WebGLMaterials` 相当はそちらにある。
**fallback は劣化版レンダラーではなく、同じレンダラーのデバイス層。**

### 実在した弱点は compute

`WebGLBackend.compute()` はスタブではなく、**transform feedback による本物のエミュレーション**:

```js
state.enable( gl.RASTERIZER_DISCARD );
gl.beginTransformFeedback( gl.POINTS );
gl.drawArrays( gl.POINTS, 0, count );
gl.endTransformFeedback();
dualAttributeData.switchBuffers();   // ダブルバッファで ping-pong
```

ただし transform feedback には共有メモリも atomics も無いのが天井。ソース grep 結果:

| | `GLSLNodeBuilder`（WebGL2） | `WGSLNodeBuilder`（WebGPU） |
|---|---:|---:|
| `atomic` / `barrier` | **0ヒット** | あり |
| `storageTexture` | **0ヒット** | 11ヒット |
| indirect dispatch | **警告して無視**（`warnOnce`） | 対応 |

- ✅ 動く: パーティクル更新、頂点変形、1要素→1要素の写像
- ❌ 動かない: atomics、workgroup barrier、prefix sum、ソート、リダクション、**GPUカリング**

→ **見た目は同一なのに性能プロファイルだけ分岐する。** そしてこれは公式ドキュメントに一切書かれていない。

### three フォールバック vs Babylon WebGL

| | three のフォールバック | Babylon の WebGL |
|---|---|---|
| 位置づけ | `WebGPURenderer` のバックエンドの一つ | **主エンジン**（Playground/Sandbox の既定） |
| 実装の素性 | 新しい再実装（11ファイル） | **2013年からの本体** |
| 枯れ具合 | 実績が浅い | 圧倒的に厚い |
| **compute** | **transform feedback でエミュ、動く** | **存在しない**（`supportComputeShaders` は `WebGPUEngine` にハードコードで `true`） |
| WebGPU専用機能の喪失 | あり | あり（同程度） |

> **three のフォールバックは「動くけど枯れていない」、Babylon の WebGL は「枯れているけど compute が無い」。**

引き分けの部分: Snapshot Rendering も `compatibilityMode=false` も compute カリングも**全部 WebGPU 側にしか無い**。
「WebGL でも同じ速さ」はどちらでも実現しない。構造的問題は共通。

---

## 6. 物理演算 — 差別化要因ではない【決定】

### 検証結果: エンジン選択と直交する

- **`@babylonjs/havok` の依存は `@types/emscripten` のみ。`@babylonjs/core` に依存なし。ライセンスは素の MIT。**
  → **three で普通に使える。**
- 逆に Rapier も Babylon で動く（`rapierphysicsplugin`、またはプラグイン機構を迂回）。
  注意: Babylon は既定で左手系、three と Rapier は右手系 → `scene.useRightHandedSystem = true`。
- **three は公式アドオンとして `RapierPhysics.js` / `JoltPhysics.js` / `AmmoPhysics.js` を同梱**（`examples/jsm/physics/`）。
  むしろ Babylon より多バックエンド。

### サイズ実測（gzip）

| | gzip |
|---|---:|
| Havok（wasm + glue） | **672 KB** |
| Rapier3d（非compat） | 786 KB |
| Rapier3d-**compat**（base64埋め込み） | 1,083 KB ← 避ける |
| Jolt | 877 KB |
| **cannon-es** | **35 KB** |

### 落とし穴【決定】

- **Rapier の既定ビルドは SIMD が入っていない。** wasm の `v128` ローカル数を数えた結果:
  Havok 4,132個 / **Rapier既定 0個** / `@dimforge/rapier3d-simd` 3,486個 / Jolt既定 0個。
  → `@dimforge/rapier3d-simd`（別パッケージ、同日同バージョン更新）を使うこと。
- three 同梱の `RapierPhysics.js` は 2つ問題がある:
  - `setInterval(step, 1000/60)` で **rAF と分離**（描画とズレる、タブスロットル時も回り続ける）
  - `RAPIER_PATH` が **外部CDN固定** かつ古い compat 版にピン留め
  → 自前運用するなら 461行をベンダリングして差し替える。
- Rapier 0.20.0 で **ゼロアロケーション同期が可能**になった:
  `body.translation(mesh.position)` / `body.rotation(mesh.quaternion)` が out-param を取る。
  同梱アドオンは 0.17.3 ピンなので使えない。

---

## 7. GitHub Pages の制約【決定】

- **brotli を返さない。** 自ドメインに `curl -H "Accept-Encoding: br, gzip"` した結果 `Content-Encoding: gzip` 固定。
  → 本書のサイズは全て **gzip 列で読むこと**。
- **カスタムヘッダを設定できない**（[community/discussions/13309](https://github.com/orgs/community/discussions/13309)、2026年時点で open）。
  → COOP/COEP 不可 → SharedArrayBuffer 不可 → **物理のマルチスレッドは選択肢外**。
  回避策の `coi-serviceworker` は初回リロードを強制するので UX 的に本末転倒。

---

## 8. Babylon Lite の扱い【提案】

**現時点では main に載せない。**

- **WebGL フォールバックが設計上存在しない**（"There is no WebGL fallback by design"）
- WebGPU 可用性は MDN BCD ベースで caniuse より悪い。
  Firefox 141 は **Windows のみ部分対応**（Intel Mac ✗ / Linux ✗ / Firefox Android ✗）。MDN 上いまだ "Limited availability — not Baseline"
- 初publish 2026-06-04、2ヶ月半で 1.0→1.21、**後方互換は保証しないと明言**
- 「feature parity は最優先課題」＝まだ揃っていない

→ ポートフォリオの2割弱が真っ白になるリスクは取れない。
**ただし「遊びのビュー1枚を WebGPU 限定で作る」なら 25 KB は他と比較にならない魅力がある。**

---

## 9. 推奨構成【提案】

```
three.js r185
  + WebGLRenderer（WebGL2）
  + ShaderMaterial（生GLSL）
  + InstancedMesh（同一ジオメトリ） / BatchedMesh（異なるジオメトリ）
  + cannon-es（重くなったら @dimforge/rapier3d-simd）
```

総量の比較:

| 構成 | 合計 gzip |
|---|---:|
| **three WebGL + cannon-es** | **165 KB** |
| three WebGL + Havok | 802 KB |
| three WebGPU/TSL + Havok | 905 KB |
| Babylon core + Havok | 918 KB |

理由:

1. **165 KB は他の選択肢の 1/5。** brotli の効かない GitHub Pages では最大の UX レバー
2. WebGL2 は事実上全訪問者で動く。フォールバック分岐を保守しなくてよい
3. 生GLSL で「そこそこ頑張ったシェーダー」を DSL 税なしに書ける
4. `BatchedMesh` が「無数の**別々の**モデル」に効く（Babylon に等価物なし）
5. three の WebGPU は experimental かつ #30560 を抱えており、**今 WebGPU に行くと UX が下がる**

補足: 物理 WASM は非同期ロードなので、**先にシーンを出して物理を後から有効化**すれば初回描画は塞がない。
そこまでやるなら Rapier-SIMD でも初回体感は守れる。

「TSL に乗り換える」は **three の WebGPU が #30560 を解決してからの後払いにできるコスト**。

---

## TBD

| # | 未解決事項 | 備考 |
|---|---|---|
| 1 | **`forceWebGL: true` の `WebGPURenderer` は素の `WebGLRenderer` より遅いのか** | 調査エージェントがセッション上限で到達できず。同一シーンで実測可能 |
| 2 | 「無数のモデル」は**同一ジオメトリの繰り返し**か**別々のモデル**か | 前者なら両エンジン互角、後者なら `BatchedMesh` のある three 有利。**要確認** |
| 3 | 「多少の物理演算」で**シーンの大半が静止するか**、全部動くか | 前者なら Babylon + Snapshot Rendering が桁違いに有利になり、結論が変わりうる。**要確認** |
| 4 | GitHub Pages が大きい `application/wasm` を gzip 圧縮するか | 未検証。デプロイ後に `curl -I` で30秒。**2 MB の振れ幅** |
| 5 | cannon-es（2022年から更新停止）を許容するか | 剛体数百個・凝った関節なしなら実用。要判断 |
| 6 | `@babylonjs/lite` を実験ビュー1枚に使うか | 25 KB は魅力。WebGPU限定・API不安定を許容できる範囲でなら |

---

## 参照

- [three.js manual — WebGPURenderer](https://threejs.org/manual/en/webgpurenderer.html)
- [three.js #30560 — WebGPURenderer UBO performance（open）](https://github.com/mrdoob/three.js/issues/30560)
- [three.js #28776 — BatchedMesh performance（open）](https://github.com/mrdoob/three.js/issues/28776)
- [Babylon.js — Introducing Babylon Lite](https://forum.babylonjs.com/t/introducing-babylon-lite/63648)
- [Babylon.js — WebGPU status](https://doc.babylonjs.com/setup/support/webGPU/webGPUStatus)
- [Babylon.js — Snapshot Rendering](https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUSnapshotRendering)
- [Babylon.js — Material Plugins](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materialPlugins)
- [Babylon.js — Frame Graph v1.0](https://forum.babylonjs.com/t/frame-graph-v1-0-is-now-live/62163)
- [Rapier build config（SIMD feature gate）](https://github.com/dimforge/rapier/blob/master/typescript/builds/prepare_builds/src/main.rs)
- [GitHub community #13309 — custom headers on Pages（open）](https://github.com/orgs/community/discussions/13309)
