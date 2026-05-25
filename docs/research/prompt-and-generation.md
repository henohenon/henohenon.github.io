# Claude への渡し方と生成の安定化

> 「Claude にどう書かせるか」自体の研究。`generate-theme.ts` の system prompt 構造 /
> 入力フォーマット / 出力検証 / 失敗時の振る舞いを設計者が点検するための語彙。
> 出力 (デザイン語彙) を厚くしてきた他研究と対になる、**生成手法側** のリサーチ。

---

## 1. 現状の prompt 構造

[scripts/generate-theme.ts](../../scripts/generate-theme.ts) は 2 系統の生成呼び出しを持つ:

### 1.a theme.css 生成 (`SYSTEM_PROMPT`)
3 部構成:
1. **役割定義** — 「ブログ "へのへのんのの" の毎日の見た目を CSS だけで翻訳するデザイナー」
2. **方針** — 「曲名と歌詞を主に。タグは補助」(= "曲を信じる" の prompt 上の現れ)
3. **必ず守ること / 自由に決めてよいこと / 禁止**

### 1.b OGP 生成 (`OG_SYSTEM_PROMPT`)
- 入力: 曲情報 + 生成済みの theme.css
- "theme.css と整合する" 指示で 1st 出力に整合性を寄せる
- 同じ 3 部構成 (必須 / 自由 / 禁止)

### user message
```
# 今日の曲
{name} / {artistString}

## 歌詞 (抜粋)
{lyrics}

## 補助タグ (参考程度)
{tags}
```
明示的に "参考程度" と書くことで階層を伝える ([input-and-vocadb.md](input-and-vocadb.md) §4 と対応)。

---

## 2. 生成 backend の選択

`pickBackend()` の優先順:
1. `THEME_BACKEND=cli|sdk` の明示指定があればそれ
2. なければ `ANTHROPIC_API_KEY` 有 → SDK / 無 → CLI

実運用は **CLI 経路** (Pro/Max サブスク認証を流用、API 課金を避ける、[decisions.md](../decisions.md) 「ローカル cron 一本化」)。

### CLI 経路 (`callClaudeCli`) の特性
- 子プロセス `claude --print` をスポーン
- `cwd: tmpdir()` で **プロジェクトの CLAUDE.md を auto-discovery させない**
- `--disallowed-tools` で `Bash,Edit,Write,Read,WebFetch,WebSearch,Agent,TodoWrite,NotebookEdit` を全部塞ぐ (= 純粋にテキスト生成のみ)
- stderr は `inherit`、stdout を受ける

### SDK 経路 (`callClaudeSdk`) の特性
- `system` を `cache_control: ephemeral` で送る (= prompt cache 活用)
- `max_tokens: 4096`
- `MODEL = "claude-sonnet-4-6"`

---

## 3. 出力の sanitize / validate

### sanitize (緩い)
- code fence (` ```css ` / ` ```svg `) を剥がす
- 前後 trim

### validate (失敗時 throw)
- **CSS**: `--color-fg` / `--color-bg` / `--spacing-unit` / `--font-body` / `prefers-reduced-motion` の **トークン存在検査**
- **OGP SVG**: dimensions / `<script>` 禁止 / `<foreignObject>` 禁止 / 外部 href / `font-family` ホワイトリスト (`serif` / `sans-serif` / `monospace`)

### 失敗時の振る舞い
- 1st (CSS) 失敗 → process exit 1、**既存 theme.css を温存** (前日のテーマが残る)
- 2nd (OGP) 失敗 → console.error で警告、**前日の og.svg を温存** (= 独立失敗)

「壊れたら fallback」の方針 ([decisions.md](../decisions.md) 「OGP: ハイブリッド」) が実装に反映されている。

---

## 4. 一般的な prompt engineering 慣習との対比

外部慣習を本プロジェクトと照合:

| 慣習 | 一般推奨 | 本プロジェクトの状況 |
|---|---|---|
| **役割定義** (system に persona) | 推奨 | あり ("デザイナー") |
| **必須/自由/禁止 の三分** | 推奨 (Microsoft, Anthropic ガイド) | あり |
| **入出力例 (few-shot)** | 表現の幅が広い場合は逆効果 | なし (意図的: Claude のセンスを縛らない) |
| **構造化 (XML/JSON tags)** | 長い prompt で推奨 | なし。markdown heading で代用 |
| **chain-of-thought / 思考の場** | 推奨 (難しい変換) | なし (Claude が内部でやる前提) |
| **temperature 制御** | 創造性タスクで高め | SDK は無指定 (= デフォルト) |
| **prompt cache** | system 再利用なら推奨 | SDK 側で実装済 (`ephemeral`) |
| **出力 schema 強制** (JSON mode / tool use) | 厳密形式が要るなら | なし。テキスト出力 + regex 検証 |

### 含意
本プロジェクトの prompt は「**緩く渡して、出力を validate で守る**」型。逆に「**厳密に縛って事故を防ぐ**」型 (JSON mode / few-shot / 思考の場) は採っていない。これは適切性ファースト原則 ([decisions.md](../decisions.md)) と整合 — 縛ると Claude のセンスを潰す。

---

## 5. "曲を信じる" の prompt 上の再現性

[input-and-vocadb.md](input-and-vocadb.md) §4 で示した一次/二次の階層を、prompt は次の表現で Claude に伝える:

1. **方針節**: 「曲名と歌詞を主に読み取ること。タグはあくまで補助情報」
2. **user message の見出し**: `## 補助タグ (参考程度)`
3. **歌詞優先のフォールバック**: pickFromPool が `fresh+lyrics` > `stale+lyrics` を確保

### 失敗パターン (Claude が崩しやすい部分)
過去の生成を見ての観察ベース、確証ではないが要注意:
- 強いキャラ色のタグ (`Hatsune Miku`) があると **曲調より先にキャラ色** に寄りがち
- ジャンルタグの数が多いと **複数ジャンルを混ぜたチグハグなテーマ** になる
- 歌詞が短いと **タグ依存度が上がる** (情報密度の差)

これらは「タグの解像度を上げて渡す」(input-and-vocadb.md §2) との緊張点。

---

## 6. 安定化の引き出し (将来必要になったら)

### prompt 側
- **役割定義の強化** — "デザイナー" だけでなく、参照する慣習 (Bauhaus / Swiss など) を明示することで判断軸を共有
- **DESIGN.md 形式の出力強制** ([design-doc-conventions.md](design-doc-conventions.md)) — YAML + markdown の二段にすると Claude の思考の場が増える
- **inspiration の追加渡し** ([decisions.md](../decisions.md) 「自由度優先」) — `docs/techniques/*.md` を user message に組み込み
- **反例の明示** — "Helvetica は避ける" のような Don't を具体化すると効きやすい

### 検証側
- **WCAG コントラスト自動計算** — 現状は regex で token 検査のみ。CSS パース + 色比較は重いが効く
- **CSS 構文 validation** — `csstree` 等で AST 化して投げる選択肢
- **テスト生成** — N 回呼んで揺れの幅を測る (= 非決定性は仕様だが、その範囲は知っておきたい)

### 失敗の冗長化
- 1st call で CSS が validate を抜けたが妙な時の **再生成 retry**
- 「3 回ダメなら昨日を温存」のような fallback (現状は 1 回失敗で即昨日)

---

## 7. SDK 経路ならではの拡張余地 (休眠中)

`callClaudeSdk` は現状 message 1 つだけ送るが、SDK ならではの機能:
- **prompt cache** — system 共通で 90% 引き
- **tool use** — Claude に validate を「自分でやらせる」設計
- **streaming** — 段階的に出力を見て中断判断
- **batch API** — 1 日 1 回なので不要だが将来の N 回呼びには効く

CLI 経路では使えない (claude -p の枠内のみ)。

---

## 8. 棚卸時の確認ポイント

- system prompt の "必須 / 自由 / 禁止" が現状の実態と乖離していないか (例: base.css のクラス名は禁止/必須に書かれていない)
- 「曲を信じる」原則が文言として弱まっていないか
- validate の token 検査が新しい変数追加に追従しているか
- CLI 経路で CLAUDE.md auto-discovery が漏れていないか (`cwd: tmpdir()` の維持)
- inspiration として渡せる外部 md (techniques 系) の経路が用意できているか

---

## 9. 関連

- [scripts/generate-theme.ts](../../scripts/generate-theme.ts) — 実装本体
- [input-and-vocadb.md](input-and-vocadb.md) — prompt に流す入力データ側
- [css-only-boundary.md](css-only-boundary.md) — Claude に期待できる出力範囲
- [design-doc-conventions.md](design-doc-conventions.md) — 構造化フォーマット (DESIGN.md) の検討
- [../CLAUDE.md](../../CLAUDE.md) — 「generate-theme のバックエンド」節

---

## Sources

- [Anthropic — Build with Claude / Prompt engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [OpenAI — Prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering) (一般慣習として)
- [Microsoft — Prompt engineering techniques](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/advanced-prompt-engineering)
- [Claude Code CLI — `claude --print` / `--disallowed-tools`](https://docs.anthropic.com/en/docs/claude-code/cli-reference)
