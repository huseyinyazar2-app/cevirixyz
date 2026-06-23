@echo off
echo AI Ceviri Odasi Baslatiliyor...
echo Tarayicida http://localhost:3696 adresi acilacak.
cd /d "%~dp0"
start http://localhost:3696
npm run dev -- -p 3696
