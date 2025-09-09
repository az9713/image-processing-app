class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d');
    }
    
    async compress(imageData, quality = 0.85, format = 'jpeg') {
        try {
            if (!imageData || !imageData.canvas) {
                throw new Error('Invalid image data');
            }
            
            const sourceCanvas = imageData.canvas;
            this.canvas.width = sourceCanvas.width;
            this.canvas.height = sourceCanvas.height;
            
            this.ctx.drawImage(sourceCanvas, 0, 0);
            
            let mimeType;
            let actualQuality = quality;
            
            switch (format.toLowerCase()) {
                case 'jpeg':
                case 'jpg':
                    mimeType = 'image/jpeg';
                    break;
                case 'png':
                    mimeType = 'image/png';
                    actualQuality = undefined;
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    if (!this.isWebPSupported()) {
                        console.warn('WebP not supported, falling back to JPEG');
                        mimeType = 'image/jpeg';
                        format = 'jpeg';
                    }
                    break;
                default:
                    mimeType = 'image/jpeg';
                    format = 'jpeg';
            }
            
            const dataURL = this.canvas.toDataURL(mimeType, actualQuality);
            const estimatedSize = this.estimateDataURLSize(dataURL);
            
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = sourceCanvas.width;
            resultCanvas.height = sourceCanvas.height;
            resultCtx.drawImage(sourceCanvas, 0, 0);
            
            return {
                canvas: resultCanvas,
                width: sourceCanvas.width,
                height: sourceCanvas.height,
                format: format.toLowerCase(),
                mimeType: mimeType,
                size: estimatedSize,
                quality: quality,
                dataURL: dataURL,
                originalFile: imageData.originalFile
            };
            
        } catch (error) {
            console.error('Compression error:', error);
            throw new Error(`Failed to compress image: ${error.message}`);
        }
    }
    
    async rotate(imageData, degrees) {
        try {
            if (!imageData || !imageData.canvas) {
                throw new Error('Invalid image data');
            }
            
            const sourceCanvas = imageData.canvas;
            const radians = (degrees * Math.PI) / 180;
            
            let newWidth, newHeight;
            if (degrees === 90 || degrees === 270) {
                newWidth = sourceCanvas.height;
                newHeight = sourceCanvas.width;
            } else {
                newWidth = sourceCanvas.width;
                newHeight = sourceCanvas.height;
            }
            
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            
            this.ctx.clearRect(0, 0, newWidth, newHeight);
            
            this.ctx.save();
            
            this.ctx.translate(newWidth / 2, newHeight / 2);
            this.ctx.rotate(radians);
            this.ctx.translate(-sourceCanvas.width / 2, -sourceCanvas.height / 2);
            
            this.ctx.drawImage(sourceCanvas, 0, 0);
            
            this.ctx.restore();
            
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = newWidth;
            resultCanvas.height = newHeight;
            resultCtx.drawImage(this.canvas, 0, 0);
            
            return {
                canvas: resultCanvas,
                width: newWidth,
                height: newHeight,
                format: imageData.format,
                mimeType: imageData.mimeType,
                size: this.estimateCanvasSize(resultCanvas, imageData.format),
                rotation: degrees,
                originalFile: imageData.originalFile
            };
            
        } catch (error) {
            console.error('Rotation error:', error);
            throw new Error(`Failed to rotate image: ${error.message}`);
        }
    }
    
    async resize(imageData, newWidth, newHeight, maintainAspectRatio = true) {
        try {
            if (!imageData || !imageData.canvas) {
                throw new Error('Invalid image data');
            }
            
            const sourceCanvas = imageData.canvas;
            let targetWidth = newWidth;
            let targetHeight = newHeight;
            
            if (maintainAspectRatio) {
                const aspectRatio = sourceCanvas.width / sourceCanvas.height;
                
                if (newWidth / newHeight > aspectRatio) {
                    targetWidth = newHeight * aspectRatio;
                } else {
                    targetHeight = newWidth / aspectRatio;
                }
            }
            
            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;
            
            this.ctx.clearRect(0, 0, targetWidth, targetHeight);
            
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            
            this.ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
            
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = targetWidth;
            resultCanvas.height = targetHeight;
            resultCtx.drawImage(this.canvas, 0, 0);
            
            return {
                canvas: resultCanvas,
                width: targetWidth,
                height: targetHeight,
                format: imageData.format,
                mimeType: imageData.mimeType,
                size: this.estimateCanvasSize(resultCanvas, imageData.format),
                resized: true,
                originalFile: imageData.originalFile
            };
            
        } catch (error) {
            console.error('Resize error:', error);
            throw new Error(`Failed to resize image: ${error.message}`);
        }
    }
    
    async crop(imageData, x, y, width, height) {
        try {
            if (!imageData || !imageData.canvas) {
                throw new Error('Invalid image data');
            }
            
            const sourceCanvas = imageData.canvas;
            
            if (x < 0 || y < 0 || x + width > sourceCanvas.width || y + height > sourceCanvas.height) {
                throw new Error('Crop area outside image bounds');
            }
            
            this.canvas.width = width;
            this.canvas.height = height;
            
            this.ctx.clearRect(0, 0, width, height);
            
            this.ctx.drawImage(
                sourceCanvas,
                x, y, width, height,
                0, 0, width, height
            );
            
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = width;
            resultCanvas.height = height;
            resultCtx.drawImage(this.canvas, 0, 0);
            
            return {
                canvas: resultCanvas,
                width: width,
                height: height,
                format: imageData.format,
                mimeType: imageData.mimeType,
                size: this.estimateCanvasSize(resultCanvas, imageData.format),
                cropped: true,
                cropArea: { x, y, width, height },
                originalFile: imageData.originalFile
            };
            
        } catch (error) {
            console.error('Crop error:', error);
            throw new Error(`Failed to crop image: ${error.message}`);
        }
    }
    
    async applyFilter(imageData, filterName, params = {}) {
        try {
            if (!imageData || !imageData.canvas) {
                throw new Error('Invalid image data');
            }
            
            const sourceCanvas = imageData.canvas;
            this.canvas.width = sourceCanvas.width;
            this.canvas.height = sourceCanvas.height;
            
            this.ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            
            switch (filterName) {
                case 'brightness':
                    this.ctx.filter = `brightness(${params.value || 1})`;
                    break;
                case 'contrast':
                    this.ctx.filter = `contrast(${params.value || 1})`;
                    break;
                case 'saturate':
                    this.ctx.filter = `saturate(${params.value || 1})`;
                    break;
                case 'grayscale':
                    this.ctx.filter = 'grayscale(1)';
                    break;
                case 'sepia':
                    this.ctx.filter = 'sepia(1)';
                    break;
                case 'blur':
                    this.ctx.filter = `blur(${params.value || 0}px)`;
                    break;
                case 'hue-rotate':
                    this.ctx.filter = `hue-rotate(${params.value || 0}deg)`;
                    break;
                default:
                    this.ctx.filter = 'none';
            }
            
            this.ctx.drawImage(sourceCanvas, 0, 0);
            
            this.ctx.filter = 'none';
            
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = sourceCanvas.width;
            resultCanvas.height = sourceCanvas.height;
            resultCtx.drawImage(this.canvas, 0, 0);
            
            return {
                canvas: resultCanvas,
                width: sourceCanvas.width,
                height: sourceCanvas.height,
                format: imageData.format,
                mimeType: imageData.mimeType,
                size: this.estimateCanvasSize(resultCanvas, imageData.format),
                filter: filterName,
                filterParams: params,
                originalFile: imageData.originalFile
            };
            
        } catch (error) {
            console.error('Filter error:', error);
            throw new Error(`Failed to apply filter: ${error.message}`);
        }
    }
    
    async flipHorizontal(imageData) {
        try {
            if (!imageData || !imageData.canvas) {
                throw new Error('Invalid image data');
            }
            
            const sourceCanvas = imageData.canvas;
            this.canvas.width = sourceCanvas.width;
            this.canvas.height = sourceCanvas.height;
            
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(sourceCanvas, -sourceCanvas.width, 0);
            this.ctx.restore();
            
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = sourceCanvas.width;
            resultCanvas.height = sourceCanvas.height;
            resultCtx.drawImage(this.canvas, 0, 0);
            
            return {
                canvas: resultCanvas,
                width: sourceCanvas.width,
                height: sourceCanvas.height,
                format: imageData.format,
                mimeType: imageData.mimeType,
                size: this.estimateCanvasSize(resultCanvas, imageData.format),
                flipped: 'horizontal',
                originalFile: imageData.originalFile
            };
            
        } catch (error) {
            console.error('Flip error:', error);
            throw new Error(`Failed to flip image: ${error.message}`);
        }
    }
    
    async flipVertical(imageData) {
        try {
            if (!imageData || !imageData.canvas) {
                throw new Error('Invalid image data');
            }
            
            const sourceCanvas = imageData.canvas;
            this.canvas.width = sourceCanvas.width;
            this.canvas.height = sourceCanvas.height;
            
            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.drawImage(sourceCanvas, 0, -sourceCanvas.height);
            this.ctx.restore();
            
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = sourceCanvas.width;
            resultCanvas.height = sourceCanvas.height;
            resultCtx.drawImage(this.canvas, 0, 0);
            
            return {
                canvas: resultCanvas,
                width: sourceCanvas.width,
                height: sourceCanvas.height,
                format: imageData.format,
                mimeType: imageData.mimeType,
                size: this.estimateCanvasSize(resultCanvas, imageData.format),
                flipped: 'vertical',
                originalFile: imageData.originalFile
            };
            
        } catch (error) {
            console.error('Flip error:', error);
            throw new Error(`Failed to flip image: ${error.message}`);
        }
    }
    
    isWebPSupported() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    estimateDataURLSize(dataURL) {
        const base64String = dataURL.split(',')[1];
        const byteString = atob(base64String);
        return byteString.length;
    }
    
    estimateCanvasSize(canvas, format) {
        try {
            const dataURL = canvas.toDataURL(`image/${format}`, 0.85);
            return this.estimateDataURLSize(dataURL);
        } catch (error) {
            const pixels = canvas.width * canvas.height;
            const bytesPerPixel = format === 'png' ? 4 : 3;
            return Math.round(pixels * bytesPerPixel * 0.5);
        }
    }
    
    getImageData(canvas) {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    putImageData(canvas, imageData) {
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
    }
    
    createImageFromCanvas(canvas) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = canvas.toDataURL();
        });
    }
    
    async convertFormat(imageData, targetFormat, quality = 0.85) {
        if (!imageData || !imageData.canvas) {
            throw new Error('Invalid image data');
        }
        
        if (imageData.format === targetFormat) {
            return imageData;
        }
        
        return await this.compress(imageData, quality, targetFormat);
    }
    
    clone(imageData) {
        if (!imageData || !imageData.canvas) {
            throw new Error('Invalid image data');
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageData.canvas.width;
        canvas.height = imageData.canvas.height;
        ctx.drawImage(imageData.canvas, 0, 0);
        
        return {
            ...imageData,
            canvas: canvas
        };
    }
}

if (typeof window !== 'undefined') {
    window.imageProcessor = new ImageProcessor();
}