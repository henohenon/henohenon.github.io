# techniques/

Claude への inspiration 用 md カタログ。`generate-theme.ts` から **push (concat) で SYSTEM_PROMPT に流して** 表現の幅を広げる。

設計の根拠は [../ai-flow.md](../ai-flow.md)、可能性カタログは [../feature-expansion-ideas.md](../feature-expansion-ideas.md)。

---

## 在中 (実装中・段階的に拡充)

| ID | File | 役割 | 状態 |
|---|---|---|---|
| **D7** | [layout-patterns.md](layout-patterns.md) | レイアウトの型カタログ (Plan-and-Solve 生成の母体) | ✓ MVP |
| **D1** | [backgrounds.md](backgrounds.md) | 背景の手法 | ✓ MVP |
| **D2** | [decorations.md](decorations.md) | 装飾の手法 | ✓ MVP |
| **D4** | [motion.md](motion.md) | 動き (transition / @keyframes / scroll-driven / @starting-style) | ✓ MVP |
| D3 | typography.md | タイポ (F1 フォント curation と一体) | 未 |
| D5 | view-transitions.md | C1 機構実装後 | 未 |
| D6 | cursor-and-microinteractions.md | C2 機構実装後 | 未 |
| D8 | vocaloid-aesthetic.md | Vocaloid 文化の prompt 翻訳 (research から) | 未 |
| D9 | color-application.md | `color-mix` / OKLCH / contrast 等 | 未 |
| D10 | markdown-elements.md | `blockquote` / `pre` / `table` 等のスタイリング | 未 |

---

## 書き方の規約

各 md は以下を満たす:

- **inspire として渡す前提**: Claude が今日の曲に応じて使う / 使わない判断。**強制ではない**
- **CSS-only で書ける手法のみ** (現状の方針、JS は将来 re-visit)
- **形式**: 手法名 + 狙い (何のために使うか) + どんな曲に合うか / 避けるか + CSS のヒント (snippets)
- **AI っぽさを抜く** ことを目的に、引用元 (印刷文化 / 音楽文化 / Web デザインの先行事例) を付ける
- 1 md ~50-200 行を目安に。大きすぎたら分割

---

## 関連

- [../ai-flow.md](../ai-flow.md) — AI 生成パイプライン (これらをどう注入するか)
- [../direction.md](../direction.md) — 北極星
- [../feature-expansion-ideas.md](../feature-expansion-ideas.md) — 拡張可能性カタログ
- [../research/](../research/) — 語彙の母集団 (将来 techniques/ に統合される source)
