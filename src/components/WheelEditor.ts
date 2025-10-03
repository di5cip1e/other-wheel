/**
 * WheelEditor component - Enhanced game editor interface for comprehensive wheel customization
 * Supports adding, removing, and modifying wedges with real-time preview
 */

import { Wheel, Wedge } from '../models';

export interface WheelEditorOptions {
  containerId: string;
  wheel?: Wheel;
  showAdvancedOptions?: boolean;
  enablePreview?: boolean;
}

export interface WheelEditorCallbacks {
  onWedgeAdd?: (wedge: Wedge) => void;
  onWedgeRemove?: (wedgeId: string) => void;
  onWedgeUpdate?: (wedge: Wedge) => void;
  onWheelUpdate?: (wheel: Wheel) => void;
  onPreviewUpdate?: (wheel: Wheel) => void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class WheelEditor {
  private container: HTMLElement;
  private headerContainer!: HTMLElement;
  private wedgesContainer!: HTMLElement;
  private advancedContainer!: HTMLElement;
  private previewContainer!: HTMLElement;
  private wheel: Wheel;
  private callbacks: WheelEditorCallbacks;
  private options: WheelEditorOptions;

  constructor(options: WheelEditorOptions, callbacks: WheelEditorCallbacks = {}) {
    this.options = options;
    this.callbacks = callbacks;
    
    // Initialize wheel with default values if not provided
    this.wheel = options.wheel || this.createDefaultWheel();

    const container = document.getElementById(options.containerId);
    if (!container) {
      throw new Error(`Container element with id '${options.containerId}' not found`);
    }
    this.container = container;
    
    this.initializeEditor();
  }

  private createDefaultWheel(): Wheel {
    return {
      id: 'wheel-' + Date.now(),
      label: 'New Wheel',
      wedges: [
        { id: 'wedge-1', label: 'Option 1', weight: 1, color: '#ff6b6b' },
        { id: 'wedge-2', label: 'Option 2', weight: 1, color: '#4ecdc4' },
        { id: 'wedge-3', label: 'Option 3', weight: 1, color: '#45b7d1' },
        { id: 'wedge-4', label: 'Option 4', weight: 1, color: '#96ceb4' }
      ],
      frictionCoefficient: 0.02,
      clutchRatio: 0.8,
      radius: 150,
      position: { x: 0, y: 0 },
      currentAngle: 0,
      angularVelocity: 0
    };
  }

  private initializeEditor(): void {
    this.container.innerHTML = '';
    this.container.className = 'wheel-editor';

    // Header with wheel properties
    this.createHeader();
    
    // Wedges section
    this.createWedgesSection();
    
    // Advanced options (if enabled)
    if (this.options.showAdvancedOptions) {
      this.createAdvancedSection();
    }
    
    // Preview section (if enabled)
    if (this.options.enablePreview) {
      this.createPreviewSection();
    }
  }

  private createHeader(): void {
    this.headerContainer = document.createElement('div');
    this.headerContainer.className = 'wheel-editor-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Wheel Editor';
    
    const labelContainer = document.createElement('div');
    labelContainer.className = 'wheel-label-container';
    
    const labelLabel = document.createElement('label');
    labelLabel.textContent = 'Wheel Label:';
    
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = this.wheel.label;
    labelInput.className = 'wheel-label-input';
    labelInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      this.wheel.label = target.value;
      this.triggerWheelUpdate();
    };
    
    labelContainer.appendChild(labelLabel);
    labelContainer.appendChild(labelInput);
    
    this.headerContainer.appendChild(title);
    this.headerContainer.appendChild(labelContainer);
    this.container.appendChild(this.headerContainer);
  }

  private createWedgesSection(): void {
    const wedgesSection = document.createElement('div');
    wedgesSection.className = 'wedges-section';
    
    const wedgesHeader = document.createElement('div');
    wedgesHeader.className = 'wedges-header';
    
    const wedgesTitle = document.createElement('h4');
    wedgesTitle.textContent = 'Wedges';
    
    const addButton = document.createElement('button');
    addButton.textContent = '+ Add Wedge';
    addButton.className = 'add-wedge-btn';
    addButton.onclick = () => this.addWedge();
    
    wedgesHeader.appendChild(wedgesTitle);
    wedgesHeader.appendChild(addButton);
    
    this.wedgesContainer = document.createElement('div');
    this.wedgesContainer.className = 'wedges-container';
    
    wedgesSection.appendChild(wedgesHeader);
    wedgesSection.appendChild(this.wedgesContainer);
    this.container.appendChild(wedgesSection);
    
    this.renderWedges();
  }

  private createAdvancedSection(): void {
    this.advancedContainer = document.createElement('div');
    this.advancedContainer.className = 'advanced-section';
    
    const title = document.createElement('h4');
    title.textContent = 'Advanced Properties';
    
    const frictionContainer = this.createNumberInput(
      'Friction Coefficient',
      this.wheel.frictionCoefficient,
      0,
      1,
      0.01,
      (value) => {
        this.wheel.frictionCoefficient = value;
        this.triggerWheelUpdate();
      }
    );
    
    const clutchContainer = this.createNumberInput(
      'Clutch Ratio',
      this.wheel.clutchRatio || 0,
      0,
      1,
      0.01,
      (value) => {
        this.wheel.clutchRatio = value;
        this.triggerWheelUpdate();
      }
    );
    
    this.advancedContainer.appendChild(title);
    this.advancedContainer.appendChild(frictionContainer);
    this.advancedContainer.appendChild(clutchContainer);
    this.container.appendChild(this.advancedContainer);
  }

  private createPreviewSection(): void {
    this.previewContainer = document.createElement('div');
    this.previewContainer.className = 'preview-section';
    
    const title = document.createElement('h4');
    title.textContent = 'Preview';
    
    const previewArea = document.createElement('div');
    previewArea.className = 'preview-area';
    previewArea.textContent = 'Preview will be rendered here';
    
    this.previewContainer.appendChild(title);
    this.previewContainer.appendChild(previewArea);
    this.container.appendChild(this.previewContainer);
  }

  private renderWedges(): void {
    this.wedgesContainer.innerHTML = '';
    
    this.wheel.wedges.forEach((wedge, index) => {
      const wedgeElement = this.createWedgeElement(wedge, index);
      this.wedgesContainer.appendChild(wedgeElement);
    });
  }

  private createWedgeElement(wedge: Wedge, index: number): HTMLElement {
    const wedgeContainer = document.createElement('div');
    wedgeContainer.className = 'wedge-item';
    wedgeContainer.dataset['wedgeId'] = wedge.id;
    
    // Wedge header with drag handle and remove button
    const header = document.createElement('div');
    header.className = 'wedge-header';
    
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '⋮⋮';
    
    const wedgeNumber = document.createElement('span');
    wedgeNumber.className = 'wedge-number';
    wedgeNumber.textContent = `Wedge ${index + 1}`;
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-wedge-btn';
    removeButton.textContent = '×';
    removeButton.onclick = () => this.removeWedge(wedge.id);
    
    header.appendChild(dragHandle);
    header.appendChild(wedgeNumber);
    header.appendChild(removeButton);
    
    // Wedge content
    const content = document.createElement('div');
    content.className = 'wedge-content';
    
    // Label input
    const labelContainer = this.createTextInput(
      'Label',
      wedge.label,
      (value) => {
        wedge.label = value;
        this.triggerWedgeUpdate(wedge);
      }
    );
    
    // Weight input
    const weightContainer = this.createNumberInput(
      'Weight',
      wedge.weight,
      0,
      100,
      0.1,
      (value) => {
        wedge.weight = value;
        this.triggerWedgeUpdate(wedge);
      }
    );
    
    // Color input
    const colorContainer = this.createColorInput(
      'Color',
      wedge.color,
      (value) => {
        wedge.color = value;
        this.triggerWedgeUpdate(wedge);
      }
    );
    
    content.appendChild(labelContainer);
    content.appendChild(weightContainer);
    content.appendChild(colorContainer);
    
    wedgeContainer.appendChild(header);
    wedgeContainer.appendChild(content);
    
    return wedgeContainer;
  }

  private createTextInput(label: string, value: string, onChange: (value: string) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'input-container';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label + ':';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.className = 'text-input';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const validationResult = this.validateWedgeLabel(target.value);
      
      if (validationResult.isValid) {
        onChange(target.value);
        input.classList.remove('error');
      } else {
        input.classList.add('error');
        input.title = validationResult.errors.join(', ');
      }
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
    input.className = 'number-input';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const numValue = parseFloat(target.value);
      const validationResult = this.validateWedgeWeight(numValue);
      
      if (validationResult.isValid) {
        onChange(numValue);
        input.classList.remove('error');
      } else {
        input.classList.add('error');
        input.title = validationResult.errors.join(', ');
      }
    };
    
    container.appendChild(labelElement);
    container.appendChild(input);
    
    return container;
  }

  private createColorInput(label: string, value: string, onChange: (value: string) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'input-container';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label + ':';
    
    const input = document.createElement('input');
    input.type = 'color';
    input.value = value;
    input.className = 'color-input';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      onChange(target.value);
    };
    
    container.appendChild(labelElement);
    container.appendChild(input);
    
    return container;
  }

  private addWedge(): void {
    const newWedge: Wedge = {
      id: 'wedge-' + Date.now(),
      label: `Option ${this.wheel.wedges.length + 1}`,
      weight: 1,
      color: this.generateRandomColor()
    };
    
    this.wheel.wedges.push(newWedge);
    this.renderWedges();
    
    if (this.callbacks.onWedgeAdd) {
      this.callbacks.onWedgeAdd(newWedge);
    }
    
    this.triggerWheelUpdate();
  }

  private removeWedge(wedgeId: string): void {
    if (this.wheel.wedges.length <= 2) {
      alert('A wheel must have at least 2 wedges');
      return;
    }
    
    const wedgeIndex = this.wheel.wedges.findIndex(w => w.id === wedgeId);
    if (wedgeIndex !== -1) {
      this.wheel.wedges.splice(wedgeIndex, 1);
      this.renderWedges();
      
      if (this.callbacks.onWedgeRemove) {
        this.callbacks.onWedgeRemove(wedgeId);
      }
      
      this.triggerWheelUpdate();
    }
  }

  private generateRandomColor(): string {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', 
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
    ];
    return colors[Math.floor(Math.random() * colors.length)] || '#cccccc';
  }

  private triggerWedgeUpdate(wedge: Wedge): void {
    if (this.callbacks.onWedgeUpdate) {
      this.callbacks.onWedgeUpdate(wedge);
    }
    
    this.triggerWheelUpdate();
    this.triggerPreviewUpdate();
  }

  private triggerWheelUpdate(): void {
    if (this.callbacks.onWheelUpdate) {
      this.callbacks.onWheelUpdate({ ...this.wheel });
    }
    
    this.triggerPreviewUpdate();
  }

  private triggerPreviewUpdate(): void {
    if (this.options.enablePreview && this.callbacks.onPreviewUpdate) {
      this.callbacks.onPreviewUpdate({ ...this.wheel });
    }
  }

  // Validation methods
  private validateWedgeLabel(label: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!label || label.trim().length === 0) {
      errors.push('Label cannot be empty');
    }
    
    if (label.length > 50) {
      errors.push('Label must be 50 characters or less');
    }
    
    if (label.length > 20) {
      warnings.push('Long labels may not display well on the wheel');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateWedgeWeight(weight: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (isNaN(weight) || weight < 0) {
      errors.push('Weight must be a non-negative number');
    }
    
    if (weight === 0) {
      warnings.push('Zero weight means this wedge will never be selected');
    }
    
    if (weight > 100) {
      warnings.push('Very high weights may make other wedges rarely selected');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  public validateWheel(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check minimum wedges
    if (this.wheel.wedges.length < 2) {
      errors.push('Wheel must have at least 2 wedges');
    }
    
    // Check maximum wedges
    if (this.wheel.wedges.length > 20) {
      warnings.push('More than 20 wedges may be difficult to read');
    }
    
    // Check for duplicate labels
    const labels = this.wheel.wedges.map(w => w.label.toLowerCase());
    const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
    if (duplicates.length > 0) {
      warnings.push('Duplicate wedge labels detected');
    }
    
    // Check total weight
    const totalWeight = this.wheel.wedges.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) {
      errors.push('At least one wedge must have a weight greater than 0');
    }
    
    // Validate individual wedges
    this.wheel.wedges.forEach((wedge, index) => {
      const labelValidation = this.validateWedgeLabel(wedge.label);
      const weightValidation = this.validateWedgeWeight(wedge.weight);
      
      labelValidation.errors.forEach(error => 
        errors.push(`Wedge ${index + 1}: ${error}`)
      );
      weightValidation.errors.forEach(error => 
        errors.push(`Wedge ${index + 1}: ${error}`)
      );
      
      labelValidation.warnings.forEach(warning => 
        warnings.push(`Wedge ${index + 1}: ${warning}`)
      );
      weightValidation.warnings.forEach(warning => 
        warnings.push(`Wedge ${index + 1}: ${warning}`)
      );
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Public API methods
  public getWheel(): Wheel {
    return { ...this.wheel };
  }

  public setWheel(wheel: Wheel): void {
    this.wheel = { ...wheel };
    this.renderWedges();
    this.triggerWheelUpdate();
  }

  public getWedges(): Wedge[] {
    return [...this.wheel.wedges];
  }

  public addWedgePublic(wedge?: Partial<Wedge>): void {
    const newWedge: Wedge = {
      id: wedge?.id || 'wedge-' + Date.now(),
      label: wedge?.label !== undefined ? wedge.label : `Option ${this.wheel.wedges.length + 1}`,
      weight: wedge?.weight !== undefined ? wedge.weight : 1,
      color: wedge?.color || this.generateRandomColor()
    };
    
    if (wedge?.media) {
      newWedge.media = wedge.media;
    }
    
    this.wheel.wedges.push(newWedge);
    this.renderWedges();
    this.triggerWheelUpdate();
  }

  public removeWedgePublic(wedgeId: string): boolean {
    if (this.wheel.wedges.length <= 2) {
      return false;
    }
    
    const wedgeIndex = this.wheel.wedges.findIndex(w => w.id === wedgeId);
    if (wedgeIndex !== -1) {
      this.wheel.wedges.splice(wedgeIndex, 1);
      this.renderWedges();
      this.triggerWheelUpdate();
      return true;
    }
    
    return false;
  }

  public updateWedgePublic(wedgeId: string, updates: Partial<Wedge>): boolean {
    const wedge = this.wheel.wedges.find(w => w.id === wedgeId);
    if (wedge) {
      Object.assign(wedge, updates);
      this.renderWedges();
      this.triggerWheelUpdate();
      return true;
    }
    return false;
  }

  // Legacy compatibility methods
  public getWedgeTexts(): string[] {
    return this.wheel.wedges.map(w => w.label);
  }

  public getWedgeWeights(): number[] {
    return this.wheel.wedges.map(w => w.weight);
  }

  public getWedgeCount(): number {
    return this.wheel.wedges.length;
  }

  public updateWedgeText(index: number, text: string): void {
    if (index >= 0 && index < this.wheel.wedges.length && this.wheel.wedges[index]) {
      this.wheel.wedges[index]!.label = text;
      this.renderWedges();
      this.triggerWheelUpdate();
    }
  }

  public updateWedgeWeight(index: number, weight: number): void {
    if (index >= 0 && index < this.wheel.wedges.length && this.wheel.wedges[index]) {
      this.wheel.wedges[index]!.weight = Math.max(0, weight);
      this.renderWedges();
      this.triggerWheelUpdate();
    }
  }

  public updateAllWedgeTexts(texts: string[]): void {
    texts.forEach((text, index) => {
      if (index < this.wheel.wedges.length && this.wheel.wedges[index]) {
        this.wheel.wedges[index]!.label = text;
      }
    });
    this.renderWedges();
    this.triggerWheelUpdate();
  }

  public updateAllWedgeWeights(weights: number[]): void {
    weights.forEach((weight, index) => {
      if (index < this.wheel.wedges.length && this.wheel.wedges[index]) {
        this.wheel.wedges[index]!.weight = Math.max(0, weight);
      }
    });
    this.renderWedges();
    this.triggerWheelUpdate();
  }

  public updateWedgeData(texts: string[], weights: number[]): void {
    texts.forEach((text, index) => {
      if (index < this.wheel.wedges.length && this.wheel.wedges[index]) {
        this.wheel.wedges[index]!.label = text;
      }
    });
    weights.forEach((weight, index) => {
      if (index < this.wheel.wedges.length && this.wheel.wedges[index]) {
        this.wheel.wedges[index]!.weight = Math.max(0, weight);
      }
    });
    this.renderWedges();
    this.triggerWheelUpdate();
  }

  public destroy(): void {
    this.container.innerHTML = '';
  }
}