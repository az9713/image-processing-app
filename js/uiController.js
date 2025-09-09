class UIController {
    constructor() {
        this.isInitialized = false;
        this.debounceTimers = {};
        this.currentTheme = 'light';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeTooltips();
        this.setupKeyboardShortcuts();
        this.isInitialized = true;
    }
    
    setupEventListeners() {
        this.setupSliderListeners();
        this.setupButtonListeners();
        this.setupModalListeners();
        this.setupResizeHandler();
    }
    
    setupSliderListeners() {
        const qualitySlider = document.getElementById('qualitySlider');
        const exportQualitySlider = document.getElementById('exportQualitySlider');
        
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                this.updateQualityDisplay(e.target.value, 'qualityValue');
                this.debounce('qualityUpdate', () => {
                    this.updateEstimatedSize(e.target.value);
                }, 300);
            });
        }
        
        if (exportQualitySlider) {
            exportQualitySlider.addEventListener('input', (e) => {
                this.updateQualityDisplay(e.target.value, 'exportQualityValue');
            });
        }
    }
    
    setupButtonListeners() {
        const settingsBtn = document.getElementById('settingsBtn');
        const helpBtn = document.getElementById('helpBtn');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelp());
        }
    }
    
    setupModalListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.triggerRedo();
                        } else {
                            e.preventDefault();
                            this.triggerUndo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.triggerRedo();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.triggerUpload();
                        break;
                    case 's':
                        e.preventDefault();
                        this.triggerExport();
                        break;
                }
            }
        });
    }
    
    setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }
    
    updateQualityDisplay(value, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${value}%`;
        }
    }
    
    updateEstimatedSize(quality) {
        if (window.app && window.app.currentImage) {
            const format = document.getElementById('formatSelect')?.value || 'jpeg';
            const estimatedSizeEl = document.getElementById('estimatedSize');
            
            if (estimatedSizeEl && window.formatHandler) {
                const estimatedBytes = window.formatHandler.estimateSize(
                    window.app.currentImage,
                    format,
                    quality / 100
                );
                
                estimatedSizeEl.textContent = this.formatFileSize(estimatedBytes);
                
                this.updateSizeComparison(estimatedBytes, window.app.currentImage.size);
            }
        }
    }
    
    updateSizeComparison(newSize, originalSize) {
        const estimatedSizeEl = document.getElementById('estimatedSize');
        if (!estimatedSizeEl) return;
        
        estimatedSizeEl.classList.remove('size-reduction', 'size-increase');
        
        if (newSize < originalSize) {
            estimatedSizeEl.classList.add('size-reduction');
            const reduction = Math.round(((originalSize - newSize) / originalSize) * 100);
            estimatedSizeEl.title = `${reduction}% smaller than original`;
        } else if (newSize > originalSize) {
            estimatedSizeEl.classList.add('size-increase');
            const increase = Math.round(((newSize - originalSize) / originalSize) * 100);
            estimatedSizeEl.title = `${increase}% larger than original`;
        } else {
            estimatedSizeEl.title = 'Same size as original';
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }
    
    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }
    
    showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }
    
    showInfo(message, duration = 3000) {
        this.showNotification(message, 'info', duration);
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        const colors = {
            success: '#34c759',
            error: '#ff3b30',
            warning: '#ff9500',
            info: '#007aff'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
    
    showSettings() {
        const modal = this.createModal('settings', 'Settings', `
            <div class="settings-content">
                <div class="setting-group">
                    <h3>Processing Options</h3>
                    <label class="setting-item">
                        <input type="checkbox" id="autoCompress" ${this.getSetting('autoCompress') ? 'checked' : ''}>
                        <span>Auto-compress large images</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="preserveMetadata" ${this.getSetting('preserveMetadata') ? 'checked' : ''}>
                        <span>Preserve image metadata</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="showProcessingTime" ${this.getSetting('showProcessingTime') ? 'checked' : ''}>
                        <span>Show processing time</span>
                    </label>
                </div>
                
                <div class="setting-group">
                    <h3>Interface</h3>
                    <label class="setting-item">
                        <select id="defaultFormat">
                            <option value="jpeg" ${this.getSetting('defaultFormat') === 'jpeg' ? 'selected' : ''}>JPEG</option>
                            <option value="png" ${this.getSetting('defaultFormat') === 'png' ? 'selected' : ''}>PNG</option>
                            <option value="webp" ${this.getSetting('defaultFormat') === 'webp' ? 'selected' : ''}>WebP</option>
                        </select>
                        <span>Default export format</span>
                    </label>
                    <label class="setting-item">
                        <input type="range" id="defaultQuality" min="1" max="100" value="${this.getSetting('defaultQuality') || 85}">
                        <span>Default quality: <span id="defaultQualityValue">${this.getSetting('defaultQuality') || 85}%</span></span>
                    </label>
                </div>
                
                <div class="setting-actions">
                    <button class="action-btn" onclick="uiController.saveSettings()">Save Settings</button>
                    <button class="pipeline-btn" onclick="uiController.resetSettings()">Reset to Defaults</button>
                </div>
            </div>
        `);
        
        const qualitySlider = modal.querySelector('#defaultQuality');
        const qualityValue = modal.querySelector('#defaultQualityValue');
        
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = `${e.target.value}%`;
        });
    }
    
    showHelp() {
        this.createModal('help', 'Help & Instructions', `
            <div class="help-content">
                <div class="help-section">
                    <h3>🚀 Getting Started</h3>
                    <ul>
                        <li>Click "Upload Image" or drag & drop an image to begin</li>
                        <li>Supported formats: PNG, JPEG, BMP, GIF, SVG, WebP, HEIF</li>
                        <li>Maximum file size: 50MB</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h3>🔧 Processing Options</h3>
                    <ul>
                        <li><strong>Compression:</strong> Adjust quality slider to reduce file size</li>
                        <li><strong>Rotation:</strong> Rotate image in 90° increments</li>
                        <li><strong>Format Conversion:</strong> Export to different formats</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h3>📋 Processing Pipeline</h3>
                    <ul>
                        <li>All operations are tracked in the step history</li>
                        <li>Use Undo/Redo to navigate through changes</li>
                        <li>Save pipeline to reuse processing steps</li>
                        <li>Clear All to reset to original image</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h3>⌨️ Keyboard Shortcuts</h3>
                    <ul>
                        <li><kbd>Ctrl/Cmd + Z</kbd> - Undo</li>
                        <li><kbd>Ctrl/Cmd + Shift + Z</kbd> - Redo</li>
                        <li><kbd>Ctrl/Cmd + O</kbd> - Upload Image</li>
                        <li><kbd>Ctrl/Cmd + S</kbd> - Export Image</li>
                        <li><kbd>Escape</kbd> - Close modals</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h3>💾 Export Options</h3>
                    <ul>
                        <li>Choose output format and quality</li>
                        <li>Customize filename before download</li>
                        <li>Save processing pipeline for future use</li>
                    </ul>
                </div>
            </div>
        `);
    }
    
    createModal(id, title, content) {
        this.closeAllModals();
        
        const modal = document.createElement('div');
        modal.id = `modal-${id}`;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="uiController.closeModal(this.closest('.modal-overlay'))">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
        `;
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            max-width: 600px;
            max-height: 80vh;
            width: 100%;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        `;
        
        const modalHeader = modal.querySelector('.modal-header');
        modalHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px 15px;
            border-bottom: 1px solid #e5e5ea;
        `;
        
        const modalBody = modal.querySelector('.modal-body');
        modalBody.style.cssText = `
            padding: 20px 25px 25px;
        `;
        
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        return modal;
    }
    
    closeModal(modal) {
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 200);
        }
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => this.closeModal(modal));
    }
    
    saveSettings() {
        const settings = {
            autoCompress: document.getElementById('autoCompress')?.checked || false,
            preserveMetadata: document.getElementById('preserveMetadata')?.checked || false,
            showProcessingTime: document.getElementById('showProcessingTime')?.checked || false,
            defaultFormat: document.getElementById('defaultFormat')?.value || 'jpeg',
            defaultQuality: document.getElementById('defaultQuality')?.value || 85
        };
        
        localStorage.setItem('imageProcessorSettings', JSON.stringify(settings));
        this.showSuccess('Settings saved successfully');
        this.closeAllModals();
    }
    
    resetSettings() {
        localStorage.removeItem('imageProcessorSettings');
        this.showInfo('Settings reset to defaults');
        this.closeAllModals();
    }
    
    getSetting(key) {
        const settings = JSON.parse(localStorage.getItem('imageProcessorSettings') || '{}');
        const defaults = {
            autoCompress: true,
            preserveMetadata: false,
            showProcessingTime: true,
            defaultFormat: 'jpeg',
            defaultQuality: 85
        };
        return settings[key] !== undefined ? settings[key] : defaults[key];
    }
    
    triggerUndo() {
        if (window.processingPipeline) {
            window.processingPipeline.undo();
        }
    }
    
    triggerRedo() {
        if (window.processingPipeline) {
            window.processingPipeline.redo();
        }
    }
    
    triggerUpload() {
        document.getElementById('uploadBtn')?.click();
    }
    
    triggerExport() {
        document.getElementById('exportBtn')?.click();
    }
    
    handleResize() {
        const imageContainers = document.querySelectorAll('.image-container');
        imageContainers.forEach(container => {
            const canvas = container.querySelector('.image-canvas.active');
            if (canvas) {
                this.adjustCanvasDisplay(canvas, container);
            }
        });
    }
    
    adjustCanvasDisplay(canvas, container) {
        const containerRect = container.getBoundingClientRect();
        const maxWidth = containerRect.width - 40;
        const maxHeight = 400;
        
        const scaleX = maxWidth / canvas.width;
        const scaleY = maxHeight / canvas.height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        canvas.style.width = `${canvas.width * scale}px`;
        canvas.style.height = `${canvas.height * scale}px`;
    }
    
    initializeTooltips() {
        const elements = document.querySelectorAll('[data-tooltip]');
        elements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
    
    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        
        this.currentTooltip = tooltip;
    }
    
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
    
    debounce(key, func, delay) {
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }
        this.debounceTimers[key] = setTimeout(() => {
            func();
            delete this.debounceTimers[key];
        }, delay);
    }
}

if (typeof window !== 'undefined') {
    window.uiController = new UIController();
}