# 設計記録

実装に直結する具体的な判断と理由のログ。
**全体方針 (目的・基本方針・前提) は [direction.md](direction.md)**、拡張可能性のカタログは [feature-expansion-ideas.md](feature-expansion-ideas.md)、現状タスクは [../TODO.md](../TODO.md)。

新しい設計判断が出たら上に追記する (新しい順)。

---

## 2026-05-25 OGP: ハイブリッド 2 call + ビルド時ラスタライズ

**決定**:

1. `generate-theme.ts` で 1st call (CSS 生成) → 成功後 2nd call で OGP SVG 生成
2. 2nd call には CSS と曲名・アーティストを渡す (歌詞・タグは省略 = トークン節約)
3. `public/og.svg` を commit、`scripts/build-og.ts` がビルド時に `dist/og.png` にラスタライズ
4. Twitter / FB 等のキャッシュで「同URLでも見える絵は日次で変わる」状態 = 儚さ的に on-brand

**理由**: AI 生成にすれば SVG 構図にも今日らしさが出る。失敗 (構文崩れ等) しても 1st call の
CSS は守られるので独立失敗が可能。PNG を git に commit しない (年 ~50MB の肥大回避)。

**バリデーション**: dimensions / `<script>` / `<foreignObject>` / 外部リソース / font-family
を regex でガード。NG なら前日 og.svg を温存。

---

## 2026-05-25 404 ページ

**決定**: 案 A 「ここには何もない」+ "/" へのリンクのみ。コピーは最小。

**理由**: 儚さ原則と整合。Base レイアウト経由でその日のテーマとフッターの曲名はそのまま
表示されるため、追加で「テーマ反映」を仕込まなくても自動でそうなる。

---

## 2026-05-25 選曲: ブラックリスト方式 + 歌詞優先 + 曲を信じる

**決定**:

- ローリング 30 日ウィンドウから RatingScore 上位 50 曲を pool
- フォールバック順: `fresh+lyrics` → `stale+lyrics` → `fresh-no-lyrics`
- `src/data/used-songs.json` で過去ピック済 ID を管理 (重複避ける)
- LLM へのプロンプトは「曲名 + 歌詞を主、タグは補助」

**理由**:

- 「直近の1曲」だと歌詞未追加のことが多い → 情報量を担保したい
- 重複避けは "毎日違う顔" の体験的価値を守るため
- 曲名・歌詞が一次情報、タグは編集者によるラベルにすぎない

---

## 2026-05-25 ローカル cron 一本化 (脱 API キー / 脱 GHA cron)

**決定**: 日次のテーマ生成は GitHub Actions ではなく、ユーザーのローカル launchd/cron で
回す。CLI バックエンド (`claude -p` = Pro/Max サブスク認証) を本番経路にし、SDK 経路 (API
キー必須) は休眠で残置。GHA は `deploy.yml` (main push → Pages) のみ残す。

**理由**: API 課金を避けたい。サブスクで動く CLI で完結する方が「現状健全」と判断。

**詳細**: [TODO.md](../TODO.md) #1 ローカルスケジュール化、project memory
[project-local-cron-direction](
../../../.claude/projects/-Users-kitamuratakeru-Documents-projects-henohenon-github-io/memory/project_local_cron_direction.md)。
