# 機能拡張アイデア一覧

[direction.md](direction.md) の方針 (「制限を決めるのではなく、できることを増やす」) に基づく実装候補のカタログ。
スケジュール化されたタスクは [../TODO.md](../TODO.md)。

[research/](research/) / [log/inventory-2026-05-25.md](log/inventory-2026-05-25.md) で挙がった候補も統合し、議論を経て採否・順序を確定済み。

---

## 進める順序 (大局)

1. **C. 土台拡張** — Claude が書ける CSS の幅を広げる ★まずこれ
2. **F. フォント / レイアウト** — C と並行可
3. **E2 favicon 自動色追従 (ロジック) / theme-source.json スリム化** — どこかで
4. **D. 手法 md** — C 終わったらまとめる
5. **E5. ローカル cron** — 拡張全体がひと段落してから

---

## C. 土台拡張 ★最優先

Claude が theme.css で書ける表現の幅を広げる常設機構。それぞれ独立に効くが、揃うと相乗。

| ID | 内容 | 効果 |
|---|---|---|
| **C1** | View Transitions (Astro `<ClientRouter />`) | ページ / 要素遷移を CSS で書ける |
| **C2** | カーソル位置 CSS 変数 bridge (`--mx` / `--my`) | spotlight / parallax / mix-blend-mode |
| **C3** | 時刻シフト (`<html data-tod>`) | 同テーマの朝 / 昼 / 夕 / 夜版 |
| **C4** | `color-mix` 曲調 dim modifier (自動) | 暗い曲調なら背景 1 段落とす |
| **C5** | 装飾レイヤー HTML を 1 枚 (`<div class="theme-canvas">`) | 大型装飾を CSS で盛れる |
| **C6** | `@property` 型付き CSS 変数 | アニメ可能な型付き変数 |
| **C7** | scrollbar / selection / cursor の標準対応 | base.css に枠、Claude が色だけ書く |
| **C8** | 隠し SVG スロット | 文字 / アイコンを CSS で操作 |

**進行状況:**
- ~~C5~~ 既に capability あり (body 背景 / `::before` で Claude 自由に書ける) → 不要
- ~~C6~~ Claude が CSS で直接 `@property` 書ける → 制限さえ外せば不要
- **C2 ✓ 方針確定**: CSS 変数 bridge (`--mx` / `--my` を `:root` に。`requestAnimationFrame` throttle、`px` のみ、touch 非対応、bridge 自体は reduced-motion 無効化しない)
- C3 保留: 「`--tod` 連続値 + `data-tod` 5 段 (深夜帯 `late-night` 含む)」「JS 解禁すれば全部いける」議論で一旦止め
- C7 保留: base.css 大幅削減と同時にやる方向 (下記)
- **C1 方針確定 (メモ実装は後)**: ClientRouter は入れない (SSG 維持)。代わりに `@view-transition { navigation: auto; }` のクロスドキュメント版を採用。Chrome 126+ / Safari 18.2+ で view transitions が効き、未対応ブラウザは普通の遷移で fallback (壊れない)。SSG の純粋性損なわず、できることは限定的だが進化的拡張。実装は base.css に 1 行 + Claude が `view-transition-name` を CSS で振れる旨を SYSTEM_PROMPT に伝えるだけ
- ~~C4~~ 廃止: 「自動 dim modifier」は元々 mood ラベル前提。mood 撤回で前提が壊れたので廃止。Claude が dim したい日は theme.css に直接書けば十分
- C8 棚上げ: 中身に何を置くかで aesthetic 縛りが発生。Claude は現状 CSS-only (擬似要素 / 多層 background) で十分やれており困ってない。将来「DOM SVG が要る」と判明したら再検討
- **P1 方針確定 (実装は後)**: コンセプト先行生成 (2 段プロセス)。Claude が曲を読んで設計意図 (短文) を書く → concept を後段 prompt に注入 → theme.css / og.svg / article-template が同じ concept を共有してコヒーレンス。**手段としての位置付け、目的化禁止** (UI 表示しない / prompt 過剰構造化しない / 効果出なきゃ落とせる)。保存先は `src/data/concept.txt`。theme.css 冒頭の「ムード:」行は削除して concept に統合

**C7+ base.css の aesthetic 削減** (C7 と一体で議論):

[src/styles/base.css](../src/styles/base.css) の現状 199 行のうち、aesthetic / layout 固定 (`.container { width: 72ch }` / `.site { grid-template-rows: auto 1fr auto }` / `.post-list / article.post` の font-size / opacity 等) を theme.css 行きに移し、base.css は **~70 行の reset + 機能的構造 (`.brand-mark` mask / `.icon-link svg`) + C7 メタ要素** のみに縮める。

- 削除の影響: `.container` 削除で Claude が幅を書かない日は body 全幅、`.site` grid 削除で footer 貼り付きが theme.css 任せに。SYSTEM_PROMPT で「`.container` の幅は theme で指定」を一言伝えるか、Astro 側で `.container` 依存を解消するか要設計
- 着手は C2 / C3 / C7 / View Transitions 等の方針が揃ってから一括で

## F. フォント / レイアウトテンプレ ★やりたい

| ID | 内容 |
|---|---|
| **F1** | 日本語フォント curation (装飾・見出し寄り、自前 bundle) |
| **F2** | レイアウトテンプレ複数化 (BaseMagazine / BasePoster 等) |

## E2. favicon 自動色追従 — AI でなくロジックで

theme.css の `--color-accent` を SVG favicon に inject。Claude 介在なしの決定的処理。

**方針確定 (実装は後):**

- ソース画像: `public/favicon-source.png` (現 `public/image 13.png` を rename、90x79 RGBA、淡いタッチのもへじマーク)
- テンプレ: `public/favicon.template.svg` を新設 (commit する)。`<image>` で PNG を base64 埋め込み + `<feFlood>` + `<feComposite operator="in">` で alpha 領域だけ `{{ACCENT}}` 単色塗り。viewBox は `0 0 90 79`
- 生成タイミング: ビルド時のみ ([scripts/build-og.ts](../scripts/build-og.ts) を拡張、`buildFavicon` を追加)。生成物 `dist/favicon.svg` は commit しない (dist 専用)
- ブラウザ側: [src/layouts/Base.astro](../src/layouts/Base.astro) に `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />` を追加、既存の `.ico` を legacy fallback として残す
- 単色のみ (`--color-accent` だけ参照)、3 色は使わない (画像構造上不自然)
- dev (`bun run dev`) 時は build 走らないので favicon.svg 無し → `.ico` fallback。「dev では theme 追従しない、deploy 時のみ追従」を許容

## theme-source.json スリム化

今は `songId / songName / artist / generatedAt` の 4 項目。どれを削るかは要相談 (mood 不要を受けて E4 拡張案は撤回、減らす方向)。

## D. 手法 md (techniques/) — C 完了後

| ID | 内容 |
|---|---|
| **D0** | C-α 注入機構 — `docs/techniques/` を prompt に組み込む (ハブ) |
| **D1** | backgrounds.md |
| **D2** | decorations.md |
| **D3** | typography.md |
| **D4** | motion.md |
| **D5** | view-transitions.md (C1 後) |
| **D6** | cursor-and-microinteractions.md (C2 後) |
| **D7** | layout-patterns.md |
| **D8** | vocaloid-aesthetic を prompt 用に翻訳 |
| **D9** | color-application.md (`color-mix` / OKLCH 等) |

## E5. ローカル cron 自動化 — 最後

launchd / cron で日次自動実行 ([../TODO.md](../TODO.md) #1)。

## 将来候補 (条件付き)

- **A6** 音響分析 (BPM / 調性) / 映像分析 (PV) — 使える API or ローカル処理が見つかったら

## 外したもの (議論記録)

- **A1-A5** — 歌詞言語拡張 / タグ階層化 / publishDate / 過去傾向 / 生成時刻 (入力強化はそこまでではない)
- **B 全部** — 再生成 / retry / 複数案 / バックエンド差し替え / preview (いったん不要)
- **E1** mood ラベル (要らない)
- **E3** 404 強化 / **E6** 失敗ログ可視化 (今は触らない)
- **E4** theme-source.json 拡張 (むしろスリム化方向に反転)
- **G** 自己紹介 / 記事執筆 / archive 発掘 (= 機能ではなく中身、別軸)

---

## 関連

- [direction.md](direction.md) — 北極星
- [../TODO.md](../TODO.md) — 着手中・保留タスク
- [log/inventory-2026-05-25.md](log/inventory-2026-05-25.md) — 棚卸し記録
- [research/](research/) — 語彙の母集団
