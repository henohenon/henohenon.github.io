# 棚卸し記録 (2026-05-25)

> [research/](../research/) の 3 つの「棚卸時の確認ポイント」(input-and-vocadb §6 /
> css-only-boundary §7 / prompt-and-generation §8) を、実装と照合した結果。
> 雑な箇所 / 矛盾 / 改善余地のリスト + 安全度別の修正候補。

---

## 1. 観た対象

- [scripts/generate-theme.ts](../../scripts/generate-theme.ts)
- [src/styles/base.css](../../src/styles/base.css)
- [src/layouts/Base.astro](../../src/layouts/Base.astro)
- [src/components/Footer.astro](../../src/components/Footer.astro)
- [src/components/Header.astro](../../src/components/Header.astro)
- [src/pages/index.astro](../../src/pages/index.astro)
- [src/pages/[slug].astro](../../src/pages/[slug].astro)
- [src/pages/404.astro](../../src/pages/404.astro)

---

## 2. 発見 (カテゴリ別)

### A. SYSTEM_PROMPT と validate / base.css の不整合 ★中

**A-1. validateCss と SYSTEM_PROMPT の必須リストが不一致**

- SYSTEM_PROMPT が要求する必須 CSS 変数: `--color-fg / --color-bg / --color-accent / --spacing-unit / --font-heading / --font-body / --line-height-body / --line-height-heading / --ease-default` (9 個)
- [validateCss](../../scripts/generate-theme.ts) (line 440-452) が検査するのは: `--color-fg / --color-bg / --spacing-unit / --font-body / prefers-reduced-motion` (5 個)
- **`--color-accent` `--font-heading` `--line-height-body` `--line-height-heading` `--ease-default` の検証漏れ**
- Claude が指示通りこれらを出していても、validate がスルーするため、出してなくても気づけない

**A-2. base.css のクラス名が SYSTEM_PROMPT に伝わってない**

- 現状 base.css が定義している: `.brand-mark` / `.icon-link` / `.not-found` / `.not-found-mark` / `.not-found-msg` / `.theme-credit`
- SYSTEM_PROMPT の "自由" 節で言及されているクラス: `.site-header / .site-footer / .post-list / article.post` のみ
- → Claude は `.brand-mark` 等の存在を知らないので装飾できない可能性

### B. SYSTEM_PROMPT の "自由" 節が薄い ★大

[generate-theme.ts:237-243](../../scripts/generate-theme.ts) の「自由に決めてよいこと」が 4 項目のみ:

> - 配色 (曲の雰囲気に合わせて大胆に)
> - フォント選択 (欧文)
> - セレクタを追加してアニメーション・装飾を盛る
> - `.site-header`, `.site-footer`, `.post-list`, `article.post` といったクラスへの色付け

[research/css-only-boundary.md §4](../research/css-only-boundary.md) で整理した「CSS-only で描ける範囲」(レイアウト変化 / `:has()` / `color-mix` / `@property` / `text-wrap` / scrollbar / ::selection / cursor / View Transitions 命名 / ...) は **prompt に伝わっていない**。

→ Claude は知っていれば出せたものを出していない可能性が高い。

### C. SYSTEM_PROMPT の "禁止" 節が薄い ★中

[generate-theme.ts:244-248](../../scripts/generate-theme.ts) の「禁止」は 3 項目のみ:

> - HTML 構造の変更を前提とするセレクタ
> - 外部リソースの `@import`
> - `!important` の濫用

[decisions.md](../decisions.md) の「表現として可能だが採らない」リスト
(動画背景 / 自動再生音 / 大型 hero アニメ / 過剰パララックス / ホイール乗っ取り / localStorage 依存) は **prompt に渡っていない**。

→ Claude がやらなくても今のところ問題にはなっていないが、明示するに越したことはない。

### D. 入力データの解像度 ★中〜大

**D-1. `tag.categoryName` を捨てている**

[generate-theme.ts:197-200](../../scripts/generate-theme.ts) で `tag.name` だけ抽出。
TagSchema (line 61-66) には `categoryName: z.string().nullish()` で持ってるのに使ってない。

→ `Genres` / `Vocalists` / `Subjective` / `Themes` が区別されないまま flat に並ぶ。
[input-and-vocadb.md §2](../research/input-and-vocadb.md) で示した「情報の解像度を下げてる」典型。

**D-2. 歌詞 1 言語のみ**

[pickLyric](../../scripts/generate-theme.ts) (line 187-194) で日 → 英 → 任意1番手だけ。
`Hepburn (ha)` を使うと音韻・リズムまで Claude が読める ([input-and-vocadb.md §2](../research/input-and-vocadb.md))。

**D-3. `publishDate` / `lengthSeconds` 未取得**

[SongDetailSchema](../../scripts/generate-theme.ts) (line 81-83) に含まれていない。
取れば曲の "新しさ" や "テンポ感" の弱いヒントになる ([input-and-vocadb.md §3](../research/input-and-vocadb.md))。

**D-4. 「曲を信じる」の prompt 上の表記**

SYSTEM_PROMPT 冒頭の `(曲名 / アーティスト / 歌詞 + 補助タグ)` の `/` 区切りはタグも対等に見える。
強調 (**曲名と歌詞を主に**) はあるが、入力データ階層の "一次/二次" 構造は文字としては伝わってない。

### E. inspiration 経路の未実装 ★大

`research/` 配下に大量の語彙集 (`color-systems.md` / `typography.md` / `vocaloid-aesthetic.md` ...) が
できたが、generate-theme は **これらを読み込んでいない**。

TODO #3 の **C-α (techniques 注入機構)** が未着手。
SYSTEM_PROMPT 内 (固定文字列) に直接書き足すか、user message に挿入するか、設計判断要。

### F. ステップ表示の不整合 (小) ★低

`main()` の console.log:

- [line 413](../../scripts/generate-theme.ts): `[1/4] fetching song by id=...`
- [line 458](../../scripts/generate-theme.ts): `[2/3] calling Claude...` ← **`/3` だけ古い**
- [line 472](../../scripts/generate-theme.ts): `[3/4] wrote ...`
- [line 474](../../scripts/generate-theme.ts): `[4/4] generating OGP svg (site)...`

→ `[2/3]` を `[2/4]` に直すだけ。

### G. ファイル冒頭コメントの嘘 (小) ★低

[generate-theme.ts:1-8](../../scripts/generate-theme.ts) のヘッダーコメント:

> VocaDB から直近の人気 Vocaloid 曲をランダムに 1 曲選び...

→ 現状はランダムではなく **blacklist + 歌詞優先** ([pickFromPool](../../scripts/generate-theme.ts:138-159))。
コメントが古い。

### H. placeholder 文字列の残置 ★低

- [Base.astro:14](../../src/layouts/Base.astro): `siteDescription = "へのへのんののの部分"` (placeholder)
- [index.astro:11](../../src/pages/index.astro): 本文 `<p>へのへのんののの部分</p>` (placeholder)

→ 本文の決定は人手 (デザイン議論と別)。記録しておくレベル。

### I. backend ログの冗長 (小) ★低

[generateOgSvg](../../scripts/generate-theme.ts:383-397) と [generateThemeCss](../../scripts/generate-theme.ts:399-404) で `console.log("using backend: ...")` がそれぞれ出る。
2 回呼ぶので 2 行ログるが、毎回同じ値。

→ 害ではないが整理可能。

### J. mood ラベルが theme-source.json に保存されていない ★低 (TODO E1)

[main](../../scripts/generate-theme.ts:464-470) で書き出す source オブジェクトに mood なし。
theme.css の先頭コメントには Claude が mood を書いているが、抽出していない。

→ Footer 表示と合わせて TODO E1 マターだが、棚卸として記録。

---

## 3. 改善候補 (安全度別)

### Tier 1: 低リスク即実行 (機能変わらない / 整合性回復)

1. **F**: ステップ表示 `[2/3]` → `[2/4]` に修正
2. **G**: ファイル冒頭コメントの「ランダム」を「blacklist + 歌詞優先」に修正
3. **A-1**: `validateCss` の必須トークンを SYSTEM_PROMPT と一致させる (`--color-accent` 等を追加)

これらは仕様も挙動も変えず、内部整合性だけを直す。1 commit で OK。

### Tier 2: 中リスク (prompt の改善、Claude 出力が変わる可能性)

4. **A-2**: SYSTEM_PROMPT の "自由" 節に `.brand-mark` `.icon-link` `.not-found` の存在を伝える
5. **B**: SYSTEM_PROMPT の "自由" 節を拡充 (modern CSS / scrollbar / ::selection / `:has()` 等を inspire として軽く触れる)
6. **C**: SYSTEM_PROMPT の "禁止" 節に decisions.md の「採らない」リストを追加
7. **D-4**: 「曲を信じる」階層の表現を強化 (例: 「曲名・歌詞は一次情報、タグは二次情報」)

これらは prompt 改修。Claude の出力が変わるので、生成して見てから判断する系。

### Tier 3: 大物 (構造変更 / 機構追加)

8. **D-1**: tag を categoryName でグルーピングして渡す
9. **D-2**: 歌詞を `ja` + `ha` (Hepburn) 等で複数言語渡す
10. **D-3**: `publishDate` / `lengthSeconds` を schema に追加して渡す
11. **E**: inspiration 経路 (research/*.md を prompt に注入する機構) 実装 = TODO C-α
12. **J**: mood ラベルを抽出して theme-source.json + Footer に出す = TODO E1

これらは複数判断が要る。E と J は既に TODO 入り。

---

## 4. ギャップ分析フェーズへの接続

棚卸で見えたのは主に **A-G 内部整合の崩れ** と **B-C-E 情報量不足**。
[research/css-only-boundary.md §8](../research/css-only-boundary.md) で提示された分類:

> 1. 表現案を §4 (CSS-only で描ける) と §5 (機構が要る) に分類
> 2. §4 のうち実際に Claude が出していないものは prompt 側のギャップ
> 3. §5 のうち欲しいものは機構の追加判断

→ 次フェーズ (ギャップ分析) で、research/ の各語彙を「現状 Claude が出せそうか?」で照合し、「prompt のせいで出せない」「機構がないと出せない」を分ける。
そこから補助情報確立フェーズで prompt を厚くする / 機構を増やす判断。

---

## 5. 進め方提案

**Step 1**: Tier 1 (3 つの整合修正) をまず実行 → 1 commit。

**Step 2**: Tier 2 を **prompt diff のレビュー** として議論。一気に書き換える前に方針合意したい。

**Step 3**: Tier 3 は個別に判断。D-1/D-2/D-3 は実装すれば即効果、E と J は TODO 通り。

---

## 6. 関連

- [research/input-and-vocadb.md](../research/input-and-vocadb.md) §6 — 入力側の確認ポイント
- [research/css-only-boundary.md](../research/css-only-boundary.md) §7 — 境界側の確認ポイント
- [research/prompt-and-generation.md](../research/prompt-and-generation.md) §8 — prompt 側の確認ポイント
- [decisions.md](../decisions.md) — 設計判断ログ
- [../TODO.md](../../TODO.md) — 既存 TODO (C-α / E1 等)
