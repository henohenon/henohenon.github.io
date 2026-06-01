# run-daily-theme.ps1
#
# Thin wrapper invoked hourly by Windows Task Scheduler.
# Its only job: fix up PATH / cwd / logging, then run `bun run scripts/daily-theme.ts`.
# All decision logic lives in daily-theme.ts (OS-independent).
#
# ASCII-only on purpose: Windows PowerShell 5.1 reads a BOM-less .ps1 as ANSI (CP932 on
# JP Windows), so non-ASCII comments corrupt tokenization. Keep this file ASCII.
#
# Manual run: powershell -ExecutionPolicy Bypass -File scripts\run-daily-theme.ps1

$ErrorActionPreference = "Continue"

# This wrapper lives in scripts\; daily-theme.ts is alongside it, repo is the parent.
$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }
$repo = Split-Path -Parent $here
$dailyTs = Join-Path $here "daily-theme.ts"

# Log under %LOCALAPPDATA%, rotated monthly.
$logDir = Join-Path $env:LOCALAPPDATA "henohenon-theme"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ("theme-{0}.log" -f (Get-Date -Format "yyyyMM"))
function Write-Log([string]$line) { Add-Content -Path $log -Value $line -Encoding utf8 }

Write-Log ("==== {0} run ====" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-Log ("repo={0}" -f $repo)
Write-Log ("entry={0}" -f $dailyTs)

# Make sure bun is reachable even when the task environment lacks it on PATH.
foreach ($d in @("D:\bun\bin", (Join-Path $env:USERPROFILE ".local\bin"))) {
  if ((Test-Path $d) -and ($env:PATH -notlike "*$d*")) { $env:PATH = "$d;$env:PATH" }
}
$bun = (Get-Command bun -ErrorAction SilentlyContinue).Source
if (-not $bun) {
  Write-Log "ERROR: bun not found on PATH"; Write-Log "==== exit 127 ===="; exit 127
}
if (-not (Test-Path $dailyTs)) {
  Write-Log "ERROR: entry not found: $dailyTs"; Write-Log "==== exit 2 ===="; exit 2
}
Write-Log ("bun={0}" -f $bun)

# Launch bun via Start-Process, redirecting stdout/stderr to temp files.
# Why: in PowerShell 5.1, piping a native command's `2>&1` mangles output and exit code.
# Start-Process gives a reliable ExitCode and honors -WorkingDirectory.
$outFile = Join-Path $logDir "last-stdout.txt"
$errFile = Join-Path $logDir "last-stderr.txt"
$p = Start-Process -FilePath $bun -ArgumentList "run", $dailyTs `
  -WorkingDirectory $repo -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput $outFile -RedirectStandardError $errFile
$code = $p.ExitCode
if ($null -eq $code) { $code = -1 }

$stdout = Get-Content $outFile -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
$stderr = Get-Content $errFile -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
if ($stdout) { Write-Log $stdout.TrimEnd() }
if ($stderr) { Write-Log ("[stderr] " + $stderr.TrimEnd()) }
Write-Log ("==== exit {0} ====" -f $code)
exit $code
