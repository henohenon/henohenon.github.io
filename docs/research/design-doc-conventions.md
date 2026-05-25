# 設計ドキュメント慣習リサーチ (2026-05-25)

> 「Claude に何を、どう書いて渡すか」を整えるための外部慣習調査。
> このプロジェクトの prompt / theme.css 規約 / decisions.md / catalog の
> 構造を考え直すときの参照軸。

---

## 1. DESIGN.md (Google Labs 2026 規格) ★最有力候補

**最も直接刺さる発見**。今年 (2026) ベースで普及中の、AI コーディングエージェント
向けの設計ドキュメント仕様。

### 概要
- Google Labs が公開した規格 ([google-labs-code/design.md](https://github.com/google-labs-code/design.md))
- ビジュアル・アイデンティティを **YAML (トークン) + Markdown (根拠)** の二段で記述
- AI エージェントがそのまま読んで一貫した UI を生成できる
- Figma エクスポートも JSON スキーマも不要、プレーンな .md 1 枚

### 構造
**YAML frontmatter** (機械可読):
```yaml
version: alpha
name: [Design System Name]
description: [optional]
colors:
  primary: "#1A1C1E"
  tertiary: "#B8422E"
typography:
  h1: { fontFamily: Public Sans, fontSize: 48px, fontWeight: 600, lineHeight: 1.1 }
  body-md: { ... }
rounded:
  sm: 4px
spacing:
  md: 16
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
```

**Markdown 本文** (人 / AI 両用、順序固定の `##` headings):
1. Overview — ブランド人格 / 感情的意図
2. Colors — パレットと意味役割
3. Typography — フォント戦略
4. Layout — グリッドモデル / spacing 哲学
5. Elevation & Depth
6. Shapes (角丸戦略)
7. Components (ボタン / 入力等)
8. Do's and Don'ts (実用的ガードレール)

### トークン参照記法
`{colors.primary}` / `{typography.body-md}` の curly-brace 参照。
Figma 変数 / Tailwind / tokens.json への自動変換が想定されてる。

### 採用事例 (awesome-design-md)
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) に
73 サイトの DESIGN.md が集まってる:

- AI/LLM 系 (Claude, OpenAI, Mistral)
- 開発者ツール (Cursor, Vercel, Linear, Notion, Figma)
- 大規模 SaaS / 消費者ブランド (Stripe, Apple, Spotify, Tesla, ...)

2026 年の GitHub で最速級に成長したリポジトリの一つ。

### このプロジェクトへの示唆

**現状の `theme.css` + system prompt は、実質 DESIGN.md と等価のことをやろうとしてる**。
形式を採用する価値は大いにある。ただし重要な転換点:

- 通常の DESIGN.md は **1 つの固定アイデンティティ** を記述する
- 本プロジェクトは **毎日違うアイデンティティ** を生成する
- → 構造を借りつつ、**Claude が「今日の DESIGN.md」を生成して、それから theme.css を導出する** モデルが考えられる

可能なフロー案:
```
generate-theme.ts
  1. 曲データを user message として Claude に渡す
  2. Claude が DESIGN.md (YAML + markdown) を出力
  3. 後段のスクリプトが YAML を読んで theme.css に変換
     (もしくは Claude に DESIGN.md → CSS の翻訳までさせる 2nd call)
  4. theme-source.json には DESIGN.md の Overview 段落の要点 (mood) も保存
```

利点:
- 表現の "言語" が構造化される (Claude が「何を考えたか」が読める)
- Footer 表示の "mood ラベル" が DESIGN.md の Overview から自然に出る
- 後でデザイン軸を追加するときの拡張点が明確 (YAML スキーマに追記すれば良い)

欠点 / 懸念:
- 工程が増える (Claude 呼び出し増 + 変換ステップ)
- DESIGN.md スキーマに縛られると Claude の創造性を抑制する可能性 (本プロジェクトの "自由度は正義" と衝突)
- → ただし「YAML は緩く、markdown 部分でフリースタイル」とすれば調整可能

---

## 2. ADR (Architecture Decision Records)

### 概要
- 重要なアーキテクチャ判断とその根拠を append-only に残す慣習
- 1 decision = 1 ファイル
- ステータス (Proposed / Accepted / Superseded) で追跡

### 典型構造 (MADR)
```
# (短い意思決定タイトル)
## Status (Proposed / Accepted / Deprecated / Superseded by ADR-XXX)
## Context (何が問題で、なぜ決める必要があったか)
## Decision (何を決めたか)
## Consequences (結果として何が起こる / 何を諦める)
## Alternatives Considered (検討した他の選択肢、pros/cons)
```

### このプロジェクトでは
- 既に `docs/decisions.md` が ADR 的役割
- 厳密な MADR 形式までは要らないが、書き方の規律は参考になる:
  - **Alternatives Considered** を書く癖 (= 「私の保険的思考」を客観視できる)
  - **Consequences** を書く癖 (= 機構導入で何が制約されるか自覚)
  - append-only (= 過去の判断を編集しない、新エントリで上書き)

---

## 3. CSS Custom Properties = Design Tokens (現代の正解)

### 推奨される多層構造

```css
:root {
  /* Layer 1: global primitives (raw values) */
  --color-blue-600: #0052CC;
  --color-blue-700: #003F9E;

  /* Layer 2: semantic mappings (purpose) */
  --color-interactive: var(--color-blue-600);
  --color-interactive-hover: var(--color-blue-700);

  /* Layer 3: component tokens (scoped use) */
  --button-bg: var(--color-interactive);
  --button-bg-hover: var(--color-interactive-hover);
}
```

### 本プロジェクトとの対比

現状の `theme.css` は:
```css
:root {
  --color-bg: #f4ead3;
  --color-fg: #1c2a4a;
  --color-accent: #c8324a;
  /* ... */
}
```

これは Layer 2 (semantic) 相当に直接値が入ってる。primitive 層がない。

**分離した方が良いケース**:
- Claude が「色を選ぶ → 意味を割当てる」の段階分けで思考できる
- 後付け modifier (時刻 dim, 曲調 dark, etc.) を仕込みやすい
- 似た色の派生がしやすい (`color-mix(in oklch, var(--color-primary), black 30%)` 等)

**分離しなくて良いケース**:
- 現状の単純さは美徳。primitive 層を増やすと Claude が書く量も増える
- daily に総入れ替えなので Layer 1 を別に持つ意味は薄い (再利用しない)
- → 結論: 当面は今のまま single-layer で OK。必要になったら導入

### runtime 切替の活用 (将来)
CSS 変数は runtime で更新可能 (Sass 変数と違う)。JS から `:root.style.setProperty(...)`
で動的に書ける = 時刻分岐や A/B 等の機構と相性良い (機構を入れる場合)。

---

## 4. その他 (補足)

### Storybook / Living Style Guide
コンポーネント単位のドキュメント。本プロジェクトはコンポーネントが少ない (Header / Footer
くらい) ので過剰。

### arc42
アーキテクチャドキュメント全体の構成テンプレ。9 セクションある。本プロジェクトの規模では大袈裟。

---

## 5. このプロジェクトへの全体的示唆

| 慣習 | 推奨 | 理由 |
|---|---|---|
| **DESIGN.md** | **検討強く推奨** | AI 向けに最適化された規格、本プロジェクトの目的と直結。日替わり版に翻案する形で導入可能 |
| **ADR (MADR)** | 部分採用 | `decisions.md` の書き方の規律として参照。Alternatives + Consequences を意識する |
| **CSS 多層トークン** | 当面見送り | 単純さは美徳。Claude の出力が複雑化すると trade-off になる |
| **Storybook 系** | 不要 | 規模感が合わない |

---

## 6. 直近で踏み込めるアクション

棚卸フェーズ (次の工程) で:

1. **system prompt と theme.css 規約を DESIGN.md 形式に近づけられるか検討**
   - 現状: 散文で書かれた prompt → 構造化すべきか?
   - 副次的に Claude の出力安定性も上がる可能性

2. **`decisions.md` に Alternatives 欄を追加するか検討**
   - 今の各エントリにも「他に何を考えてどう却下したか」を残せると将来役立つ

3. **CSS 変数の整理は急がない**
   - 単層を維持。「Claude が書きやすく、人間が読める」が優先

---

## Sources

- [DESIGN.md spec — google-labs-code](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)
- [DESIGN.md repository — google-labs-code](https://github.com/google-labs-code/design.md)
- [What is DESIGN.md? Google's Open-Source Format — designmd.app](https://designmd.app/what-is-design-md/)
- [DESIGN.md: The Markdown File That Became GitHub's Fastest Design Standard — OSS Insight](https://ossinsight.io/blog/design-md-protocol-2026)
- [awesome-design-md — VoltAgent](https://github.com/VoltAgent/awesome-design-md)
- [Architectural Decision Records (ADRs)](https://adr.github.io/)
- [MADR — Markdown Architectural Decision Records](https://adr.github.io/madr/)
- [bliki: Architecture Decision Record — Martin Fowler](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html)
- [Custom properties (--*): CSS variables — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/--*)
- [CSS Variables Guide: Design Tokens & Theming — FrontendTools](https://www.frontendtools.tech/blog/css-variables-guide-design-tokens-theming-2025)
- [The developer's guide to design tokens and CSS variables — Penpot](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
