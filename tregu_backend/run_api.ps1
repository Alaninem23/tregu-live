param(
  [string]$Port = "8003",
  [string]$Passphrase = ""
)

$ErrorActionPreference = "Stop"

# Move to the script's directory (project root)
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Prefer Python 3.12 for better wheel availability on Windows
$pyList = & py -0p 2>$null
$usePy312 = $false
if ($pyList -and ($pyList -match "3\.12")) { $usePy312 = $true }

$venvDir = if ($usePy312) { ".venv312" } else { ".venv" }
$venvActivate = Join-Path $PWD "$venvDir\Scripts\Activate.ps1"

# Ensure venv exists
if (-not (Test-Path $venvDir)) {
  Write-Host "Creating virtual environment $venvDir ..." -ForegroundColor Cyan
  if ($usePy312) { py -3.12 -m venv $venvDir } else { py -m venv $venvDir }
}

# Activate venv (bypass execution policy) in a sub-shell and capture python path
Write-Host "Activating $venvDir ..." -ForegroundColor Cyan
$capture = @"
& {
  . "$venvActivate"
  (Get-Command python).Source
}
"@
$pyPath = powershell -NoProfile -ExecutionPolicy Bypass -Command $capture
if (-not $pyPath) { $pyPath = (Join-Path $PWD "$venvDir\Scripts\python.exe") }
Write-Host "Python:" $pyPath -ForegroundColor DarkGray

# Install deps using the venv python
Write-Host "Installing requirements..." -ForegroundColor Cyan
& $pyPath -m pip install --upgrade pip
& $pyPath -m pip install -r .\requirements.txt
& $pyPath -m pip install uvicorn

# Set passphrase env var if provided or use existing env var
if ($Passphrase -ne "") {
  $env:TREGU_MASTER_PASSPHRASE = $Passphrase
} elseif (-not $env:TREGU_MASTER_PASSPHRASE) {
  # Fall back to a dev default (you can change this)
  $env:TREGU_MASTER_PASSPHRASE = "change-me-dev"
}

Write-Host "TREGU_MASTER_PASSPHRASE set." -ForegroundColor DarkGray
# Force SQLite fallback unless DATABASE_URL is already set
if (-not $env:DATABASE_URL) {
  $env:DATABASE_URL = "sqlite:///./tregu.db"
}
Write-Host "DATABASE_URL=$($env:DATABASE_URL)" -ForegroundColor DarkGray
Write-Host "Starting API on port $Port ..." -ForegroundColor Green

# Run the API (we're already in tregu_backend) using venv python
& $pyPath -m uvicorn app.main:app --port $Port
