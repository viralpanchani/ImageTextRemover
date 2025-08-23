@echo off
setlocal EnableDelayedExpansion

title Text Remover Tool - One-Click Installer
color 0A

echo.
echo ================================================================
echo                 TEXT REMOVER TOOL - INSTALLER
echo ================================================================
echo.
echo This will automatically install everything you need and start the app.
echo No technical knowledge required!
echo.
echo What this installer does:
echo  1. Check if Python is installed
echo  2. Download and install Python if needed
echo  3. Install all required packages
echo  4. Start the application
echo.
echo Press any key to continue or close this window to cancel...
pause >nul

echo.
echo [1/4] Checking Python installation...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python is already installed
    goto :install_packages
)

echo ❌ Python not found. Installing Python automatically...

REM Create temp directory
if not exist "%TEMP%\TextRemoverInstall" mkdir "%TEMP%\TextRemoverInstall"
cd /d "%TEMP%\TextRemoverInstall"

echo.
echo [2/4] Downloading Python installer...

REM Download Python installer
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe' -OutFile 'python-installer.exe'}"

if not exist "python-installer.exe" (
    echo ❌ Failed to download Python installer
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo ✅ Python installer downloaded

echo.
echo [3/4] Installing Python (this may take a few minutes)...
echo Please wait and don't close this window...

REM Install Python silently with PATH
start /wait python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

REM Refresh environment variables
call refreshenv >nul 2>&1

REM Verify Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python installation failed
    echo Please restart your computer and try again.
    pause
    exit /b 1
)

echo ✅ Python installed successfully

REM Go back to project directory
cd /d "%~dp0"

:install_packages
echo.
echo [4/4] Installing application packages...

REM Upgrade pip first
python -m pip install --upgrade pip --quiet

REM Install requirements
python -m pip install -r requirements.txt --quiet

if %errorlevel% neq 0 (
    echo ❌ Failed to install packages
    echo Trying alternative installation method...
    python -m pip install Flask==2.3.3 opencv-python==4.8.1.78 Pillow==10.0.1 numpy==1.24.3 Werkzeug==2.3.7 easyocr==1.7.0 --quiet
)

echo ✅ All packages installed

REM Create directories
if not exist "uploads" mkdir uploads
if not exist "processed" mkdir processed

echo.
echo ================================================================
echo                    INSTALLATION COMPLETE!
echo ================================================================
echo.
echo Starting the Text Remover Tool...
echo.
echo The website will open at: http://localhost:5001
echo.
echo Instructions:
echo  1. Your web browser should open automatically
echo  2. If not, manually go to: http://localhost:5001
echo  3. Upload an image and start removing text!
echo  4. To stop: Close this window or press Ctrl+C
echo.
echo ================================================================

REM Start the application
echo Starting application...
timeout /t 3 >nul

REM Try to open browser
start http://localhost:5001 >nul 2>&1

REM Start the Flask app
python app.py

echo.
echo Application stopped.
echo To restart, just double-click this file again!
pause
