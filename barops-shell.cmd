@echo off
setlocal
set "BAROPS_ROOT=%~dp0"
if not exist "%BAROPS_ROOT%.tools\node-v20.20.2-win-x64\node.exe" (
  echo Ejecuta primero: powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
  exit /b 1
)
set "PATH=%BAROPS_ROOT%.tools\node-v20.20.2-win-x64;%PATH%"
set "COREPACK_HOME=%BAROPS_ROOT%.tools\corepack"
set "TEMP=%BAROPS_ROOT%.tools\tmp"
set "TMP=%TEMP%"
set "npm_config_store_dir=%BAROPS_ROOT%.tools\pnpm-store"
set "PLAYWRIGHT_BROWSERS_PATH=%BAROPS_ROOT%.tools\playwright-browsers"
powershell.exe -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%BAROPS_ROOT%'"
