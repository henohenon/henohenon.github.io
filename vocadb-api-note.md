# VocaDB API 調査メモ

`scripts/generate-theme.ts` が叩く外部 API の調査ログ。実装時の判断材料として残す。

## 基本情報

- ベース URL: `https://vocadb.net/api/`
- 認証不要（GET リクエスト）
- レスポンスは JSON のみ
- 全エンドポイントの一覧は [Swagger UI](https://vocadb.net/swagger/index.html) で確認可能

## 目的

毎日1曲、その日の人気 Vocaloid 曲を取得し、テーマ生成 (`theme.css`) の入力にする。

## 試すべきエンドポイント

### 第一候補: 直近24時間の人気上位

```
GET /api/songs/top-rated?durationHours=24&maxResults=1&vocalistSelection=Vocaloid&fields=Tags,Lyrics
```

- VocaDB の Rankings ページが裏で叩いてるルートに近い
- `durationHours` パラメータが API レベルでも効くかは実装前に Swagger で要確認
- ハンドル名 `top-rated` の挙動も Swagger でちゃんと裏取りする

### 第二候補（フォールバック）: 新着 × 人気の手動マージ

第一候補が想定通り動かなかった場合：

```
GET /api/songs?sort=PublishDate&maxResults=30&songTypes=Original&fields=Tags,Lyrics
```

- 直近30曲を取得 → クライアント側で `ratingScore` 降順ソート → 1位を採用
- API 1 回で済むが、API 側のランキング判定に乗れない

## 取得するフィールド

```
fields=Tags,Lyrics,ThumbUrl
```

| フィールド | 用途 |
| --- | --- |
| `Tags` | ジャンル・ムード (dark, cute, rock 等) → デザイン生成の主入力 |
| `Lyrics` | 歌詞テキスト → トーン補強 |
| `ThumbUrl` | サムネイル URL。カラーパレット抽出を試すなら使う（オプション） |

## RatingScore について

- VocaDB ユーザーによる Like (+2) と Favorite (+3) の累積スコア
- ニコニコ動画の再生数や YouTube views とは無関係
- `durationHours` で時間窓を切ることで「今日の人気」に近い概念になる

## 利用上の注意

- アクセスは 1 日 1 回（cron 1 発）。利用規模的に問題なし
- データはコミュニティ編集 → 新曲の登録にタイムラグあり（`PublishDate` と `AdditionDate` は別フィールド）
- 個人ブログ用途での利用
