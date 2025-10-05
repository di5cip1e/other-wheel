/**
 * Specific error recovery mechanisms for different game components
 */

import { GameError, GameErrorFactory, ErrorType } from './ErrorHandler';

export interface GameStateBackup {
  timestamp: number;
  gameState: any;
  checksum: string;
}

/**
 * Game state recovery and backup system
 */
export class GameStateRecovery {
  private static readonly MAX_BACKUPS = 5;
  private static readonly BACKUP_KEY = 'wheel-game-backups';
  private backups: GameStateBackup[] = [];

  constructor() {
    this.loadBackups();
  }

  /**
   * Create a backup of the current game state
   */
  createBackup(gameState: any): void {
    try {
      const backup: GameStateBackup = {
        timestamp: Date.now(),
        gameState: JSON.parse(JSON.stringify(gameState)), // Deep clone
        checksum: this.calculateChecksum(gameState),
      };

      this.backups.unshift(backup);
      
      // Keep only the most recent backups
      if (this.backups.length > GameStateRecovery.MAX_BACKUPS) {
        this.backups = this.backups.slice(0, GameStateRecovery.MAX_BACKUPS);
      }

      this.saveBackups();
    } catch (error) {
      console.warn('Failed to create game state backup:', error);
    }
  }

  /**
   * Restore from the most recent valid backup
   */
  restoreFromBackup(): any | null {
    for (const backup of this.backups) {
      if (this.validateBackup(backup)) {
        return backup.gameState;
      }
    }
    return null;
  }

  /**
   * Get all available backups
   */
  getAvailableBackups(): GameStateBackup[] {
    return this.backups.filter(backup => this.validateBackup(backup));
  }

  /**
   * Validate game state integrity
   */
  validateGameState(gameState: any): boolean {
    try {
      // Basic structure validation
      if (!gameState || typeof gameState !== 'object') {
        return false;
      }

      // Check required properties
      const requiredProps = ['wheels', 'players', 'gamePhase', 'settings'];
      for (const prop of requiredProps) {
        if (!(prop in gameState)) {
          return false;
        }
      }

      // Validate wheels array
      if (!Array.isArray(gameState.wheels) || gameState.wheels.length === 0) {
        return false;
      }

      // Validate each wheel
      for (const wheel of gameState.wheels) {
        if (!this.validateWheel(wheel)) {
          return false;
        }
      }

      // Validate players array
      if (!Array.isArray(gameState.players)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Attempt to repair corrupted game state
   */
  repairGameState(gameState: any): any {
    const repaired = JSON.parse(JSON.stringify(gameState));

    try {
      // Repair missing or invalid wheels
      if (!Array.isArray(repaired.wheels) || repaired.wheels.length === 0) {
        repaired.wheels = this.createDefaultWheels();
      }

      // Repair each wheel
      repaired.wheels = repaired.wheels.map((wheel: any) => this.repairWheel(wheel));

      // Repair players array
      if (!Array.isArray(repaired.players)) {
        repaired.players = [{ id: 'player1', name: 'Player 1', isActive: true }];
      }

      // Repair game phase
      if (!repaired.gamePhase || typeof repaired.gamePhase !== 'string') {
        repaired.gamePhase = 'setup';
      }

      // Repair settings
      if (!repaired.settings || typeof repaired.settings !== 'object') {
        repaired.settings = this.createDefaultSettings();
      }

      return repaired;
    } catch (error) {
      // If repair fails, return minimal valid state
      return this.createMinimalGameState();
    }
  }

  private validateBackup(backup: GameStateBackup): boolean {
    try {
      const currentChecksum = this.calculateChecksum(backup.gameState);
      return currentChecksum === backup.checksum && this.validateGameState(backup.gameState);
    } catch {
      return false;
    }
  }

  private validateWheel(wheel: any): boolean {
    if (!wheel || typeof wheel !== 'object') {return false;}
    if (!wheel.id || typeof wheel.id !== 'string') {return false;}
    if (!Array.isArray(wheel.wedges) || wheel.wedges.length === 0) {return false;}
    
    // Validate each wedge
    for (const wedge of wheel.wedges) {
      if (!wedge.id || typeof wedge.weight !== 'number' || wedge.weight <= 0) {
        return false;
      }
    }

    return true;
  }

  private repairWheel(wheel: any): any {
    const repaired = { ...wheel };

    // Ensure required properties
    if (!repaired.id) {repaired.id = `wheel-${Date.now()}`;}
    if (!repaired.label) {repaired.label = 'Wheel';}
    if (!Array.isArray(repaired.wedges)) {repaired.wedges = [];}

    // Ensure at least one wedge
    if (repaired.wedges.length === 0) {
      repaired.wedges = this.createDefaultWedges();
    }

    // Repair each wedge
    repaired.wedges = repaired.wedges.map((wedge: any, index: number) => ({
      id: wedge.id || `wedge-${index}`,
      label: wedge.label || `Option ${index + 1}`,
      weight: typeof wedge.weight === 'number' && wedge.weight > 0 ? wedge.weight : 1,
      color: wedge.color || this.getDefaultColor(index),
    }));

    // Ensure physics properties
    if (!repaired.frictionCoefficient || typeof repaired.frictionCoefficient !== 'number') {
      repaired.frictionCoefficient = 0.02;
    }

    return repaired;
  }

  private createDefaultWheels(): any[] {
    return [
      {
        id: 'outer-wheel',
        label: 'Outer Wheel',
        wedges: this.createDefaultWedges(),
        frictionCoefficient: 0.02,
        radius: 200,
        currentAngle: 0,
        angularVelocity: 0,
      },
      {
        id: 'inner-wheel',
        label: 'Inner Wheel',
        wedges: this.createDefaultWedges(),
        frictionCoefficient: 0.02,
        clutchRatio: 0.3,
        radius: 100,
        currentAngle: 0,
        angularVelocity: 0,
      },
    ];
  }

  private createDefaultWedges(): any[] {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return Array.from({ length: 6 }, (_, i) => ({
      id: `wedge-${i}`,
      label: `Option ${i + 1}`,
      weight: 1,
      color: colors[i % colors.length],
    }));
  }

  private createDefaultSettings(): any {
    return {
      maxPlayers: 4,
      enableSound: true,
      theme: 'default',
      deterministic: false,
    };
  }

  private createMinimalGameState(): any {
    return {
      wheels: this.createDefaultWheels(),
      players: [{ id: 'player1', name: 'Player 1', isActive: true }],
      currentPlayerIndex: 0,
      gamePhase: 'setup',
      scores: {},
      rules: [],
      settings: this.createDefaultSettings(),
    };
  }

  private getDefaultColor(index: number): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[index % colors.length] || '#cccccc';
  }

  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private loadBackups(): void {
    try {
      const stored = localStorage.getItem(GameStateRecovery.BACKUP_KEY);
      if (stored) {
        this.backups = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load game state backups:', error);
      this.backups = [];
    }
  }

  private saveBackups(): void {
    try {
      localStorage.setItem(GameStateRecovery.BACKUP_KEY, JSON.stringify(this.backups));
    } catch (error) {
      console.warn('Failed to save game state backups:', error);
    }
  }
}

/**
 * Feature degradation manager
 */
export class FeatureDegradation {
  private static readonly DEGRADATION_KEY = 'wheel-game-degradation';
  private degradedFeatures: Set<string> = new Set();

  constructor() {
    this.loadDegradationState();
  }

  /**
   * Enable degradation for a feature
   */
  enableDegradation(feature: string, reason?: string): void {
    this.degradedFeatures.add(feature);
    this.saveDegradationState();
    
    console.warn(`Feature degraded: ${feature}${reason ? ` (${reason})` : ''}`);
    
    // Emit degradation event
    window.dispatchEvent(new CustomEvent('feature-degraded', {
      detail: { feature, reason },
    }));
  }

  /**
   * Disable degradation for a feature
   */
  disableDegradation(feature: string): void {
    this.degradedFeatures.delete(feature);
    this.saveDegradationState();
    
    console.info(`Feature restored: ${feature}`);
    
    // Emit restoration event
    window.dispatchEvent(new CustomEvent('feature-restored', {
      detail: { feature },
    }));
  }

  /**
   * Check if a feature is degraded
   */
  isFeatureDegraded(feature: string): boolean {
    return this.degradedFeatures.has(feature);
  }

  /**
   * Get all degraded features
   */
  getDegradedFeatures(): string[] {
    return Array.from(this.degradedFeatures);
  }

  /**
   * Clear all degradations
   */
  clearAllDegradations(): void {
    const features = Array.from(this.degradedFeatures);
    this.degradedFeatures.clear();
    this.saveDegradationState();
    
    features.forEach(feature => {
      window.dispatchEvent(new CustomEvent('feature-restored', {
        detail: { feature },
      }));
    });
  }

  private loadDegradationState(): void {
    try {
      const stored = localStorage.getItem(FeatureDegradation.DEGRADATION_KEY);
      if (stored) {
        const features = JSON.parse(stored);
        this.degradedFeatures = new Set(features);
      }
    } catch (error) {
      console.warn('Failed to load degradation state:', error);
    }
  }

  private saveDegradationState(): void {
    try {
      const features = Array.from(this.degradedFeatures);
      localStorage.setItem(FeatureDegradation.DEGRADATION_KEY, JSON.stringify(features));
    } catch (error) {
      console.warn('Failed to save degradation state:', error);
    }
  }
}

/**
 * Automatic error recovery coordinator
 */
export class AutoRecoveryCoordinator {
  private gameStateRecovery: GameStateRecovery;
  private featureDegradation: FeatureDegradation;

  constructor() {
    this.gameStateRecovery = new GameStateRecovery();
    this.featureDegradation = new FeatureDegradation();
    
    this.setupRecoveryStrategies();
  }

  /**
   * Attempt comprehensive recovery from a critical error
   */
  async attemptFullRecovery(error: GameError, currentGameState?: any): Promise<boolean> {
    console.log(`Attempting full recovery from ${error.type} error: ${error.code}`);

    // Step 1: Try to backup current state if it's valid
    if (currentGameState && this.gameStateRecovery.validateGameState(currentGameState)) {
      this.gameStateRecovery.createBackup(currentGameState);
    }

    // Step 2: Attempt specific recovery based on error type
    switch (error.type) {
    case ErrorType.GAME_STATE:
      return await this.recoverGameState(currentGameState);
      
    case ErrorType.PHYSICS:
      return await this.recoverPhysics();
      
    case ErrorType.RENDERING:
      return await this.recoverRendering();
      
    case ErrorType.STORAGE:
      return await this.recoverStorage();
      
    case ErrorType.MEDIA:
      return await this.recoverMedia();
      
    default:
      return await this.recoverGeneric(error);
    }
  }

  private async recoverGameState(currentGameState?: any): Promise<boolean> {
    // Try to repair current state
    if (currentGameState) {
      try {
        const repaired = this.gameStateRecovery.repairGameState(currentGameState);
        if (this.gameStateRecovery.validateGameState(repaired)) {
          // Emit recovery event with repaired state
          window.dispatchEvent(new CustomEvent('game-state-recovered', {
            detail: { gameState: repaired, method: 'repair' },
          }));
          return true;
        }
      } catch (error) {
        console.warn('Failed to repair game state:', error);
      }
    }

    // Try to restore from backup
    const backup = this.gameStateRecovery.restoreFromBackup();
    if (backup) {
      window.dispatchEvent(new CustomEvent('game-state-recovered', {
        detail: { gameState: backup, method: 'backup' },
      }));
      return true;
    }

    // Create minimal valid state as last resort
    const minimal = this.gameStateRecovery.repairGameState({});
    window.dispatchEvent(new CustomEvent('game-state-recovered', {
      detail: { gameState: minimal, method: 'minimal' },
    }));
    return true;
  }

  private async recoverPhysics(): Promise<boolean> {
    this.featureDegradation.enableDegradation('advanced-physics', 'Physics engine error');
    
    // Emit physics recovery event
    window.dispatchEvent(new CustomEvent('physics-recovered', {
      detail: { fallbackMode: true },
    }));
    
    return true;
  }

  private async recoverRendering(): Promise<boolean> {
    this.featureDegradation.enableDegradation('canvas-rendering', 'Canvas rendering error');
    
    // Emit rendering recovery event
    window.dispatchEvent(new CustomEvent('rendering-recovered', {
      detail: { fallbackRenderer: 'css' },
    }));
    
    return true;
  }

  private async recoverStorage(): Promise<boolean> {
    this.featureDegradation.enableDegradation('persistent-storage', 'Storage access error');
    
    // Emit storage recovery event
    window.dispatchEvent(new CustomEvent('storage-recovered', {
      detail: { memoryOnly: true },
    }));
    
    return true;
  }

  private async recoverMedia(): Promise<boolean> {
    this.featureDegradation.enableDegradation('media-content', 'Media loading error');
    
    // Emit media recovery event
    window.dispatchEvent(new CustomEvent('media-recovered', {
      detail: { textOnly: true },
    }));
    
    return true;
  }

  private async recoverGeneric(error: GameError): Promise<boolean> {
    // Log the error for debugging
    console.error('Generic recovery for unknown error:', error);
    
    // Emit generic recovery event
    window.dispatchEvent(new CustomEvent('generic-recovery', {
      detail: { error },
    }));
    
    return false;
  }

  private setupRecoveryStrategies(): void {
    // Listen for unrecoverable errors and attempt full recovery
    window.addEventListener('unhandledrejection', async (event) => {
      const error = GameErrorFactory.createGameStateError(
        `Unhandled promise rejection: ${event.reason}`,
        'UNHANDLED_PROMISE',
      );
      
      await this.attemptFullRecovery(error);
    });
  }

  /**
   * Get recovery coordinator instance
   */
  getGameStateRecovery(): GameStateRecovery {
    return this.gameStateRecovery;
  }

  /**
   * Get feature degradation manager
   */
  getFeatureDegradation(): FeatureDegradation {
    return this.featureDegradation;
  }
}

// Export singleton instances
export const gameStateRecovery = new GameStateRecovery();
export const featureDegradation = new FeatureDegradation();
export const autoRecoveryCoordinator = new AutoRecoveryCoordinator();