@echo off
setlocal enabledelayedexpansion

:: Release Helper Script for Interview Preparation App (Windows)
:: This script helps create tags and trigger releases

echo 🎯 Interview Preparation App - Release Helper
echo =============================================

:: Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not in a git repository!
    exit /b 1
)

:: Check if we're on main branch
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i
if not "!current_branch!"=="main" (
    echo [WARNING] You're on branch '!current_branch!', not 'main'. Continue? (y/N)
    set /p response=
    if /i not "!response!"=="y" (
        echo [INFO] Cancelled.
        exit /b 0
    )
)

:: Check for uncommitted changes
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo [WARNING] You have uncommitted changes. They will be committed with the version bump. Continue? (y/N)
    set /p response=
    if /i not "!response!"=="y" (
        echo [INFO] Cancelled. Please commit or stash your changes first.
        exit /b 0
    )
)

:: Get current version
for /f "tokens=2 delims=:, " %%i in ('findstr "version" package.json') do (
    set current_version=%%i
    set current_version=!current_version:"=!
    goto :found_version
)
:found_version

echo [INFO] Current version in package.json: !current_version!
echo.

:: Get version from user
if "%1"=="" (
    set /p version="Enter new version (e.g., v1.0.0): "
) else (
    set version=%1
)

:: Validate version format (basic check)
echo !version! | findstr /r "^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
if errorlevel 1 (
    echo [ERROR] Invalid version format. Use vX.Y.Z (e.g., v1.0.0)
    exit /b 1
)

:: Check if tag already exists
git rev-parse !version! >nul 2>&1
if not errorlevel 1 (
    echo [ERROR] Tag !version! already exists!
    exit /b 1
)

:: Get version without 'v' prefix
set version_no_v=!version:~1!

:: Confirm with user
echo.
echo [INFO] This will:
echo   1. Update package.json version to !version_no_v!
echo   2. Commit the version bump
echo   3. Create and push tag !version!
echo   4. Trigger GitHub Actions to build binaries
echo.
set /p response="Continue? (y/N): "

if /i "!response!"=="y" (
    echo [INFO] Updating package.json version to !version_no_v!
    
    :: Update package.json version (basic sed-like replacement)
    powershell -Command "(Get-Content package.json) -replace '\"version\": \".*\"', '\"version\": \"!version_no_v!\"' | Set-Content package.json"
    
    :: Update web/package.json if it exists
    if exist "web\package.json" (
        echo [INFO] Updating web/package.json version to !version_no_v!
        powershell -Command "(Get-Content web\package.json) -replace '\"version\": \".*\"', '\"version\": \"!version_no_v!\"' | Set-Content web\package.json"
        git add web\package.json
    )
    
    echo [INFO] Creating tag !version!
    git add package.json
    git commit -m "Bump version to !version!"
    
    git tag -a "!version!" -m "Release !version!"
    
    echo [INFO] Pushing tag !version! to origin
    git push origin main
    git push origin "!version!"
    
    echo.
    echo [INFO] Tag !version! created and pushed successfully!
    echo [INFO] GitHub Actions will now build the binaries automatically.
    
    :: Get repository URL for display
    for /f "tokens=*" %%i in ('git remote get-url origin') do set repo_url=%%i
    set repo_url=!repo_url:https://github.com/=!
    set repo_url=!repo_url:.git=!
    
    echo [INFO] Check the progress at: https://github.com/!repo_url!/actions
    echo [INFO] Binaries will be available at: https://github.com/!repo_url!/releases/tag/!version!
    echo.
    echo [INFO] Release process initiated! 🚀
) else (
    echo [INFO] Cancelled.
)

pause
