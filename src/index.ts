/**
 * Main entry point for the Wheel within a Wheel Game
 * This file initializes the application using the extracted and modularized components
 */

import './styles/main.css';
import { GameController, GameControllerCallbacks } from './components/GameController';
import { Player, GameSettings } from './models';
import { TurnResult } from './managers/PlayerManager';
import { AudioEngine } from './engines/AudioEngine';
import { ThemeEngine } from './engines/ThemeEngine';
import { ThemeControls } from './components/ThemeControls';
import { defaultAudioTheme, retroAudioTheme, silentAudioTheme } from './themes/DefaultAudioTheme';

// Application initialization
class WheelGameApp {
  private appElement: HTMLElement | null;
  private gameController: GameController | null = null;
  private multiplayerEnabled: boolean = false;
  private audioEngine: AudioEngine;
  private themeEngine: ThemeEngine;
  private themeControls: ThemeControls | null = null;

  constructor() {
    this.appElement = document.getElementById('app');
    
    // Initialize audio and theme engines
    this.audioEngine = new AudioEngine();
    this.themeEngine = new ThemeEngine();
    
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
        <p>Enhanced TypeScript version with weighted probability system and hot-seat multiplayer</p>
        <div style="margin-top: 10px; padding: 10px; background: #e8f4fd; border-radius: 5px; font-size: 14px;">
          <strong>Features:</strong> Set custom "Weight" values for each wedge to control probability independent of visual size!<br>
          Add players for hot-seat multiplayer mode. Higher weights = higher chance of selection.
        </div>
        <div id="game-mode-controls" style="margin-top: 15px; text-align: center;">
          <button id="toggle-multiplayer" style="margin-right: 10px;">Enable Multiplayer</button>
          <button id="save-game" style="margin-right: 10px;" disabled>Save Game</button>
          <button id="load-game" style="margin-right: 10px;" disabled>Load Game</button>
          <button id="reset-game" disabled>Reset Game</button>
          <button id="toggle-theme-controls" style="margin-left: 10px;">Theme Settings</button>
        </div>
      </header>
      <main id="game-main">
        <div id="left-panel">
          <div id="wheel-container">
            <!-- Wheels will be rendered here by WheelRenderer -->
          </div>
          <div id="power-meter-container">
            <!-- Power meter will be rendered here -->
          </div>
          <div id="output-container">
            <p id="output" style="margin:1em auto; padding:0 1em; max-width:700px;"></p>
          </div>
        </div>
        <div id="right-panel">
          <div id="theme-controls-container" style="display: none; margin-bottom: 20px;">
            <!-- Theme controls will be rendered here -->
          </div>
          <div id="player-ui-container" style="display: none;">
            <!-- Player UI will be rendered here -->
          </div>
          <div id="multiplayer-controls" style="display: none; margin-bottom: 20px;">
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3>Multiplayer Controls</h3>
              <div style="margin-bottom: 10px;">
                <input type="text" id="player-name-input" placeholder="Enter player name" style="margin-right: 10px; padding: 8px;">
                <button id="add-player-btn">Add Player</button>
              </div>
              <div style="margin-bottom: 10px;">
                <label>Round Limit: </label>
                <input type="number" id="round-limit" min="1" max="20" value="5" style="width: 60px; margin-right: 15px;">
                <label>Score Limit: </label>
                <input type="number" id="score-limit" min="10" max="1000" value="100" style="width: 80px;">
              </div>
              <button id="start-game-btn" disabled>Start Game</button>
              <button id="end-game-btn" disabled style="margin-left: 10px;">End Game</button>
            </div>
          </div>
          <div id="editors-container">
            <div id="big-wheel-editor">
              <!-- Big wheel editor will be rendered here -->
            </div>
            <div id="small-wheel-editor">
              <!-- Small wheel editor will be rendered here -->
            </div>
          </div>
        </div>
      </main>
    `;

    this.appElement.appendChild(gameContainer);

    // Initialize the game using extracted components
    this.initializeGame();
    
    // Initialize theme and audio systems
    this.initializeThemeSystem();

    console.log('Wheel within a Wheel Game initialized successfully with extracted components');
  }

  private initializeGame(): void {
    try {
      // Setup game controller callbacks
      const callbacks: GameControllerCallbacks = {
        onGameEnd: (winners: Player[]) => this.handleGameEnd(winners),
        onTurnComplete: (result: TurnResult) => this.handleTurnComplete(result),
        onPlayerChange: (current: Player | null, previous: Player | null) => this.handlePlayerChange(current, previous),
      };

      // Initialize the game controller with all the extracted functionality
      this.gameController = new GameController({
        wheelContainerId: 'wheel-container',
        powerMeterContainerId: 'power-meter-container',
        bigWheelEditorContainerId: 'big-wheel-editor',
        smallWheelEditorContainerId: 'small-wheel-editor',
        outputElementId: 'output',
        playerUIContainerId: 'player-ui-container',
        enableMultiplayer: false, // Start in single player mode
      }, callbacks);

      // Setup UI event handlers
      this.setupEventHandlers();

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

  private setupEventHandlers(): void {
    // Toggle multiplayer mode
    const toggleMultiplayerBtn = document.getElementById('toggle-multiplayer');
    toggleMultiplayerBtn?.addEventListener('click', () => this.toggleMultiplayer());

    // Add player
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;
    
    addPlayerBtn?.addEventListener('click', () => this.addPlayer());
    playerNameInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {this.addPlayer();}
    });

    // Game controls
    const startGameBtn = document.getElementById('start-game-btn');
    const endGameBtn = document.getElementById('end-game-btn');
    const resetGameBtn = document.getElementById('reset-game');
    const saveGameBtn = document.getElementById('save-game');
    const loadGameBtn = document.getElementById('load-game');
    const toggleThemeControlsBtn = document.getElementById('toggle-theme-controls');

    startGameBtn?.addEventListener('click', () => this.startGame());
    endGameBtn?.addEventListener('click', () => this.endGame());
    resetGameBtn?.addEventListener('click', () => this.resetGame());
    saveGameBtn?.addEventListener('click', () => this.saveGame());
    loadGameBtn?.addEventListener('click', () => this.loadGame());
    toggleThemeControlsBtn?.addEventListener('click', () => this.toggleThemeControls());

    // Game settings
    const roundLimitInput = document.getElementById('round-limit') as HTMLInputElement;
    const scoreLimitInput = document.getElementById('score-limit') as HTMLInputElement;

    roundLimitInput?.addEventListener('change', () => this.updateGameSettings());
    scoreLimitInput?.addEventListener('change', () => this.updateGameSettings());
  }

  private toggleMultiplayer(): void {
    this.multiplayerEnabled = !this.multiplayerEnabled;
    
    const toggleBtn = document.getElementById('toggle-multiplayer');
    const playerUI = document.getElementById('player-ui-container');
    const multiplayerControls = document.getElementById('multiplayer-controls');
    const gameMain = document.getElementById('game-main');

    if (this.multiplayerEnabled) {
      toggleBtn!.textContent = 'Disable Multiplayer';
      playerUI!.style.display = 'block';
      multiplayerControls!.style.display = 'block';
      gameMain!.style.gridTemplateColumns = '1fr 350px';
      
      // Enable game controls
      this.updateButtonStates();
    } else {
      toggleBtn!.textContent = 'Enable Multiplayer';
      playerUI!.style.display = 'none';
      multiplayerControls!.style.display = 'none';
      gameMain!.style.gridTemplateColumns = '1fr 300px';
      
      // Reset multiplayer state
      this.gameController?.resetGame();
      this.updateButtonStates();
    }
  }

  private addPlayer(): void {
    const playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;
    const name = playerNameInput.value.trim();
    
    if (!name) {
      alert('Please enter a player name');
      return;
    }

    try {
      this.gameController?.addPlayer(name);
      playerNameInput.value = '';
      this.updateButtonStates();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add player');
    }
  }

  private startGame(): void {
    this.updateGameSettings();
    this.updateButtonStates();
    
    const output = document.getElementById('output');
    if (output) {
      output.innerHTML = '<div style="text-align: center; color: #28a745; font-weight: bold;">Game Started! Current player can spin the wheel.</div>';
    }
  }

  private endGame(): void {
    this.gameController?.endGame();
    this.updateButtonStates();
  }

  private resetGame(): void {
    if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
      this.gameController?.resetGame();
      this.updateButtonStates();
      
      const output = document.getElementById('output');
      if (output) {
        output.innerHTML = '';
      }
    }
  }

  private saveGame(): void {
    try {
      const gameState = this.gameController?.saveGameState();
      if (gameState) {
        localStorage.setItem('wheelGameSave', gameState);
        alert('Game saved successfully!');
      }
    } catch (error) {
      alert('Failed to save game: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private loadGame(): void {
    try {
      const savedState = localStorage.getItem('wheelGameSave');
      if (savedState) {
        this.gameController?.loadGameState(savedState);
        this.updateButtonStates();
        alert('Game loaded successfully!');
      } else {
        alert('No saved game found');
      }
    } catch (error) {
      alert('Failed to load game: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private updateGameSettings(): void {
    const roundLimitInput = document.getElementById('round-limit') as HTMLInputElement;
    const scoreLimitInput = document.getElementById('score-limit') as HTMLInputElement;
    
    const settings: Partial<GameSettings> = {};
    
    const roundLimit = parseInt(roundLimitInput.value);
    if (!isNaN(roundLimit) && roundLimit > 0) {
      settings.roundLimit = roundLimit;
    }
    
    const scoreLimit = parseInt(scoreLimitInput.value);
    if (!isNaN(scoreLimit) && scoreLimit > 0) {
      settings.scoreLimit = scoreLimit;
    }
    
    this.gameController?.updateGameSettings(settings);
  }

  private updateButtonStates(): void {
    const players = this.gameController?.getPlayers() || [];
    const isMultiplayer = this.multiplayerEnabled;
    const hasPlayers = players.length > 0;
    
    const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
    const endGameBtn = document.getElementById('end-game-btn') as HTMLButtonElement;
    const resetGameBtn = document.getElementById('reset-game') as HTMLButtonElement;
    const saveGameBtn = document.getElementById('save-game') as HTMLButtonElement;
    const loadGameBtn = document.getElementById('load-game') as HTMLButtonElement;
    
    if (startGameBtn) {startGameBtn.disabled = !isMultiplayer || players.length < 2;}
    if (endGameBtn) {endGameBtn.disabled = !isMultiplayer || !hasPlayers;}
    if (resetGameBtn) {resetGameBtn.disabled = !isMultiplayer || !hasPlayers;}
    if (saveGameBtn) {saveGameBtn.disabled = !isMultiplayer || !hasPlayers;}
    if (loadGameBtn) {loadGameBtn.disabled = !isMultiplayer;}
  }

  // Game event handlers
  private handleGameEnd(winners: Player[]): void {
    console.log('Game ended. Winners:', winners.map(w => w.name));
    this.updateButtonStates();
  }

  private handleTurnComplete(result: TurnResult): void {
    console.log('Turn completed:', result);
  }

  private handlePlayerChange(current: Player | null, previous: Player | null): void {
    console.log('Player changed from', previous?.name, 'to', current?.name);
  }

  private async initializeThemeSystem(): Promise<void> {
    try {
      // Load default audio theme
      await this.audioEngine.loadTheme(defaultAudioTheme);
      
      // Add additional audio themes
      this.audioEngine.loadTheme(retroAudioTheme);
      this.audioEngine.loadTheme(silentAudioTheme);
      
      // Initialize theme controls
      const themeControlsContainer = document.getElementById('theme-controls-container');
      if (themeControlsContainer) {
        this.themeControls = new ThemeControls(
          themeControlsContainer,
          this.audioEngine,
          this.themeEngine,
          {
            showVolumeControls: true,
            showThemeSelector: true,
            showAudioToggle: true,
            showAnimationToggle: true,
            compact: false,
          },
        );
      }
      
      // Setup audio triggers for game events
      this.setupAudioTriggers();
      
      console.log('Theme and audio systems initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize theme system:', error);
    }
  }

  private setupAudioTriggers(): void {
    if (!this.gameController) {return;}

    // Subscribe to game events and play appropriate sounds
    // Note: This would require the GameController to have event emitters
    // For now, we'll set up basic button click sounds
    
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON') {
        this.playButtonClickSound();
      }
    });
  }

  private playButtonClickSound(): void {
    const currentTheme = this.audioEngine.getCurrentTheme();
    if (currentTheme) {
      this.audioEngine.playSoundEffect(currentTheme.soundEffects.buttonClick.id);
    }
  }

  private toggleThemeControls(): void {
    const themeControlsContainer = document.getElementById('theme-controls-container');
    const toggleBtn = document.getElementById('toggle-theme-controls');
    
    if (themeControlsContainer && toggleBtn) {
      const isVisible = themeControlsContainer.style.display !== 'none';
      
      if (isVisible) {
        themeControlsContainer.style.display = 'none';
        toggleBtn.textContent = 'Theme Settings';
      } else {
        themeControlsContainer.style.display = 'block';
        toggleBtn.textContent = 'Hide Theme Settings';
        
        // Resume audio context on user interaction
        this.audioEngine.resumeAudioContext();
      }
    }
  }

  public getGameController(): GameController | null {
    return this.gameController;
  }

  public getAudioEngine(): AudioEngine {
    return this.audioEngine;
  }

  public getThemeEngine(): ThemeEngine {
    return this.themeEngine;
  }

  public dispose(): void {
    // Clean up resources
    this.themeControls?.dispose();
    this.audioEngine.dispose();
    this.themeEngine.dispose();
    this.gameController = null;
    this.themeControls = null;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new WheelGameApp();
});