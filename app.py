from flask import Flask, request, jsonify, render_template, send_file
import cv2
import numpy as np
from PIL import Image, ImageFilter
import os
import uuid
from werkzeug.utils import secure_filename
import io
import base64
import ssl
import json

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create directories for uploads and processed images
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Initialize EasyOCR reader with SSL context fix (optional for smaller deployments)
reader = None
try:
    # Fix SSL certificate issue
    ssl._create_default_https_context = ssl._create_unverified_context
    import easyocr
    reader = easyocr.Reader(['en'])
    print("EasyOCR initialized successfully")
except ImportError:
    print("EasyOCR not installed - using OpenCV-based text detection")
except Exception as e:
    print(f"EasyOCR initialization failed: {e}")
    print("Will use OpenCV-based text detection as fallback")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_text_regions_opencv(image_path):
    """Fallback text detection using OpenCV EAST detector"""
    try:
        image = cv2.imread(image_path)
        if image is None:
            return []
        
        # Resize image for better detection
        orig = image.copy()
        (H, W) = image.shape[:2]
        
        # Set the new width and height and then determine the ratio
        (newW, newH) = (320, 320)
        rW = W / float(newW)
        rH = H / float(newH)
        
        # Resize the image and grab the new image dimensions
        image = cv2.resize(image, (newW, newH))
        (H, W) = image.shape[:2]
        
        # Convert to grayscale and apply threshold
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Use simple contour detection for text-like regions
        # Apply morphological operations to find text regions
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)
        
        # Apply threshold
        _, thresh = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        
        # Apply morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 1))
        connected = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        text_regions = []
        for contour in contours:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by size (likely text regions)
            if w > 15 and h > 8 and w < W * 0.8 and h < H * 0.8:
                # Scale back to original image size
                x = int(x * rW)
                y = int(y * rH)
                w = int(w * rW)
                h = int(h * rH)
                
                text_regions.append({
                    'bbox': [x, y, x + w, y + h],
                    'text': 'detected_text',
                    'confidence': 0.7
                })
        
        return text_regions
    except Exception as e:
        print(f"Error in OpenCV text detection: {e}")
        return []

def detect_text_regions(image_path):
    """Detect text regions in the image using EasyOCR or OpenCV fallback"""
    if reader is not None:
        try:
            results = reader.readtext(image_path)
            text_regions = []
            
            for (bbox, text, confidence) in results:
                if confidence > 0.5:  # Only consider high-confidence detections
                    # Convert bbox to rectangle coordinates
                    bbox = np.array(bbox, dtype=np.int32)
                    x_min = int(np.min(bbox[:, 0]))
                    y_min = int(np.min(bbox[:, 1]))
                    x_max = int(np.max(bbox[:, 0]))
                    y_max = int(np.max(bbox[:, 1]))
                    
                    text_regions.append({
                        'bbox': [x_min, y_min, x_max, y_max],
                        'text': text,
                        'confidence': confidence
                    })
            
            return text_regions
        except Exception as e:
            print(f"Error in EasyOCR text detection: {e}")
            print("Falling back to OpenCV detection")
    
    # Fallback to OpenCV-based detection
    return detect_text_regions_opencv(image_path)

def remove_text_from_image(image_path, output_path, brush_mask_path=None):
    """Remove text from image using inpainting"""
    try:
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Could not load image")
        
        if brush_mask_path:
            # Use brush mask directly
            mask = cv2.imread(brush_mask_path, cv2.IMREAD_GRAYSCALE)
            if mask is None:
                raise ValueError("Could not load brush mask")
            
            # Resize mask to match image if needed
            if mask.shape != image.shape[:2]:
                mask = cv2.resize(mask, (image.shape[1], image.shape[0]))
            
            # Ensure mask is binary
            _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
        else:
            # Fallback to automatic text detection
            text_regions = detect_text_regions(image_path)
            
            if not text_regions:
                # No text detected, save original image
                cv2.imwrite(output_path, image)
                return True
            
            # Create mask for text regions
            mask = np.zeros(image.shape[:2], dtype=np.uint8)
            
            for region in text_regions:
                x_min, y_min, x_max, y_max = region['bbox']
                # Expand the region slightly for better inpainting
                padding = 5
                x_min = max(0, x_min - padding)
                y_min = max(0, y_min - padding)
                x_max = min(image.shape[1], x_max + padding)
                y_max = min(image.shape[0], y_max + padding)
                
                cv2.rectangle(mask, (x_min, y_min), (x_max, y_max), 255, -1)
        
        # Apply inpainting to remove text
        result = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)
        
        # Save result
        cv2.imwrite(output_path, result)
        return True
        
    except Exception as e:
        print(f"Error in text removal: {e}")
        return False

def blur_text_in_image(image_path, output_path, brush_mask_path=None):
    """Blur text regions in the image"""
    try:
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Could not load image")
        
        if brush_mask_path:
            # Use brush mask to create blur effect
            mask = cv2.imread(brush_mask_path, cv2.IMREAD_GRAYSCALE)
            if mask is None:
                raise ValueError("Could not load brush mask")
            
            # Resize mask to match image if needed
            if mask.shape != image.shape[:2]:
                mask = cv2.resize(mask, (image.shape[1], image.shape[0]))
            
            # Normalize mask to 0-1 range for blending
            mask_normalized = mask.astype(np.float32) / 255.0
            
            # Create blurred version of entire image
            blurred_image = cv2.GaussianBlur(image, (15, 15), 0)
            
            # Blend original and blurred based on mask
            for c in range(3):  # For each color channel
                image[:, :, c] = (1 - mask_normalized) * image[:, :, c] + mask_normalized * blurred_image[:, :, c]
        else:
            # Fallback to automatic text detection
            text_regions = detect_text_regions(image_path)
            
            if not text_regions:
                # No text detected, save original image
                cv2.imwrite(output_path, image)
                return True
            
            # Apply blur to each text region
            for region in text_regions:
                x_min, y_min, x_max, y_max = region['bbox']
                
                # Extract the text region
                text_area = image[y_min:y_max, x_min:x_max]
                
                # Apply Gaussian blur
                blurred_area = cv2.GaussianBlur(text_area, (15, 15), 0)
                
                # Replace the original region with blurred version
                image[y_min:y_max, x_min:x_max] = blurred_area
        
        # Save result
        cv2.imwrite(output_path, image)
        return True
        
    except Exception as e:
        print(f"Error in text blurring: {e}")
        return False

def image_to_base64(image_path):
    """Convert image to base64 string for frontend display"""
    try:
        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect-text', methods=['POST'])
def detect_text():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Generate unique filename
        filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Detect text regions
        text_regions = detect_text_regions(filepath)
        
        # Convert image to base64 for frontend display
        image_b64 = image_to_base64(filepath)
        
        if not image_b64:
            return jsonify({'error': 'Failed to process image'}), 500
        
        return jsonify({
            'success': True,
            'image': image_b64,
            'text_regions': text_regions,
            'filename': filename
        })
        
    except Exception as e:
        print(f"Text detection error: {e}")
        return jsonify({'error': 'An error occurred during text detection'}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        operation = request.form.get('operation', 'remove')  # 'remove' or 'blur'
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Generate unique filename
        filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Handle brush mask if provided
        brush_mask_path = None
        if 'brush_mask' in request.files:
            mask_file = request.files['brush_mask']
            if mask_file and mask_file.filename:
                mask_filename = f"mask_{filename}"
                brush_mask_path = os.path.join(UPLOAD_FOLDER, mask_filename)
                mask_file.save(brush_mask_path)
        
        # Process the image
        processed_filename = f"processed_{filename}"
        processed_filepath = os.path.join(PROCESSED_FOLDER, processed_filename)
        
        if operation == 'remove':
            success = remove_text_from_image(filepath, processed_filepath, brush_mask_path)
        elif operation == 'blur':
            success = blur_text_in_image(filepath, processed_filepath, brush_mask_path)
        else:
            return jsonify({'error': 'Invalid operation'}), 400
        
        if not success:
            return jsonify({'error': 'Failed to process image'}), 500
        
        # Clean up mask file if it was created
        if brush_mask_path and os.path.exists(brush_mask_path):
            os.remove(brush_mask_path)
        
        # Convert images to base64 for frontend display
        original_b64 = image_to_base64(filepath)
        processed_b64 = image_to_base64(processed_filepath)
        
        if not original_b64 or not processed_b64:
            return jsonify({'error': 'Failed to process images'}), 500
        
        return jsonify({
            'success': True,
            'original_image': original_b64,
            'processed_image': processed_b64,
            'filename': processed_filename,
            'operation': operation
        })
        
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({'error': 'An error occurred during processing'}), 500

@app.route('/download/<filename>')
def download_file(filename):
    try:
        filepath = os.path.join(PROCESSED_FOLDER, filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        print(f"Download error: {e}")
        return jsonify({'error': 'An error occurred during download'}), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=False, host='0.0.0.0', port=port)
