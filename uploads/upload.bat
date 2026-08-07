@echo off
chcp 65001 >nul
cd /d "C:\Users\user\Documents\GitHub\school_bible"
git add -A
git commit -m "update %date% %time%"
git pull --no-rebase -X ours --no-edit
git push
echo.
echo ===== 업로드 완료 =====
pause
