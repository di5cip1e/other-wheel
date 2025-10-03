/**
 * Main entry point for the Wheel within a Wheel Game
 * This file initializes the application using the extracted and modularized components
 */

import './styles/main.css';
import { GameController } from './components/index';

// Application initialization
class WheelGameApp {
  private appElement: HTMLElement | null;
  private gameController: GameController | null = null;

  constructor() {
    this.appElement = document.getElementById('app');
    this.init();
  }

  private init(): void {
    if (!this.appElement) {
      throw new Error('App element not found');
    }

    // Clear loading message
    this.appElement.innerHTML = '';

    // Create game container with structure that preserves original layout
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.innerHTML = `
      <header>
        <h1>Double Wheel Spinner</h1>
        <p>Enhanced TypeScript version with weighted probability system</p>
        <div style="margin-top: 10px; padding: 10px; background: #e8f4fd; border-radius: 5px; font-size: 14px;">
          <strong>New Feature:</strong> Set custom "Weight" values for each wedge to control probability independent of visual size!<br>
          Higher weights = higher chance of selection. Try setting different weights and spinning to see the effect.
        </div>
      </header>
      <main id="game-main">
        <div id="wheel-container">
          <!-- Wheels will be rendered here by WheelRenderer -->
        </div>
        <div id="controls">
          <div id="power-meter-container">
            <!-- Power meter will be rendered here -->
          </div>
          <div id="editors-container" style="display:flex; justify-content:space-around; margin:20px auto; max-width:800px;">
            <div id="big-wheel-editor">
              <!-- Big wheel editor will be rendered here -->
            </div>
            <div id="small-wheel-editor">
              <!-- Small wheel editor will be rendered here -->
            </div>
          </div>
          <div id="output-container">
            <p id="output" style="margin:1em auto; padding:0 1em; max-width:700px;"></p>
          </div>
        </div>
      </main>
    `;

    this.appElement.appendChild(gameContainer);

    // Initialize the game using extracted components
    this.initializeGame();

    console.log('Wheel within a Wheel Game initialized successfully with extracted components');
  }

  private initializeGame(): void {
    try {
      // Initialize the game controller with all the extracted functionality
      this.gameController = new GameController({
        wheelContainerId: 'wheel-container',
        powerMeterContainerId: 'power-meter-container',
        bigWheelEditorContainerId: 'big-wheel-editor',
        smallWheelEditorContainerId: 'small-wheel-editor',
        outputElementId: 'output'
      });
    } catch (error) {
      console.error('Failed to initialize game:', error);
      if (this.appElement) {
        this.appElement.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <h2>Error initializing game</h2>
            <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        `;
      }
    }
  }

  public getGameController(): GameController | null {
    return this.gameController;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new WheelGameApp();
});