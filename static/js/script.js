class TextRemoverApp {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.currentFilename = null;
        this.brushStrokes = [];
        this.currentStroke = [];
        this.isDrawing = false;
        this.brushSize = 20;
        this.brushOpacity = 0.6;
        this.canvasScale = { x: 1, y: 1 };
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.processBtn = document.getElementById('processBtn');
        this.loadingSection = document.getElementById('loadingSection');
        this.brushSelectionSection = document.getElementById('brushSelectionSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        this.selectionImage = document.getElementById('selectionImage');
        this.selectionCanvas = document.getElementById('selectionCanvas');
        this.brushSizeSlider = document.getElementById('brushSize');
        this.brushSizeValue = document.getElementById('brushSizeValue');
        this.brushOpacitySlider = document.getElementById('brushOpacity');
        this.brushOpacityValue = document.getElementById('brushOpacityValue');
        this.clearBrushBtn = document.getElementById('clearBrushBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.proceedBtn = document.getElementById('proceedBtn');
        this.originalImage = document.getElementById('originalImage');
        this.processedImage = document.getElementById('processedImage');
        this.processedTitle = document.getElementById('processedTitle');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newImageBtn = document.getElementById('newImageBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.errorText = document.getElementById('errorText');
    }

    attachEventListeners() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // File input change
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Button events
        this.processBtn.addEventListener('click', this.showBrushSelection.bind(this));
        this.clearBrushBtn.addEventListener('click', this.clearBrushStrokes.bind(this));
        this.undoBtn.addEventListener('click', this.undoLastStroke.bind(this));
        this.proceedBtn.addEventListener('click', this.processBrushedAreas.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        this.newImageBtn.addEventListener('click', this.resetApp.bind(this));
        this.retryBtn.addEventListener('click', this.hideError.bind(this));

        // Brush controls
        this.brushSizeSlider.addEventListener('input', this.updateBrushSize.bind(this));
        this.brushOpacitySlider.addEventListener('input', this.updateBrushOpacity.bind(this));

        // Canvas events for drawing
        this.selectionCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.selectionCanvas.addEventListener('mousemove', this.draw.bind(this));
        this.selectionCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.selectionCanvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.selectionCanvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.selectionCanvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.selectionCanvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('Please select a valid image file (PNG, JPG, JPEG, GIF, BMP, WEBP)');
            return;
        }

        // Validate file size (16MB)
        if (file.size > 16 * 1024 * 1024) {
            this.showError('File size must be less than 16MB');
            return;
        }

        // Store the file and enable process button
        this.selectedFile = file;
        this.processBtn.disabled = false;
        
        // Update upload area to show selected file
        this.updateUploadArea(file.name);
    }

    updateUploadArea(filename) {
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <i class="fas fa-check-circle upload-icon" style="color: #28a745;"></i>
            <h3>File Selected: ${filename}</h3>
            <p>Click "Process Image" to continue or select a different file</p>
        `;
    }

    showBrushSelection() {
        if (!this.selectedFile) {
            this.showError('Please select an image first');
            return;
        }

        this.hideAllSections();
        
        // Create object URL for the selected file
        const imageUrl = URL.createObjectURL(this.selectedFile);
        this.selectionImage.src = imageUrl;
        
        this.selectionImage.onload = () => {
            this.setupCanvas();
            this.clearBrushStrokes();
            URL.revokeObjectURL(imageUrl); // Clean up
        };
        
        this.brushSelectionSection.style.display = 'block';
        this.updateProceedButton();
    }

    async processBrushedAreas() {
        if (this.brushStrokes.length === 0) {
            this.showError('Please paint some areas first');
            return;
        }

        const operation = document.querySelector('input[name="operation"]:checked').value;
        
        // Show loading
        this.showLoading();

        try {
            // Create brush mask
            const maskCanvas = document.createElement('canvas');
            const maskCtx = maskCanvas.getContext('2d');
            maskCanvas.width = this.selectionImage.naturalWidth;
            maskCanvas.height = this.selectionImage.naturalHeight;
            
            // Fill with black background
            maskCtx.fillStyle = 'black';
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
            
            // Draw brush strokes on mask in white
            maskCtx.strokeStyle = 'white';
            maskCtx.fillStyle = 'white';
            maskCtx.globalCompositeOperation = 'source-over';
            
            this.brushStrokes.forEach(stroke => {
                if (stroke.length > 0) {
                    const scaledSize = stroke[0].size * Math.max(this.canvasScale.x, this.canvasScale.y);
                    maskCtx.lineWidth = scaledSize;
                    maskCtx.lineCap = 'round';
                    maskCtx.lineJoin = 'round';
                    
                    if (stroke.length === 1) {
                        // Single point - draw circle
                        const scaledX = stroke[0].x * this.canvasScale.x;
                        const scaledY = stroke[0].y * this.canvasScale.y;
                        maskCtx.beginPath();
                        maskCtx.arc(scaledX, scaledY, scaledSize / 2, 0, 2 * Math.PI);
                        maskCtx.fill();
                    } else {
                        // Multiple points - draw path
                        maskCtx.beginPath();
                        maskCtx.moveTo(stroke[0].x * this.canvasScale.x, stroke[0].y * this.canvasScale.y);
                        stroke.forEach(point => {
                            maskCtx.lineTo(point.x * this.canvasScale.x, point.y * this.canvasScale.y);
                        });
                        maskCtx.stroke();
                        
                        // Also draw circles at each point for better coverage
                        stroke.forEach(point => {
                            maskCtx.beginPath();
                            maskCtx.arc(point.x * this.canvasScale.x, point.y * this.canvasScale.y, scaledSize / 2, 0, 2 * Math.PI);
                            maskCtx.fill();
                        });
                    }
                }
            });
            
            // Convert mask to blob
            const maskBlob = await new Promise(resolve => maskCanvas.toBlob(resolve, 'image/png'));
            
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            formData.append('operation', operation);
            formData.append('brush_mask', maskBlob, 'mask.png');

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showResults(result, operation);
            } else {
                this.showError(result.error || 'An error occurred during processing');
            }
        } catch (error) {
            console.error('Process error:', error);
            this.showError('Network error. Please check your connection and try again.');
        }
    }

    showLoading() {
        this.hideAllSections();
        this.loadingSection.style.display = 'block';
    }

    showResults(result, operation) {
        this.hideAllSections();
        
        // Set images
        this.originalImage.src = `data:image/jpeg;base64,${result.original_image}`;
        this.processedImage.src = `data:image/jpeg;base64,${result.processed_image}`;
        
        // Update title based on operation
        this.processedTitle.textContent = operation === 'remove' ? 'Text Removed' : 'Text Blurred';
        
        // Store filename for download
        this.currentFilename = result.filename;
        
        this.resultsSection.style.display = 'block';
    }

    async downloadImage() {
        if (!this.currentFilename) {
            this.showError('No processed image available for download');
            return;
        }

        try {
            const response = await fetch(`/download/${this.currentFilename}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = this.currentFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                this.showError('Failed to download image');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Network error during download');
        }
    }

    showError(message) {
        this.hideAllSections();
        this.errorText.textContent = message;
        this.errorSection.style.display = 'block';
    }

    hideError() {
        this.errorSection.style.display = 'none';
    }

    resetApp() {
        this.hideAllSections();
        this.selectedFile = null;
        this.currentFilename = null;
        this.brushStrokes = [];
        this.currentStroke = [];
        this.isDrawing = false;
        this.processBtn.disabled = true;
        this.fileInput.value = '';
        
        // Reset brush controls
        this.brushSizeSlider.value = 20;
        this.brushOpacitySlider.value = 0.6;
        this.updateBrushSize();
        this.updateBrushOpacity();
        
        // Reset upload area
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <h3>Drop your image here or click to browse</h3>
            <p>Supports PNG, JPG, JPEG, GIF, BMP, WEBP (Max 16MB)</p>
        `;
    }

    updateBrushSize() {
        this.brushSize = parseInt(this.brushSizeSlider.value);
        this.brushSizeValue.textContent = `${this.brushSize}px`;
    }

    updateBrushOpacity() {
        this.brushOpacity = parseFloat(this.brushOpacitySlider.value);
        this.brushOpacityValue.textContent = `${Math.round(this.brushOpacity * 100)}%`;
    }

    setupCanvas() {
        const img = this.selectionImage;
        const canvas = this.selectionCanvas;
        
        // Set canvas size to match image display size
        canvas.width = img.offsetWidth;
        canvas.height = img.offsetHeight;
        
        // Calculate scale factor
        this.canvasScale = {
            x: img.naturalWidth / img.offsetWidth,
            y: img.naturalHeight / img.offsetHeight
        };
        
        // Set canvas style
        canvas.style.width = img.offsetWidth + 'px';
        canvas.style.height = img.offsetHeight + 'px';
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.currentStroke = [];
        const point = this.getCanvasPoint(e);
        point.size = this.brushSize;
        point.opacity = this.brushOpacity;
        this.currentStroke.push(point);
        this.drawPoint(point);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const point = this.getCanvasPoint(e);
        point.size = this.brushSize;
        point.opacity = this.brushOpacity;
        this.currentStroke.push(point);
        
        const ctx = this.selectionCanvas.getContext('2d');
        const prevPoint = this.currentStroke[this.currentStroke.length - 2];
        
        ctx.globalAlpha = this.brushOpacity;
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = this.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }

    stopDrawing() {
        if (this.isDrawing && this.currentStroke.length > 0) {
            this.brushStrokes.push([...this.currentStroke]);
            this.updateProceedButton();
        }
        this.isDrawing = false;
        this.currentStroke = [];
    }

    drawPoint(point) {
        const ctx = this.selectionCanvas.getContext('2d');
        ctx.globalAlpha = this.brushOpacity;
        ctx.fillStyle = '#007bff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, this.brushSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    getCanvasPoint(e) {
        const canvas = this.selectionCanvas;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        
        if (e.type === 'touchstart') this.startDrawing(mouseEvent);
        else if (e.type === 'touchmove') this.draw(mouseEvent);
    }

    clearBrushStrokes() {
        this.brushStrokes = [];
        this.currentStroke = [];
        const ctx = this.selectionCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
        this.updateProceedButton();
    }

    undoLastStroke() {
        if (this.brushStrokes.length > 0) {
            this.brushStrokes.pop();
            this.redrawBrushStrokes();
            this.updateProceedButton();
        }
    }

    redrawBrushStrokes() {
        const ctx = this.selectionCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
        
        this.brushStrokes.forEach(stroke => {
            if (stroke.length > 0) {
                ctx.globalAlpha = stroke[0].opacity || 0.6;
                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = stroke[0].size;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.beginPath();
                ctx.moveTo(stroke[0].x, stroke[0].y);
                stroke.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
                
                // Draw start point
                ctx.fillStyle = '#007bff';
                ctx.beginPath();
                ctx.arc(stroke[0].x, stroke[0].y, stroke[0].size / 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        
        ctx.globalAlpha = 1;
    }

    updateProceedButton() {
        this.proceedBtn.disabled = this.brushStrokes.length === 0;
    }

    hideAllSections() {
        this.loadingSection.style.display = 'none';
        this.brushSelectionSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.errorSection.style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextRemoverApp();
});
