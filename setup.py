#!/usr/bin/env python3
"""
Text Remover & Blur Tool - Setup Script
Automated installation script for easy deployment
"""

import subprocess
import sys
import os
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during {description}:")
        print(f"   {e.stderr}")
        return False

def check_python():
    """Check if Python 3.7+ is installed"""
    print("🔍 Checking Python installation...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 7:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} found")
        return True
    else:
        print(f"❌ Python 3.7+ required, found {version.major}.{version.minor}.{version.micro}")
        return False

def install_dependencies():
    """Install Python dependencies"""
    if not run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip"):
        return False
    
    if not run_command(f"{sys.executable} -m pip install -r requirements.txt", "Installing dependencies"):
        return False
    
    return True

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    directories = ['uploads', 'processed']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created {directory}/ directory")
    return True

def main():
    """Main setup function"""
    print("🚀 Text Remover & Blur Tool - Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python():
        print("\n❌ Setup failed: Please install Python 3.7 or higher")
        print("   Download from: https://www.python.org/downloads/")
        return False
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Setup failed: Could not install dependencies")
        return False
    
    # Create directories
    if not create_directories():
        print("\n❌ Setup failed: Could not create directories")
        return False
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Run the application:")
    
    if platform.system() == "Windows":
        print("   - Double-click 'run.bat' or")
        print("   - Run: python app.py")
    else:
        print("   - Double-click 'run.sh' or")
        print("   - Run: python3 app.py")
    
    print("2. Open your browser and go to: http://localhost:5001")
    print("3. Upload an image and start removing text!")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        input("\nPress Enter to exit...")
        sys.exit(1)
