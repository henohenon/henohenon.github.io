# ローカル日次スケジュール (毎時テーマ更新)

日次のテーマ生成をローカルで回す仕組みのメモ。
「PC が起動している間、毎時チェックして、今日まだ更新されていなければ生成して push する」を
冪等に実現する。API 課金回避のため LLM 呼び出しは `claude -p` (CLI = Pro/Max サブスク認証)。

関連: [ai-flow.md](ai-flow.md) (生成フロー本体) / [vocadb-api.md](vocadb-api.md) (選曲入力) /
[TODO.md](../TODO.md) の「1. ローカルスケジュール化」。

## 全体構成

```
Windows タスクスケジューラ (毎時 :39)
  └─ scripts/run-daily-theme.ps1   薄いラッパ (PATH/cwd/ログを整えるだけ)
       └─ bun run scripts/daily-theme.ts   判定 + push (OS 非依存)
            └─ bun run generate-theme        生成 + commit (LLM 呼び出し)
```

責務分離:

| ファイル | 役割 |
| --- | --- |
| `scripts/daily-theme.ts` | コミットベースで「今日もう更新済みか」を判定し、未更新なら生成→push。**push はここ** |
| `scripts/generate-theme.ts` | VocaDB→Claude でファイル生成し、デフォルトで `chore(theme)` コミット。**commit はここ** (`--no-commit` で抑止)。push はしない |
| `scripts/run-daily-theme.ps1` | タスクから呼ばれる Windows 専用ラッパ。PATH 補正・`CLAUDE_BIN` 固定・ログ・終了コード回収 |
| `scripts/register-theme-task.ps1` | タスクスケジューラへの登録 |

commit と push を分離しているのは、**「生成 + commit は済んだが push だけ失敗」した日に、
再生成せず push だけ再試行できる**ようにするため (下記 段階2)。

## daily-theme.ts の段階ロジック (冪等)

JST の「今日」を基準に、コミットメッセージ `chore(theme):` を持つコミットの有無で判定する。

```
git fetch origin main            # オフラインなら警告して続行
1. origin/main に今日の chore(theme) コミットあり  → 何もしない (ローカルに一切触れず終了)
   git merge --ff-only origin/main  # 1 を抜けた = 何か手を加える前にローカルを最新へ追従
2. ローカル main に今日の chore(theme) コミットあり (未 push) → push だけ (再生成しない)
3. どちらも無し → bun run generate-theme (生成+commit) → push
```

- 普段 (PC 常時起動): 1 日の最初の 1 回だけ 3 が走り、残りは 1 で即終了。
- 朝 PC オフ → 昼起動: 起動後最初の毎時で 3 が走り取りこぼしを回収。
- push だけ失敗した日: 次回 2 が拾って push のみ再試行 (曲が変わる事故を防ぐ)。

### 段階 1 を抜けた後の ff-only 追従 (non-ff push 対策)

別マシン等で `origin/main` が進んでいると、ローカルが古いまま生成コミットを積んでしまい、
push が non-ff で弾かれ続ける (段階 2 が毎回 reject される無限ループ) ことがある。これを避けるため、
**段階 1 を抜けた直後 (= 生成 or push する前) に `git merge --ff-only origin/main` でローカル main を最新へ前進させる**。

- ローカルが既に先行 (未 push の theme コミットあり) なら `origin/main` は祖先なので no-op。段階 2 はそのまま成立。
- 真に分岐 / 作業ツリーに衝突する変更がある場合は **ff できない旨をログに出して続行**するだけ
  (履歴を勝手に rebase/merge して壊さない — 安全側)。この場合 push は依然弾かれるが、ログで気づける。
- 段階 1 で終わるとき (= デプロイ済み) は**ローカルに一切触れない** (副作用最小化)。`--check` でも ff はせず `would:` を出すだけ。

### 判定クエリ

```sh
git log <ref> --since="<今日0時JST>+09:00" --fixed-strings --grep="chore(theme):"
```

- **メッセージ条件**: subject にリテラル `chore(theme):` を含む (`--fixed-strings` なので `()` は正規表現でない)
- **日付条件**: コミット日時が今日 0:00 JST 以降 (`+09:00` を明示するのでマシン TZ に依存しない)
- 対象 ref は `origin/main` (push 済み) と `main` (ローカル) の 2 つ

作るコミットは `chore(theme): YYYY-MM-DD (曲名)`。「作るメッセージ」=「探すパターン」で自己整合する。

## Windows タスクスケジューラ設定

`scripts/register-theme-task.ps1` で登録 (管理者権限不要)。

- 名前: `henohenon-daily-theme`
- トリガー: **毎時 :39 発火** (正時集中を避ける)
- `StartWhenAvailable = true`: PC オフで逃した分は起動後に 1 回だけ回収
- バッテリー時も実行 / 実行 30 分上限 / 多重起動抑止 (IgnoreNew)
- **`/IT` = ログオン中のみ実行・パスワード保存なし**
  - push は HTTPS + Git Credential Manager 経由なので、ユーザーセッションで走る必要がある
  - SYSTEM や「ログオン問わず」だと push 認証が取れない

### ラッパの PATH / CLAUDE_BIN 補正

タスクスケジューラの実行環境は対話セッションより PATH が薄いことがある。ラッパは起動時に:

- `D:\bun\bin` (bun) と `~\.local\bin` (Claude CLI) を PATH に前置 (無ければ無視)。
- `bun` が見つからなければ即 `exit 127` (これが無いと何も動かないため致命扱い)。
- **`claude` を絶対パスで解決して `CLAUDE_BIN` に固定**し、ログに `claude=...` を出す。
  generate-theme は `process.env.CLAUDE_BIN ?? "claude"` で見るので、PATH 順序に依存せず確実に同じ binary を使う。
  見つからない時は **warn して続行** — `claude` を要るのは段階 3 だけで、段階 1/2 (何もしない / push のみ) は
  `claude` 不在でも成立させたいため、ここでは落とさない (生成時に generate-theme 側が明示エラーにする)。

### 実装上の制約 (PS 5.1)

`New-ScheduledTaskTrigger` は時刻トリガーに毎時繰り返しを付与できない
(Repetition パラメータ非対応、CIM トリガーは `Register-ScheduledTask` に型名不一致で弾かれる)。
そのため**作成は `schtasks /SC HOURLY` に任せ**、取りこぼし回収・バッテリー設定だけ
`Set-ScheduledTask` で後付けする。

## ハマりどころ (重要)

Windows PowerShell 5.1 起因の落とし穴を 2 つ踏んだ。ラッパを直す際は再発に注意。

1. **BOM 無し `.ps1` は CP932 として読まれる**
   PS 5.1 は BOM の無い `.ps1` を UTF-8 ではなく ANSI (日本語環境では CP932) として解釈する。
   日本語コメントの多バイト列が `` ` `` や `"` に化けてトークンを壊し、**後続行の変数代入が
   静かに null 化**する (例: `$dailyTs` が空 → `Start-Process` が null 引数で失敗)。
   → **`.ps1` は ASCII (英語コメント) で書く**。`.ts` 側は bun が UTF-8 で読むので日本語可。

2. **native の `2>&1` パイプが出力・終了コードを壊す**
   `& bun ... 2>&1 | ...` を**スクリプトスコープで**使うと、出力が捨てられ `$LASTEXITCODE` も
   null になることがある (インラインでは再現しにくい)。
   → **`Start-Process -RedirectStandardOutput/-RedirectStandardError` でファイルに落とし、
   `$process.ExitCode` を取る**。stdout/stderr の読み戻しは `Get-Content -Encoding UTF8`。

## 運用

- ログ: `%LOCALAPPDATA%\henohenon-theme\theme-YYYYMM.log` (月次ローテ)
  - 直近の生 stdout/stderr は同フォルダの `last-stdout.txt` / `last-stderr.txt`
- 今すぐ手動起動: `Start-ScheduledTask -TaskName henohenon-daily-theme`
- ラッパ単体実行: `powershell -ExecutionPolicy Bypass -File scripts\run-daily-theme.ps1`
- 判定だけ確認 (副作用なし): `bun run scripts/daily-theme.ts --check`
- 一時停止 / 解除: `Disable-ScheduledTask -TaskName henohenon-daily-theme` /
  `Unregister-ScheduledTask -TaskName henohenon-daily-theme -Confirm:$false`
- 再登録: `powershell -ExecutionPolicy Bypass -File scripts\register-theme-task.ps1`
- 任意の曲で手動生成 (コミット込み): `bun run generate-theme --song "曲名"` /
  コミットしたくない時は `--no-commit`

## mac へ移すとき

判定ロジックは `daily-theme.ts` に集約してあるので、**scheduler だけ差し替える**。
launchd の plist から `bun run scripts/daily-theme.ts` を毎時叩くようにすればよい
(bun の PATH / `CLAUDE_BIN` を plist の環境に明示する)。ログ出力先も mac 流に変える。
`run-daily-theme.ps1` / `register-theme-task.ps1` は Windows 専用。
