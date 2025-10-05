/**
 * CanvasWheelRenderer - High-performance Canvas-based wheel rendering
 * Provides smooth animations, dynamic wedge sizing, and visual effects
 * Maintains fallback compatibility with CSS rendering
 */

import { Wheel, Wedge } from '../models';

export interface CanvasRenderOptions {
  wheelId: string;
  wheel: Wheel;
  showLabels?: boolean;
  showProbabilityIndicators?: boolean;
  highlightedWedgeId?: string;
  animationProgress?: number; // 0-1 for spin animations
}

export interface VisualEffect {
  type: 'glow' | 'pulse' | 'sparkle' | 'highlight';
  intensity: number; // 0-1
  color?: string;
  duration?: number; // milliseconds
}

export interface RenderingMetrics {
  frameTime: number;
  fps: number;
  drawCalls: number;
  lastRenderTime: number;
}

export class CanvasWheelRenderer {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private container: HTMLElement;
  private needleElement: HTMLElement | null = null;
  private animationFrameId: number | null = null;
  private metrics: RenderingMetrics = {
    frameTime: 0,
    fps: 0,
    drawCalls: 0,
    lastRenderTime: 0,
  };
  
  // Visual effects state
  private activeEffects: Map<string, VisualEffect[]> = new Map();
  private wheelRotations: Map<string, number> = new Map();
  private wheelVelocities: Map<string, number> = new Map();
  
  // Performance optimization
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private isDirty: boolean = true;
  
  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }
    this.container = container;
    this.initializeCanvas();
    this.initializeNeedle();
  }

  private initializeCanvas(): void {
    // Clear container and set up canvas
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.width = '500px';
    this.container.style.height = '500px';
    this.container.style.margin = '0 auto';

    this.canvas = document.createElement('canvas');
    this.canvas.width = 500;
    this.canvas.height = 500;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '1';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;

    // Enable high-DPI rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    if (devicePixelRatio > 1) {
      this.canvas.width = 500 * devicePixelRatio;
      this.canvas.height = 500 * devicePixelRatio;
      this.canvas.style.width = '500px';
      this.canvas.style.height = '500px';
      this.ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    this.container.appendChild(this.canvas);
  }

  private initializeNeedle(): void {
    this.needleElement = document.createElement('div');
    this.needleElement.id = 'needle';
    this.needleElement.style.position = 'absolute';
    this.needleElement.style.width = '4px';
    this.needleElement.style.height = '50px';
    this.needleElement.style.background = 'red';
    this.needleElement.style.top = '-20px';
    this.needleElement.style.left = '248px';
    this.needleElement.style.transformOrigin = 'bottom center';
    this.needleElement.style.zIndex = '10';
    this.needleElement.style.boxShadow = '0 0 5px rgba(255, 0, 0, 0.5)';
    
    this.container.appendChild(this.needleElement);
  }

  /**
   * Renders a wheel with Canvas for high performance
   */
  public renderWheel(options: CanvasRenderOptions): void {
    const { wheelId, wheel, showLabels = true, highlightedWedgeId, animationProgress = 0 } = options;
    
    const startTime = performance.now();
    this.metrics.drawCalls++;

    // Calculate wheel properties
    const centerX = wheel.position.x;
    const centerY = wheel.position.y;
    const radius = wheel.radius;
    const currentRotation = this.wheelRotations.get(wheelId) || wheel.currentAngle;

    // Clear the wheel area
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    this.ctx.clip();
    this.ctx.clearRect(centerX - radius - 10, centerY - radius - 10, (radius + 10) * 2, (radius + 10) * 2);

    // Calculate wedge angles (dynamic sizing based on weights)
    const wedgeAngles = this.calculateWedgeAngles(wheel.wedges, options.showProbabilityIndicators);
    
    let currentAngle = currentRotation * (Math.PI / 180);
    
    // Render each wedge
    for (let i = 0; i < wheel.wedges.length; i++) {
      const wedge = wheel.wedges[i];
      const wedgeAngle = wedgeAngles[i];
      if (!wedge || wedgeAngle === undefined) {continue;}
      
      const isHighlighted = wedge.id === highlightedWedgeId;
      
      this.renderWedge(
        centerX, 
        centerY, 
        radius, 
        currentAngle, 
        wedgeAngle, 
        wedge, 
        isHighlighted,
        animationProgress,
      );
      
      if (showLabels) {
        this.renderWedgeLabel(
          centerX, 
          centerY, 
          radius, 
          currentAngle + wedgeAngle / 2, 
          wedge.label,
        );
      }
      
      currentAngle += wedgeAngle;
    }

    // Render wheel border
    this.renderWheelBorder(centerX, centerY, radius, wheelId);

    // Apply visual effects
    this.applyVisualEffects(wheelId, centerX, centerY, radius);

    this.ctx.restore();

    // Update performance metrics
    const endTime = performance.now();
    this.metrics.frameTime = endTime - startTime;
    this.metrics.lastRenderTime = endTime;
    this.updateFPS();
  }

  private calculateWedgeAngles(wedges: Wedge[], useProbabilityWeights: boolean = false): number[] {
    if (!useProbabilityWeights) {
      // Equal visual angles
      const equalAngle = (Math.PI * 2) / wedges.length;
      return new Array(wedges.length).fill(equalAngle);
    }

    // Calculate angles based on weights
    const totalWeight = wedges.reduce((sum, wedge) => sum + wedge.weight, 0);
    return wedges.map(wedge => (wedge.weight / totalWeight) * Math.PI * 2);
  }

  private renderWedge(
    centerX: number, 
    centerY: number, 
    radius: number, 
    startAngle: number, 
    wedgeAngle: number, 
    wedge: Wedge, 
    isHighlighted: boolean,
    animationProgress: number,
  ): void {
    this.ctx.save();

    // Create wedge path
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.arc(centerX, centerY, radius, startAngle, startAngle + wedgeAngle);
    this.ctx.closePath();

    // Apply base color with animation effects
    const fillColor = wedge.color;
    if (animationProgress > 0) {
      // Add motion blur effect during spinning
      const blurIntensity = Math.min(animationProgress * 0.3, 0.3);
      this.ctx.filter = `blur(${blurIntensity}px)`;
    }

    if (isHighlighted) {
      // Enhance highlighted wedge
      const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, this.lightenColor(fillColor, 0.3));
      gradient.addColorStop(1, fillColor);
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = fillColor;
    }

    this.ctx.fill();

    // Add wedge border
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Render media if present
    if (wedge.media && wedge.media.type === 'image') {
      this.renderWedgeMedia(centerX, centerY, radius, startAngle + wedgeAngle / 2, wedge.media);
    }

    this.ctx.restore();
  }

  private renderWedgeLabel(
    centerX: number, 
    centerY: number, 
    radius: number, 
    angle: number, 
    label: string,
  ): void {
    if (!label.trim()) {return;}

    this.ctx.save();

    // Calculate label position
    const labelRadius = radius * 0.7;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;

    // Set text properties
    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Rotate text to be readable
    this.ctx.translate(x, y);
    let textAngle = angle;
    if (textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2) {
      textAngle += Math.PI; // Flip text if it would be upside down
    }
    this.ctx.rotate(textAngle);

    // Draw text with outline
    this.ctx.strokeText(label, 0, 0);
    this.ctx.fillText(label, 0, 0);

    this.ctx.restore();
  }

  private renderWedgeMedia(
    centerX: number, 
    centerY: number, 
    radius: number, 
    angle: number, 
    media: { type: string; src: string; alt?: string },
  ): void {
    if (media.type !== 'image') {return;}

    const img = this.getOrLoadImage(media.src);
    if (!img || !img.complete) {return;}

    this.ctx.save();

    // Calculate media position and size
    const mediaRadius = radius * 0.5;
    const x = centerX + Math.cos(angle) * mediaRadius;
    const y = centerY + Math.sin(angle) * mediaRadius;
    const size = radius * 0.3;

    // Create circular clipping path for image
    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.clip();

    // Draw image
    this.ctx.drawImage(img, x - size / 2, y - size / 2, size, size);

    this.ctx.restore();
  }

  private renderWheelBorder(centerX: number, centerY: number, radius: number, wheelId: string): void {
    this.ctx.save();

    // Determine border style based on wheel type
    const borderWidth = wheelId === 'bigWheel' ? 5 : 3;
    const borderColor = wheelId === 'bigWheel' ? '#333' : '#555';

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = borderWidth;
    this.ctx.stroke();

    // Add inner shadow effect
    const gradient = this.ctx.createRadialGradient(centerX, centerY, radius - 10, centerX, centerY, radius);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.restore();
  }

  private applyVisualEffects(wheelId: string, centerX: number, centerY: number, radius: number): void {
    const effects = this.activeEffects.get(wheelId);
    if (!effects || effects.length === 0) {return;}

    this.ctx.save();

    for (const effect of effects) {
      switch (effect.type) {
      case 'glow':
        this.applyGlowEffect(centerX, centerY, radius, effect);
        break;
      case 'pulse':
        this.applyPulseEffect(centerX, centerY, radius, effect);
        break;
      case 'sparkle':
        this.applySparkleEffect(centerX, centerY, radius, effect);
        break;
      case 'highlight':
        this.applyHighlightEffect(centerX, centerY, radius, effect);
        break;
      }
    }

    this.ctx.restore();
  }

  private applyGlowEffect(centerX: number, centerY: number, radius: number, effect: VisualEffect): void {
    const glowRadius = radius + (effect.intensity * 20);
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, radius,
      centerX, centerY, glowRadius,
    );
    
    const glowColor = effect.color || '#ffff00';
    gradient.addColorStop(0, `${glowColor}${Math.floor(effect.intensity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'transparent');

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  private applyPulseEffect(centerX: number, centerY: number, radius: number, effect: VisualEffect): void {
    const time = Date.now() / 1000;
    const pulseScale = 1 + (Math.sin(time * 4) * effect.intensity * 0.1);
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(pulseScale, pulseScale);
    this.ctx.translate(-centerX, -centerY);
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = effect.color || '#ff0000';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private applySparkleEffect(centerX: number, centerY: number, radius: number, effect: VisualEffect): void {
    const sparkleCount = Math.floor(effect.intensity * 20);
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkleCount + (Date.now() / 1000);
      const sparkleRadius = radius * (0.8 + Math.random() * 0.4);
      const x = centerX + Math.cos(angle) * sparkleRadius;
      const y = centerY + Math.sin(angle) * sparkleRadius;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = effect.color || '#ffffff';
      this.ctx.fill();
    }
  }

  private applyHighlightEffect(centerX: number, centerY: number, radius: number, effect: VisualEffect): void {
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    this.ctx.strokeStyle = effect.color || '#00ff00';
    this.ctx.lineWidth = 5;
    this.ctx.globalAlpha = effect.intensity;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  /**
   * Updates wheel rotation with smooth animation
   */
  public updateWheelRotation(wheelId: string, angle: number, velocity: number = 0): void {
    this.wheelRotations.set(wheelId, angle);
    this.wheelVelocities.set(wheelId, velocity);
    this.isDirty = true;
  }

  /**
   * Adds visual effect to a wheel
   */
  public addVisualEffect(wheelId: string, effect: VisualEffect): void {
    const effects = this.activeEffects.get(wheelId) || [];
    effects.push(effect);
    this.activeEffects.set(wheelId, effects);
    this.isDirty = true;
  }

  /**
   * Removes visual effects from a wheel
   */
  public clearVisualEffects(wheelId: string): void {
    this.activeEffects.delete(wheelId);
    this.isDirty = true;
  }

  /**
   * Starts the animation loop for smooth rendering
   */
  public startAnimationLoop(): void {
    if (this.animationFrameId !== null) {return;}

    const animate = (_currentTime: number) => {
      if (this.isDirty || this.hasActiveAnimations()) {
        // Animation loop will be handled by the game controller
        // This method provides the infrastructure for smooth rendering
        this.isDirty = false;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stops the animation loop
   */
  public stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Determines which wedge the needle points to
   */
  public determineWedgeResult(_wheelId: string, angle: number, wedges: Wedge[]): { index: number; wedge: Wedge } {
    const normAngle = ((angle % 360) + 360) % 360;
    const wedgeAngles = this.calculateWedgeAngles(wedges, false);
    
    let currentAngle = 0;
    for (let i = 0; i < wedges.length; i++) {
      const wedgeAngle = wedgeAngles[i];
      if (wedgeAngle === undefined) {continue;}
      
      const wedgeAngleDegrees = wedgeAngle * (180 / Math.PI);
      if (normAngle >= currentAngle && normAngle < currentAngle + wedgeAngleDegrees) {
        const wedge = wedges[i];
        if (!wedge) {
          throw new Error(`Invalid wedge at index ${i}`);
        }
        return { index: i, wedge };
      }
      currentAngle += wedgeAngleDegrees;
    }
    
    // Fallback to last wedge
    const lastWedge = wedges[wedges.length - 1];
    if (!lastWedge) {
      throw new Error('No wedges available');
    }
    return { index: wedges.length - 1, wedge: lastWedge };
  }

  /**
   * Gets rendering performance metrics
   */
  public getMetrics(): RenderingMetrics {
    return { ...this.metrics };
  }

  /**
   * Clears the canvas
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.wheelRotations.clear();
    this.wheelVelocities.clear();
    this.activeEffects.clear();
    this.isDirty = true;
  }

  /**
   * Gets the canvas element for external manipulation
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Gets the container element
   */
  public getContainer(): HTMLElement {
    return this.container;
  }

  // Utility methods
  private getOrLoadImage(src: string): HTMLImageElement | null {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.isDirty = true; // Trigger re-render when image loads
    };
    img.src = src;
    this.imageCache.set(src, img);
    
    return img;
  }

  private lightenColor(color: string, amount: number): string {
    // Simple color lightening - convert hex to RGB and lighten
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.floor(255 * amount));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.floor(255 * amount));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.floor(255 * amount));
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private updateFPS(): void {
    const now = performance.now();
    if (this.metrics.lastRenderTime > 0) {
      const deltaTime = now - this.metrics.lastRenderTime;
      this.metrics.fps = Math.round(1000 / deltaTime);
    }
  }

  private hasActiveAnimations(): boolean {
    // Check if any wheels have non-zero velocity or active effects
    for (const velocity of this.wheelVelocities.values()) {
      if (Math.abs(velocity) > 0.1) {return true;}
    }
    
    for (const effects of this.activeEffects.values()) {
      if (effects.length > 0) {return true;}
    }
    
    return false;
  }
}