# AI 生成フロー設計

毎日のテーマ生成パイプラインの設計と根拠。
方針は [direction.md](direction.md) (Identity = HTML 骨格、Dress = CSS Mode 3)、可能性カタログは [feature-expansion-ideas.md](feature-expansion-ideas.md)。

設計の根拠となるリサーチは [log/journey-2026-05-29.md](log/journey-2026-05-29.md) (Anthropic 公式 / 学術論文の調査結果) を参照。

---

## 全体像

```
=== Daily main flow (cron で回す) ===

scripts/generate-theme.ts
  [0] 曲選定 (現状維持)
  [1] theme.css 生成 (push + Plan-and-Solve、concept を CSS 冒頭コメントに embedded)
  [2] og.svg 生成
  [3] og.article-template.svg 生成

scripts/build-favicon.ts (predev / prebuild フック)
  [4] favicon.svg (theme.css 抽出ロジック、Claude 不介在)

=== On-demand (将来、必要時に手で or 別 cron) ===

scripts/reflect.ts (将来)        # wishlist 生成
scripts/research-*.ts (将来)     # techniques selection / 評価 / etc.
```

LLM call は daily で **3 個** (theme / og / article)。

---

## 各 step 詳細

### Step 0: 曲選定

[scripts/generate-theme.ts](../scripts/generate-theme.ts) 内で実装済 (現状維持)。

- VocaDB から直近 30 日 RatingScore 上位 50 曲 fetch
- fallback tier: `fresh+lyrics` → `stale+lyrics` → `fresh-no-lyrics`
- `used-songs.json` で過去ピック blacklist

### Step 1: theme.css 生成 (Plan-and-Solve)

**プロンプト構造:**
- System Prompt = 共通 preamble + theme.css 用指示 + `techniques/*.md` (concat) + decision tree
- User Message = 曲情報 (name, artist, lyrics, tags)

**Plan-and-Solve 形式の指示** (SYSTEM_PROMPT 内):

> ファイル冒頭の CSS コメントとして、以下を 50-100 字程度で宣言してください:
> - 今日の color palette の方針
> - typography の方向性
> - mood / atmosphere
> - (もし concept がいずれかの layout-pattern に合致するなら、その pattern 名を併記)
>
> その下に theme.css の中身を書いてください。

→ concept は theme.css の **冒頭 CSS コメント**に embedded。別 file / 別 call は持たない。
→ og.svg / article-template はこの theme.css を user message で受け取るので、自然に concept を引き継ぐ。

**失敗 fallback:** throw → 以降 skip、前日 theme.css 温存。

### Step 2: og.svg 生成

**プロンプト構造:**
- System Prompt = 共通 preamble + og.svg 用指示 + 関連 techniques (layout/decoration 系)
- User Message = 曲 + 生成済 theme.css (concept コメント含む)

**失敗 fallback:** catch、前日 og.svg 温存。

### Step 3: og.article-template.svg 生成

**プロンプト構造:**
- System Prompt = 共通 preamble + article-template 用指示 + 関連 techniques (layout/typography 系)
- User Message = 曲 + theme.css

**失敗 fallback:** catch、前日 article-template 温存。

### Step 4: favicon.svg

[scripts/build-favicon.ts](../scripts/build-favicon.ts) で実装済。
Claude 介在なし、`assets/favicon.template.svg` の `{{BG}}` `{{FG}}` を theme.css の `--color-bg` `--color-accent` で substitute して `public/favicon.svg` に出力。

---

## 設計の核 (根拠付き)

### 1. Push 一択 (techniques 全部 concat)

**根拠:** Anthropic 公式が「lightweight task では tool round trip overhead が work を超える」と明言 ([Tool use docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works))。
1 日 1 回・10-20 md の scale では push (prompt caching 併用) が最適。

→ techniques/*.md は全部 concat して system prompt に入れる。
→ Claude が自分で md を読みに行く形 (pull / tool-use) は **将来 md が 20+ に増えた時の保険** として記録のみ。

### 2. Concept-first は Plan-and-Solve 形式 (同一 call)

**根拠:**
- 別 call にすると coherence の保証が弱まる、call 数も増える
- Plan-and-Solve ([Wang et al. ACL 2023](https://arxiv.org/abs/2305.04091)) が「同一 call 内で plan を書かせて続けて実装」の canonical 形
- creative single-shot task では同一 call が安全

→ concept = theme.css の冒頭 CSS コメント。下流 step は theme.css を読むだけで自然に concept 引き継ぎ。

(旧 P1「別 call concept-first」案は廃止、Plan-and-Solve 同一 call に置換)

### 3. Reflection / wishlist は別 script、on-demand

**根拠:**
- Self-correction は external feedback 無しだと逆効果リスク ([Kamoi TACL 2024](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00713/125177/), [Huang ICLR 2024](https://arxiv.org/abs/2310.01798))
- daily で必須にする ROI が見えない
- 別 script に切り離せば main flow を汚さず実験可能

→ `scripts/reflect.ts` は将来実装、必要時に手動 or 別 cron で回す。

### 4. Prompt caching の境界

| 層 | cache | 内容 |
|---|---|---|
| 共通 preamble | ✓ | 全 step 共通の「サイト精神 / Identity-Dress / 守ること」 |
| step specialized | ✓ | theme.css 用 / og.svg 用 / article 用の固定部分 |
| techniques inject | ✓ | 日内ほぼ不変 |
| decision tree | ✓ | theme.css 生成時のみ、固定文 |
| user message (曲 + theme.css 等) | × | 毎日変動 |

SDK 経路: `cache_control: { type: 'ephemeral' }` を applicable に。
CLI 経路: 素通り (CLI 側の暗黙 caching に任せる)。

### 5. 失敗 cascade (最小限)

| Step | Fail 時 |
|---|---|
| 0 曲選定 | throw、abort (前日まま、何も書き換わらない) |
| 1 theme.css | throw → 以降 skip、前日 theme.css 温存 |
| 2 og.svg | catch、前日 og.svg 温存、Step 3 は続行 |
| 3 article-template | catch、前日 article-template 温存 |
| 4 favicon | logic、theme.css あれば必ず動く |

→ 各 step は独立 fail OK、cascade は最小限。

---

## techniques inject の構造

### System prompt の体裁 (各 step 共通)

```
[共通 preamble (Identity / Dress / 公序良俗 / 守ること)]
   ↓ cache 効かせる
[step specialized (theme.css 用 / og.svg 用 / article 用)]
   ↓ step ごとに固定
[techniques/*.md (concat、relevant な md)]
   ↓ daily 不変、cache 効く
[decision tree の指示 (theme.css 生成時のみ)]
```

### techniques の filter (step 別)

| Step | 流す techniques (将来想定) |
|---|---|
| theme.css | backgrounds / decorations / typography / motion / layout-patterns / vocaloid-aesthetic / color-application |
| og.svg | layout-patterns / decorations / svg-iconography |
| article-template | layout-patterns / typography / svg-iconography |
| favicon | なし (logic) |

→ **MVP では filter せず全 md を全 step に push**、最適化後検討。

### Decision tree (theme.css 生成のみ)

SYSTEM_PROMPT に 3-4 行で:

> 今日の concept (上記で書いた冒頭コメント) が `layout-patterns.md` のいずれかに合致するなら、そのパターンを base に書いてください。部分一致なら拡張・改変、合致しないなら自由に書いてください。

---

## 将来の拡張ポイント (実装は後)

### Phase 2: techniques selection を subagent + plan mode で分離

(md が 15-20 個 超え or 質が plateau したら)

- `generate-theme.ts` の前に Claude SDK で subagent 起動
- plan mode (read-only tool) で「今日の曲・concept」から関連 techniques を N 個選ぶ
- 親 generate-theme は subagent の結果 (md 名 list + 短い rationale) を受け取り、それだけ push

Anthropic 公式の hybrid push/pull canonical example (CLAUDE.md + Glob/Grep/Read) と整合。

### Phase 3: extended thinking 有効化

(SDK で extended thinking が安定したら)
- theme.css 生成に extended thinking on
- 思考過程を log、生成質を観察

### Phase 4: vision / Files API

(必要が見えてきたら)
- VocaDB のアルバムアート (取れれば) を Claude に画像で渡す
- techniques を Files API で pre-upload、token 節約

### Phase 5: on-demand 調査 scripts

- `scripts/reflect.ts` — wishlist 生成
- `scripts/eval.ts` — 過去テーマ評価 (儚さ的に微妙、自分用)
- その他思いついたもの

---

## 実装順序 (この doc の後)

1. **この設計を `direction.md` / `feature-expansion-ideas.md` に反映**
   - P1 を「同一 call で Plan-and-Solve」に書き換え
   - C-α (techniques inject 機構) の方針更新 (filter は MVP では無し)
2. **C7+ base.css 削減** — concept-driven layout を Claude が書ける土台
3. **`techniques/*.md` の MVP** — 最低限 `layout-patterns.md` + 1-2 個を書く
4. **`generate-theme.ts` を Plan-and-Solve 形式に書き換え** — SYSTEM_PROMPT 更新、techniques inject、prompt caching
5. **C1 view-transition / C2 cursor bridge / C3 時刻シフト** — 任意の順で
6. **(将来) reflection / wishlist / subagent 等**

---

## 関連

- [direction.md](direction.md) — 北極星
- [decisions.md](decisions.md) — 個別判断
- [feature-expansion-ideas.md](feature-expansion-ideas.md) — 拡張可能性カタログ
- [log/journey-2026-05-29.md](log/journey-2026-05-29.md) — このセッションの議論経緯 + リサーチ結果のソース
- [research/prompt-and-generation.md](research/prompt-and-generation.md) — prompt 設計の語彙
- [../scripts/generate-theme.ts](../scripts/generate-theme.ts) — 現在の実装
- [../scripts/build-favicon.ts](../scripts/build-favicon.ts) — favicon 生成 (Step 4)
