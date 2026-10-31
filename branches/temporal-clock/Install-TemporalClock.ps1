param([switch]$Launch)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$publish = Join-Path $source 'publish'
$exe = Join-Path $publish 'HALVETH.Clock.exe'
$launcher = Join-Path $source 'Launch-HALVETH.ps1'
$shell = Join-Path $source 'Shell.ps1'
$target = Join-Path $env:LOCALAPPDATA 'HALVETH\TemporalShell'
$backupRoot = Join-Path $env:LOCALAPPDATA 'HALVETH\backup'
$runtimeFiles = @('HALVETH.Clock.exe', 'HALVETH.Clock.dll',
    'HALVETH.Clock.deps.json', 'HALVETH.Clock.runtimeconfig.json')

foreach ($required in @($runtimeFiles | ForEach-Object { Join-Path $publish $_ }) +
    @($launcher, $shell)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
        throw "Built file missing: $required"
    }
}
& $exe --self-test
if ($LASTEXITCODE -ne 0) { throw 'Published clock self-test failed.' }
foreach ($script in @($launcher, $shell)) {
    $tokens = $null
    $errors = $null
    [void][System.Management.Automation.Language.Parser]::ParseFile($script, [ref]$tokens, [ref]$errors)
    if ($errors.Count -gt 0) { throw "PowerShell parser rejected $script : $errors" }
}

New-Item -ItemType Directory -Path $target, $backupRoot -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $backupRoot "temporal-clock-$stamp"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($name in $runtimeFiles + @('Launch-HALVETH.ps1', 'Shell.ps1')) {
    $prior = Join-Path $target $name
    if (Test-Path -LiteralPath $prior -PathType Leaf) {
        Copy-Item -LiteralPath $prior -Destination (Join-Path $backup $name) -Force
    }
}

foreach ($name in $runtimeFiles) {
    Copy-Item -LiteralPath (Join-Path $publish $name) -Destination (Join-Path $target $name) -Force
}
Copy-Item -LiteralPath $launcher -Destination (Join-Path $target 'Launch-HALVETH.ps1') -Force
Copy-Item -LiteralPath $shell -Destination (Join-Path $target 'Shell.ps1') -Force
& (Join-Path $target 'HALVETH.Clock.exe') --self-test
if ($LASTEXITCODE -ne 0) { throw 'Installed clock self-test failed.' }

Write-Output "Installed: $target"
Write-Output "Backup: $backup"
if ($Launch) { & (Join-Path $target 'Launch-HALVETH.ps1') }
