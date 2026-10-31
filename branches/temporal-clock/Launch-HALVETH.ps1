Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$env:HALVETH_CHILD = '1'

$wt = (Get-Command wt.exe -ErrorAction Stop).Source
$root = Join-Path $env:LOCALAPPDATA 'HALVETH\TemporalShell'
$clock = Join-Path $root 'HALVETH.Chronosphere.exe'
$shell = Join-Path $root 'Shell.ps1'
foreach ($required in @($clock, $shell)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
        throw "HALVETH pane file missing: $required"
    }
}

# Keep the command area full height. The vector clock is a small movable window.
$window = 'HALVETH_LIVE_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$shellArgs = @('-w', $window, 'new-tab',
    '--title', 'HALVETH_SHELL', 'powershell.exe', '-NoLogo', '-NoProfile',
    '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $shell)
& $wt @shellArgs
if ($LASTEXITCODE -ne 0) { throw "HALVETH shell start failed: $LASTEXITCODE" }
Start-Sleep -Milliseconds 450
Start-Process -FilePath $clock -WorkingDirectory $root | Out-Null
Write-Output "HALVETH shell and compact clock started: $window"
