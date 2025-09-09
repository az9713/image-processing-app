@echo off
REM Image Processing Application - Windows Installation Script
REM This script sets up the application with all dependencies

echo.
echo 🖼️  Image Processing Application - Setup
echo ========================================

REM Check if we're in the right directory
if not exist "index.html" (
    echo ❌ Error: Please run this script from the image_processing directory
    echo    Make sure index.html exists in the current directory
    pause
    exit /b 1
)

echo 📁 Project directory verified

REM Create directories if they don't exist
if not exist "lib" mkdir lib
if not exist "css" mkdir css
if not exist "js" mkdir js
if not exist "images" mkdir images

echo 📂 Directory structure verified

REM Try to download HEIF/HEIC support library using PowerShell
echo 📥 Downloading HEIF/HEIC support library...

powershell -Command "try { Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js' -OutFile 'lib/heic2any.min.js' -UseBasicParsing; echo '✅ HEIF/HEIC library downloaded successfully' } catch { echo '⚠️  Warning: Failed to download HEIF library - you can still use other formats' }" 2>nul

if not exist "lib/heic2any.min.js" (
    echo ⚠️  Warning: HEIF library not downloaded automatically
    echo    You can manually download from: https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js
    echo    Save it as lib/heic2any.min.js
)

REM Check if SVG library exists
if exist "lib\svg.min.js" (
    echo ✅ SVG processing library found
) else (
    echo ⚠️  SVG processing library not found ^(should be created by the application^)
)

echo.
echo 🔍 Verifying core application files...

REM Check core files
set missing_files=0

if exist "index.html" (echo ✅ index.html) else (echo ❌ Missing: index.html & set missing_files=1)
if exist "css\styles.css" (echo ✅ css/styles.css) else (echo ❌ Missing: css/styles.css & set missing_files=1)
if exist "js\app.js" (echo ✅ js/app.js) else (echo ❌ Missing: js/app.js & set missing_files=1)
if exist "js\formatHandler.js" (echo ✅ js/formatHandler.js) else (echo ❌ Missing: js/formatHandler.js & set missing_files=1)
if exist "js\imageProcessor.js" (echo ✅ js/imageProcessor.js) else (echo ❌ Missing: js/imageProcessor.js & set missing_files=1)
if exist "js\processingPipeline.js" (echo ✅ js/processingPipeline.js) else (echo ❌ Missing: js/processingPipeline.js & set missing_files=1)
if exist "js\uiController.js" (echo ✅ js/uiController.js) else (echo ❌ Missing: js/uiController.js & set missing_files=1)

if %missing_files%==1 (
    echo.
    echo ❌ Error: Missing core application files
    echo    Please ensure all files are properly extracted/copied
    pause
    exit /b 1
)

echo.
echo 🖼️  Checking for sample images...

REM Count image files
set image_count=0
for %%f in (images\*.jpg images\*.jpeg images\*.JPG images\*.JPEG images\*.png images\*.PNG) do (
    if exist "%%f" set /a image_count+=1
)

if %image_count% gtr 0 (
    echo ✅ Found %image_count% sample images in images/ directory
) else (
    echo ℹ️  No sample images found - you can add your own to the images/ directory
)

echo.
echo 🚀 Installation complete!
echo.
echo Next steps:
echo 1. Start a local web server:
echo    • Python: python -m http.server 8000
echo    • Node.js: npx http-server -p 8000
echo    • PHP: php -S localhost:8000
echo    • Or use VS Code with Live Server extension
echo.
echo 2. Open http://localhost:8000 in your browser
echo.
echo 3. Test the application:
echo    • Upload an image from the images/ folder
echo    • Try compression and rotation features
echo    • Test the undo/redo functionality
echo.
echo For more detailed instructions, see README.md
echo Happy image processing! 🎨
echo.
pause