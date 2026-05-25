# 企画書: VocaDB × Claude 毎日テーマ生成ブログ

## コンセプト

毎朝その日のVocaloidシーンをClaudeが読み取り、ブログのデザインを自動生成する。
コンテンツは変わらないのに、サイトが毎日違う顔をしている。

変化の記録は意図せずgit historyに残るが、サイト上には出てこない。
訪れたタイミングの人だけが、その日のデザインを見る。

---

## アーキテクチャ

```
[GitHub Actions / daily cron]
        ↓
VocaDB API（人気曲プール: トップ10〜30）
  → ランダムに1曲を選定
  - タグ（dark, cute, rock, melancholic...）
  - 歌詞
  - サムネイルURL（オプション）
        ↓
Claude API
  - デザイントークン・CSSを生成
  - 背景SVGパターンを生成（stretch）
        ↓
Astro ビルド
  - src/styles/theme.css を上書き
  - public/pattern.svg を上書き（stretch）
        ↓
デプロイ（GitHub Pages / Netlify / Cloudflare Pages）
```

---

## ディレクトリ構成

```
.
├── src/
│   ├── content/
│   │   └── posts/          # Markdownファイル
│   ├── styles/
│   │   ├── base.css        # 固定スタイル（変更なし）
│   │   └── theme.css       # 毎日Claudeが上書き
│   └── pages/
├── public/
│   └── pattern.svg         # 毎日Claudeが上書き（stretch）
├── scripts/
│   └── generate-theme.ts   # VocaDB → Claude → ファイル生成
└── .github/workflows/
    └── daily.yml           # 毎朝スケジューラ
```

---

## generate-theme.ts の責務

1. VocaDB APIを叩いて人気曲プール（トップ10〜30）を取得し、その中から1曲をランダムに選ぶ
2. 選ばれた曲のタグ・歌詞をClaudeに渡す
3. Claudeが`theme.css`を生成（色・欧文フォント選択・余白・レイアウト・アニメーション）
4. `prefers-reduced-motion` ブロックを必ず含める
5. ファイルを書き出す

---

## GitHub Actions

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 毎日0時（UTC）
```

- `ANTHROPIC_API_KEY` をシークレットに登録
- テーマ生成 → Astroビルド → デプロイ の順に実行

---

## 変化の粒度

| レイヤー | 変化するもの | 実装 |
|---|---|---|
| 必須 | 色・フォント・余白・グリッド・アニメーション | `theme.css` |
| stretch | 背景グラフィック | `pattern.svg` |
| stretch | ヘッダー・フッターの見た目 | `theme.css` 拡張 |
| 将来 | ライフログ連携（再生履歴など） | 未定 |

HTMLテンプレート・Astroコンポーネントは変化しない。
CSSの範囲で見た目の変化を最大化する。

---

## フォント戦略

日本語フォントはファイルサイズが大きく（Noto Sans JP等は10MB超）、毎日差し替えるとキャッシュが効かずパフォーマンスが落ちる。

### 方針

- **日本語はシステムフォントスタックに任せる** — ダウンロードゼロ
- **欧文・見出しフォントのみ自前ホスト** — ファイルサイズが小さくOFL等で自由に使える

```css
font-family: 'CustomHeadingFont', 'Hiragino Sans', 'Yu Gothic', sans-serif;
```

Claudeが選ぶのは欧文フォントのみ。`public/fonts/` にあらかじめ数種類を置いておき、その中から選ばせる。

### フォールバック最適化

`font-display: swap` + フォールバックフォントのメトリクス調整でレイアウトシフトを最小化。

```css
@font-face {
  font-family: 'FallbackFont';
  src: local('Hiragino Sans');
  ascent-override: 90%;
  size-adjust: 95%;
}
```

---

## CSSアニメーション

`theme.css` の一部としてClaudeが毎日生成する。その日の雰囲気が動きにも反映される。

### 生成対象

- ページロード時のエントリーアニメーション
- ホバーエフェクト（カード・リンク）
- アンビエントな背景アニメーション

### アニメーションなしパターン（stretch）

あえてアニメーションを一切生成しない日もClaudeが判断できるようにする。静けさも表現のひとつ。

### prefers-reduced-motion

必ずセットで生成させる。

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 入力データ（VocaDB）

- エンドポイント: `https://vocadb.net/api/songs`（認証不要）
- 取得する情報: タイトル・アーティスト・タグ・歌詞
- サムネイルのカラーパレット抽出はオプション

---

## 設計思想

- **非決定性は仕様** — 毎回違う出力であることが価値
- **記録は意図せず残る** — git historyが唯一のアーカイブ
- **シンプルに保つ** — HTMLは変えない、CSSだけで変化を表現
- **ライフログは後から** — まず外部データで動かしてから拡張

---

## サイト構成

### URL設計

フラットに保つ。

```
/          トップ（最新記事一覧 + 一行bio）
/slug      記事詳細
/tag       タグ別一覧
```

Aboutページなし。自己紹介はブログそのものでする。

### レイアウト

1カラム。サイドバーなし。毎日テーマが変わるデザインが映えるようシンプルに保つ。

```
ヘッダー（ブログ名 / SNSリンク / links）
─────────────────────────────
メインコンテンツ
─────────────────────────────
フッター（copyright only）
```

### ヘッダー

- ブログ名
- SNSリンク（アイコン）
- リンク集へのアンカー or リンク

### フッター

- copyright のみ

### stretch

- ヘッダー・フッターの要素も毎日のテーマに合わせて変化させる

---

## SSGライブラリ

**Astro** を採用。

- Content CollectionsでMarkdown管理が綺麗
- `theme.css`の差し替えだけで全ページに反映
- ビルドが速く静的出力がシンプル

---

## TODO（Claude Codeへ）

- [ ] Astroプロジェクトの初期セットアップ
- [ ] `scripts/generate-theme.ts` の実装
- [ ] VocaDB APIの動作確認・エンドポイント選定
- [ ] Claudeへのプロンプト設計（テーマ生成指示）
- [ ] `base.css` と `theme.css` の役割分担定義
- [ ] 欧文フォントの選定・`public/fonts/` への配置
- [ ] フォールバックフォントのメトリクス調整
- [ ] GitHub Actions ワークフロー作成
- [ ] デプロイ先の設定
- [ ] `pattern.svg` 生成の実装（stretch）
