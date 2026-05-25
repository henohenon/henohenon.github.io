# 企画書: VocaDB × Claude 毎日テーマ生成ブログ

## コンセプト

毎朝その日の Vocaloid シーンを Claude が読み取り、ブログのデザインを自動生成する。
コンテンツは変わらないのに、サイトが毎日違う顔をしている。

変化の記録は意図せず git history に残るが、サイト上には出てこない。
訪れたタイミングの人だけが、その日のデザインを見る。

---

## アーキテクチャ

```
[GitHub Actions / daily cron]
        ↓
VocaDB API (人気曲プール: トップ10〜30)
  → ランダムに1曲を選定
  - タグ (dark, cute, rock, melancholic...)
  - 歌詞
  - サムネイル URL (オプション)
        ↓
Claude API
  - デザイントークン・CSS を生成
  - 背景 SVG パターンを生成 (stretch)
        ↓
Astro ビルド
  - src/styles/theme.css を上書き
  - public/pattern.svg を上書き (stretch)
        ↓
GitHub Pages デプロイ
```

ディレクトリ構成は [CLAUDE.md](CLAUDE.md) の「ディレクトリ規約」参照。

---

## generate-theme.ts の責務

1. VocaDB API から人気曲プール (トップ10〜30) を取得し、1曲をランダムに選ぶ
2. 選ばれた曲のタグ・歌詞を Claude に渡す
3. Claude が `theme.css` を生成 (色・欧文フォント選択・余白・レイアウト・アニメーション)
4. `prefers-reduced-motion` ブロックを必ず含める
5. ファイルを書き出す

詳細な API 呼び出し規約 (prompt caching / tool use / モデル選定) は [TODO.md](TODO.md) で後回し中。

---

## GitHub Actions

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 毎日 0 時 (UTC) = JST 9 時
```

- `ANTHROPIC_API_KEY` をシークレットに登録
- テーマ生成 → Astro ビルド → デプロイ の順
- テーマ生成失敗時は **Issue を立てない**。静かに失敗して前日のテーマを維持

---

## 変化の粒度

| レイヤー | 変化するもの | 実装 |
|---|---|---|
| 必須 | 色・フォント・余白・グリッド・アニメーション | `theme.css` |
| stretch | 背景グラフィック | `pattern.svg` |
| stretch | ヘッダー・フッターの見た目 | `theme.css` 拡張 |
| 将来 | ライフログ連携 (再生履歴など) | 未定 |

HTML テンプレート・Astro コンポーネントは変化しない。CSS の範囲で変化を最大化する。

---

## フォント方針 (概要)

- 日本語はシステムフォントスタックに任せる (ダウンロードゼロ)
- 欧文・見出しフォントのみ `public/fonts/` に自前ホスト

詳細な選定・メトリクス調整は [TODO.md](TODO.md)。

---

## CSS アニメーション (概要)

`theme.css` の一部として Claude が毎日生成する。その日の雰囲気を動きにも反映。
`@media (prefers-reduced-motion: reduce)` ブロックは必須。

アニメーションを生成しない日の判断や具体仕様は [TODO.md](TODO.md)。

---

## 入力データ (VocaDB)

- ベース URL: `https://vocadb.net/api/` (認証不要、JSON)
- 取得: タイトル・アーティスト・タグ・歌詞・サムネイル URL
- カラーパレット抽出は stretch

詳細・エンドポイント選定・フォールバック方針は [vocadb-api-note.md](vocadb-api-note.md)。

---

## 設計思想

- **非決定性は仕様** — 毎回違う出力であることが価値
- **記録は意図せず残る** — git history が唯一のアーカイブ
- **シンプルに保つ** — HTML は変えない、CSS だけで変化を表現
- **ライフログは後から** — まず外部データで動かしてから拡張

---

## サイト構成

### URL 設計

フラットに保つ。タグ別ページは作らない。

```
/          トップ (最新記事一覧 + 一行 bio)
/slug      記事詳細
```

About ページなし。自己紹介はブログそのものでする。

### サイト名・ブランド資産

旧 Strune 版から引き継ぐ。新規に作らない。詳細は [CLAUDE.md](CLAUDE.md) の「過去資産の流用」。

- サイト名: **へのへのんのの**
- SNS: X (`@henohenon_8282`) / GitHub (`henohenon`)

### レイアウト

1 カラム。サイドバーなし。毎日テーマが変わるデザインが映えるようシンプルに。

```
ヘッダー (ブログ名 / SNS リンク / links)
─────────────────────────────
メインコンテンツ
─────────────────────────────
フッター (copyright only)
```

stretch: ヘッダー・フッターも日替わりテーマに合わせて変化させる。

---

## SSG ライブラリ

**Astro 5.x** を採用。

- Content Layer API (`glob` loader + zod) で Markdown 管理が綺麗・型安全
- `theme.css` の差し替えだけで全ページに反映
- ビルドが速く静的出力がシンプル
