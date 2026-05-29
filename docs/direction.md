# 方向性

このプロジェクトでこれから取り組むことの目的と基本方針。
個別の採否判断は [decisions.md](decisions.md)、現状タスクは [../TODO.md](../TODO.md)、拡張可能性のカタログは [feature-expansion-ideas.md](feature-expansion-ideas.md)。

---

## 目的

**機能拡張 — できることを増やす。**

その日の曲ごとに見た目が豊かに変わる体験を、サイトの精神 (静かで壊れにくい / 儚さ / 非決定性は仕様) を保ったまま、表現の幅を底上げする。

「これを描く」「これは描かない」と前もって決めるのではなく、**Claude が自由に判断できる土台を整える**。

---

## 基本方針 (3 本柱)

### 1. 制限を「決める」のではなく、できることを増やす

- 「自由節 / 禁止節」のような書き方は採らない。Claude のデザイン選択を前もって枠にはめない。
- 「描けないことを生んでいる箇所」(規約の穴 / 入力データの薄さ / 構造的依存) は**外す方向**に動く。
- 唯一のハードな線は **公序良俗** — それ以外は基本自由。
- 技術的な「守ること」(CSS 変数定義 / `prefers-reduced-motion` / WCAG / 外部リソース不可 等) は美的制約ではなく**構造的前提**として最小限に保つ。

### 2. 補助テキストで「質が高く / AI っぽくない」デザインを引き出す

- 制限ではなく **補助** で質を上げる。
- 表現の語彙・参照・事例を Claude に渡す。母集団は [research/](research/)。
- 入れ口: SYSTEM_PROMPT / [techniques/](techniques/) (未整備) / user message。
- 失敗時 fallback (前日ファイル温存) は維持 — 自由生成と壊れにくさは両立。

### 3. デザイン的選択肢を提示・補助する

- 技法・パターンの md (`techniques/`、未整備) を **inspire として渡す**。
- 採否は Claude が今日の曲との適切性で判断 — **適切性ファースト**。
- 静かな曲の日は装飾も動きも無くていい (詰め込みではなく余白)。
- 技法 md は強制ではなくレファレンス、Claude が独自に書いてもよい。

---

## 前提 (制限ではなく、サイトを支える事実)

- **儚さ** — 過去テーマを履歴ページ等でサイト上に出さない (git だけが唯一のアーカイブ)
- **非決定性は仕様** — 壊れない枠より、壊れたら fallback で十分
- **公序良俗** — 唯一のハード制限
- **Identity と Dress の分離** — Claude が触れる範囲の境界:
  - **HTML 骨格 (Astro)** = Identity = Claude 不可侵 (サイトの "戻る場所感" の源泉)
  - **CSS (theme.css)** = Dress = Mode 3 全自由 (毎日の表現)
  - **JS** = 当面禁止 (壊れにくさ・状態管理回避)。ただし限定的な静的 bridge (例: `--mx --my` カーソル / `--tod` 時刻) は適切性で判断。`fetch` 系は引き続き除外
  - **Astro components** = Identity の一部、不可侵

---

## 現在地 (2026-05-29 時点)

**表現拡充の全体方針はここから最終決定する段階。**
[feature-expansion-ideas.md](feature-expansion-ideas.md) のカタログを材料に、棚上げから下ろした項目 (純 CSS 装飾、JS 制限の限定 re-visit 等) も含めて、何をどう乗せていくかを順次詰めていく。

進捗の大枠:
- **実装済**: OGP テーマ追従 / favicon テーマ追従 / docs 整備
- **方針確定 / 実装未**: C1 view-transition / C2 cursor bridge / C3 時刻シフト / C7+ base.css 削減 / P1 concept-first
- **これから決める**: 表現拡充の全体方針、AI フロー設計、HTML 構造化テンプレ化、棚上げ復活分の具体運用
- **継続**: techniques/ 母体整備 (D 群)
- **最後**: ローカル cron 自動化

---

## 関連

- [decisions.md](decisions.md) — 個別判断のログ
- [feature-expansion-ideas.md](feature-expansion-ideas.md) — 拡張可能性カタログ
- [ai-flow.md](ai-flow.md) — AI 生成パイプラインの設計
- [research/](research/) — 語彙の母集団
- [log/](log/) — 過去スナップショット (セッション記録 / 棚卸し記録 / journey)
- [../TODO.md](../TODO.md) — 着手中・保留タスク
- [../CLAUDE.md](../CLAUDE.md) — AI 向け運用規約
