Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$env:HALVETH_CHILD = '1'

$wt = (Get-Command wt.exe -ErrorAction Stop).Source
$root = Join-Path $env:LOCALAPPDATA 'HALVETH\TemporalShell'
$clock = Join-Path $root 'HALVETH.Clock.exe'
$shell = Join-Path $root 'Shell.ps1'
foreach ($required in @($clock, $shell)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
        throw "HALVETH pane file missing: $required"
    }
}

# The unique window name joins only the two panes launched here.
$window = 'HALVETH_LIVE_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$clockArgs = @('-w', $window, 'new-tab', '--title', 'HALVETH_CLOCK', $clock)
& $wt @clockArgs
if ($LASTEXITCODE -ne 0) { throw "HALVETH clock start failed: $LASTEXITCODE" }
Start-Sleep -Milliseconds 1100

# --size is the lower pane's fraction. The dial keeps the upper 54%.
$shellArgs = @('-w', $window, 'split-pane', '-H', '--size', '0.46',
    '--title', 'HALVETH_SHELL', 'powershell.exe', '-NoLogo', '-NoProfile',
    '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $shell)
& $wt @shellArgs
if ($LASTEXITCODE -ne 0) { throw "HALVETH shell split failed: $LASTEXITCODE" }
Write-Output "HALVETH window request completed: $window"
