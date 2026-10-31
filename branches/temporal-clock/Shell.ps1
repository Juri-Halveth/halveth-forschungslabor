$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$env:HALVETH_CHILD = '1'
$flow = Join-Path $env:LOCALAPPDATA 'HALVETH\FLOWBOOT\Flow.Core.ps1'
$anchor = Join-Path $env:LOCALAPPDATA 'HALVETH\SHELL\ScarletTimeAnchor.ps1'
$final = Join-Path $env:LOCALAPPDATA 'HALVETH\SHELL\PromptFinalizer.ps1'
if (Test-Path -LiteralPath $flow) { . $flow }
if (Test-Path -LiteralPath $anchor) { . $anchor }
if (Test-Path -LiteralPath $final) { . $final }
Clear-Host
Write-Host 'HALVETH LIVE' -ForegroundColor Cyan -NoNewline
Write-Host '  |  Uhr oben · Arbeit hier' -ForegroundColor DarkGray
Write-Host ''
