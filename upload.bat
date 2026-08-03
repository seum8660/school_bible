@echo off
setlocal

set "REMOTE=https://github.com/seum8660/school_bible.git"

echo ============================================
echo  school_bible - upload to GitHub
echo ============================================
echo.

cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] git command not found.
  echo         Install Git for Windows: https://git-scm.com/download/win
  goto end
)

echo Folder: %CD%
echo.

for /f "delims=" %%i in ('git rev-parse --show-toplevel 2^>nul') do set "TOP=%%i"
if defined TOP goto haverepo

echo This folder is not a git repository yet.
echo It will be connected to:
echo   %REMOTE%
echo.
echo Your existing files here will be kept and uploaded.
echo.
set /p GO=Continue? (y/n): 
if /i not "%GO%"=="y" goto end

echo.
echo [setup 1/3] git init
git init -b main
if errorlevel 1 ( echo [ERROR] git init failed. & goto end )

echo [setup 2/3] connect remote
git remote remove origin >nul 2>&1
git remote add origin "%REMOTE%"

echo [setup 3/3] fetch history
git fetch origin main
if errorlevel 1 (
  echo [ERROR] fetch failed - check network or sign in to GitHub.
  goto end
)
git reset --soft origin/main
echo       done.
echo.

:haverepo
for /f "delims=" %%i in ('git rev-parse --show-toplevel 2^>nul') do set "TOP=%%i"
cd /d "%TOP%"

echo [1/4] staging changes
git add -A

git diff --cached --quiet
if %errorlevel%==0 (
  echo       no changes - skip commit
) else (
  echo [2/4] commit
  git commit -m "update %date% %time%"
)

echo [3/4] pull
git branch --set-upstream-to=origin/main main >nul 2>&1
git pull --no-rebase -X ours --no-edit origin main
if errorlevel 1 (
  echo.
  echo [ERROR] pull failed - check for conflicts.
  goto end
)

echo [4/4] push
git push -u origin main
if errorlevel 1 (
  echo.
  echo [ERROR] push failed - check auth or network.
  goto end
)

echo.
echo ===== UPLOAD COMPLETE =====

:end
echo.
echo Press any key to close.
pause >nul
endlocal
