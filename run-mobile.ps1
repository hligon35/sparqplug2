param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $ExpoArgs
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

# Ensure the nvm symlink points at the pinned Node version.
& nvm use $version | Out-Null

# Ensure this session prefers the nvm-managed node.exe over Program Files.
if ($env:NVM_SYMLINK) {
  $env:Path = "$env:NVM_SYMLINK;$env:Path"
}

# Run the mobile dev server (dependency validation is disabled inside apps/mobile scripts).
& pnpm -C apps/mobile start @ExpoArgs
exit $LASTEXITCODE
