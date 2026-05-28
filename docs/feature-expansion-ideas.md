# 機能拡張アイデア一覧

[direction.md](direction.md) の方針 (「制限を決めるのではなく、できることを増やす」) に基づく実装候補のカタログ。

**現状: 表現拡充の全体方針はここから最終決定する段階**。棚上げから下ろした項目を含め、何をどう乗せるかを順次詰めていく材料置き場。

スケジュール化されたタスクは [../TODO.md](../TODO.md)。
[research/](research/) / [log/inventory-2026-05-25.md](log/inventory-2026-05-25.md) で挙がった候補も統合済。

---

## 進める順序 (大局)

1. **AI フロー全体図の docs/ 書き出し** ★ ここから
2. **C 群 (土台拡張) のうち未実装の機構** — C1 / C2 / C3 / C7+
3. **layout-patterns.md MVP (5-7 個 コンセプト形式)** — レイアウト hybrid の母体
4. **P1 concept-first 生成 + decision tree** — generate-theme.ts に組み込み
5. **C-α 注入機構** — techniques/*.md を prompt に流す
6. **D 群 (techniques/) 拡充** — 継続
7. **F1 フォント curation** (規模大、別 phase)
8. **棚上げ残務 (A-2 / D-4 / SYSTEM_PROMPT 自由・禁止節撃退)** — 機会見つけて
9. **E5 ローカル cron** — 拡張ひと段落後

---

## 線引き: Identity vs Dress

direction.md の "Identity と Dress の分離" を実装視点で:

| 層 | 自由度 | 性質 |
|---|---|---|
| HTML 骨格 (Astro) | 不可侵 | Site Identity (header / brand / SNS / footer / 記事構造) |
| CSS (theme.css) | Mode 3 全自由 | Dress、宣言的、壊れても見た目だけ |
| JS | 当面禁止 | `--mx --my` / `--tod` の静的 bridge は OK、fetch 系は除く |
| Astro components | 不可侵 | Identity の一部 |

---

## C. 土台拡張

Claude が theme.css で書ける表現の幅を広げる常設機構。

| ID | 内容 | 状態 |
|---|---|---|
| **C1** | `@view-transition { navigation: auto; }` (SSG 維持、ClientRouter 入れない) | ✓ 方針確定 / 実装未 |
| **C2** | カーソル位置 CSS 変数 bridge (`--mx` / `--my`、rAF throttle、px、touch 非対応) | ✓ 方針確定 / 実装未 |
| **C3** | 時刻シフト (`--tod` 0-1 連続 JST + `data-tod` 5 段、深夜帯 `late-night` 含む) | ✓ 方針確定 / 実装未 |
| ~~C4~~ | dim modifier | ✗ 廃止 (mood 撤回連動) |
| ~~C5~~ | 装飾レイヤー HTML | ✗ 不要 (既に `body::before` 等で可能) |
| ~~C6~~ | `@property` 型付き変数 | ✗ 不要 (制限さえ外せば直接書ける) |
| **C7+** | base.css 大幅削減 + scrollbar / selection / cursor 標準対応 | ✓ 方針確定 / 実装未 |
| ~~C8~~ | 隠し SVG スロット | △ 棚上げ (現状 CSS-only で困ってない) |

### C7+ base.css 削減の具体方針

[src/styles/base.css](../src/styles/base.css) の 199 行のうち aesthetic / layout 固定部分を theme.css に移し、~70 行に縮める:

**残すもの:**
- reset (box-sizing / margin 0 / img max-width / button reset 等)
- 機能的構造 (`.brand-mark` mask / `.icon-link svg`)
- C7 メタ要素 (`scrollbar-color` / `::selection` / `accent-color` / `caret-color` / `::marker` / `::placeholder`)

**撤廃するもの:**
- `.container { width: min(72ch, ...) }` — `--container-width` 変数化 or 完全撤廃 (Claude が theme.css で指定)
- `.site { grid-template-rows: auto 1fr auto }` — footer 貼り付きは theme.css 任せ
- `.post-list / article.post / .site-header` の aesthetic 数値 (font-size / gap / opacity 等)

---

## レイアウト方針: concept-first hybrid

(旧 F2「テンプレ複数化 (BaseMagazine 等)」は撤回)

```
1. Claude が今日の曲を読む
2. concept を文字列で書く (P1 concept-first)
3. layout-patterns.md を眺める
4. 判断:
   a. concept が既存パターンに合致 → そのパターンを base に書く (≒ Mode 1 内 Mode 3)
   b. 部分一致 → パターンを base に拡張・改変
   c. どれにも合致しない → 自由に書く (Mode 3 fallback)
5. 配色 / typography / 装飾を自由に乗せる
```

- HTML 構造は 1 種 (現状のまま)
- C7+ で base.css の `.container` 等を撤廃 → Claude が CSS でレイアウト自由
- `layout-patterns.md` は **コンセプト形式** で書く (コンセプト名 + 適合する曲 + 避けるとき + CSS のヒント)
- 「テンプレ menu に閉じ込めない、Mode 3 の余地は残す」「テンプレあれば優先使用、無ければ自由」のソフトな優先順位

### layout-patterns.md の MVP イメージ (5-7 個)

- アルバムジャケット型
- ライナーノーツ型 (雑誌見開き)
- コンサートチラシ型
- ターミナル型 (monospace 主体)
- Asymmetric 型 (非対称)
- Vertical 型 (`writing-mode: vertical-rl`)
- Single Hero 型 (1 記事だけ巨大、他畳む)

---

## P1 コンセプト先行生成

generate-theme.ts に concept 生成ステップを追加:

```
曲情報 → CONCEPT_PROMPT → concept.txt (短文)
曲情報 + concept → SYSTEM_PROMPT → theme.css
曲情報 + concept + theme.css → OG_SYSTEM_PROMPT → og.svg
曲情報 + concept + theme.css → OG_ARTICLE_TEMPLATE_SYSTEM_PROMPT → og.article-template.svg
```

- 保存先: `src/data/concept.txt`
- theme.css 冒頭の「ムード:」行は削除して concept に統合
- **手段としての位置付け、目的化禁止** (UI 表示しない / prompt 過剰構造化しない / 効果出なきゃ落とせる)

---

## F. フォント (F1)

Mode 1 を物理制約から受容 (アセット必要、無限不可)。OFL ライセンスのフリーフォント 15-20 個を curation して bundle:

**候補:**
- 明朝・古典: Zen Old Mincho / Shippori Mincho / Zen Antique (Soft) / Hina Mincho
- ゴシック: Zen Kaku Gothic New / Sawarabi Gothic
- 丸・柔らかい: Zen Maru Gothic / Kosugi Maru / M PLUS Rounded 1c
- 手書き・教科書: Klee One / New Tegomin / Yusei Magic
- 筆書き: Yuji Boku / Yuji Mai / Yuji Syuku / Yuji Hentaigana Akari
- ディスプレイ: DotGothic16 / Stick / Train One / Reggae One / Rampart One / RocknRoll One / Hachi Maru Pop / Cherry Bomb One

**実装方針:**
- `assets/fonts/source/` (元 TTF/OTF、commit) → `public/fonts/` (subset 後 woff2、commit) → `src/styles/fonts.css` で `@font-face` + CSS 変数
- subset 化: jpn 主要 1500-3000 字 (漢字検定 2-3 級相当)、各 200-500KB、合計 ~3MB
- 本文用 `--font-body` は system stack 維持 (重さ・即時表示)
- typography.md (= D3) で各フォントの性格を inspire として書く

**(F2 旧案撤回)** — レイアウトテンプレ複数化は不要、上記 concept-first hybrid に置換。

---

## E2 favicon 自動色追従 ✓ 実装済

(commit `2d091fa` 〜 `3bd733b`)

- [assets/favicon.template.svg](../assets/favicon.template.svg) (commit) — `{{BG}}` / `{{FG}}` placeholder
- [scripts/build-favicon.ts](../scripts/build-favicon.ts) (predev / prebuild フックで自動実行) — theme.css から `--color-bg` / `--color-accent` 抽出、`public/favicon.svg` 出力
- `public/favicon.svg` は `.gitignore` (生成物)
- [src/layouts/Base.astro](../src/layouts/Base.astro): SVG 優先 (`type="image/svg+xml"`) + `.ico` fallback (`sizes="32x32"` で Chrome の ICO 優先バグ回避)

---

## 棚上げ装飾の純 CSS 組 ★復活

Tier 4 おもちゃ系のうち、純 CSS で書けるものを techniques/ 配下に inspire として入れる:

| 装飾 | 実現方法 | 配置先 |
|---|---|---|
| ロゴクリックで弾む | `:active` + transform / animation | techniques/cursor-and-microinteractions.md |
| 隠しキャラ | `:hover` / `:target` で表示 | 同上 |
| 隠しテーマ | `:target` で URL fragment 駆動 (`/#disco`) | 同上 |
| マウス trail | C2 cursor bridge ある前提で部分的 (`--mx --my` 駆動の `:hover` 元の光) | C2 実装後 |
| scroll-driven animation | `@scroll-timeline` / `animation-timeline: scroll()` (Baseline) | techniques/motion.md |
| `@starting-style` ロード時演出 | CSS Baseline 機能、要素出現時のフェード / スライド | techniques/motion.md |

→ Mode 3 dress の延長として、Claude が今日の曲に応じて使う / 使わない判断。

## 棚上げ継続 (JS / 状態管理が必要)

| 項目 | 理由 |
|---|---|
| マウス停止演出 | `mouseleave` + `setTimeout` 必要、JS 解禁 or 新 bridge 要 |
| ブックマーク | `localStorage` 必須、`decisions.md` で却下済 |

→ **将来 JS 制限の re-visit 余地あり** (`fetch` 系は除く)。新 bridge を追加で限定的に解放するアプローチも検討対象。

---

## 表現の周辺判断 ★方針確定

### ブラウザ / OS 設定への対応
- `prefers-reduced-motion: reduce` — **必須** (SYSTEM_PROMPT で既に強制)
- `prefers-color-scheme` (light/dark) — **無視** (今日のテーマが OS 設定より勝つ、direction.md の "毎日の dress" 原則)
- `prefers-contrast` — Claude 任意

### レスポンシブ設計 — モダンに
techniques/ で「現代的レスポンシブ語彙」として書く:
- `clamp()` で fluid typography (`font-size: clamp(...)`)
- `@container` (container query)
- Logical properties (`margin-inline` / `padding-block`)
- `text-wrap: balance / pretty`
- `width: min(72ch, 100%)` 系
- Breakpoint は最小限 / なし、fluid 主体

### markdown 要素のスタイリング
- base.css は reset のみ
- `blockquote` / `pre` / `code` / `table` / `details` / `hr` / 記事内 `<img>` のスタイリングは **Claude 任せ**
- D10 markdown-elements.md (新) に inspire 例を書く

### RSS — 追加候補
- `@astrojs/rss` で記事 feed (`/rss.xml`) を build 時 static 出力
- **記事のみの feed** (theme 履歴は儚さ違反、流さない)
- 着手は別 phase で OK

### print / 多言語
- `@media print` — 無視 (CSS 書かない)
- 多言語 — `ja` only

---

## theme-source.json スリム化

現状 `{ songId, songName, artist, generatedAt }`。これ以上削るものなし、**現状維持**。
将来 mood / theme-class / palette 等を生やす場合は別 file (concept.txt 等) に分けて、theme-source.json は最小を保つ。

---

## D. 手法 md (techniques/) — 継続拡充

| ID | 内容 |
|---|---|
| **D0** | C-α 注入機構 — `docs/techniques/` を prompt に組み込む (ハブ) |
| **D1** | backgrounds.md |
| **D2** | decorations.md |
| **D3** | typography.md (F1 と一体) |
| **D4** | motion.md (scroll-driven / @starting-style 等含む) |
| **D5** | view-transitions.md (C1 後) |
| **D6** | cursor-and-microinteractions.md (C2 後、棚上げ装飾の純 CSS 組ここに) |
| **D7** | layout-patterns.md ★優先 (concept-first hybrid の母体) |
| **D8** | vocaloid-aesthetic を prompt 用に翻訳 |
| **D9** | color-application.md (`color-mix` / OKLCH 等) |
| **D10** (新) | markdown-elements.md (`blockquote` / `pre` / `code` / `table` / `details` 等) |

---

## E5. ローカル cron 自動化 — 最後

launchd / cron で日次自動実行 ([../TODO.md](../TODO.md) #1)。

---

## 将来候補 (条件付き)

- **A6** 音響分析 (BPM / 調性) / 映像分析 (PV) — 使える API or ローカル処理が見つかったら
- **JS 制限の re-visit** (`fetch` 除く) — 棚上げ「マウス停止」「ブックマーク」「他」が欲しくなったとき。新 bridge 追加で限定的に解放するアプローチを検討

---

## 棚卸し残務 (inventory.md 由来、未消化)

- **A-2**: base.css のクラス名 (`.brand-mark` 等) を SYSTEM_PROMPT に伝える
- **B / C**: SYSTEM_PROMPT の "自由節 / 禁止節" 撃退 (direction.md 柱 1 反映)
- **D-4**: 「曲を信じる」階層 (曲名・歌詞 = 一次 / タグ = 二次) を prompt で明示

---

## 外したもの (議論記録)

- A1-A5 (入力強化) / B 全部 (再生成系) / E1 (mood) / E3 (404 強化) / E6 (失敗ログ) / E4 (source 拡張)
- G (中身: 自己紹介 / 記事執筆 / archive 発掘 — 機能ではなく中身、別軸)
- F2 旧案 「テンプレ複数化 (BaseMagazine 等)」 — concept-first hybrid に置換

---

## 関連

- [direction.md](direction.md) — 北極星
- [../TODO.md](../TODO.md) — 着手中・保留タスク
- [log/inventory-2026-05-25.md](log/inventory-2026-05-25.md) — 棚卸し記録
- [research/](research/) — 語彙の母集団
- [../CLAUDE.md](../CLAUDE.md) — AI 向け運用規約
