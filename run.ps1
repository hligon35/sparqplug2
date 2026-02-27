param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $PnpmArgs
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$version = (Get-Content "$repoRoot\.nvmrc" -ErrorAction Stop | Select-Object -First 1).Trim()
if (-not $version) {
  throw "Unable to read Node version from .nvmrc"
}

if (-not (Get-Command nvm -ErrorAction SilentlyContinue)) {
  throw "nvm-windows is not available on PATH. Install nvm-windows or set up Node >=20 <23 manually."
}

& nvm use $version | Out-Null

if ($env:NVM_SYMLINK) {
  $env:Path = "$env:NVM_SYMLINK;$env:Path"
}

if (-not $PnpmArgs -or $PnpmArgs.Count -eq 0) {
  throw "No pnpm arguments provided. Example: ./run.ps1 run run:web"
}

& pnpm @PnpmArgs
exit $LASTEXITCODE
