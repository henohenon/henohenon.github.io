# register-theme-task.ps1
#
# Register the henohenon-daily-theme task in Windows Task Scheduler.
# - Fires hourly at minute :39 (avoids the top-of-hour rush)
# - StartWhenAvailable: if the PC was off, run once ASAP after it comes back (catch-up)
# - /IT = run only while logged on, no stored password
#   (push uses HTTPS + Git Credential Manager, which needs the user session)
# - No admin needed (per-user interactive task)
#
# ASCII-only on purpose: Windows PowerShell 5.1 reads a BOM-less .ps1 as ANSI (CP932 on
# JP Windows), so non-ASCII comments corrupt tokenization. Keep this file ASCII.
#
# Implementation note: on PS 5.1, New-ScheduledTaskTrigger cannot attach an hourly
# repetition to a time trigger (no Repetition param; a CIM trigger is rejected by
# Register-ScheduledTask on a type-name mismatch). So we create with `schtasks
# /SC HOURLY` and only tweak catch-up / battery settings via Set-ScheduledTask.
#
# Run:       powershell -ExecutionPolicy Bypass -File scripts\register-theme-task.ps1
# Remove:    Unregister-ScheduledTask -TaskName henohenon-daily-theme -Confirm:$false

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$wrapper = Join-Path $repo "scripts\run-daily-theme.ps1"
$taskName = "henohenon-daily-theme"

if (-not (Test-Path $wrapper)) {
  throw "wrapper not found: $wrapper"
}

# Hourly at :39 / only while logged on (/IT) / overwrite if it already exists (/F)
$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$wrapper`""
schtasks /Create /TN $taskName /TR $tr /SC HOURLY /MO 1 /ST 00:39 /IT /F
if ($LASTEXITCODE -ne 0) {
  throw "schtasks /Create failed (exit $LASTEXITCODE)"
}

# Catch-up on missed runs + run on battery + suppress overlap + cap run time.
$task = Get-ScheduledTask -TaskName $taskName
$task.Settings.StartWhenAvailable = $true
$task.Settings.DisallowStartIfOnBatteries = $false
$task.Settings.StopIfGoingOnBatteries = $false
$task.Settings.ExecutionTimeLimit = "PT30M"
$task.Settings.MultipleInstances = "IgnoreNew"
$task.Description = "henohenon.github.io: hourly check; if today is not updated yet, generate theme then push (only while logged on; missed runs caught up after boot)"
Set-ScheduledTask -InputObject $task | Out-Null

Write-Host "registered: $taskName"
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName, State
