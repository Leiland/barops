$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$toolsDir = Join-Path $projectRoot ".tools"
$nodeDir = Join-Path $toolsDir "node-v20.20.2-win-x64"
New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null

if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
  $base = "https://nodejs.org/dist/v20.20.2/"
  $archive = Join-Path $toolsDir "node-v20.20.2-win-x64.zip"
  $checksums = Join-Path $toolsDir "SHASUMS256.txt"
  Invoke-WebRequest ($base + "node-v20.20.2-win-x64.zip") -OutFile $archive
  Invoke-WebRequest ($base + "SHASUMS256.txt") -OutFile $checksums
  $entry = Get-Content $checksums | Where-Object { $_ -match " node-v20.20.2-win-x64.zip$" }
  if (-not $entry) { throw "No se encontró el SHA-256 de Node." }
  $expected = ($entry -split "\s+")[0]
  $actual = (Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($expected -ne $actual) { throw "Falló la verificación SHA-256 de Node." }
  Expand-Archive -LiteralPath $archive -DestinationPath $toolsDir -Force
}

$env:PATH = "$nodeDir;$env:PATH"
$env:COREPACK_HOME = Join-Path $toolsDir "corepack"
$env:TEMP = Join-Path $toolsDir "tmp"
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Path $env:TEMP -Force | Out-Null
corepack enable
corepack prepare pnpm@10.34.6 --activate

$envFile = Join-Path $projectRoot ".env.local"
if (-not (Test-Path $envFile)) {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  Set-Content -LiteralPath $envFile -Value ("AUTH_SECRET=" + [Convert]::ToBase64String($bytes)) -Encoding ascii
}

Write-Host "Node $(& (Join-Path $nodeDir 'node.exe') --version) y pnpm $(& (Join-Path $nodeDir 'pnpm.cmd') --version) listos."
Write-Host "Abre .\barops-shell.cmd para usar pnpm en este proyecto."
