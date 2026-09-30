@echo off
setlocal
cd /d "%~dp0"
if not exist data\inbox mkdir data\inbox
echo.
echo Site777の4円パチンコ機種ページをブラウザで開き、
echo Ctrl+S で「Webページ、HTMLのみ」として data\inbox に保存してください。
echo 海物語系は保存不要です。
echo.
echo 保存が終わったら何かキーを押してください。
pause >nul
node src\importers\import-saved-pages.js data\inbox
echo.
echo 取込結果: data\manifest\import-report.json
pause
