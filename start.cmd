@echo off
chcp 65001 >nul
setlocal
pushd "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。
  echo 请先安装 https://nodejs.org/ 官网的 LTS 版，再重新双击本文件。
  pause
  popd
  exit /b 1
)
node server.mjs --port=4312 --open
popd
pause
