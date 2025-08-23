#!/bin/bash

# Text Remover Tool - One-Click Installer for Mac/Linux
# No technical knowledge required!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "================================================================"
echo "                 TEXT REMOVER TOOL - INSTALLER"
echo "================================================================"
echo ""
echo "This will automatically install everything you need and start the app."
echo "No technical knowledge required!"
echo ""
echo "What this installer does:"
echo "  1. Check if Python is installed"
echo "  2. Install Python if needed (via system package manager)"
echo "  3. Install all required packages"
echo "  4. Start the application"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo -e "${BLUE}[1/4] Checking Python installation...${NC}"

# Check if Python 3 is installed
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    echo -e "${GREEN}✅ Python $PYTHON_VERSION is already installed${NC}"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [[ $PYTHON_VERSION == 3.* ]]; then
        echo -e "${GREEN}✅ Python $PYTHON_VERSION is already installed${NC}"
        PYTHON_CMD="python"
    else
        echo -e "${RED}❌ Python 2 found, need Python 3${NC}"
        PYTHON_CMD=""
    fi
else
    echo -e "${RED}❌ Python not found${NC}"
    PYTHON_CMD=""
fi

# Install Python if not found
if [ -z "$PYTHON_CMD" ]; then
    echo ""
    echo -e "${BLUE}[2/4] Installing Python...${NC}"
    
    # Detect OS and install Python
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Installing Python via Homebrew..."
            brew install python3
            PYTHON_CMD="python3"
        else
            echo -e "${YELLOW}Please install Homebrew first or download Python from python.org${NC}"
            echo "1. Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo "2. Or download Python from: https://www.python.org/downloads/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            # Ubuntu/Debian
            echo "Installing Python via apt..."
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv
            PYTHON_CMD="python3"
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            echo "Installing Python via yum..."
            sudo yum install -y python3 python3-pip
            PYTHON_CMD="python3"
        elif command -v dnf &> /dev/null; then
            # Fedora
            echo "Installing Python via dnf..."
            sudo dnf install -y python3 python3-pip
            PYTHON_CMD="python3"
        else
            echo -e "${RED}❌ Unsupported Linux distribution${NC}"
            echo "Please install Python 3.7+ manually from your package manager"
            exit 1
        fi
    else
        echo -e "${RED}❌ Unsupported operating system${NC}"
        echo "Please install Python 3.7+ manually from python.org"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Python installed successfully${NC}"
else
    echo -e "${BLUE}[2/4] Python already available, skipping installation${NC}"
fi

echo ""
echo -e "${BLUE}[3/4] Installing application packages...${NC}"

# Upgrade pip first
$PYTHON_CMD -m pip install --upgrade pip --quiet --user

# Install requirements
if [ -f "requirements.txt" ]; then
    $PYTHON_CMD -m pip install -r requirements.txt --quiet --user
else
    # Fallback installation
    $PYTHON_CMD -m pip install Flask==2.3.3 opencv-python==4.8.1.78 Pillow==10.0.1 numpy==1.24.3 Werkzeug==2.3.7 easyocr==1.7.0 --quiet --user
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install packages${NC}"
    echo "Trying alternative installation method..."
    $PYTHON_CMD -m pip install Flask opencv-python Pillow numpy Werkzeug easyocr --quiet --user
fi

echo -e "${GREEN}✅ All packages installed${NC}"

echo ""
echo -e "${BLUE}[4/4] Setting up directories...${NC}"

# Create directories
mkdir -p uploads processed

echo -e "${GREEN}✅ Setup complete${NC}"

echo ""
echo "================================================================"
echo "                    INSTALLATION COMPLETE!"
echo "================================================================"
echo ""
echo "Starting the Text Remover Tool..."
echo ""
echo "The website will open at: http://localhost:5001"
echo ""
echo "Instructions:"
echo "  1. Your web browser should open automatically"
echo "  2. If not, manually go to: http://localhost:5001"
echo "  3. Upload an image and start removing text!"
echo "  4. To stop: Press Ctrl+C in this terminal"
echo ""
echo "================================================================"

# Start the application
echo "Starting application..."
sleep 3

# Try to open browser
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:5001 &> /dev/null &
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:5001 &> /dev/null &
fi

# Start the Flask app
$PYTHON_CMD app.py

echo ""
echo "Application stopped."
echo "To restart, just run this script again!"
