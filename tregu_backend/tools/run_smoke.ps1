$ErrorActionPreference = 'Stop'

function Wait-Health {
  param([string]$Url, [int]$TimeoutSec = 30)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-RestMethod -UseBasicParsing -Uri "$Url/healthz" -Method Get
      if ($r.ok -eq $true) { return $true }
    } catch { Start-Sleep -Milliseconds 500 }
  }
  throw "Health check failed: $Url/healthz"
}

function Start-Backend {
  param([string]$BackendDir, [string]$ApiHost = '127.0.0.1', [int]$Port = 8003)
  Write-Host "Starting backend..." -ForegroundColor Cyan
  $env:ENABLE_RATE_LIMIT = '0'
  $py = Join-Path $BackendDir '.venv312\\Scripts\\python.exe'
  if (-not (Test-Path $py)) { throw "Python venv not found: $py" }
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $py
  $psi.Arguments = "-m uvicorn app.main:app --host $ApiHost --port $Port"
  $psi.WorkingDirectory = $BackendDir
  $psi.UseShellExecute = $true
  $proc = [System.Diagnostics.Process]::Start($psi)
  return $proc
}

function Stop-Backend { param($Proc) if ($Proc -and -not $Proc.HasExited) { $Proc.Kill(); $Proc.WaitForExit() } }

function Upload-File {
  param([string]$Api, [string]$Endpoint, [string]$FilePath)
  $url = "$Api/api/integration/upload/$Endpoint"
  $fileName = [System.IO.Path]::GetFileName($FilePath)
  $useCurl = $false
  try { Add-Type -AssemblyName System.Net.Http -ErrorAction Stop } catch { $useCurl = $true }

  if (-not $useCurl) {
    try {
      $handler = New-Object System.Net.Http.HttpClientHandler
      $client = New-Object System.Net.Http.HttpClient($handler)
      $mp = New-Object System.Net.Http.MultipartFormDataContent
      # add text field
      $srcContent = New-Object System.Net.Http.StringContent('csv:upload')
      $mp.Add($srcContent, 'source')
      # add file field
      $fs = [System.IO.File]::OpenRead($FilePath)
      $fileContent = New-Object System.Net.Http.StreamContent($fs)
      $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('text/csv')
      $mp.Add($fileContent, 'files', $fileName)
      $response = $client.PostAsync($url, $mp).Result
      $content = $response.Content.ReadAsStringAsync().Result
      if (-not $response.IsSuccessStatusCode) { throw "Upload failed: $($response.StatusCode) $content" }
      $r = $content | ConvertFrom-Json
      if (-not $r.ok) { throw "Upload failed: $content" }
      return $r.batch_id
    } finally {
      if ($fileContent) { $fileContent.Dispose() }
      if ($fs) { $fs.Dispose() }
      if ($mp) { $mp.Dispose() }
      if ($client) { $client.Dispose() }
      if ($handler) { $handler.Dispose() }
    }
  }

  # Fallback to curl.exe for multipart upload on Windows
  $curl = 'curl.exe'
  $formSource = "-F`"source=csv:upload`""
  $formFile = "-F`"files=@$FilePath;type=text/csv`""
  $curlArgs = @('-s','-S','-f',$formSource,$formFile,$url)
  $out = & $curl @curlArgs 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Upload via curl failed: $out" }
  $r = $out | ConvertFrom-Json
  if (-not $r.ok) { throw "Upload failed: $out" }
  return $r.batch_id
}

function MapValidate {
  param([string]$Api, [string]$Endpoint, [string]$BatchId, [hashtable]$Mapping)
  $body = @{ batch_id = $BatchId; mapping_json = ($Mapping | ConvertTo-Json -Compress) }
  $r = Invoke-RestMethod -UseBasicParsing -Uri "$Api/api/integration/map-validate/$Endpoint" -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
  return $r
}

function Invoke-ApplyBatch {
  param([string]$Api, [string]$Endpoint, [string]$BatchId)
  $body = @{ batch_id = $BatchId }
  $r = Invoke-RestMethod -UseBasicParsing -Uri "$Api/api/integration/apply/$Endpoint" -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
  return $r
}

function Get-Counts { param([string]$Api) Invoke-RestMethod -UseBasicParsing -Uri "$Api/api/integration/debug/counts" -Method Get }

# Paths
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backend = Join-Path $repoRoot 'tregu_backend'
$api = 'http://127.0.0.1:8003'
$invCsv = Join-Path $repoRoot 'tregu_frontend\public\templates\inventory.csv'
$cusCsv = Join-Path $repoRoot 'tregu_frontend\public\templates\customers.csv'
$ordCsv = Join-Path $repoRoot 'tregu_frontend\public\templates\orders.csv'

if (-not (Test-Path $invCsv)) { throw "Missing: $invCsv" }
if (-not (Test-Path $cusCsv)) { throw "Missing: $cusCsv" }
if (-not (Test-Path $ordCsv)) { throw "Missing: $ordCsv" }

$proc = $null
try {
  $proc = Start-Backend -BackendDir $backend
  Wait-Health -Url $api -TimeoutSec 30 | Out-Null

  # Inventory
  Write-Host "[1/3] Inventory: upload" -ForegroundColor Yellow
  $invBatch = Upload-File -Api $api -Endpoint 'inventory' -FilePath $invCsv
  Write-Output ("Inventory batch: {0}" -f $invBatch)
  $invMap = @{ sku='sku'; site_id='site_id'; bin='bin'; on_hand='on_hand'; allocated='allocated'; lot='lot'; serial='serial'; unit_cost='unit_cost' }
  $mv = MapValidate -Api $api -Endpoint 'inventory' -BatchId $invBatch -Mapping $invMap
  Write-Output ("Inventory map-validate errors: {0}" -f $mv.errors)
  $ap = Invoke-ApplyBatch -Api $api -Endpoint 'inventory' -BatchId $invBatch
  Write-Output ("Inventory applied: {0}" -f ($ap.applied))

  # Customers
  Write-Host "[2/3] Customers: upload" -ForegroundColor Yellow
  $cusBatch = Upload-File -Api $api -Endpoint 'customers' -FilePath $cusCsv
  Write-Output ("Customers batch: {0}" -f $cusBatch)
  $cusMap = @{ customer_code='customer_code'; name='name'; email='email'; phone='phone'; billing_address='billing_address'; shipping_address='shipping_address'; tags='tags' }
  $mv = MapValidate -Api $api -Endpoint 'customers' -BatchId $cusBatch -Mapping $cusMap
  Write-Output ("Customers map-validate errors: {0}" -f $mv.errors)
  $ap = Invoke-ApplyBatch -Api $api -Endpoint 'customers' -BatchId $cusBatch
  Write-Output ("Customers applied: {0}" -f ($ap.applied))

  # Orders
  Write-Host "[3/3] Orders: upload" -ForegroundColor Yellow
  $ordBatch = Upload-File -Api $api -Endpoint 'orders' -FilePath $ordCsv
  Write-Output ("Orders batch: {0}" -f $ordBatch)
  $ordMap = @{ order_no='order_no'; customer_code='customer_code'; order_date='order_date'; currency='currency'; sku='sku'; qty='qty'; unit_price='unit_price' }
  $mv = MapValidate -Api $api -Endpoint 'orders' -BatchId $ordBatch -Mapping $ordMap
  Write-Output ("Orders map-validate errors: {0}" -f $mv.errors)
  $ap = Invoke-ApplyBatch -Api $api -Endpoint 'orders' -BatchId $ordBatch
  Write-Output ("Orders applied: {0}" -f ($ap.applied))

  # Counts
  $counts = Get-Counts -Api $api | ConvertTo-Json -Depth 5
  Write-Host "[Final] Counts:" -ForegroundColor Green
  Write-Output $counts
}
finally {
  Stop-Backend -Proc $proc
}
