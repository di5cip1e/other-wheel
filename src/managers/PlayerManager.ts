/**
 * PlayerManager - Manages multiple players and turn rotation for hot-seat multiplayer
 */

import { Player } from '../models';
import { RuleSpinResult } from '../models/Rule';

export interface PlayerScore {
  playerId: string;
  score: number;
  roundsPlayed: number;
  lastResult?: string;
}

export interface TurnResult {
  playerId: string;
  result: string;
  score: number;
  timestamp: number;
}

export class PlayerManager {
  private players: Player[] = [];
  private scores: Map<string, PlayerScore> = new Map();
  private currentPlayerIndex: number = 0;
  private turnHistory: TurnResult[] = [];
  private roundNumber: number = 1;

  constructor() {
    this.reset();
  }

  /**
   * Add a new player to the game
   */
  addPlayer(name: string, avatarUrl?: string): Player {
    if (this.players.length >= 8) {
      throw new Error('Maximum of 8 players allowed');
    }

    if (name.trim().length === 0) {
      throw new Error('Player name cannot be empty');
    }

    // Check for duplicate names
    if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Player name must be unique');
    }

    const player: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      isActive: this.players.length === 0 // First player is active
    };

    if (avatarUrl) {
      player.avatarUrl = avatarUrl;
    }

    this.players.push(player);
    this.scores.set(player.id, {
      playerId: player.id,
      score: 0,
      roundsPlayed: 0
    });

    return player;
  }

  /**
   * Remove a player from the game
   */
  removePlayer(playerId: string): boolean {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }

    // Adjust current player index if necessary
    if (playerIndex < this.currentPlayerIndex) {
      this.currentPlayerIndex--;
    } else if (playerIndex === this.currentPlayerIndex && this.currentPlayerIndex >= this.players.length - 1) {
      this.currentPlayerIndex = 0;
    }

    this.players.splice(playerIndex, 1);
    this.scores.delete(playerId);

    // Update active status
    this.updateActivePlayer();

    return true;
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    return [...this.players];
  }

  /**
   * Get current active player
   */
  getCurrentPlayer(): Player | null {
    if (this.players.length === 0) {
      return null;
    }
    return this.players[this.currentPlayerIndex] || null;
  }

  /**
   * Advance to the next player's turn
   */
  nextTurn(): Player | null {
    if (this.players.length === 0) {
      return null;
    }

    // Mark current player as inactive
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (currentPlayer) {
      currentPlayer.isActive = false;
    }

    // Advance to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    // If we've completed a full round, increment round number
    if (this.currentPlayerIndex === 0) {
      this.roundNumber++;
    }

    this.updateActivePlayer();
    return this.getCurrentPlayer();
  }

  /**
   * Record a turn result for the current player
   */
  recordTurnResult(result: string, scoreChange: number = 0): TurnResult {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) {
      throw new Error('No active player to record result for');
    }

    const playerScore = this.scores.get(currentPlayer.id);
    if (!playerScore) {
      throw new Error('Player score not found');
    }

    // Update player score
    playerScore.score += scoreChange;
    playerScore.roundsPlayed++;
    playerScore.lastResult = result;

    const turnResult: TurnResult = {
      playerId: currentPlayer.id,
      result,
      score: scoreChange,
      timestamp: Date.now()
    };

    this.turnHistory.push(turnResult);
    return turnResult;
  }

  /**
   * Get player scores
   */
  getPlayerScores(): PlayerScore[] {
    return Array.from(this.scores.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Get score for a specific player
   */
  getPlayerScore(playerId: string): PlayerScore | null {
    return this.scores.get(playerId) || null;
  }

  /**
   * Get score value for a specific player (for rule evaluation)
   */
  getPlayerScoreValue(playerId: string): number {
    const playerScore = this.scores.get(playerId);
    return playerScore ? playerScore.score : 0;
  }

  /**
   * Get turn history
   */
  getTurnHistory(): TurnResult[] {
    return [...this.turnHistory];
  }

  /**
   * Get game history in format needed for rule evaluation
   */
  getGameHistory(): RuleSpinResult[] {
    // Convert turn history to spin results format
    // Note: This is a simplified conversion - in a full implementation,
    // we would store more detailed spin information
    return this.turnHistory.map(turn => ({
      playerId: turn.playerId,
      outerWedgeId: 'unknown', // Would need to store this in turn result
      innerWedgeId: 'unknown', // Would need to store this in turn result
      points: turn.score,
      timestamp: new Date(turn.timestamp).toISOString()
    }));
  }

  /**
   * Get current round number
   */
  getCurrentRound(): number {
    return this.roundNumber;
  }

  /**
   * Check if game should end based on settings
   */
  shouldGameEnd(settings: { roundLimit?: number; scoreLimit?: number }): boolean {
    // Check round limit
    if (settings.roundLimit && this.roundNumber > settings.roundLimit) {
      return true;
    }

    // Check score limit
    if (settings.scoreLimit) {
      const highestScore = Math.max(...Array.from(this.scores.values()).map(s => s.score));
      if (highestScore >= settings.scoreLimit) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get game winner(s)
   */
  getWinners(): Player[] {
    if (this.players.length === 0) {
      return [];
    }

    const scores = this.getPlayerScores();
    const highestScore = scores[0]?.score || 0;
    
    return this.players.filter(player => {
      const playerScore = this.scores.get(player.id);
      return playerScore && playerScore.score === highestScore;
    });
  }

  /**
   * Reset the player manager
   */
  reset(): void {
    this.players = [];
    this.scores.clear();
    this.currentPlayerIndex = 0;
    this.turnHistory = [];
    this.roundNumber = 1;
  }

  /**
   * Export game state for persistence
   */
  exportState(): any {
    return {
      players: this.players,
      scores: Array.from(this.scores.entries()),
      currentPlayerIndex: this.currentPlayerIndex,
      turnHistory: this.turnHistory,
      roundNumber: this.roundNumber
    };
  }

  /**
   * Import game state from persistence
   */
  importState(state: any): void {
    this.players = state.players || [];
    this.scores = new Map(state.scores || []);
    this.currentPlayerIndex = state.currentPlayerIndex || 0;
    this.turnHistory = state.turnHistory || [];
    this.roundNumber = state.roundNumber || 1;

    this.updateActivePlayer();
  }

  /**
   * Update active player status
   */
  private updateActivePlayer(): void {
    this.players.forEach((player, index) => {
      player.isActive = index === this.currentPlayerIndex;
    });
  }
}