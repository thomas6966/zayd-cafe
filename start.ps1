# ZAYD Cafe: frontend + tunnel + backend (bot) ni ishga tushiradi va yangi linkni chiqaradi
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$log = Join-Path $root 'logs'
New-Item -ItemType Directory -Force $log | Out-Null

# Eskilarini to'xtatish (5173 va 3000 portlar, cloudflared)
foreach ($port in 5173, 3000) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force

# 1) Frontend
Start-Process -WindowStyle Minimized -WorkingDirectory (Join-Path $root 'frontend') -FilePath 'cmd.exe' `
  -ArgumentList '/c', "npm run dev > `"$log\frontend.log`" 2>&1"

# 2) Tunnel (ro'yxatdan o'tish shart emas)
$cf = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $cf) { $cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }
Remove-Item "$log\tunnel.log", "$log\tunnel.out" -ErrorAction SilentlyContinue
Start-Process -WindowStyle Hidden -FilePath $cf -ArgumentList 'tunnel', '--url', 'http://localhost:5173' `
  -RedirectStandardError "$log\tunnel.log" -RedirectStandardOutput "$log\tunnel.out"

$url = $null
for ($i = 0; $i -lt 40 -and -not $url; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path "$log\tunnel.log") {
    $m = Select-String -Path "$log\tunnel.log" -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($m) { $url = $m.Matches[0].Value }
  }
}
if (-not $url) { throw "Tunnel linki olinmadi. logs\tunnel.log ni tekshiring." }

# 3) .env ga yozish
$envFile = Join-Path $root '.env'
$txt = Get-Content $envFile -Raw
$txt = [regex]::Replace($txt, '(?m)^WEBAPP_URL=.*$', "WEBAPP_URL=`"$url`"")
Set-Content $envFile $txt -NoNewline -Encoding UTF8

# 4) Backend + bot
Start-Process -WindowStyle Minimized -WorkingDirectory $root -FilePath 'cmd.exe' `
  -ArgumentList '/c', "node src/index.js > `"$log\backend.log`" 2>&1"

Start-Sleep -Seconds 6
Write-Host ''
Write-Host "Mini App : $url"
Write-Host "Admin    : $url/admin"
