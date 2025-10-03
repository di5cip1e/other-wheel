/**
 * WheelRenderer class - Extracts and modularizes existing wheel rendering functionality
 * Preserves the current CSS-based rendering approach while adding TypeScript structure
 */

// Types are imported but may not be used directly in implementation
// They are available for future type annotations

export interface WheelRenderOptions {
  wheelId: string;
  wedgeCount: number;
  texts: string[];
  colors: string[];
  radius: number;
}

export class WheelRenderer {
  private container: HTMLElement;
  private wheels: Map<string, HTMLElement> = new Map();
  private needleElement: HTMLElement | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }
    this.container = container;
    this.initializeContainer();
  }

  private initializeContainer(): void {
    // Create the wheel container structure similar to the original
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.width = '500px';
    this.container.style.height = '500px';
    this.container.style.margin = '0 auto';

    // Create needle element
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
      text: texts[index] || ''
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
   * Clears all wheels from the container
   */
  public clearWheels(): void {
    this.wheels.forEach(wheel => wheel.remove());
    this.wheels.clear();
  }
}