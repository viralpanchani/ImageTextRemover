# Text Remover & Blur Tool

A web application that uses AI-powered text detection to remove or blur text from images.

## Features

- **Text Detection**: Uses EasyOCR for accurate text detection in images
- **Text Removal**: Removes detected text using OpenCV inpainting techniques
- **Text Blurring**: Applies Gaussian blur to detected text regions
- **Modern UI**: Clean, responsive interface with drag-and-drop file upload
- **Before/After Preview**: Side-by-side comparison of original and processed images
- **Download Support**: Download processed images directly

## Tech Stack

- **Backend**: Flask, OpenCV, EasyOCR, Pillow
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI/ML**: EasyOCR for text detection, OpenCV for image processing

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and navigate to `http://localhost:5000`

## Usage

1. **Upload Image** - Drag & drop or click to browse (PNG, JPG, JPEG, GIF, BMP, WEBP up to 16MB)
2. **Choose Operation** - Select either "Remove Text" or "Blur Text" 
3. **Paint Areas** - Click "Process Image" to open the brush tool
4. **Brush Controls**:
   - **Brush Size**: Adjust from 5px to 50px
   - **Opacity**: Control transparency (10% to 100%)
   - **Paint**: Click and drag to paint over text areas you want to process
   - **Clear All**: Remove all brush strokes
   - **Undo**: Remove the last brush stroke
5. **Process** - Click "Process Painted Areas" to apply the operation
6. **Review** - View the before/after comparison
7. **Download** - Save the processed image to your device

## Supported Formats

- PNG, JPG, JPEG, GIF, BMP, WEBP
- Maximum file size: 16MB

## How It Works

1. **Text Detection**: EasyOCR analyzes the image to identify text regions
2. **Text Removal**: Uses OpenCV's inpainting algorithm to seamlessly remove text
3. **Text Blurring**: Applies Gaussian blur to detected text areas
4. **Processing**: Returns both original and processed images for comparison

## Requirements

- Python 3.7+
- OpenCV
- EasyOCR
- Flask
- Pillow
- NumPy

## Note

First run may take longer as EasyOCR downloads language models.
