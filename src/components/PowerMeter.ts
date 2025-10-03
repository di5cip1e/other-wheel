/**
 * PowerMeter component - Enhanced with skill-based timing mechanics
 * Provides configurable oscillation patterns and power-to-velocity mapping
 */

import { PowerMeterState } from '../models/index.js';

export interface PowerMeterOptions {
  containerId: string;
  width?: number;
  height?: number;
  oscillationSpeed?: number; // Speed of oscillation (higher = faster)
  oscillationPattern?: 'linear' | 'sine' | 'triangle' | 'sawtooth';
  minAngularVelocity?: number; // Minimum wheel velocity at 0% power
  maxAngularVelocity?: number; // Maximum wheel velocity at 100% power
  showTimingFeedback?: boolean; // Show visual feedback for timing accuracy
  powerCurve?: 'linear' | 'quadratic' | 'cubic'; // Power-to-velocity mapping curve
}

export interface PowerMeterCallbacks {
  onStart?: () => void;
  onStop?: (power: number, angularVelocity: number, timingAccuracy: number) => void;
}

export interface TimingFeedback {
  accuracy: number; // 0-1, where 1 is perfect timing
  zone: 'poor' | 'good' | 'excellent' | 'perfect';
  color: string;
}

export class PowerMeter {
  private container: HTMLElement;
  private meterContainer!: HTMLElement;
  private indicator!: HTMLElement;
  private button!: HTMLButtonElement;
  private feedbackDisplay!: HTMLElement;
  private powerDisplay!: HTMLElement;
  private state: PowerMeterState;
  private animationFrame: number | null = null;
  private callbacks: PowerMeterCallbacks;
  private options: Required<PowerMeterOptions>;
  private startTime: number = 0;

  constructor(options: PowerMeterOptions, callbacks: PowerMeterCallbacks = {}) {
    this.options = {
      containerId: options.containerId,
      width: options.width || 300,
      height: options.height || 30,
      oscillationSpeed: options.oscillationSpeed || 2.0, // Oscillations per second
      oscillationPattern: options.oscillationPattern || 'sine',
      minAngularVelocity: options.minAngularVelocity || 0.5,
      maxAngularVelocity: options.maxAngularVelocity || 8.0,
      showTimingFeedback: options.showTimingFeedback !== false,
      powerCurve: options.powerCurve || 'quadratic'
    };
    
    this.callbacks = callbacks;
    this.state = {
      value: 50, // Start at middle position
      isActive: false,
      oscillationSpeed: this.options.oscillationSpeed
    };

    const container = document.getElementById(this.options.containerId);
    if (!container) {
      throw new Error(`Container element with id '${this.options.containerId}' not found`);
    }
    this.container = container;
    
    this.initializePowerMeter();
  }

  private initializePowerMeter(): void {
    // Create the enhanced power meter structure
    this.container.innerHTML = '';
    this.container.style.margin = '20px auto';
    this.container.style.textAlign = 'center';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Power Meter';
    this.container.appendChild(title);

    // Power display
    this.powerDisplay = document.createElement('div');
    this.powerDisplay.style.fontSize = '18px';
    this.powerDisplay.style.fontWeight = 'bold';
    this.powerDisplay.style.margin = '5px 0';
    this.powerDisplay.textContent = 'Power: 50%';
    this.container.appendChild(this.powerDisplay);

    // Meter container with enhanced styling
    this.meterContainer = document.createElement('div');
    this.meterContainer.style.position = 'relative';
    this.meterContainer.style.width = `${this.options.width}px`;
    this.meterContainer.style.height = `${this.options.height}px`;
    this.meterContainer.style.background = 'linear-gradient(to right, #ff4444 0%, #ffff44 50%, #44ff44 100%)';
    this.meterContainer.style.border = '2px solid #333';
    this.meterContainer.style.borderRadius = '5px';
    this.meterContainer.style.margin = '10px auto';
    this.meterContainer.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';

    // Add power zones for visual feedback
    this.createPowerZones();

    // Enhanced meter indicator
    this.indicator = document.createElement('div');
    this.indicator.style.position = 'absolute';
    this.indicator.style.width = '4px';
    this.indicator.style.height = `${this.options.height + 4}px`;
    this.indicator.style.background = '#000';
    this.indicator.style.left = '0';
    this.indicator.style.top = '-2px';
    this.indicator.style.borderRadius = '2px';
    this.indicator.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
    this.indicator.style.transition = 'none'; // Smooth animation handled by requestAnimationFrame

    this.meterContainer.appendChild(this.indicator);
    this.container.appendChild(this.meterContainer);

    // Timing feedback display
    if (this.options.showTimingFeedback) {
      this.feedbackDisplay = document.createElement('div');
      this.feedbackDisplay.style.fontSize = '14px';
      this.feedbackDisplay.style.margin = '5px 0';
      this.feedbackDisplay.style.minHeight = '20px';
      this.container.appendChild(this.feedbackDisplay);
    }

    // Enhanced spin button
    this.button = document.createElement('button');
    this.button.id = 'spinBtn';
    this.button.textContent = 'Start Spin';
    this.button.style.padding = '10px 20px';
    this.button.style.fontSize = '16px';
    this.button.style.backgroundColor = '#4CAF50';
    this.button.style.color = 'white';
    this.button.style.border = 'none';
    this.button.style.borderRadius = '5px';
    this.button.style.cursor = 'pointer';
    this.button.onclick = () => this.handleButtonClick();
    this.container.appendChild(this.button);

    // Set initial indicator position
    this.updateIndicatorPosition();
  }

  private createPowerZones(): void {
    // Create visual zones for timing feedback
    const zones = [
      { start: 0, end: 20, color: 'rgba(255, 68, 68, 0.3)', label: 'Poor' },
      { start: 20, end: 40, color: 'rgba(255, 255, 68, 0.3)', label: 'Good' },
      { start: 40, end: 60, color: 'rgba(68, 255, 68, 0.3)', label: 'Excellent' },
      { start: 60, end: 80, color: 'rgba(68, 255, 68, 0.3)', label: 'Excellent' },
      { start: 80, end: 100, color: 'rgba(255, 255, 68, 0.3)', label: 'Good' }
    ];

    zones.forEach(zone => {
      const zoneElement = document.createElement('div');
      zoneElement.style.position = 'absolute';
      zoneElement.style.left = `${(zone.start / 100) * this.options.width}px`;
      zoneElement.style.width = `${((zone.end - zone.start) / 100) * this.options.width}px`;
      zoneElement.style.height = `${this.options.height}px`;
      zoneElement.style.backgroundColor = zone.color;
      zoneElement.style.pointerEvents = 'none';
      zoneElement.title = zone.label;
      this.meterContainer.appendChild(zoneElement);
    });
  }

  private handleButtonClick(): void {
    if (!this.state.isActive) {
      this.startMeter();
    } else {
      this.stopMeter();
    }
  }

  /**
   * Starts the meter animation with smooth oscillation patterns
   */
  public startMeter(): void {
    if (this.state.isActive) return;
    
    this.state.isActive = true;
    this.button.textContent = 'Stop Meter';
    this.button.style.backgroundColor = '#f44336';
    this.startTime = performance.now();
    
    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }
    
    // Start smooth animation using requestAnimationFrame
    this.animate();
  }

  private animate(): void {
    if (!this.state.isActive) return;

    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000; // Convert to seconds
    
    // Calculate oscillation value based on pattern
    this.state.value = this.calculateOscillationValue(elapsed);
    
    this.updateIndicatorPosition();
    this.updatePowerDisplay();
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  private calculateOscillationValue(elapsed: number): number {
    const frequency = this.options.oscillationSpeed;
    const phase = elapsed * frequency * 2 * Math.PI;
    
    let normalizedValue: number;
    
    switch (this.options.oscillationPattern) {
      case 'linear':
        // Triangle wave
        normalizedValue = 2 * Math.abs((phase / (2 * Math.PI)) % 1 - 0.5);
        break;
      case 'sine':
        // Sine wave (0 to 1)
        normalizedValue = (Math.sin(phase) + 1) / 2;
        break;
      case 'triangle':
        // Triangle wave
        const t = (phase / (2 * Math.PI)) % 1;
        normalizedValue = t < 0.5 ? 2 * t : 2 * (1 - t);
        break;
      case 'sawtooth':
        // Sawtooth wave
        normalizedValue = (phase / (2 * Math.PI)) % 1;
        break;
      default:
        normalizedValue = (Math.sin(phase) + 1) / 2;
    }
    
    return Math.round(normalizedValue * 100);
  }

  /**
   * Stops the meter and captures the power value with timing feedback
   */
  public stopMeter(): void {
    if (!this.state.isActive) return;
    
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.state.isActive = false;
    this.button.textContent = 'Spinning...';
    this.button.disabled = true;
    this.button.style.backgroundColor = '#666';
    
    // Calculate timing accuracy and angular velocity
    const timingFeedback = this.calculateTimingFeedback(this.state.value);
    const angularVelocity = this.powerToAngularVelocity(this.state.value);
    
    // Show timing feedback
    if (this.options.showTimingFeedback) {
      this.displayTimingFeedback(timingFeedback);
    }
    
    if (this.callbacks.onStop) {
      this.callbacks.onStop(this.state.value, angularVelocity, timingFeedback.accuracy);
    }
  }

  /**
   * Converts power percentage to angular velocity using configurable curve
   */
  public powerToAngularVelocity(power: number): number {
    const normalizedPower = Math.max(0, Math.min(100, power)) / 100;
    const { minAngularVelocity, maxAngularVelocity, powerCurve } = this.options;
    
    let curveValue: number;
    
    switch (powerCurve) {
      case 'linear':
        curveValue = normalizedPower;
        break;
      case 'quadratic':
        curveValue = normalizedPower * normalizedPower;
        break;
      case 'cubic':
        curveValue = normalizedPower * normalizedPower * normalizedPower;
        break;
      default:
        curveValue = normalizedPower * normalizedPower; // Default to quadratic
    }
    
    return minAngularVelocity + (maxAngularVelocity - minAngularVelocity) * curveValue;
  }

  /**
   * Calculates timing accuracy based on power level
   */
  private calculateTimingFeedback(power: number): TimingFeedback {
    let accuracy: number;
    let zone: TimingFeedback['zone'];
    let color: string;
    
    // Define optimal power ranges for timing accuracy
    if (power >= 45 && power <= 55) {
      // Perfect zone (center)
      accuracy = 1.0;
      zone = 'perfect';
      color = '#00ff00';
    } else if (power >= 35 && power <= 65) {
      // Excellent zone
      const distance = Math.min(Math.abs(power - 45), Math.abs(power - 55));
      accuracy = 0.8 + (0.2 * (1 - distance / 10));
      zone = 'excellent';
      color = '#44ff44';
    } else if (power >= 25 && power <= 75) {
      // Good zone
      const distance = Math.min(Math.abs(power - 35), Math.abs(power - 65));
      accuracy = 0.6 + (0.2 * (1 - distance / 10));
      zone = 'good';
      color = '#ffff44';
    } else {
      // Poor zone
      accuracy = Math.max(0.1, 0.6 - Math.abs(power - 50) / 100);
      zone = 'poor';
      color = '#ff4444';
    }
    
    return { accuracy, zone, color };
  }

  private displayTimingFeedback(feedback: TimingFeedback): void {
    if (!this.feedbackDisplay) return;
    
    const accuracyPercent = Math.round(feedback.accuracy * 100);
    this.feedbackDisplay.textContent = `Timing: ${feedback.zone.toUpperCase()} (${accuracyPercent}%)`;
    this.feedbackDisplay.style.color = feedback.color;
    this.feedbackDisplay.style.fontWeight = 'bold';
  }

  /**
   * Resets the meter to ready state
   */
  public resetMeter(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.state.isActive = false;
    this.state.value = 50; // Reset to middle position
    this.button.textContent = 'Start Spin';
    this.button.disabled = false;
    this.button.style.backgroundColor = '#4CAF50';
    
    this.updateIndicatorPosition();
    this.updatePowerDisplay();
    
    if (this.feedbackDisplay) {
      this.feedbackDisplay.textContent = '';
    }
  }

  private updateIndicatorPosition(): void {
    const maxPosition = this.options.width - 4; // Account for indicator width
    const position = (this.state.value / 100) * maxPosition;
    this.indicator.style.left = `${position}px`;
  }

  private updatePowerDisplay(): void {
    this.powerDisplay.textContent = `Power: ${this.state.value}%`;
    
    // Color code the power display
    if (this.state.value >= 45 && this.state.value <= 55) {
      this.powerDisplay.style.color = '#00aa00'; // Perfect zone
    } else if (this.state.value >= 35 && this.state.value <= 65) {
      this.powerDisplay.style.color = '#aa8800'; // Good zone
    } else {
      this.powerDisplay.style.color = '#aa0000'; // Poor zone
    }
  }

  /**
   * Gets the current power value (0-100)
   */
  public getCurrentPower(): number {
    return this.state.value;
  }

  /**
   * Gets the current state of the power meter
   */
  public getState(): PowerMeterState {
    return { ...this.state };
  }

  /**
   * Checks if the meter is currently active
   */
  public isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Gets timing feedback for the current power level
   */
  public getTimingFeedback(): TimingFeedback {
    return this.calculateTimingFeedback(this.state.value);
  }

  /**
   * Updates oscillation speed dynamically
   */
  public setOscillationSpeed(speed: number): void {
    this.options.oscillationSpeed = Math.max(0.1, Math.min(10, speed));
    this.state.oscillationSpeed = this.options.oscillationSpeed;
  }

  /**
   * Updates oscillation pattern dynamically
   */
  public setOscillationPattern(pattern: PowerMeterOptions['oscillationPattern']): void {
    this.options.oscillationPattern = pattern || 'sine';
  }

  /**
   * Updates power curve dynamically
   */
  public setPowerCurve(curve: PowerMeterOptions['powerCurve']): void {
    this.options.powerCurve = curve || 'quadratic';
  }

  /**
   * Destroys the power meter and cleans up resources
   */
  public destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.container.innerHTML = '';
  }
}