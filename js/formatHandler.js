class FormatHandler {
    constructor() {
        this.supportedFormats = {
            'image/jpeg': { extensions: ['.jpg', '.jpeg'], name: 'JPEG' },
            'image/png': { extensions: ['.png'], name: 'PNG' },
            'image/gif': { extensions: ['.gif'], name: 'GIF' },
            'image/bmp': { extensions: ['.bmp'], name: 'BMP' },
            'image/webp': { extensions: ['.webp'], name: 'WebP' },
            'image/svg+xml': { extensions: ['.svg'], name: 'SVG' },
            'image/heic': { extensions: ['.heic', '.heif'], name: 'HEIF' },
            'image/heif': { extensions: ['.heic', '.heif'], name: 'HEIF' }
        };
    }
    
    async loadImage(file) {
        try {
            const formatInfo = this.detectFormat(file);
            console.log('Loading image:', file.name, 'Format:', formatInfo.name);
            
            switch (formatInfo.name) {
                case 'HEIF':
                    return await this.loadHEIFImage(file);
                case 'SVG':
                    return await this.loadSVGImage(file);
                case 'GIF':
                    return await this.loadGIFImage(file);
                default:
                    return await this.loadStandardImage(file, formatInfo);
            }
        } catch (error) {
            console.error('Format handler error:', error);
            throw new Error(`Failed to load ${file.name}: ${error.message}`);
        }
    }
    
    detectFormat(file) {
        const mimeType = file.type;
        const fileName = file.name.toLowerCase();
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        
        if (this.supportedFormats[mimeType]) {
            return {
                mimeType,
                ...this.supportedFormats[mimeType]
            };
        }
        
        for (const [type, info] of Object.entries(this.supportedFormats)) {
            if (info.extensions.includes(extension)) {
                return {
                    mimeType: type,
                    ...info
                };
            }
        }
        
        if (mimeType.startsWith('image/')) {
            return {
                mimeType,
                name: 'Unknown',
                extensions: [extension]
            };
        }
        
        throw new Error(`Unsupported file format: ${extension || mimeType}`);
    }
    
    async loadStandardImage(file, formatInfo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        if (formatInfo.name === 'PNG' || formatInfo.name === 'GIF') {
                            ctx.fillStyle = 'rgba(255, 255, 255, 0)';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        
                        ctx.drawImage(img, 0, 0);
                        
                        resolve({
                            canvas,
                            width: img.width,
                            height: img.height,
                            format: formatInfo.name.toLowerCase(),
                            mimeType: formatInfo.mimeType,
                            size: file.size,
                            originalFile: file
                        });
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to decode image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    async loadHEIFImage(file) {
        if (typeof heic2any === 'undefined') {
            throw new Error('HEIF support library not loaded. Please include heic2any.js');
        }
        
        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.92
            });
            
            const convertedFile = new File([convertedBlob], file.name + '.jpg', {
                type: 'image/jpeg'
            });
            
            const result = await this.loadStandardImage(convertedFile, {
                mimeType: 'image/jpeg',
                name: 'JPEG',
                extensions: ['.jpg']
            });
            
            result.originalFormat = 'heif';
            result.size = file.size;
            result.converted = true;
            
            return result;
        } catch (error) {
            throw new Error(`HEIF conversion failed: ${error.message}`);
        }
    }
    
    async loadSVGImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const svgText = e.target.result;
                    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
                    const svgUrl = URL.createObjectURL(svgBlob);
                    
                    const img = new Image();
                    
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            const scale = Math.min(800 / img.width, 600 / img.height, 1);
                            canvas.width = img.width * scale;
                            canvas.height = img.height * scale;
                            
                            ctx.fillStyle = 'white';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            
                            URL.revokeObjectURL(svgUrl);
                            
                            resolve({
                                canvas,
                                width: canvas.width,
                                height: canvas.height,
                                format: 'svg',
                                mimeType: 'image/svg+xml',
                                size: file.size,
                                originalFile: file,
                                svgContent: svgText
                            });
                        } catch (error) {
                            URL.revokeObjectURL(svgUrl);
                            reject(error);
                        }
                    };
                    
                    img.onerror = () => {
                        URL.revokeObjectURL(svgUrl);
                        reject(new Error('Failed to render SVG'));
                    };
                    
                    img.src = svgUrl;
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read SVG file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    async loadGIFImage(file) {
        const result = await this.loadStandardImage(file, {
            mimeType: 'image/gif',
            name: 'GIF',
            extensions: ['.gif']
        });
        
        result.animated = true;
        
        return result;
    }
    
    isFormatSupported(file) {
        try {
            this.detectFormat(file);
            return true;
        } catch {
            return false;
        }
    }
    
    getSupportedExtensions() {
        const extensions = new Set();
        Object.values(this.supportedFormats).forEach(format => {
            format.extensions.forEach(ext => extensions.add(ext));
        });
        return Array.from(extensions).sort();
    }
    
    getMimeTypes() {
        return Object.keys(this.supportedFormats);
    }
    
    canConvertTo(fromFormat, toFormat) {
        if (fromFormat === 'svg') {
            return ['jpeg', 'png', 'webp'].includes(toFormat);
        }
        
        if (fromFormat === 'gif') {
            return ['jpeg', 'png', 'webp'].includes(toFormat);
        }
        
        if (['jpeg', 'png', 'bmp', 'webp'].includes(fromFormat)) {
            return ['jpeg', 'png', 'webp', 'bmp'].includes(toFormat);
        }
        
        return false;
    }
    
    getOptimalQuality(format) {
        const qualitySettings = {
            'jpeg': 0.85,
            'webp': 0.85,
            'png': 1.0,
            'bmp': 1.0
        };
        
        return qualitySettings[format] || 0.85;
    }
    
    estimateSize(imageData, format, quality = 1.0) {
        if (!imageData) return 0;
        
        const pixels = imageData.width * imageData.height;
        
        const baseSize = {
            'jpeg': pixels * 0.5 * quality,
            'png': pixels * 2.5,
            'webp': pixels * 0.4 * quality,
            'bmp': pixels * 3,
            'gif': pixels * 1.5
        };
        
        return Math.round(baseSize[format] || baseSize['jpeg']);
    }
    
    validateFile(file) {
        const maxSize = 50 * 1024 * 1024;
        
        if (!file) {
            throw new Error('No file provided');
        }
        
        if (file.size > maxSize) {
            throw new Error('File too large. Maximum size is 50MB');
        }
        
        if (!this.isFormatSupported(file)) {
            const supported = this.getSupportedExtensions().join(', ');
            throw new Error(`Unsupported format. Supported formats: ${supported}`);
        }
        
        return true;
    }
}

if (typeof window !== 'undefined') {
    window.formatHandler = new FormatHandler();
}