# run-daily-theme.ps1
#
# Windows タスクスケジューラから毎時呼ばれる薄いラッパ。
# 役割は PATH / cwd / ログを整えて `bun run scripts/daily-theme.ts` を叩くだけ。
# 判定ロジック本体は daily-theme.ts 側 (= OS 非依存)。
#
# 手動実行: powershell -ExecutionPolicy Bypass -File scripts\run-daily-theme.ps1

$ErrorActionPreference = "Continue"

# scripts\ の親 = リポジトリルート
$repo = Split-Path -Parent $PSScriptRoot

# bun / claude が PATH に無い環境 (タスク実行時など) でも拾えるよう補う
$ensureDirs = @("D:\bun\bin", (Join-Path $env:USERPROFILE ".local\bin"))
foreach ($d in $ensureDirs) {
  if ((Test-Path $d) -and ($env:PATH -notlike "*$d*")) {
    $env:PATH = "$d;$env:PATH"
  }
}

# ログ (scripts 外、月ごとにローテーション)
$logDir = Join-Path $env:LOCALAPPDATA "henohenon-theme"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ("theme-{0}.log" -f (Get-Date -Format "yyyyMM"))

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"==== $stamp run ====" | Out-File -FilePath $log -Append -Encoding utf8

Set-Location $repo
# stdout/stderr (1..6) すべてログへ追記
& bun run scripts/daily-theme.ts *>> $log
$code = $LASTEXITCODE

"==== exit $code ====" | Out-File -FilePath $log -Append -Encoding utf8
exit $code
