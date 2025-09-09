# Git Bash Quick Start Guide

## 🚀 Running the Image Processing App in Git Bash on Windows

**Git Bash is perfect for this application!** It provides Unix-like commands on Windows, making the setup process smooth and familiar.

### ⚡ Super Quick Start (2 minutes)

```bash
# 1. Open Git Bash and navigate to the project folder
cd /c/Users/$(whoami)/Downloads/image_processing

# 2. Run the automated installer
chmod +x install.sh && ./install.sh

# 3. Start the web server
python -m http.server 8000

# 4. Open your browser to http://localhost:8000
# That's it! 🎉
```

### 📋 Step-by-Step Instructions

#### Step 1: Open Git Bash
- Right-click in Windows Explorer → "Git Bash Here"
- Or open Git Bash and navigate manually

#### Step 2: Navigate to Project
```bash
# Option A: Unix-style path (recommended)
cd /c/Users/YourName/Downloads/image_processing

# Option B: Windows path with quotes
cd "C:\Users\YourName\Downloads\image_processing"

# Option C: Use current user automatically
cd /c/Users/$(whoami)/Downloads/image_processing
```

#### Step 3: Verify Project Files
```bash
# Check if you're in the right place
ls -la
# You should see: index.html, css/, js/, lib/, images/
```

#### Step 4: Run Installation Script
```bash
# Make the script executable
chmod +x install.sh

# Run the installer
./install.sh

# The script will:
# ✅ Verify all files are present
# ✅ Download HEIF/HEIC library
# ✅ Check dependencies
# ✅ Give you next steps
```

#### Step 5: Start Web Server
```bash
# Option A: Python (most common)
python -m http.server 8000

# Option B: Node.js (if you have it)
npx http-server -p 8000

# Option C: PHP (if you have it)
php -S localhost:8000
```

#### Step 6: Open Application
- Open your browser
- Go to `http://localhost:8000`
- Start processing images! 🖼️

### 🛠️ Troubleshooting in Git Bash

#### Problem: "python: command not found"
```bash
# Check if Python is installed
which python
python --version

# If not installed, download from python.org
# Or try python3 instead of python
python3 -m http.server 8000
```

#### Problem: "Permission denied"
```bash
# Fix script permissions
chmod +x install.sh
chmod +x *.sh

# Try running with explicit bash
bash install.sh
```

#### Problem: "curl: command not found" in install script
```bash
# Git Bash usually has curl, but if not:
# Download manually using PowerShell
powershell -c "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js' -OutFile 'lib/heic2any.min.js'"
```

#### Problem: Path issues
```bash
# Use forward slashes in Git Bash
cd /c/path/to/your/project

# Or use the automatic user detection
cd /c/Users/$(whoami)/Downloads/image_processing

# Check current directory
pwd
```

#### Problem: Server starts but can't access in browser
```bash
# Make sure you're using the right URL
echo "Open: http://localhost:8000"

# Check if the server is running
netstat -an | grep 8000

# Try a different port if 8000 is busy
python -m http.server 8080
# Then use http://localhost:8080
```

### 🎯 Git Bash Advantages

**Why Git Bash is great for this project:**
- ✅ Unix commands work perfectly (`ls`, `cd`, `chmod`, `curl`)
- ✅ The `install.sh` script runs natively
- ✅ Python/Node.js servers work normally
- ✅ No need for separate terminal or command prompt
- ✅ Familiar environment for developers
- ✅ Better path handling than Windows CMD

### 🚦 Quick Status Check

After setup, verify everything works:

```bash
# Check project structure
ls -la
# Should show: index.html, css/, js/, lib/, images/

# Check if HEIF library downloaded
ls -la lib/
# Should show: heic2any.min.js, svg.min.js

# Check if server is running
curl -s http://localhost:8000 | head -5
# Should show HTML content

# Test with sample image
ls images/
# Should show *.JPG files for testing
```

### 💡 Pro Tips for Git Bash Users

```bash
# Create an alias for quick server start
echo 'alias imgserver="cd /c/Users/$(whoami)/Downloads/image_processing && python -m http.server 8000"' >> ~/.bashrc

# Now you can just type 'imgserver' from anywhere!

# Quick project navigation
echo 'alias imgproj="cd /c/Users/$(whoami)/Downloads/image_processing"' >> ~/.bashrc

# Reload bash configuration
source ~/.bashrc
```

### 🎉 You're Ready!

Once you see the server running message:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

Open `http://localhost:8000` in your browser and enjoy processing images!

---

**Need more help?** Check the main `README.md` for detailed troubleshooting and advanced features.