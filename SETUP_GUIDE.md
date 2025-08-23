# 🚀 Text Remover & Blur Tool - Setup Guide

This guide will help you set up and run the Text Remover & Blur Tool on any computer, even without technical knowledge.

## 📋 Prerequisites

**You need Python 3.7 or higher installed on your computer.**

### Check if Python is installed:
- **Windows**: Open Command Prompt and type `python --version`
- **Mac/Linux**: Open Terminal and type `python3 --version`

### If Python is not installed:
1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Download Python 3.11 or newer
3. Run the installer and **check "Add Python to PATH"**

## 🔧 Easy Setup (Recommended)

### Option 1: Automatic Setup
1. **Download/Clone** this project to your computer
2. **Double-click** `setup.py` to run automatic installation
3. Wait for setup to complete (may take 5-10 minutes)
4. Follow the on-screen instructions

### Option 2: Manual Setup
If automatic setup doesn't work:

**Windows:**
```cmd
python -m pip install -r requirements.txt
```

**Mac/Linux:**
```bash
python3 -m pip install -r requirements.txt
```

## 🏃‍♂️ Running the Application

### Easy Way:
- **Windows**: Double-click `run.bat`
- **Mac/Linux**: Double-click `run.sh`

### Manual Way:
**Windows:**
```cmd
python app.py
```

**Mac/Linux:**
```bash
python3 app.py
```

## 🌐 Using the Website

1. **Start the application** using one of the methods above
2. **Open your web browser** and go to: `http://localhost:5001`
3. **Upload an image** with text you want to remove or blur
4. **Choose operation**: Remove Text or Blur Text
5. **Paint over text areas** using the brush tool
6. **Process and download** your edited image

## 🛠️ Troubleshooting

### Common Issues:

**"Python not found"**
- Install Python from python.org
- Make sure to check "Add Python to PATH" during installation

**"Port 5001 already in use"**
- Close other applications using port 5001
- Or restart your computer

**"Module not found" errors**
- Run setup again: `python setup.py`
- Or manually install: `pip install -r requirements.txt`

**Application won't start**
- Check if all files are present
- Make sure you're in the correct folder
- Try running `python app.py` directly

### Getting Help:
1. Check this troubleshooting section
2. Try running setup again
3. Restart your computer and try again
4. Contact the developer with error messages

## 📁 Project Structure

```
ImageTextRemover/
├── app.py              # Main application
├── requirements.txt    # Dependencies
├── setup.py           # Automatic setup
├── run.bat            # Windows runner
├── run.sh             # Mac/Linux runner
├── templates/         # Web pages
├── static/           # CSS, JS, images
├── uploads/          # Uploaded images (auto-created)
├── processed/        # Processed images (auto-created)
└── README.md         # Documentation
```

## 🔄 Updating the Application

When you receive updates:
1. **Download** the new version
2. **Replace** old files with new ones
3. **Run setup** again if needed: `python setup.py`
4. **Restart** the application

## 🔒 Security Notes

- This application runs locally on your computer
- No images are sent to external servers
- All processing happens on your machine
- Safe to use with sensitive documents

## 💡 Tips

- **Brush Size**: Use smaller brushes for precise text removal
- **Opacity**: Lower opacity lets you see the image underneath
- **Undo**: Use the undo button to remove the last brush stroke
- **Clear All**: Start over with brush selection
- **File Formats**: Supports PNG, JPG, JPEG, GIF, BMP, WEBP
- **File Size**: Maximum 16MB per image

---

**Need help?** Contact the developer with any error messages you see.
