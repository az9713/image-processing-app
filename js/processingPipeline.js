class ProcessingPipeline {
    constructor() {
        this.steps = [];
        this.currentIndex = -1;
        this.originalImage = null;
        this.maxHistorySize = 50;
        this.stepHistoryElement = null;
        
        this.initialize();
    }
    
    initialize(imageData = null) {
        if (imageData) {
            this.originalImage = this.cloneImageData(imageData);
            this.reset();
            
            this.addStep({
                type: 'load',
                params: {
                    format: imageData.format,
                    size: imageData.size,
                    dimensions: `${imageData.width}x${imageData.height}`
                },
                description: `Loaded ${imageData.format.toUpperCase()} image (${this.formatSize(imageData.size)})`,
                result: this.cloneImageData(imageData),
                timestamp: Date.now()
            }, false);
        }
        
        this.stepHistoryElement = document.getElementById('stepHistory');
        this.updateUI();
    }
    
    reset() {
        this.steps = [];
        this.currentIndex = -1;
        this.updateUI();
    }
    
    addStep(step, processImage = true) {
        try {
            if (this.currentIndex < this.steps.length - 1) {
                this.steps = this.steps.slice(0, this.currentIndex + 1);
            }
            
            if (processImage && step.type !== 'load') {
                const currentImage = this.getCurrentImage();
                if (!currentImage) {
                    throw new Error('No current image available for processing');
                }
                
                step.result = this.processStep(currentImage, step);
                step.timestamp = Date.now();
            }
            
            this.steps.push(step);
            this.currentIndex = this.steps.length - 1;
            
            if (this.steps.length > this.maxHistorySize) {
                this.steps = this.steps.slice(-this.maxHistorySize);
                this.currentIndex = this.steps.length - 1;
            }
            
            this.updateUI();
            
            if (step.result && window.app) {
                window.app.displayProcessedImage(step.result);
            }
            
            return step.result;
            
        } catch (error) {
            console.error('Error adding step:', error);
            throw error;
        }
    }
    
    async processStep(imageData, step) {
        if (!window.imageProcessor) {
            throw new Error('Image processor not available');
        }
        
        switch (step.type) {
            case 'compress':
                return await window.imageProcessor.compress(
                    imageData,
                    step.params.quality,
                    step.params.format
                );
                
            case 'rotate':
                return await window.imageProcessor.rotate(
                    imageData,
                    step.params.degrees
                );
                
            case 'resize':
                return await window.imageProcessor.resize(
                    imageData,
                    step.params.width,
                    step.params.height,
                    step.params.maintainAspectRatio
                );
                
            case 'crop':
                return await window.imageProcessor.crop(
                    imageData,
                    step.params.x,
                    step.params.y,
                    step.params.width,
                    step.params.height
                );
                
            case 'filter':
                return await window.imageProcessor.applyFilter(
                    imageData,
                    step.params.filterName,
                    step.params.filterParams
                );
                
            case 'flipHorizontal':
                return await window.imageProcessor.flipHorizontal(imageData);
                
            case 'flipVertical':
                return await window.imageProcessor.flipVertical(imageData);
                
            case 'reset':
                return this.cloneImageData(this.originalImage);
                
            default:
                throw new Error(`Unknown processing step type: ${step.type}`);
        }
    }
    
    undo() {
        if (!this.canUndo()) return null;
        
        this.currentIndex--;
        const currentImage = this.getCurrentImage();
        
        this.updateUI();
        
        if (currentImage && window.app) {
            window.app.displayProcessedImage(currentImage);
        }
        
        return currentImage;
    }
    
    redo() {
        if (!this.canRedo()) return null;
        
        this.currentIndex++;
        const currentImage = this.getCurrentImage();
        
        this.updateUI();
        
        if (currentImage && window.app) {
            window.app.displayProcessedImage(currentImage);
        }
        
        return currentImage;
    }
    
    canUndo() {
        return this.currentIndex > 0;
    }
    
    canRedo() {
        return this.currentIndex < this.steps.length - 1;
    }
    
    hasSteps() {
        return this.steps.length > 1;
    }
    
    getCurrentImage() {
        if (this.currentIndex < 0 || this.currentIndex >= this.steps.length) {
            return this.originalImage;
        }
        
        const step = this.steps[this.currentIndex];
        return step.result || this.originalImage;
    }
    
    clearAll() {
        if (!this.originalImage) return;
        
        this.reset();
        this.initialize(this.originalImage);
        
        if (window.app) {
            window.app.displayProcessedImage(this.originalImage);
        }
    }
    
    exportPipeline() {
        return {
            version: '1.0',
            originalImage: {
                format: this.originalImage?.format,
                size: this.originalImage?.size,
                width: this.originalImage?.width,
                height: this.originalImage?.height
            },
            steps: this.steps.map(step => ({
                type: step.type,
                params: step.params,
                description: step.description,
                timestamp: step.timestamp
            })),
            totalSteps: this.steps.length,
            currentIndex: this.currentIndex,
            createdAt: Date.now()
        };
    }
    
    async importPipeline(pipelineData, imageData) {
        try {
            if (!pipelineData.steps || !Array.isArray(pipelineData.steps)) {
                throw new Error('Invalid pipeline data');
            }
            
            this.initialize(imageData);
            
            for (let i = 1; i < pipelineData.steps.length; i++) {
                const step = pipelineData.steps[i];
                await this.addStep({
                    type: step.type,
                    params: step.params,
                    description: step.description
                });
            }
            
            return this.getCurrentImage();
            
        } catch (error) {
            console.error('Error importing pipeline:', error);
            throw new Error(`Failed to import pipeline: ${error.message}`);
        }
    }
    
    updateUI() {
        this.updateStepHistory();
        this.updateButtonStates();
    }
    
    updateStepHistory() {
        if (!this.stepHistoryElement) return;
        
        if (this.steps.length === 0) {
            this.stepHistoryElement.innerHTML = `
                <div class="step-item placeholder-step">
                    <span class="step-number">1.</span>
                    <span class="step-status">⏳</span>
                    <span class="step-description">Ready for first operation</span>
                </div>
            `;
            return;
        }
        
        let historyHTML = '';
        
        this.steps.forEach((step, index) => {
            const isActive = index === this.currentIndex;
            const isPast = index < this.currentIndex;
            const isFuture = index > this.currentIndex;
            
            let status = '⏳';
            let statusClass = '';
            
            if (isPast) {
                status = '✅';
                statusClass = 'success';
            } else if (isActive) {
                status = '▶️';
                statusClass = 'active';
            } else if (isFuture) {
                status = '⏸️';
                statusClass = 'pending';
            }
            
            historyHTML += `
                <div class="step-item ${statusClass}" data-step-index="${index}">
                    <span class="step-number">${index + 1}.</span>
                    <span class="step-status">${status}</span>
                    <span class="step-description">${step.description}</span>
                    <span class="step-time">${this.formatTimestamp(step.timestamp)}</span>
                </div>
            `;
        });
        
        if (this.currentIndex === this.steps.length - 1) {
            historyHTML += `
                <div class="step-item next-step">
                    <span class="step-number">${this.steps.length + 1}.</span>
                    <span class="step-status">⏳</span>
                    <span class="step-description">Ready for next operation</span>
                </div>
            `;
        }
        
        this.stepHistoryElement.innerHTML = historyHTML;
        
        this.stepHistoryElement.scrollTop = this.stepHistoryElement.scrollHeight;
    }
    
    updateButtonStates() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const savePipelineBtn = document.getElementById('savePipelineBtn');
        
        if (undoBtn) undoBtn.disabled = !this.canUndo();
        if (redoBtn) redoBtn.disabled = !this.canRedo();
        if (clearAllBtn) clearAllBtn.disabled = !this.hasSteps();
        if (savePipelineBtn) savePipelineBtn.disabled = !this.hasSteps();
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    cloneImageData(imageData) {
        if (!imageData || !imageData.canvas) return null;
        
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
    
    getStepSummary() {
        return {
            totalSteps: this.steps.length,
            currentStep: this.currentIndex + 1,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            stepTypes: this.steps.map(step => step.type),
            processingTime: this.steps.length > 1 ? 
                this.steps[this.steps.length - 1].timestamp - this.steps[0].timestamp : 0
        };
    }
    
    optimizePipeline() {
        const optimizedSteps = [];
        let hasOptimizations = false;
        
        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];
            const nextStep = this.steps[i + 1];
            
            if (step.type === 'rotate' && nextStep?.type === 'rotate') {
                const totalRotation = (step.params.degrees + nextStep.params.degrees) % 360;
                if (totalRotation !== 0) {
                    optimizedSteps.push({
                        ...step,
                        params: { degrees: totalRotation },
                        description: `Rotated ${totalRotation}° clockwise (optimized)`
                    });
                }
                i++;
                hasOptimizations = true;
            } else if (step.type === 'compress' && nextStep?.type === 'compress' && 
                       step.params.format === nextStep.params.format) {
                optimizedSteps.push({
                    ...nextStep,
                    description: `Compressed to ${Math.round(nextStep.params.quality * 100)}% quality (${nextStep.params.format.toUpperCase()}, optimized)`
                });
                i++;
                hasOptimizations = true;
            } else {
                optimizedSteps.push(step);
            }
        }
        
        return {
            optimized: hasOptimizations,
            steps: optimizedSteps,
            savings: this.steps.length - optimizedSteps.length
        };
    }
}

if (typeof window !== 'undefined') {
    window.processingPipeline = new ProcessingPipeline();
}