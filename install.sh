#!/bin/bash
# Image Processing Application - Installation Script
# This script sets up the application with all dependencies

echo "🖼️  Image Processing Application - Setup"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the image_processing directory"
    echo "   Make sure index.html exists in the current directory"
    exit 1
fi

echo "📁 Project directory verified"

# Create directories if they don't exist
mkdir -p lib
mkdir -p css
mkdir -p js
mkdir -p images

echo "📂 Directory structure verified"

# Download HEIF/HEIC support library
echo "📥 Downloading HEIF/HEIC support library..."
if command -v curl &> /dev/null; then
    curl -s -o lib/heic2any.min.js https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js
    if [ $? -eq 0 ]; then
        echo "✅ HEIF/HEIC library downloaded successfully"
    else
        echo "⚠️  Warning: Failed to download HEIF library - you can still use other formats"
    fi
elif command -v wget &> /dev/null; then
    wget -q -O lib/heic2any.min.js https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js
    if [ $? -eq 0 ]; then
        echo "✅ HEIF/HEIC library downloaded successfully"
    else
        echo "⚠️  Warning: Failed to download HEIF library - you can still use other formats"
    fi
else
    echo "⚠️  Warning: Neither curl nor wget found - HEIF library not downloaded"
    echo "   You can manually download from: https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js"
fi

# Check if SVG library exists
if [ -f "lib/svg.min.js" ]; then
    echo "✅ SVG processing library found"
else
    echo "⚠️  SVG processing library not found (should be created by the application)"
fi

# Verify core files exist
echo ""
echo "🔍 Verifying core application files..."

files=(
    "index.html"
    "css/styles.css"
    "js/app.js"
    "js/formatHandler.js"
    "js/imageProcessor.js"
    "js/processingPipeline.js"
    "js/uiController.js"
)

missing_files=()
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "❌ Error: Missing core application files:"
    printf '%s\n' "${missing_files[@]}"
    echo "   Please ensure all files are properly extracted/copied"
    exit 1
fi

# Check for sample images
echo ""
echo "🖼️  Checking for sample images..."
image_count=$(find images -name "*.JPG" -o -name "*.jpg" -o -name "*.jpeg" 2>/dev/null | wc -l)
if [ "$image_count" -gt 0 ]; then
    echo "✅ Found $image_count sample images in images/ directory"
else
    echo "ℹ️  No sample images found - you can add your own to the images/ directory"
fi

echo ""
echo "🚀 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Start a local web server:"
echo "   • Python: python -m http.server 8000"
echo "   • Node.js: npx http-server -p 8000"
echo "   • PHP: php -S localhost:8000"
echo ""
echo "2. Open http://localhost:8000 in your browser"
echo ""
echo "3. Test the application:"
echo "   • Upload an image from the images/ folder"
echo "   • Try compression and rotation features"
echo "   • Test the undo/redo functionality"
echo ""
echo "For more detailed instructions, see README.md"
echo "Happy image processing! 🎨"