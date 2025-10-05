/**
 * WedgeEditor component - Detailed editor for individual wedge properties
 * Supports setting labels, weights, colors, and media content
 */

import { Wedge, WedgeMedia } from '../models';
import { mediaManager, MediaValidationResult as MediaManagerValidationResult } from '../managers/MediaManager';

export interface WedgeEditorOptions {
  containerId: string;
  wedge?: Wedge;
  showMediaOptions?: boolean;
}

export interface WedgeEditorCallbacks {
  onWedgeUpdate?: (wedge: Wedge) => void;
  onMediaUpload?: (file: File) => Promise<string>;
  onMediaValidation?: (media: WedgeMedia) => Promise<boolean>;
}

export interface MediaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class WedgeEditor {
  private container: HTMLElement;
  private wedge: Wedge;
  private callbacks: WedgeEditorCallbacks;
  private options: WedgeEditorOptions;
  private mediaPreviewContainer!: HTMLElement;

  constructor(options: WedgeEditorOptions, callbacks: WedgeEditorCallbacks = {}) {
    this.options = options;
    this.callbacks = callbacks;
    
    // Initialize wedge with default values if not provided
    this.wedge = options.wedge || this.createDefaultWedge();

    const container = document.getElementById(options.containerId);
    if (!container) {
      throw new Error(`Container element with id '${options.containerId}' not found`);
    }
    this.container = container;
    
    this.initializeEditor();
  }

  private createDefaultWedge(): Wedge {
    return {
      id: 'wedge-' + Date.now(),
      label: 'New Option',
      weight: 1,
      color: '#4ecdc4'
    };
  }

  private initializeEditor(): void {
    this.container.innerHTML = '';
    this.container.className = 'wedge-editor';

    // Header
    this.createHeader();
    
    // Basic properties
    this.createBasicPropertiesSection();
    
    // Media section (if enabled)
    if (this.options.showMediaOptions) {
      this.createMediaSection();
    }
    
    // Preview section
    this.createPreviewSection();
  }

  private createHeader(): void {
    const header = document.createElement('div');
    header.className = 'wedge-editor-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Wedge Editor';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = `Editing: ${this.wedge.label}`;
    subtitle.className = 'wedge-subtitle';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    this.container.appendChild(header);
  }

  private createBasicPropertiesSection(): void {
    const section = document.createElement('div');
    section.className = 'basic-properties-section';
    
    const title = document.createElement('h4');
    title.textContent = 'Basic Properties';
    
    // Label input
    const labelContainer = this.createTextInput(
      'Label',
      this.wedge.label,
      'The text displayed on the wedge',
      (value) => {
        this.wedge.label = value;
        this.updateSubtitle();
        this.triggerUpdate();
      }
    );
    
    // Weight input
    const weightContainer = this.createNumberInput(
      'Weight',
      this.wedge.weight,
      0,
      100,
      0.1,
      'Probability weight (higher = more likely to be selected)',
      (value) => {
        this.wedge.weight = value;
        this.triggerUpdate();
      }
    );
    
    // Color input
    const colorContainer = this.createColorInput(
      'Color',
      this.wedge.color,
      'Background color for the wedge',
      (value) => {
        this.wedge.color = value;
        this.updatePreview();
        this.triggerUpdate();
      }
    );
    
    section.appendChild(title);
    section.appendChild(labelContainer);
    section.appendChild(weightContainer);
    section.appendChild(colorContainer);
    this.container.appendChild(section);
  }

  private createMediaSection(): void {
    const section = document.createElement('div');
    section.className = 'media-section';
    
    const title = document.createElement('h4');
    title.textContent = 'Media Content';
    
    // Media type selector
    const typeContainer = this.createMediaTypeSelector();
    
    // Media content input
    const contentContainer = this.createMediaContentInput();
    
    // Media preview
    this.mediaPreviewContainer = document.createElement('div');
    this.mediaPreviewContainer.className = 'media-preview-container';
    
    section.appendChild(title);
    section.appendChild(typeContainer);
    section.appendChild(contentContainer);
    section.appendChild(this.mediaPreviewContainer);
    this.container.appendChild(section);
    
    this.updateMediaPreview();
  }

  private createMediaTypeSelector(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'input-container';
    
    const label = document.createElement('label');
    label.textContent = 'Media Type:';
    
    const select = document.createElement('select');
    select.className = 'media-type-select';
    
    const options = [
      { value: 'text', label: 'Text Only' },
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' }
    ];
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      optionElement.selected = this.wedge.media?.type === option.value;
      select.appendChild(optionElement);
    });
    
    select.onchange = (e) => {
      const target = e.target as HTMLSelectElement;
      const type = target.value as 'text' | 'image' | 'video';
      
      if (type === 'text') {
        delete this.wedge.media;
      } else {
        this.wedge.media = {
          type,
          src: '',
          alt: this.wedge.label
        };
      }
      
      this.updateMediaContentInput();
      this.updateMediaPreview();
      this.triggerUpdate();
    };
    
    container.appendChild(label);
    container.appendChild(select);
    
    return container;
  }

  private createMediaContentInput(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'media-content-container';
    container.id = 'media-content-container';
    
    this.updateMediaContentInput();
    
    return container;
  }

  private updateMediaContentInput(): void {
    const container = document.getElementById('media-content-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!this.wedge.media || this.wedge.media.type === 'text') {
      return;
    }
    
    // URL input with validation
    const urlContainer = this.createTextInput(
      'Media URL',
      this.wedge.media.src,
      'URL or path to the media file',
      async (value) => {
        if (this.wedge.media) {
          this.wedge.media.src = value;
          
          // Validate media if URL is provided
          if (value.trim()) {
            const validation = mediaManager.validateMedia(this.wedge.media);
            if (!validation.isValid) {
              this.showMessage(`Invalid media: ${validation.error}`, 'warning');
              if (validation.suggestedType) {
                this.showMessage(`Suggested type: ${validation.suggestedType}`, 'info');
              }
            }
          }
          
          this.updateMediaPreview();
          this.triggerUpdate();
        }
      }
    );
    
    // Alt text input (for images)
    if (this.wedge.media.type === 'image') {
      const altContainer = this.createTextInput(
        'Alt Text',
        this.wedge.media.alt || '',
        'Alternative text for accessibility',
        (value) => {
          if (this.wedge.media) {
            this.wedge.media.alt = value;
            this.triggerUpdate();
          }
        }
      );
      container.appendChild(altContainer);
    }
    
    // File upload button
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'upload-container';
    
    const uploadButton = document.createElement('button');
    uploadButton.textContent = 'Upload File';
    uploadButton.type = 'button';
    uploadButton.className = 'upload-button';
    uploadButton.onclick = () => this.handleFileUpload();
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.accept = this.wedge.media.type === 'image' ? 'image/*' : 'video/*';
    fileInput.onchange = (e) => this.handleFileSelected(e);
    
    uploadContainer.appendChild(uploadButton);
    uploadContainer.appendChild(fileInput);
    
    container.appendChild(urlContainer);
    container.appendChild(uploadContainer);
  }

  private createPreviewSection(): void {
    const section = document.createElement('div');
    section.className = 'preview-section';
    
    const title = document.createElement('h4');
    title.textContent = 'Preview';
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'wedge-preview';
    previewContainer.id = 'wedge-preview';
    
    section.appendChild(title);
    section.appendChild(previewContainer);
    this.container.appendChild(section);
    
    this.updatePreview();
  }

  private createTextInput(
    label: string, 
    value: string, 
    placeholder: string, 
    onChange: (value: string) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'input-container';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label + ':';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = placeholder;
    input.className = 'text-input';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      onChange(target.value);
    };
    
    container.appendChild(labelElement);
    container.appendChild(input);
    
    return container;
  }

  private createNumberInput(
    label: string, 
    value: number, 
    min: number, 
    max: number, 
    step: number, 
    placeholder: string,
    onChange: (value: number) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'input-container';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label + ':';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = value.toString();
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.placeholder = placeholder;
    input.className = 'number-input';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const numValue = parseFloat(target.value);
      if (!isNaN(numValue)) {
        onChange(Math.max(min, Math.min(max, numValue)));
      }
    };
    
    container.appendChild(labelElement);
    container.appendChild(input);
    
    return container;
  }

  private createColorInput(
    label: string, 
    value: string, 
    placeholder: string,
    onChange: (value: string) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'input-container color-input-container';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label + ':';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'color-input-wrapper';
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = value;
    colorInput.className = 'color-input';
    colorInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      textInput.value = target.value;
      onChange(target.value);
    };
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = value;
    textInput.placeholder = placeholder;
    textInput.className = 'color-text-input';
    textInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (this.isValidColor(target.value)) {
        colorInput.value = target.value;
        onChange(target.value);
      }
    };
    
    inputContainer.appendChild(colorInput);
    inputContainer.appendChild(textInput);
    
    container.appendChild(labelElement);
    container.appendChild(inputContainer);
    
    return container;
  }

  private handleFileUpload(): void {
    const fileInput = this.container.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  private async handleFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    try {
      // Use MediaManager to create media from file
      const media = await mediaManager.createMediaFromFile(file);
      
      // Update wedge with new media
      this.wedge.media = media;
      
      // Update UI
      this.updateMediaContentInput();
      this.updateMediaPreview();
      this.triggerUpdate();
      
      // Show success message
      this.showMessage('File uploaded successfully!', 'success');
      
    } catch (error) {
      console.error('File upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'File upload failed. Please try again.';
      this.showMessage(errorMessage, 'error');
    }
  }

  private updateSubtitle(): void {
    const subtitle = this.container.querySelector('.wedge-subtitle') as HTMLElement;
    if (subtitle) {
      subtitle.textContent = `Editing: ${this.wedge.label}`;
    }
  }

  private updatePreview(): void {
    const preview = document.getElementById('wedge-preview');
    if (!preview) return;
    
    preview.innerHTML = '';
    preview.style.backgroundColor = this.wedge.color;
    preview.style.color = this.getContrastColor(this.wedge.color);
    preview.style.padding = '20px';
    preview.style.borderRadius = '8px';
    preview.style.textAlign = 'center';
    preview.style.minHeight = '60px';
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';
    
    const labelElement = document.createElement('div');
    labelElement.textContent = this.wedge.label;
    labelElement.style.fontWeight = 'bold';
    labelElement.style.fontSize = '16px';
    
    preview.appendChild(labelElement);
  }

  private async updateMediaPreview(): Promise<void> {
    if (!this.mediaPreviewContainer) return;
    
    this.mediaPreviewContainer.innerHTML = '';
    
    if (!this.wedge.media || !this.wedge.media.src) {
      const noMediaMsg = document.createElement('p');
      noMediaMsg.textContent = 'No media selected';
      noMediaMsg.style.color = '#6c757d';
      noMediaMsg.style.fontStyle = 'italic';
      noMediaMsg.style.textAlign = 'center';
      noMediaMsg.style.padding = '20px';
      this.mediaPreviewContainer.appendChild(noMediaMsg);
      return;
    }
    
    const previewTitle = document.createElement('h5');
    previewTitle.textContent = 'Media Preview:';
    this.mediaPreviewContainer.appendChild(previewTitle);
    
    // Show loading state
    const loadingMsg = document.createElement('p');
    loadingMsg.textContent = 'Loading media...';
    loadingMsg.style.color = '#6c757d';
    loadingMsg.style.textAlign = 'center';
    loadingMsg.style.padding = '10px';
    this.mediaPreviewContainer.appendChild(loadingMsg);
    
    try {
      // Use MediaManager to load media
      const result = await mediaManager.loadMedia(this.wedge.media);
      
      // Remove loading message
      this.mediaPreviewContainer.removeChild(loadingMsg);
      
      if (result.success && result.element) {
        const element = result.element.cloneNode(true) as HTMLImageElement | HTMLVideoElement;
        
        // Apply preview styling
        element.style.maxWidth = '200px';
        element.style.maxHeight = '150px';
        element.style.objectFit = 'contain';
        element.style.border = '1px solid #dee2e6';
        element.style.borderRadius = '4px';
        element.style.display = 'block';
        element.style.margin = '0 auto';
        
        if (element instanceof HTMLVideoElement) {
          element.controls = true;
          element.muted = true;
        }
        
        this.mediaPreviewContainer.appendChild(element);
        
        if (result.fallbackUsed) {
          this.showMessage('Media loaded with fallback', 'warning');
        }
      } else {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = result.error || 'Failed to load media';
        errorMsg.style.color = '#dc3545';
        errorMsg.style.textAlign = 'center';
        errorMsg.style.padding = '10px';
        this.mediaPreviewContainer.appendChild(errorMsg);
      }
    } catch (error) {
      // Remove loading message
      if (loadingMsg.parentElement) {
        this.mediaPreviewContainer.removeChild(loadingMsg);
      }
      
      const errorMsg = document.createElement('p');
      errorMsg.textContent = 'Error loading media preview';
      errorMsg.style.color = '#dc3545';
      errorMsg.style.textAlign = 'center';
      errorMsg.style.padding = '10px';
      this.mediaPreviewContainer.appendChild(errorMsg);
      
      console.error('Media preview error:', error);
    }
  }

  private isValidColor(color: string): boolean {
    const style = new Option().style;
    style.color = color;
    return style.color !== '';
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  private triggerUpdate(): void {
    if (this.callbacks.onWedgeUpdate) {
      this.callbacks.onWedgeUpdate({ ...this.wedge });
    }
  }

  // Public API methods
  public getWedge(): Wedge {
    return { ...this.wedge };
  }

  public setWedge(wedge: Wedge): void {
    this.wedge = { ...wedge };
    this.initializeEditor();
  }

  public validateWedge(): MediaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate label
    if (!this.wedge.label || this.wedge.label.trim().length === 0) {
      errors.push('Label cannot be empty');
    }
    
    if (this.wedge.label.length > 50) {
      errors.push('Label must be 50 characters or less');
    }
    
    // Validate weight
    if (isNaN(this.wedge.weight) || this.wedge.weight < 0) {
      errors.push('Weight must be a non-negative number');
    }
    
    if (this.wedge.weight === 0) {
      warnings.push('Zero weight means this wedge will never be selected');
    }
    
    // Validate media
    if (this.wedge.media) {
      if (!this.wedge.media.src || this.wedge.media.src.trim().length === 0) {
        errors.push('Media URL cannot be empty when media type is selected');
      }
      
      if (this.wedge.media.type === 'image' && !this.wedge.media.alt) {
        warnings.push('Alt text is recommended for accessibility');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    // Remove any existing messages
    const existingMessage = this.container.querySelector('.wedge-editor-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `wedge-editor-message wedge-editor-message-${type}`;
    messageElement.textContent = message;
    
    // Style the message
    messageElement.style.padding = '10px';
    messageElement.style.marginBottom = '15px';
    messageElement.style.borderRadius = '4px';
    messageElement.style.fontSize = '14px';
    messageElement.style.fontWeight = '500';
    
    switch (type) {
      case 'success':
        messageElement.style.backgroundColor = '#d4edda';
        messageElement.style.color = '#155724';
        messageElement.style.border = '1px solid #c3e6cb';
        break;
      case 'error':
        messageElement.style.backgroundColor = '#f8d7da';
        messageElement.style.color = '#721c24';
        messageElement.style.border = '1px solid #f5c6cb';
        break;
      case 'warning':
        messageElement.style.backgroundColor = '#fff3cd';
        messageElement.style.color = '#856404';
        messageElement.style.border = '1px solid #ffeaa7';
        break;
      case 'info':
        messageElement.style.backgroundColor = '#d1ecf1';
        messageElement.style.color = '#0c5460';
        messageElement.style.border = '1px solid #bee5eb';
        break;
    }
    
    // Insert at the top of the container
    this.container.insertBefore(messageElement, this.container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentElement) {
        messageElement.remove();
      }
    }, 5000);
  }

  public getSupportedMediaTypes(): { images: string[]; videos: string[] } {
    return mediaManager.getSupportedTypes();
  }

  public async validateMedia(media: WedgeMedia): Promise<MediaManagerValidationResult> {
    return mediaManager.validateMedia(media);
  }

  public destroy(): void {
    this.container.innerHTML = '';
  }
}