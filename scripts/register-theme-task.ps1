# register-theme-task.ps1
#
# henohenon-daily-theme を Windows タスクスケジューラに登録する。
# - 1 時間ごとに発火 (= PC 起動中は毎時チェック)
# - StartWhenAvailable: PC がオフだった時間帯の分は、起動後に可能になり次第 1 回実行 (取りこぼし回収)
# - /IT = ログオン中のみ実行 / パスワード保存なし
#   → push は HTTPS + Git Credential Manager 経由なので、ユーザーセッションで走る必要がある
# - 管理者権限は不要 (現ユーザーの対話タスクのため)
#
# 実装メモ: Windows PowerShell 5.1 の New-ScheduledTaskTrigger は時刻トリガーへの
#   繰り返し付与が通らない (Repetition プロパティ非対応 / CIM トリガーは型名不一致で
#   Register-ScheduledTask に弾かれる)。そのため作成は schtasks /SC HOURLY に任せ、
#   取りこぼし回収・バッテリー時実行などの細かい設定だけ Set-ScheduledTask で補正する。
#
# 実行:   powershell -ExecutionPolicy Bypass -File scripts\register-theme-task.ps1
# 解除:   Unregister-ScheduledTask -TaskName henohenon-daily-theme -Confirm:$false

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$wrapper = Join-Path $repo "scripts\run-daily-theme.ps1"
$taskName = "henohenon-daily-theme"

if (-not (Test-Path $wrapper)) {
  throw "wrapper not found: $wrapper"
}

# 1 時間ごと / ログオン中のみ (/IT) / 既存があれば上書き (/F)
$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$wrapper`""
schtasks /Create /TN $taskName /TR $tr /SC HOURLY /MO 1 /ST 00:00 /IT /F
if ($LASTEXITCODE -ne 0) {
  throw "schtasks /Create failed (exit $LASTEXITCODE)"
}

# 取りこぼし回収 + バッテリー時も実行 + 多重起動抑止 + 実行時間上限
$task = Get-ScheduledTask -TaskName $taskName
$task.Settings.StartWhenAvailable = $true
$task.Settings.DisallowStartIfOnBatteries = $false
$task.Settings.StopIfGoingOnBatteries = $false
$task.Settings.ExecutionTimeLimit = "PT30M"
$task.Settings.MultipleInstances = "IgnoreNew"
$task.Description = "henohenon.github.io: 毎時、今日まだ未更新なら theme 生成→commit→push (PC 起動中のみ / 取りこぼしは起動後に回収)"
Set-ScheduledTask -InputObject $task | Out-Null

Write-Host "registered: $taskName"
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName, State
