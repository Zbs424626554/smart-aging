# 设置 hosts 与生成 .env 示例（以管理员身份运行）

param(
  [Parameter(Mandatory=$true)] [string]$DevIP
)

$hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"
$entries = @(
  "$DevIP api.dev.local",
  "$DevIP family.dev.local",
  "$DevIP elderly.dev.local",
  "$DevIP nurse.dev.local"
)

Write-Host "Updating hosts file..."
foreach ($e in $entries) {
  $escaped = [Regex]::Escape($e)
  if (-not (Select-String -Path $hostsPath -Pattern ($escaped) -Quiet)) {
    Add-Content -Path $hostsPath -Value $e
  }
}

Write-Host "Writing env examples..."

@"
VITE_WS_URL=wss://api.dev.local/ws
VITE_SOCKET_IO_URL=https://api.dev.local
# 可选 TURN（如未部署可忽略）
VITE_TURN_URL=turns:turn.dev.local:5349
VITE_TURN_USER=sa
VITE_TURN_CRED=yourStrongPwd
"@ | Out-File -Encoding utf8 apps\family-app\.env.development

Copy-Item apps\family-app\.env.development apps\elderly-app\.env.development -Force
Copy-Item apps\family-app\.env.development apps\nurse-app\.env.development -Force

@"
ALLOW_CORS_ALL=1
"@ | Out-File -Encoding utf8 server\.env

Write-Host "Done. Please restart backend and frontends, and start nginx." -ForegroundColor Green

