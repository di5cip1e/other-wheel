/**
 * GameController - Orchestrates the extracted wheel functionality
 * Preserves the original game flow while providing a clean TypeScript interface
 */

import { WheelRenderer, WheelRenderOptions } from './WheelRenderer';
import { PowerMeter, PowerMeterCallbacks } from './PowerMeter';
import { WheelEditor, WheelEditorCallbacks } from './WheelEditor';
import { WedgeSelector, createGlobalWedgeSelector } from '../utils/WedgeSelector';
import { Wedge, Wheel } from '../models';
import { DeterministicRNG } from '../utils/RandomUtils';

export interface GameControllerOptions {
  wheelContainerId: string;
  powerMeterContainerId: string;
  bigWheelEditorContainerId: string;
  smallWheelEditorContainerId: string;
  outputElementId: string;
}

export class GameController {
  private wheelRenderer: WheelRenderer;
  private powerMeter: PowerMeter;
  private bigWheelEditor: WheelEditor;
  private smallWheelEditor: WheelEditor;
  private outputElement: HTMLElement;
  private wedgeSelector: WedgeSelector;
  
  // Game state - preserving original variables
  private bigWheelAngle = 0;
  private smallWheelAngle = 0;
  private bigWheelSpeed = 0;
  private smallWheelSpeed = 0;
  private isSpinning = false;
  private spinInterval: number | null = null;
  
  // Configuration - preserving original constants
  private readonly bigWheelWedges = 8;
  private readonly smallWheelWedges = 6;
  private readonly wedgeColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffbe0b', '#fb5607', '#8338ec', '#3a86ff', '#38b000'];
  
  // Wheel data - now includes weights
  private bigWheelTexts: string[] = Array(this.bigWheelWedges).fill(null).map((_, i) => `Big ${i+1}`);
  private smallWheelTexts: string[] = Array(this.smallWheelWedges).fill(null).map((_, i) => `Small ${i+1}`);
  private bigWheelWeights: number[] = Array(this.bigWheelWedges).fill(1);
  private smallWheelWeights: number[] = Array(this.smallWheelWedges).fill(1);

  constructor(options: GameControllerOptions) {
    // Initialize output element
    const outputElement = document.getElementById(options.outputElementId);
    if (!outputElement) {
      throw new Error(`Output element with id '${options.outputElementId}' not found`);
    }
    this.outputElement = outputElement;

    // Initialize wedge selector for probability-based selection
    this.wedgeSelector = createGlobalWedgeSelector();

    // Initialize wheel renderer
    this.wheelRenderer = new WheelRenderer(options.wheelContainerId);

    // Initialize power meter with callbacks
    const powerMeterCallbacks: PowerMeterCallbacks = {
      onStop: (power: number) => this.handlePowerMeterStop(power)
    };
    this.powerMeter = new PowerMeter(
      { containerId: options.powerMeterContainerId },
      powerMeterCallbacks
    );

    // Create wheel models
    const bigWheel: Wheel = {
      id: 'big-wheel',
      label: 'Big Wheel',
      wedges: this.bigWheelTexts.map((text, index) => ({
        id: `big-wedge-${index}`,
        label: text,
        weight: this.bigWheelWeights[index] || 1,
        color: this.generateWedgeColor(index)
      })),
      frictionCoefficient: 0.02,
      radius: 200,
      position: { x: 0, y: 0 },
      currentAngle: 0,
      angularVelocity: 0
    };

    const smallWheel: Wheel = {
      id: 'small-wheel',
      label: 'Small Wheel',
      wedges: this.smallWheelTexts.map((text, index) => ({
        id: `small-wedge-${index}`,
        label: text,
        weight: this.smallWheelWeights[index] || 1,
        color: this.generateWedgeColor(index + this.bigWheelWedges)
      })),
      frictionCoefficient: 0.02,
      clutchRatio: 0.8,
      radius: 100,
      position: { x: 0, y: 0 },
      currentAngle: 0,
      angularVelocity: 0
    };

    // Initialize wheel editors with callbacks
    const bigWheelCallbacks: WheelEditorCallbacks = {
      onWheelUpdate: (wheel: Wheel) => {
        this.bigWheelTexts = wheel.wedges.map(w => w.label);
        this.bigWheelWeights = wheel.wedges.map(w => w.weight);
        this.updateBigWheel();
      }
    };
    
    const smallWheelCallbacks: WheelEditorCallbacks = {
      onWheelUpdate: (wheel: Wheel) => {
        this.smallWheelTexts = wheel.wedges.map(w => w.label);
        this.smallWheelWeights = wheel.wedges.map(w => w.weight);
        this.updateSmallWheel();
      }
    };

    this.bigWheelEditor = new WheelEditor({
      containerId: options.bigWheelEditorContainerId,
      wheel: bigWheel,
      showAdvancedOptions: false
    }, bigWheelCallbacks);

    this.smallWheelEditor = new WheelEditor({
      containerId: options.smallWheelEditorContainerId,
      wheel: smallWheel,
      showAdvancedOptions: false
    }, smallWheelCallbacks);

    this.initializeWheels();
  }

  /**
   * Initializes both wheels - preserves original initWheels function
   */
  private initializeWheels(): void {
    this.updateBigWheel();
    this.updateSmallWheel();
  }

  private updateBigWheel(): void {
    const options: WheelRenderOptions = {
      wheelId: 'bigWheel',
      wedgeCount: this.bigWheelWedges,
      texts: this.bigWheelTexts,
      colors: this.wedgeColors,
      radius: 200
    };
    this.wheelRenderer.createWheel(options);
  }

  private updateSmallWheel(): void {
    const options: WheelRenderOptions = {
      wheelId: 'smallWheel',
      wedgeCount: this.smallWheelWedges,
      texts: this.smallWheelTexts,
      colors: this.wedgeColors,
      radius: 100
    };
    this.wheelRenderer.createWheel(options);
  }

  /**
   * Handles power meter stop event - preserves original stopMeter logic
   */
  private handlePowerMeterStop(power: number): void {
    // Calculate spin power based on meter position (preserving original calculation)
    const powerRatio = power / 100;
    this.bigWheelSpeed = powerRatio * 20; // Max speed of 20 degrees per frame
    this.smallWheelSpeed = Math.min(powerRatio * 15, 10); // Clutch caps at 10 degrees per frame
    
    this.isSpinning = true;
    this.spinInterval = window.setInterval(() => this.updateSpin(), 50);
  }

  /**
   * Updates wheel spinning - preserves original updateSpin function
   */
  private updateSpin(): void {
    if (!this.isSpinning) return;
    
    // Update wheel angles
    this.bigWheelAngle += this.bigWheelSpeed;
    this.smallWheelAngle += this.smallWheelSpeed;
    
    // Apply friction - preserving original friction values
    this.bigWheelSpeed *= 0.98;
    this.smallWheelSpeed *= 0.97;
    
    // Update wheel rotations
    this.wheelRenderer.updateWheelRotation('bigWheel', this.bigWheelAngle);
    this.wheelRenderer.updateWheelRotation('smallWheel', this.smallWheelAngle);
    
    // Stop spinning when speeds are very low - preserving original threshold
    if (Math.abs(this.bigWheelSpeed) < 0.1 && Math.abs(this.smallWheelSpeed) < 0.1) {
      if (this.spinInterval !== null) {
        clearInterval(this.spinInterval);
        this.spinInterval = null;
      }
      this.isSpinning = false;
      this.powerMeter.resetMeter();
      this.determineResult();
    }
  }

  /**
   * Generates a color for a wedge based on its index
   */
  private generateWedgeColor(index: number): string {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', 
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#ee5a24', '#0abde3', '#10ac84', '#f9ca24', '#f0932b',
      '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#e17055'
    ];
    return colors[index % colors.length] || '#cccccc';
  }

  /**
   * Determines the spin result using weighted probability selection
   */
  private determineResult(): void {
    // Create wedge objects for probability selection
    const bigWheelWedges: Wedge[] = this.bigWheelTexts.map((text, index) => ({
      id: `big-${index}`,
      label: text,
      weight: this.bigWheelWeights[index] || 1,
      color: this.wedgeColors[index % this.wedgeColors.length]!
    }));

    const smallWheelWedges: Wedge[] = this.smallWheelTexts.map((text, index) => ({
      id: `small-${index}`,
      label: text,
      weight: this.smallWheelWeights[index] || 1,
      color: this.wedgeColors[index % this.wedgeColors.length]!
    }));

    // Use weighted selection instead of visual position
    const bigResult = this.wedgeSelector.selectWedge(bigWheelWedges);
    const smallResult = this.wedgeSelector.selectWedge(smallWheelWedges);
    
    // Display result with probability information
    const bigProbability = (bigResult.probability * 100).toFixed(1);
    const smallProbability = (smallResult.probability * 100).toFixed(1);
    
    this.outputElement.innerHTML = `
      <div><strong>Result:</strong></div>
      <div>Big Wheel: "${bigResult.wedge.label}" (${bigProbability}% chance)</div>
      <div>Small Wheel: "${smallResult.wedge.label}" (${smallProbability}% chance)</div>
    `;
  }

  /**
   * Gets the current game state
   */
  public getGameState() {
    return {
      bigWheelAngle: this.bigWheelAngle,
      smallWheelAngle: this.smallWheelAngle,
      bigWheelSpeed: this.bigWheelSpeed,
      smallWheelSpeed: this.smallWheelSpeed,
      isSpinning: this.isSpinning,
      bigWheelTexts: [...this.bigWheelTexts],
      smallWheelTexts: [...this.smallWheelTexts],
      bigWheelWeights: [...this.bigWheelWeights],
      smallWheelWeights: [...this.smallWheelWeights]
    };
  }

  /**
   * Sets the RNG seed for deterministic results (useful for testing)
   */
  public setSeed(seed: number): void {
    DeterministicRNG.setSeed(seed);
  }

  /**
   * Gets the current RNG seed
   */
  public getSeed(): number {
    return DeterministicRNG.getSeed();
  }

  /**
   * Checks if the game is currently spinning
   */
  public isGameSpinning(): boolean {
    return this.isSpinning;
  }

  /**
   * Destroys the game controller and cleans up resources
   */
  public destroy(): void {
    if (this.spinInterval !== null) {
      clearInterval(this.spinInterval);
    }
    this.powerMeter.destroy();
    this.bigWheelEditor.destroy();
    this.smallWheelEditor.destroy();
    this.wheelRenderer.clearWheels();
  }
}