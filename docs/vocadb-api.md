# VocaDB API 調査メモ

`scripts/generate-theme.ts` が叩く外部 API の調査ログ。実装時の判断材料として残す。

## 基本情報

- ベース URL: `https://vocadb.net/api/`
- 認証不要（GET リクエスト）
- レスポンスは JSON のみ
- 全エンドポイントの一覧は [Swagger UI](https://vocadb.net/swagger/index.html) で確認可能

## 目的

毎日1曲、その日の人気 Vocaloid 曲を取得し、テーマ生成 (`theme.css`) の入力にする。

## 使うエンドポイント (動作確認済)

### Step 1: 直近 N 日の人気曲リスト取得

```
GET /api/songs?sort=RatingScore&maxResults=20&songTypes=Original&fields=Tags&lang=Default&afterDate=YYYY-MM-DD
```

- `afterDate` は ISO 形式 (例: `2026-04-25`)。日付以降に公開された曲が対象
- `sort=RatingScore` で人気順
- `songTypes=Original` でカバー曲・アレンジを除外
- レスポンスは `{ items: Song[], totalCount }`

`/api/songs/top-rated?durationHours=24` も存在するが、ブラウザ向け SPA HTML
が返るのみ (API ルートではない)。**使わない**。

### Step 2: 選定した 1 曲の歌詞・画像取得

```
GET /api/songs/{id}?fields=Lyrics,Tags,MainPicture&lang=Default
```

- `lyrics` は配列。各要素 `{ value, cultureCodes }` (`ja`, `en`, `zh`, `ha` (Hepburn) など複数言語あり)
- `mainPicture.urlOriginal` がサムネ URL。曲によっては存在しない (空オブジェクト)
- `tags` は `{ count, tag: { name, categoryName, urlSlug, additionalNames } }` の配列

### 実装手順

1. Step 1 で 10〜30 曲取得 → JS 側でランダム選定
2. Step 2 で歌詞・画像を 1 回追加取得
3. タグ名・歌詞 (日本語または英語) を Claude に投げる

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
