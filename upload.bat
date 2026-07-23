@echo off
chcp 65001 >nul
cd /d "C:\Users\user\Documents\GitHub\school_bible"
git add -A
git commit -m "update %date% %time%"
git push
echo.
echo ===== 업로드 완료 =====
pause
