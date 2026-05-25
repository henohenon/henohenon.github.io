# 設計記録

主要な方向性・採否判断と理由のログ。実装の細部 (どう書くか) は [CLAUDE.md](../CLAUDE.md) / [TODO.md](../TODO.md) / git log 側に任せる。

新しい設計判断が出たら上に追記する (新しい順)。

---

## 2026-05-25 「表現として可能だが採らない」リスト

**決定**: 以下は表現として技術的には可能だが、本プロジェクトの精神 (儚さ / 静かで壊れにくい / UX) と噛み合わないため採用しない。

- 動画背景 / 重い canvas / WebGL → 重い、外部依存
- 自動再生される音 → 自動再生ポリシー + UX 阻害
- 大型 hero アニメーション → モバイル重い
- 過剰なパララックス → 酔う
- ホイール乗っ取り → 直感に反する
- localStorage 依存ギミック → 追跡的に見える / 状態管理発生

**理由**: 「壊れにくい」と「儚さ」と「UX 阻害なし」の交点で見送り。将来プロジェクト精神が変われば再考可能。

**How to apply**: `research/expression-references.md` の語彙の棚にはこれらを **載せない** (= 引き出されないようにする)。system prompt の「禁止」節でも近い表現を排除する。

---

## 2026-05-25 表現要素は「詰め込み」ではなく「適切性ファースト」

**決定**: techniques (背景 / 装飾 / モーション / カーソル等) や機構 (View Transitions /
時刻シフト / カーソル bridge / OGP 画像生成等) は **inspiration として提示するが、
必須化しない**。Claude が「今日の曲に適切」と判断した時だけ採用する。

**理由**: 毎日 "全部入り" にするとサイトが濁って "違い" が曖昧になる。静かな曲の日は
装飾もモーションも無くていい。「静けさも表現」が成立するために、オプション群はあくまで
選択肢として保持する。

**How to apply**:

- techniques md は「inspiration として渡す。使っても・使わなくても可」を明記
- system prompt の方針も「足し算ではなく適切性で選べ」に統一
- 機構 (View Transitions / カーソル bridge / 時刻シフト) は常設するが、Claude が CSS で
  使うか使わないかは自由
- 必須なのは「壊れない最低限」(CSS 変数定義 / `prefers-reduced-motion` / WCAG コントラスト等) だけ
- レビュー時「今日は装飾少なめだな」と思っても、それは正解の場合がある

---

## 2026-05-25 表現拡充: 「自由度優先」へ路線変更

**決定**: 「静的アセット + ID 選択」式のカタログから、**技法 md を inspire 用に Claude
に渡す**式に路線変更。Claude は md を参考にしてもいいし、独自で書いてもいい。

**理由**: カタログ式は安定するが Claude のセンスを縛りすぎる。「非決定性は仕様」の
プロジェクト精神とは、自由に書かせて壊れたら fallback、の方が整合する。

**詳細**:

- techniques 系の md (背景 / 装飾 / タイポ / モーション / view transitions) を
  `docs/techniques/` に集めて、generate-theme.ts が prompt に組み込む
- 機構系 (View Transitions / 時刻シフト / `color-mix` dark / 自動 modifier) は別途実装
- **フォントは当面 system stack 維持**。再開時は日本語中心に curation する方針
  (装飾・見出し用の手描き / 表情あるもの)
- レイアウトテンプレ複数化 (`BaseMagazine` 等) は CSS だけで足りないと判明したら復活

---

## 2026-05-25 表現拡充: 静かで壊れにくい方向に絞る

**決定**: 「複雑エフェクト・動的ギミックは避ける」方針で表現の幅を取る。レイアウト変化と
メタ要素 (favicon / ::selection / scrollbar / OGP / 404) と時刻分岐は積極的に。

**理由**: 動的要素はバグ温床 / UX を下げる懸念が大きい。動かないが日替わる、で十分に
"日々の顔" は伝わる。

**詳細**: 個別の採否や表現の語彙は [research/expression-references.md](research/expression-references.md) 参照。
レイアウト変化は「気済むまで」の許可、ただし HTML 構造変えても破綻しない範囲で。

**棚上げ**: ドロップキャップ / 隠しページ — 「ただ置く」のは微妙だが、何か仕掛けがある
なら再検討。

---

## 2026-05-25 OGP: ハイブリッド 2 call + ビルド時ラスタライズ

**決定**:

1. `generate-theme.ts` で 1st call (CSS 生成) → 成功後 2nd call で OGP SVG 生成
2. 2nd call には CSS と曲名・アーティストを渡す (歌詞・タグは省略 = トークン節約)
3. `public/og.svg` を commit、`scripts/build-og.ts` がビルド時に `dist/og.png` にラスタライズ
4. Twitter / FB 等のキャッシュで「同URLでも見える絵は日次で変わる」状態 = 儚さ的に on-brand

**理由**: AI 生成にすれば SVG 構図にも今日らしさが出る。失敗 (構文崩れ等) しても 1st call の
CSS は守られるので独立失敗が可能。PNG を git に commit しない (年 ~50MB の肥大回避)。

**バリデーション**: dimensions / `<script>` / `<foreignObject>` / 外部リソース / font-family
を regex でガード。NG なら前日 og.svg を温存。

---

## 2026-05-25 404 ページ

**決定**: 案 A 「ここには何もない」+ "/" へのリンクのみ。コピーは最小。

**理由**: 儚さ原則と整合。Base レイアウト経由でその日のテーマとフッターの曲名はそのまま
表示されるため、追加で「テーマ反映」を仕込まなくても自動でそうなる。

---

## 2026-05-25 選曲: ブラックリスト方式 + 歌詞優先 + 曲を信じる

**決定**:

- ローリング 30 日ウィンドウから RatingScore 上位 50 曲を pool
- フォールバック順: `fresh+lyrics` → `stale+lyrics` → `fresh-no-lyrics`
- `src/data/used-songs.json` で過去ピック済 ID を管理 (重複避ける)
- LLM へのプロンプトは「曲名 + 歌詞を主、タグは補助」

**理由**:

- 「直近の1曲」だと歌詞未追加のことが多い → 情報量を担保したい
- 重複避けは "毎日違う顔" の体験的価値を守るため
- 曲名・歌詞が一次情報、タグは編集者によるラベルにすぎない

---

## 2026-05-25 「儚さ」を設計の核に

**決定**: 過去テーマの可視化はサイト上では行わない (履歴ページ / カレンダー禁止)。
git history を唯一のアーカイブとする。

**理由**: 「訪れたタイミングの人だけが、その日のデザインを見る」体験を守るため。
履歴ビューを作ると儚さが死ぬ。

**詳細**: project memory [project-ephemerality-principle](
../../../.claude/projects/-Users-kitamuratakeru-Documents-projects-henohenon-github-io/memory/project_ephemerality_principle.md)
にも記録 (AI セッション横断で参照されるため)。

---

## 2026-05-25 ローカル cron 一本化 (脱 API キー / 脱 GHA cron)

**決定**: 日次のテーマ生成は GitHub Actions ではなく、ユーザーのローカル launchd/cron で
回す。CLI バックエンド (`claude -p` = Pro/Max サブスク認証) を本番経路にし、SDK 経路 (API
キー必須) は休眠で残置。GHA は `deploy.yml` (main push → Pages) のみ残す。

**理由**: API 課金を避けたい。サブスクで動く CLI で完結する方が「現状健全」と判断。

**詳細**: [TODO.md](../TODO.md) #1 ローカルスケジュール化、project memory
[project-local-cron-direction](
../../../.claude/projects/-Users-kitamuratakeru-Documents-projects-henohenon-github-io/memory/project_local_cron_direction.md)。
