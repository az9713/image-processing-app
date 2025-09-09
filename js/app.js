class ImageProcessingApp {
    constructor() {
        this.currentImage = null;
        this.originalImage = null;
        this.processedImage = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            this.initializeEventListeners();
            this.initializeUI();
            this.isInitialized = true;
            console.log('Image Processing App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const originalDropZone = document.getElementById('originalDropZone');
        
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        originalDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        originalDropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        originalDropZone.addEventListener('drop', (e) => this.handleDrop(e));
        originalDropZone.addEventListener('click', () => fileInput.click());
        
        this.initializeControlListeners();
        this.initializePipelineListeners();
        this.initializeExportListeners();
    }
    
    initializeControlListeners() {
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        const applyCompressionBtn = document.getElementById('applyCompressionBtn');
        const formatSelect = document.getElementById('formatSelect');
        
        qualitySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            qualityValue.textContent = `${value}%`;
            this.updateEstimatedSize(value);
        });
        
        formatSelect.addEventListener('change', () => {
            this.updateEstimatedSize(qualitySlider.value);
        });
        
        applyCompressionBtn.addEventListener('click', () => {
            this.applyCompression(qualitySlider.value, formatSelect.value);
        });
        
        document.getElementById('rotate90Btn').addEventListener('click', () => this.rotateImage(90));
        document.getElementById('rotate180Btn').addEventListener('click', () => this.rotateImage(180));
        document.getElementById('rotate270Btn').addEventListener('click', () => this.rotateImage(270));
        document.getElementById('resetRotationBtn').addEventListener('click', () => this.resetRotation());
    }
    
    initializePipelineListeners() {
        document.getElementById('undoBtn').addEventListener('click', () => {
            if (window.processingPipeline) {
                window.processingPipeline.undo();
            }
        });
        
        document.getElementById('redoBtn').addEventListener('click', () => {
            if (window.processingPipeline) {
                window.processingPipeline.redo();
            }
        });
        
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            if (window.processingPipeline) {
                window.processingPipeline.clearAll();
            }
        });
        
        document.getElementById('savePipelineBtn').addEventListener('click', () => {
            this.savePipeline();
        });
    }
    
    initializeExportListeners() {
        const exportFormatSelect = document.getElementById('exportFormatSelect');
        const exportQualitySlider = document.getElementById('exportQualitySlider');
        const exportQualityValue = document.getElementById('exportQualityValue');
        const fileExtension = document.getElementById('fileExtension');
        
        exportFormatSelect.addEventListener('change', (e) => {
            const format = e.target.value;
            fileExtension.textContent = `.${format === 'jpeg' ? 'jpg' : format}`;
        });
        
        exportQualitySlider.addEventListener('input', (e) => {
            exportQualityValue.textContent = `${e.target.value}%`;
        });
        
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadImage();
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.downloadImage();
        });
    }
    
    initializeUI() {
        this.updateButtonStates();
    }
    
    updateButtonStates() {
        const hasImage = !!this.currentImage;
        const hasProcessed = !!this.processedImage;
        
        document.getElementById('applyCompressionBtn').disabled = !hasImage;
        document.getElementById('rotate90Btn').disabled = !hasImage;
        document.getElementById('rotate180Btn').disabled = !hasImage;
        document.getElementById('rotate270Btn').disabled = !hasImage;
        document.getElementById('resetRotationBtn').disabled = !hasImage;
        
        document.getElementById('undoBtn').disabled = !window.processingPipeline?.canUndo();
        document.getElementById('redoBtn').disabled = !window.processingPipeline?.canRedo();
        document.getElementById('clearAllBtn').disabled = !window.processingPipeline?.hasSteps();
        document.getElementById('savePipelineBtn').disabled = !window.processingPipeline?.hasSteps();
        
        document.getElementById('exportBtn').disabled = !hasProcessed;
        document.getElementById('downloadBtn').disabled = !hasProcessed;
        document.getElementById('filenameInput').disabled = !hasProcessed;
        document.getElementById('savePipelineExportBtn').disabled = !hasProcessed;
        document.getElementById('shareLinkBtn').disabled = !hasProcessed;
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('originalDropZone').parentElement.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('originalDropZone').parentElement.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('originalDropZone').parentElement.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadImage(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }
    
    async loadImage(file) {
        try {
            this.showLoading('Loading image...');
            
            if (!window.formatHandler) {
                throw new Error('Format handler not available');
            }
            
            const imageData = await window.formatHandler.loadImage(file);
            
            if (!imageData) {
                throw new Error('Failed to load image');
            }
            
            this.originalImage = imageData;
            this.currentImage = imageData;
            this.processedImage = null;
            
            this.displayOriginalImage(imageData);
            this.updateImageInfo(imageData, 'original');
            this.updateFilename(file.name);
            
            if (window.processingPipeline) {
                window.processingPipeline.initialize(imageData);
            }
            
            this.updateButtonStates();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading image:', error);
            this.showError(`Failed to load image: ${error.message}`);
            this.hideLoading();
        }
    }
    
    displayOriginalImage(imageData) {
        const canvas = document.getElementById('originalCanvas');
        const dropZone = document.getElementById('originalDropZone');
        
        if (!canvas || !imageData.canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = imageData.canvas.width;
        canvas.height = imageData.canvas.height;
        
        ctx.drawImage(imageData.canvas, 0, 0);
        
        canvas.classList.add('active');
        dropZone.style.display = 'none';
    }
    
    displayProcessedImage(imageData) {
        const canvas = document.getElementById('processedCanvas');
        const placeholder = document.getElementById('processedPlaceholder');
        
        if (!canvas || !imageData.canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = imageData.canvas.width;
        canvas.height = imageData.canvas.height;
        
        ctx.drawImage(imageData.canvas, 0, 0);
        
        canvas.classList.add('active');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        this.processedImage = imageData;
        this.updateImageInfo(imageData, 'processed');
        this.updateButtonStates();
    }
    
    updateImageInfo(imageData, type) {
        const formatEl = document.getElementById(`${type}Format`);
        const sizeEl = document.getElementById(`${type}Size`);
        const dimensionsEl = document.getElementById(`${type}Dimensions`);
        
        if (formatEl) formatEl.textContent = imageData.format.toUpperCase();
        if (sizeEl) sizeEl.textContent = this.formatFileSize(imageData.size);
        if (dimensionsEl) dimensionsEl.textContent = `${imageData.width}x${imageData.height}`;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    updateFilename(originalName) {
        const filenameInput = document.getElementById('filenameInput');
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        filenameInput.value = `processed_${nameWithoutExt}`;
    }
    
    updateEstimatedSize(quality) {
        if (!this.currentImage) return;
        
        const format = document.getElementById('formatSelect').value;
        const estimatedSizeEl = document.getElementById('estimatedSize');
        
        const compressionFactor = format === 'png' ? 0.8 : (quality / 100);
        const estimatedBytes = this.currentImage.size * compressionFactor;
        
        if (estimatedSizeEl) {
            estimatedSizeEl.textContent = this.formatFileSize(estimatedBytes);
            
            if (estimatedBytes < this.currentImage.size) {
                estimatedSizeEl.classList.add('size-reduction');
                estimatedSizeEl.classList.remove('size-increase');
            } else {
                estimatedSizeEl.classList.add('size-increase');
                estimatedSizeEl.classList.remove('size-reduction');
            }
        }
    }
    
    async applyCompression(quality, format) {
        if (!this.currentImage || !window.imageProcessor) return;
        
        try {
            this.showLoading('Compressing image...');
            
            const compressed = await window.imageProcessor.compress(
                this.currentImage,
                quality / 100,
                format
            );
            
            this.displayProcessedImage(compressed);
            
            if (window.processingPipeline) {
                window.processingPipeline.addStep({
                    type: 'compress',
                    params: { quality: quality / 100, format },
                    description: `Compressed to ${quality}% quality (${format.toUpperCase()})`
                });
            }
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Compression error:', error);
            this.showError(`Failed to compress image: ${error.message}`);
            this.hideLoading();
        }
    }
    
    async rotateImage(degrees) {
        if (!this.currentImage || !window.imageProcessor) return;
        
        try {
            this.showLoading(`Rotating image ${degrees}°...`);
            
            const rotated = await window.imageProcessor.rotate(this.currentImage, degrees);
            
            this.displayProcessedImage(rotated);
            
            if (window.processingPipeline) {
                window.processingPipeline.addStep({
                    type: 'rotate',
                    params: { degrees },
                    description: `Rotated ${degrees}° clockwise`
                });
            }
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Rotation error:', error);
            this.showError(`Failed to rotate image: ${error.message}`);
            this.hideLoading();
        }
    }
    
    resetRotation() {
        if (!this.originalImage) return;
        
        this.displayProcessedImage(this.originalImage);
        
        if (window.processingPipeline) {
            window.processingPipeline.addStep({
                type: 'reset',
                params: {},
                description: 'Reset to original'
            });
        }
    }
    
    async downloadImage() {
        if (!this.processedImage) return;
        
        try {
            const format = document.getElementById('exportFormatSelect').value;
            const quality = document.getElementById('exportQualitySlider').value / 100;
            const filename = document.getElementById('filenameInput').value;
            const extension = format === 'jpeg' ? 'jpg' : format;
            
            let exportData = this.processedImage;
            
            if (this.processedImage.format !== format || (format === 'jpeg' && quality !== 1.0)) {
                exportData = await window.imageProcessor.compress(
                    this.processedImage,
                    quality,
                    format
                );
            }
            
            const link = document.createElement('a');
            link.download = `${filename}.${extension}`;
            link.href = exportData.canvas.toDataURL(`image/${format}`, quality);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Download error:', error);
            this.showError(`Failed to download image: ${error.message}`);
        }
    }
    
    savePipeline() {
        if (!window.processingPipeline) return;
        
        const pipeline = window.processingPipeline.exportPipeline();
        const dataStr = JSON.stringify(pipeline, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.download = 'image-processing-pipeline.json';
        link.href = URL.createObjectURL(dataBlob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
    
    showLoading(text = 'Loading...') {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingText) loadingText.textContent = text;
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    }
    
    hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    }
    
    showError(message) {
        alert(`Error: ${message}`);
        console.error('App Error:', message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ImageProcessingApp();
});