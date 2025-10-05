/**
 * WheelRenderer class - Extracts and modularizes existing wheel rendering functionality
 * Preserves the current CSS-based rendering approach while adding TypeScript structure
 * Now includes Canvas rendering support with CSS fallback
 */

import { CanvasWheelRenderer, CanvasRenderOptions } from './CanvasWheelRenderer';
import { Wheel, Wedge } from '../models';

export interface WheelRenderOptions {
  wheelId: string;
  wedgeCount: number;
  texts: string[];
  colors: string[];
  radius: number;
}

export interface EnhancedWheelRenderOptions {
  wheelId: string;
  wheel: Wheel;
  showLabels?: boolean;
  showProbabilityIndicators?: boolean;
  highlightedWedgeId?: string;
  animationProgress?: number;
  useCanvas?: boolean;
}

export class WheelRenderer {
  private container: HTMLElement;
  private wheels: Map<string, HTMLElement> = new Map();
  private needleElement: HTMLElement | null = null;
  private canvasRenderer: CanvasWheelRenderer | null = null;
  private canvasSupported: boolean = false;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }
    this.container = container;
    this.detectCanvasSupport();
    this.initializeContainer();
  }

  private detectCanvasSupport(): void {
    try {
      const testCanvas = document.createElement('canvas');
      const ctx = testCanvas.getContext('2d');
      this.canvasSupported = !!(ctx && typeof ctx.fillRect === 'function');
    } catch (error) {
      this.canvasSupported = false;
    }
  }

  private initializeContainer(): void {
    // Create the wheel container structure similar to the original
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.width = '500px';
    this.container.style.height = '500px';
    this.container.style.margin = '0 auto';

    // Initialize Canvas renderer if supported
    if (this.canvasSupported) {
      try {
        this.canvasRenderer = new CanvasWheelRenderer(this.container.id);
      } catch (error) {
        console.warn('Failed to initialize Canvas renderer, falling back to CSS:', error);
        this.canvasSupported = false;
        this.initializeCSSRenderer();
      }
    } else {
      this.initializeCSSRenderer();
    }
  }

  private initializeCSSRenderer(): void {
    // Create needle element for CSS rendering
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
    
    this.container.appendChild(this.needleElement);
  }

  /**
   * Creates a wheel with wedges using the original algorithm
   * Preserves the exact styling and structure from wheewheell.html
   */
  public createWheel(options: WheelRenderOptions): HTMLElement {
    const { wheelId, wedgeCount, texts, colors } = options;
    
    // Remove existing wheel if it exists
    const existingWheel = this.wheels.get(wheelId);
    if (existingWheel) {
      existingWheel.remove();
    }

    const wheel = document.createElement('div');
    wheel.id = wheelId;
    wheel.style.position = 'absolute';
    wheel.style.borderRadius = '50%';
    wheel.style.overflow = 'hidden';
    
    // Set wheel size and position based on type (preserving original layout)
    if (wheelId === 'bigWheel') {
      wheel.style.width = '400px';
      wheel.style.height = '400px';
      wheel.style.border = '5px solid #333';
      wheel.style.top = '0px';
      wheel.style.left = '50px';
    } else if (wheelId === 'smallWheel') {
      wheel.style.width = '200px';
      wheel.style.height = '200px';
      wheel.style.border = '3px solid #555';
      wheel.style.top = '100px';
      wheel.style.left = '150px';
    }

    const wedgeAngle = 360 / wedgeCount;
    
    for (let i = 0; i < wedgeCount; i++) {
      const wedge = document.createElement('div');
      wedge.style.position = 'absolute';
      wedge.style.width = '50%';
      wedge.style.height = '50%';
      wedge.style.left = '25%';
      wedge.style.top = '0';
      wedge.style.transformOrigin = 'bottom center';
      wedge.style.transform = `rotate(${i * wedgeAngle}deg)`;
      wedge.style.clipPath = 'polygon(0 100%, 50% 0, 100% 100%)';
      wedge.style.backgroundColor = colors[i % colors.length] || '#ccc';
      
      const text = document.createElement('div');
      text.textContent = texts[i] || '';
      text.style.position = 'absolute';
      text.style.width = '100%';
      text.style.textAlign = 'center';
      text.style.top = '70%';
      text.style.transform = 'rotate(90deg)';
      text.style.fontSize = '12px';
      text.style.color = 'white';
      text.style.textShadow = '1px 1px 1px black';
      
      wedge.appendChild(text);
      wheel.appendChild(wedge);
    }

    this.wheels.set(wheelId, wheel);
    this.container.appendChild(wheel);
    
    return wheel;
  }

  /**
   * Updates wheel rotation - preserves original rotation logic
   */
  public updateWheelRotation(wheelId: string, angle: number): void {
    const wheel = this.wheels.get(wheelId);
    if (wheel) {
      wheel.style.transform = `rotate(${angle}deg)`;
    }
  }

  /**
   * Determines which wedge the needle points to using original algorithm
   */
  public determineWedgeResult(_wheelId: string, angle: number, wedgeCount: number, texts: string[]): { index: number; text: string } {
    // Calculate normalized angle (0-360) - preserving original logic
    const normAngle = ((angle % 360) + 360) % 360;
    
    // Calculate which wedge the needle is pointing to (needle at top)
    const wedgeSize = 360 / wedgeCount;
    
    // Adjust for needle position (top center) - original algorithm
    const index = Math.floor(((360 - normAngle + wedgeSize/2) % 360) / wedgeSize);
    
    return {
      index,
      text: texts[index] || '',
    };
  }

  /**
   * Gets the container element for external manipulation
   */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Gets a specific wheel element
   */
  public getWheel(wheelId: string): HTMLElement | undefined {
    return this.wheels.get(wheelId);
  }

  /**
   * Enhanced wheel rendering with Canvas support and CSS fallback
   */
  public renderEnhancedWheel(options: EnhancedWheelRenderOptions): void {
    const { useCanvas = true } = options;
    
    if (this.canvasSupported && this.canvasRenderer && useCanvas) {
      this.renderWithCanvas(options);
    } else {
      this.renderWithCSS(options);
    }
  }

  private renderWithCanvas(options: EnhancedWheelRenderOptions): void {
    if (!this.canvasRenderer) {return;}

    const canvasOptions: CanvasRenderOptions = {
      wheelId: options.wheelId,
      wheel: options.wheel,
      showLabels: options.showLabels ?? true,
      showProbabilityIndicators: options.showProbabilityIndicators ?? false,
      ...(options.highlightedWedgeId && { highlightedWedgeId: options.highlightedWedgeId }),
      animationProgress: options.animationProgress ?? 0,
    };

    this.canvasRenderer.renderWheel(canvasOptions);
  }

  private renderWithCSS(options: EnhancedWheelRenderOptions): void {
    const { wheelId, wheel } = options;
    
    // Convert enhanced options to legacy format
    const legacyOptions: WheelRenderOptions = {
      wheelId,
      wedgeCount: wheel.wedges.length,
      texts: wheel.wedges.map(w => w.label),
      colors: wheel.wedges.map(w => w.color),
      radius: wheel.radius,
    };

    this.createWheel(legacyOptions);
    this.updateWheelRotation(wheelId, wheel.currentAngle);
  }

  /**
   * Updates wheel rotation with Canvas support
   */
  public updateEnhancedWheelRotation(wheelId: string, angle: number, velocity: number = 0): void {
    if (this.canvasSupported && this.canvasRenderer) {
      this.canvasRenderer.updateWheelRotation(wheelId, angle, velocity);
    } else {
      this.updateWheelRotation(wheelId, angle);
    }
  }

  /**
   * Adds visual effects (Canvas only)
   */
  public addVisualEffect(wheelId: string, effect: { type: 'glow' | 'pulse' | 'sparkle' | 'highlight'; intensity: number; color?: string }): void {
    if (this.canvasSupported && this.canvasRenderer) {
      this.canvasRenderer.addVisualEffect(wheelId, effect);
    }
    // CSS fallback could add CSS classes for basic effects
  }

  /**
   * Clears visual effects
   */
  public clearVisualEffects(wheelId: string): void {
    if (this.canvasSupported && this.canvasRenderer) {
      this.canvasRenderer.clearVisualEffects(wheelId);
    }
  }

  /**
   * Starts animation loop for smooth rendering
   */
  public startAnimationLoop(): void {
    if (this.canvasSupported && this.canvasRenderer) {
      this.canvasRenderer.startAnimationLoop();
    }
  }

  /**
   * Stops animation loop
   */
  public stopAnimationLoop(): void {
    if (this.canvasSupported && this.canvasRenderer) {
      this.canvasRenderer.stopAnimationLoop();
    }
  }

  /**
   * Gets rendering performance metrics (Canvas only)
   */
  public getPerformanceMetrics(): { frameTime: number; fps: number; drawCalls: number } | null {
    if (this.canvasSupported && this.canvasRenderer) {
      return this.canvasRenderer.getMetrics();
    }
    return null;
  }

  /**
   * Determines wedge result with enhanced accuracy
   */
  public determineEnhancedWedgeResult(wheelId: string, angle: number, wheel: Wheel): { index: number; wedge: Wedge } {
    if (this.canvasSupported && this.canvasRenderer) {
      return this.canvasRenderer.determineWedgeResult(wheelId, angle, wheel.wedges);
    } else {
      // Fallback to legacy method
      const legacyResult = this.determineWedgeResult(wheelId, angle, wheel.wedges.length, wheel.wedges.map(w => w.label));
      const wedge = wheel.wedges[legacyResult.index];
      if (!wedge) {
        throw new Error(`Invalid wedge index: ${legacyResult.index}`);
      }
      return {
        index: legacyResult.index,
        wedge: wedge,
      };
    }
  }

  /**
   * Checks if Canvas rendering is available
   */
  public isCanvasSupported(): boolean {
    return this.canvasSupported && this.canvasRenderer !== null;
  }

  /**
   * Gets the Canvas renderer instance
   */
  public getCanvasRenderer(): CanvasWheelRenderer | null {
    return this.canvasRenderer;
  }

  /**
   * Clears all wheels from the container
   */
  public clearWheels(): void {
    if (this.canvasSupported && this.canvasRenderer) {
      this.canvasRenderer.clear();
    }
    this.wheels.forEach(wheel => wheel.remove());
    this.wheels.clear();
  }
}