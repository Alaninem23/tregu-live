$ErrorActionPreference = "Stop"

param(
  [string]$BaseUrl = "http://127.0.0.1:8000"
)

Write-Host "Querying $BaseUrl/api/integration/debug/counts" -ForegroundColor Cyan

try {
  $resp = Invoke-WebRequest -UseBasicParsing -Uri ("$BaseUrl/api/integration/debug/counts")
  $json = $resp.Content | ConvertFrom-Json
  Write-Host "Tenant:    $($json.tenant_id)"
  Write-Host "Inventory: $($json.inventory)"
  Write-Host "Customers: $($json.customers)"
  Write-Host "Orders:    $($json.orders)"
  Write-Host "Lines:     $($json.order_lines)"
} catch {
  Write-Error $_
  exit 1
}
