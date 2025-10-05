/**
 * GameController - Orchestrates the extracted wheel functionality
 * Preserves the original game flow while providing a clean TypeScript interface
 */

import { WheelRenderer, WheelRenderOptions } from './WheelRenderer';
import { PowerMeter, PowerMeterCallbacks } from './PowerMeter';
import { WheelEditor, WheelEditorCallbacks } from './WheelEditor';
import { PlayerUI } from './PlayerUI';
import { WedgeSelector, createGlobalWedgeSelector } from '../utils/WedgeSelector';
import { PlayerManager, TurnResult } from '../managers/PlayerManager';
import { RuleEngine } from '../engines/RuleEngine';
import { AudioEngine } from '../engines/AudioEngine';
import { ThemeEngine } from '../engines/ThemeEngine';
import { Wedge, Wheel, Player, GameState, GameSettings, SpinResult, Rule, RuleEvaluationContext, RuleEvaluationResult } from '../models';
import { DeterministicRNG } from '../utils/RandomUtils';
import { defaultAudioTheme } from '../themes/DefaultAudioTheme';

export interface GameControllerOptions {
  wheelContainerId: string;
  powerMeterContainerId: string;
  bigWheelEditorContainerId: string;
  smallWheelEditorContainerId: string;
  outputElementId: string;
  playerUIContainerId?: string;
  enableMultiplayer?: boolean;
  enableAudio?: boolean;
  enableThemes?: boolean;
}

export interface GameControllerCallbacks {
  onGameEnd?: (winners: Player[]) => void;
  onTurnComplete?: (result: TurnResult) => void;
  onPlayerChange?: (currentPlayer: Player | null, previousPlayer: Player | null) => void;
  onRuleTriggered?: (results: RuleEvaluationResult[], context: RuleEvaluationContext) => void;
}

export class GameController {
  private wheelRenderer: WheelRenderer;
  private powerMeter: PowerMeter;
  private bigWheelEditor: WheelEditor;
  private smallWheelEditor: WheelEditor;
  private outputElement: HTMLElement;
  private wedgeSelector: WedgeSelector;
  private playerManager: PlayerManager;
  private playerUI: PlayerUI | null = null;
  private ruleEngine: RuleEngine;
  private audioEngine: AudioEngine | null = null;
  private themeEngine: ThemeEngine | null = null;
  private callbacks: GameControllerCallbacks;
  private gameSettings: GameSettings;
  
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

  constructor(options: GameControllerOptions, callbacks: GameControllerCallbacks = {}) {
    this.callbacks = callbacks;
    
    // Initialize output element
    const outputElement = document.getElementById(options.outputElementId);
    if (!outputElement) {
      throw new Error(`Output element with id '${options.outputElementId}' not found`);
    }
    this.outputElement = outputElement;

    // Initialize player manager
    this.playerManager = new PlayerManager();

    // Initialize rule engine
    this.ruleEngine = new RuleEngine();

    // Initialize audio engine if enabled
    if (options.enableAudio !== false) {
      this.audioEngine = new AudioEngine();
      this.audioEngine.loadTheme(defaultAudioTheme);
    }

    // Initialize theme engine if enabled
    if (options.enableThemes !== false) {
      this.themeEngine = new ThemeEngine();
    }

    // Initialize game settings
    this.gameSettings = {
      maxPlayers: 8,
      enableSound: options.enableAudio !== false,
      theme: 'default',
      deterministic: false
    };

    // Initialize player UI if multiplayer is enabled
    if (options.enableMultiplayer && options.playerUIContainerId) {
      const playerUIContainer = document.getElementById(options.playerUIContainerId);
      if (playerUIContainer) {
        this.playerUI = new PlayerUI(playerUIContainer, this.playerManager);
      }
    }

    // Initialize wedge selector for probability-based selection
    this.wedgeSelector = createGlobalWedgeSelector();

    // Initialize wheel renderer
    this.wheelRenderer = new WheelRenderer(options.wheelContainerId);

    // Initialize power meter with callbacks
    const powerMeterCallbacks: PowerMeterCallbacks = {
      onStop: (power: number) => this.handlePowerMeterStop(power),
      onTick: () => this.playSound('powerMeterTick')
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
    // Resume audio context if needed (required after user interaction)
    if (this.audioEngine) {
      this.audioEngine.resumeAudioContext();
    }

    // Play wheel spin sound
    this.playSound('wheelSpin');

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
      
      // Play wheel stop sound
      this.playSound('wheelStop');
      
      this.powerMeter.resetMeter();
      
      // Delay result determination to let stop sound play
      setTimeout(() => {
        this.determineResult();
      }, 200);
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
    
    // Create spin result
    const spinResult: SpinResult = {
      bigWheelWedge: bigResult.wedge,
      smallWheelWedge: smallResult.wedge,
      bigWheelIndex: this.bigWheelTexts.indexOf(bigResult.wedge.label),
      smallWheelIndex: this.smallWheelTexts.indexOf(smallResult.wedge.label)
    };

    // Handle multiplayer turn completion
    const currentPlayer = this.playerManager.getCurrentPlayer();
    if (currentPlayer) {
      this.handleMultiplayerResult(spinResult, currentPlayer);
    } else {
      this.displaySinglePlayerResult(spinResult);
    }
  }

  /**
   * Handle result in multiplayer mode
   */
  private handleMultiplayerResult(spinResult: SpinResult, currentPlayer: Player): void {
    // Create rule evaluation context
    const context: RuleEvaluationContext = {
      playerId: currentPlayer.id,
      currentSpin: {
        outerWedgeId: spinResult.bigWheelWedge.id,
        innerWedgeId: spinResult.smallWheelWedge.id,
        outerWedgeLabel: spinResult.bigWheelWedge.label,
        innerWedgeLabel: spinResult.smallWheelWedge.label
      },
      playerScore: this.playerManager.getPlayerScoreValue(currentPlayer.id),
      gameHistory: this.playerManager.getGameHistory(),
      roundNumber: this.playerManager.getCurrentRound()
    };

    // Evaluate rules
    const ruleResults = this.ruleEngine.evaluateRules(context);
    
    // Calculate score based on rules or default scoring
    let scoreChange = 10; // Default score
    let gameOutcome: 'continue' | 'win' | 'lose' = 'continue';
    let ruleMessage = '';

    // Process rule results
    for (const result of ruleResults) {
      if (result.triggered) {
        if (result.points !== undefined) {
          scoreChange = result.points;
        }
        if (result.outcome) {
          gameOutcome = result.outcome;
        }
        if (result.message) {
          ruleMessage = result.message;
        }
        break; // Use first triggered rule (highest priority)
      }
    }
    
    const resultText = `${spinResult.bigWheelWedge.label} + ${spinResult.smallWheelWedge.label}`;
    
    // Record turn result
    const turnResult = this.playerManager.recordTurnResult(resultText, scoreChange);
    
    // Display result with rule information
    this.displayMultiplayerResult(spinResult, currentPlayer, turnResult, ruleMessage);
    
    // Notify callbacks
    if (this.callbacks.onTurnComplete) {
      this.callbacks.onTurnComplete(turnResult);
    }

    if (this.callbacks.onRuleTriggered && ruleResults.some(r => r.triggered)) {
      this.callbacks.onRuleTriggered(ruleResults, context);
    }

    // Handle game outcome
    if (gameOutcome === 'win') {
      this.endGameWithWinner(currentPlayer, ruleMessage);
    } else if (gameOutcome === 'lose') {
      this.endGameWithLoser(currentPlayer, ruleMessage);
    } else {
      // Check if game should end normally
      if (this.playerManager.shouldGameEnd(this.gameSettings)) {
        this.endGame();
      } else {
        // Advance to next player after a delay
        setTimeout(() => {
          this.nextTurn();
        }, 3000);
      }
    }
  }

  /**
   * Display result for single player mode
   */
  private displaySinglePlayerResult(spinResult: SpinResult): void {
    // Play result reveal sound
    this.playSound('resultReveal');

    const bigProbability = (spinResult.bigWheelWedge.weight / 
      this.bigWheelWeights.reduce((sum, w) => sum + w, 0) * 100).toFixed(1);
    const smallProbability = (spinResult.smallWheelWedge.weight / 
      this.smallWheelWeights.reduce((sum, w) => sum + w, 0) * 100).toFixed(1);
    
    this.outputElement.innerHTML = `
      <div><strong>Result:</strong></div>
      <div>Big Wheel: "${spinResult.bigWheelWedge.label}" (${bigProbability}% chance)</div>
      <div>Small Wheel: "${spinResult.smallWheelWedge.label}" (${smallProbability}% chance)</div>
    `;
  }

  /**
   * Display result for multiplayer mode
   */
  private displayMultiplayerResult(spinResult: SpinResult, player: Player, turnResult: TurnResult, ruleMessage?: string): void {
    // Play result reveal sound
    this.playSound('resultReveal');

    this.outputElement.innerHTML = `
      <div class="multiplayer-result">
        <div class="player-result"><strong>${player.name}'s Turn:</strong></div>
        ${ruleMessage ? `<div class="rule-message" style="color: #007bff; font-weight: bold; margin: 10px 0;">${ruleMessage}</div>` : ''}
        <div class="spin-result">
          <div>Big Wheel: "${spinResult.bigWheelWedge.label}"</div>
          <div>Small Wheel: "${spinResult.smallWheelWedge.label}"</div>
        </div>
        <div class="score-change">+${turnResult.score} points</div>
        <div class="next-turn-info">Next player in 3 seconds...</div>
      </div>
    `;

    // Update player UI
    if (this.playerUI) {
      this.playerUI.update();
    }
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

  // Multiplayer Management Methods

  /**
   * Add a player to the game
   */
  public addPlayer(name: string, avatarUrl?: string): Player {
    const player = this.playerManager.addPlayer(name, avatarUrl);
    if (this.playerUI) {
      this.playerUI.update();
    }
    return player;
  }

  /**
   * Remove a player from the game
   */
  public removePlayer(playerId: string): boolean {
    const result = this.playerManager.removePlayer(playerId);
    if (this.playerUI) {
      this.playerUI.update();
    }
    return result;
  }

  /**
   * Get all players
   */
  public getPlayers(): Player[] {
    return this.playerManager.getPlayers();
  }

  /**
   * Get current player
   */
  public getCurrentPlayer(): Player | null {
    return this.playerManager.getCurrentPlayer();
  }

  /**
   * Advance to next player's turn
   */
  public nextTurn(): void {
    const previousPlayer = this.playerManager.getCurrentPlayer();
    const currentPlayer = this.playerManager.nextTurn();
    
    if (this.playerUI && currentPlayer) {
      this.playerUI.showTurnTransition(previousPlayer, currentPlayer);
    }

    if (this.callbacks.onPlayerChange) {
      this.callbacks.onPlayerChange(currentPlayer, previousPlayer);
    }
  }

  /**
   * Get player scores
   */
  public getPlayerScores() {
    return this.playerManager.getPlayerScores();
  }

  /**
   * Update game settings
   */
  public updateGameSettings(settings: Partial<GameSettings>): void {
    this.gameSettings = { ...this.gameSettings, ...settings };
  }

  /**
   * Get current game settings
   */
  public getGameSettings(): GameSettings {
    return { ...this.gameSettings };
  }

  // Rule Management Methods

  /**
   * Get the rule engine instance
   */
  public getRuleEngine(): RuleEngine {
    return this.ruleEngine;
  }

  /**
   * Add a rule to the game
   */
  public addRule(rule: Rule): void {
    this.ruleEngine.addRule(rule);
  }

  /**
   * Remove a rule from the game
   */
  public removeRule(ruleId: string): boolean {
    return this.ruleEngine.removeRule(ruleId);
  }

  /**
   * Get all rules
   */
  public getRules(): Rule[] {
    return this.ruleEngine.getAllRules();
  }

  /**
   * Get current wheels for rule editor
   */
  public getWheels(): Wheel[] {
    return [
      {
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
        currentAngle: this.bigWheelAngle,
        angularVelocity: this.bigWheelSpeed
      },
      {
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
        currentAngle: this.smallWheelAngle,
        angularVelocity: this.smallWheelSpeed
      }
    ];
  }

  /**
   * End the current game
   */
  public endGame(): void {
    // Play game end sound
    this.playSound('gameEnd');

    const winners = this.playerManager.getWinners();
    
    if (this.playerUI) {
      this.playerUI.showGameEnd(winners);
    }

    if (this.callbacks.onGameEnd) {
      this.callbacks.onGameEnd(winners);
    }
  }

  /**
   * End the game with a specific winner (triggered by rule)
   */
  private endGameWithWinner(winner: Player, message: string): void {
    // Play game end sound
    this.playSound('gameEnd');

    if (this.playerUI) {
      this.playerUI.showGameEnd([winner], message);
    }

    if (this.callbacks.onGameEnd) {
      this.callbacks.onGameEnd([winner]);
    }
  }

  /**
   * End the game with a specific loser (triggered by rule)
   */
  private endGameWithLoser(loser: Player, message: string): void {
    // Play game end sound
    this.playSound('gameEnd');

    // Get all players except the loser as winners
    const winners = this.playerManager.getPlayers().filter(p => p.id !== loser.id);
    
    if (this.playerUI) {
      this.playerUI.showGameEnd(winners, message);
    }

    if (this.callbacks.onGameEnd) {
      this.callbacks.onGameEnd(winners);
    }
  }

  /**
   * Reset the game
   */
  public resetGame(): void {
    this.playerManager.reset();
    if (this.playerUI) {
      this.playerUI.update();
    }
    this.outputElement.innerHTML = '';
  }

  /**
   * Save game state for persistence
   */
  public saveGameState(): string {
    const gameState: GameState = {
      wheels: [
        {
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
          currentAngle: this.bigWheelAngle,
          angularVelocity: this.bigWheelSpeed
        },
        {
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
          currentAngle: this.smallWheelAngle,
          angularVelocity: this.smallWheelSpeed
        }
      ],
      players: this.playerManager.getPlayers(),
      currentPlayerIndex: this.playerManager.getPlayers().findIndex(p => p.isActive),
      gamePhase: this.isSpinning ? 'spinning' : 'playing',
      scores: new Map(this.playerManager.getPlayerScores().map(s => [s.playerId, s.score])),
      settings: this.gameSettings
    };

    return JSON.stringify({
      gameState,
      playerManagerState: this.playerManager.exportState()
    });
  }

  /**
   * Load game state from persistence
   */
  public loadGameState(savedState: string): void {
    try {
      const parsed = JSON.parse(savedState);
      const { gameState, playerManagerState } = parsed;

      // Restore wheel data
      if (gameState.wheels && gameState.wheels.length >= 2) {
        const bigWheel = gameState.wheels[0];
        const smallWheel = gameState.wheels[1];

        this.bigWheelTexts = bigWheel.wedges.map((w: Wedge) => w.label);
        this.bigWheelWeights = bigWheel.wedges.map((w: Wedge) => w.weight);
        this.smallWheelTexts = smallWheel.wedges.map((w: Wedge) => w.label);
        this.smallWheelWeights = smallWheel.wedges.map((w: Wedge) => w.weight);

        this.bigWheelAngle = bigWheel.currentAngle || 0;
        this.smallWheelAngle = smallWheel.currentAngle || 0;
        this.bigWheelSpeed = bigWheel.angularVelocity || 0;
        this.smallWheelSpeed = smallWheel.angularVelocity || 0;
      }

      // Restore player manager state
      if (playerManagerState) {
        this.playerManager.importState(playerManagerState);
      }

      // Restore game settings
      if (gameState.settings) {
        this.gameSettings = { ...this.gameSettings, ...gameState.settings };
      }

      // Update UI
      this.updateBigWheel();
      this.updateSmallWheel();
      if (this.playerUI) {
        this.playerUI.update();
      }

    } catch (error) {
      console.error('Failed to load game state:', error);
      throw new Error('Invalid saved game state');
    }
  }

  /**
   * Check if multiplayer mode is active
   */
  public isMultiplayerMode(): boolean {
    return this.playerManager.getPlayers().length > 0;
  }

  // Audio and Theme Management Methods

  /**
   * Play a sound effect by name
   */
  private playSound(soundName: keyof typeof defaultAudioTheme.soundEffects): void {
    if (this.audioEngine && this.gameSettings.enableSound) {
      const currentTheme = this.audioEngine.getCurrentTheme();
      if (currentTheme && currentTheme.soundEffects[soundName]) {
        this.audioEngine.playSoundEffect(currentTheme.soundEffects[soundName].id);
      }
    }
  }

  /**
   * Get the audio engine instance
   */
  public getAudioEngine(): AudioEngine | null {
    return this.audioEngine;
  }

  /**
   * Get the theme engine instance
   */
  public getThemeEngine(): ThemeEngine | null {
    return this.themeEngine;
  }

  /**
   * Start background music
   */
  public startBackgroundMusic(): void {
    if (this.audioEngine) {
      this.audioEngine.playBackgroundMusic();
    }
  }

  /**
   * Stop background music
   */
  public stopBackgroundMusic(): void {
    if (this.audioEngine) {
      this.audioEngine.stopBackgroundMusic();
    }
  }

  /**
   * Start a new game (with audio)
   */
  public startGame(): void {
    // Play game start sound
    this.playSound('gameStart');
    
    // Start background music if enabled
    if (this.gameSettings.enableSound) {
      this.startBackgroundMusic();
    }

    // Reset game state
    this.resetGame();
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
    if (this.playerUI) {
      this.playerUI.destroy();
    }
    if (this.audioEngine) {
      this.audioEngine.dispose();
    }
    if (this.themeEngine) {
      this.themeEngine.dispose();
    }
  }
}