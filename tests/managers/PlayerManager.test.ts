/**
 * Tests for PlayerManager - Hot-seat multiplayer functionality
 */

import { PlayerManager } from '../../src/managers/PlayerManager';

describe('PlayerManager', () => {
  let playerManager: PlayerManager;

  beforeEach(() => {
    playerManager = new PlayerManager();
  });

  describe('Player Management', () => {
    test('should add a player successfully', () => {
      const player = playerManager.addPlayer('Alice');
      
      expect(player.name).toBe('Alice');
      expect(player.id).toBeDefined();
      expect(player.isActive).toBe(true); // First player is active
      expect(playerManager.getPlayers()).toHaveLength(1);
    });

    test('should add multiple players', () => {
      const alice = playerManager.addPlayer('Alice');
      const bob = playerManager.addPlayer('Bob');
      
      expect(playerManager.getPlayers()).toHaveLength(2);
      expect(alice.isActive).toBe(true);
      expect(bob.isActive).toBe(false);
    });

    test('should add player with avatar URL', () => {
      const player = playerManager.addPlayer('Alice', 'https://example.com/avatar.jpg');
      
      expect(player.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    test('should throw error when adding more than 8 players', () => {
      // Add 8 players
      for (let i = 1; i <= 8; i++) {
        playerManager.addPlayer(`Player ${i}`);
      }
      
      // Try to add 9th player
      expect(() => {
        playerManager.addPlayer('Player 9');
      }).toThrow('Maximum of 8 players allowed');
    });

    test('should throw error for empty player name', () => {
      expect(() => {
        playerManager.addPlayer('');
      }).toThrow('Player name cannot be empty');
      
      expect(() => {
        playerManager.addPlayer('   ');
      }).toThrow('Player name cannot be empty');
    });

    test('should throw error for duplicate player names', () => {
      playerManager.addPlayer('Alice');
      
      expect(() => {
        playerManager.addPlayer('Alice');
      }).toThrow('Player name must be unique');
      
      expect(() => {
        playerManager.addPlayer('alice'); // Case insensitive
      }).toThrow('Player name must be unique');
    });

    test('should remove a player successfully', () => {
      const alice = playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      
      const removed = playerManager.removePlayer(alice.id);
      
      expect(removed).toBe(true);
      expect(playerManager.getPlayers()).toHaveLength(1);
      expect(playerManager.getPlayers()[0]?.name).toBe('Bob');
      expect(playerManager.getPlayers()[0]?.isActive).toBe(true);
    });

    test('should return false when removing non-existent player', () => {
      const removed = playerManager.removePlayer('non-existent-id');
      expect(removed).toBe(false);
    });

    test('should adjust current player index when removing player before current', () => {
      const alice = playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      playerManager.addPlayer('Charlie');
      
      // Advance to Bob's turn
      playerManager.nextTurn();
      expect(playerManager.getCurrentPlayer()?.name).toBe('Bob');
      
      // Remove Alice (before current player)
      playerManager.removePlayer(alice.id);
      
      // Bob should still be current player
      expect(playerManager.getCurrentPlayer()?.name).toBe('Bob');
    });
  });

  describe('Turn Management', () => {
    beforeEach(() => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      playerManager.addPlayer('Charlie');
    });

    test('should get current player', () => {
      const currentPlayer = playerManager.getCurrentPlayer();
      expect(currentPlayer?.name).toBe('Alice');
      expect(currentPlayer?.isActive).toBe(true);
    });

    test('should advance to next player', () => {
      expect(playerManager.getCurrentPlayer()?.name).toBe('Alice');
      
      const nextPlayer = playerManager.nextTurn();
      expect(nextPlayer?.name).toBe('Bob');
      expect(nextPlayer?.isActive).toBe(true);
      
      // Alice should no longer be active
      const players = playerManager.getPlayers();
      expect(players.find(p => p.name === 'Alice')?.isActive).toBe(false);
    });

    test('should cycle through all players', () => {
      expect(playerManager.getCurrentPlayer()?.name).toBe('Alice');
      
      playerManager.nextTurn();
      expect(playerManager.getCurrentPlayer()?.name).toBe('Bob');
      
      playerManager.nextTurn();
      expect(playerManager.getCurrentPlayer()?.name).toBe('Charlie');
      
      // Should cycle back to Alice
      playerManager.nextTurn();
      expect(playerManager.getCurrentPlayer()?.name).toBe('Alice');
    });

    test('should increment round number after full cycle', () => {
      expect(playerManager.getCurrentRound()).toBe(1);
      
      // Complete one full round
      playerManager.nextTurn(); // Bob
      playerManager.nextTurn(); // Charlie
      playerManager.nextTurn(); // Alice (round 2)
      
      expect(playerManager.getCurrentRound()).toBe(2);
    });

    test('should return null when no players exist', () => {
      const emptyManager = new PlayerManager();
      expect(emptyManager.getCurrentPlayer()).toBeNull();
      expect(emptyManager.nextTurn()).toBeNull();
    });
  });

  describe('Score Management', () => {
    beforeEach(() => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
    });

    test('should record turn result for current player', () => {
      const turnResult = playerManager.recordTurnResult('Big 1 + Small 3', 10);
      
      expect(turnResult.playerId).toBe(playerManager.getCurrentPlayer()?.id);
      expect(turnResult.result).toBe('Big 1 + Small 3');
      expect(turnResult.score).toBe(10);
      expect(turnResult.timestamp).toBeDefined();
    });

    test('should update player score', () => {
      const currentPlayer = playerManager.getCurrentPlayer()!;
      
      playerManager.recordTurnResult('Result 1', 10);
      playerManager.recordTurnResult('Result 2', 5);
      
      const playerScore = playerManager.getPlayerScore(currentPlayer.id);
      expect(playerScore?.score).toBe(15);
      expect(playerScore?.roundsPlayed).toBe(2);
      expect(playerScore?.lastResult).toBe('Result 2');
    });

    test('should throw error when recording result with no active player', () => {
      const emptyManager = new PlayerManager();
      
      expect(() => {
        emptyManager.recordTurnResult('Test', 10);
      }).toThrow('No active player to record result for');
    });

    test('should get sorted player scores', () => {
      const alice = playerManager.getCurrentPlayer()!;
      playerManager.recordTurnResult('Alice Result', 20);
      
      playerManager.nextTurn();
      const bob = playerManager.getCurrentPlayer()!;
      playerManager.recordTurnResult('Bob Result', 30);
      
      const scores = playerManager.getPlayerScores();
      expect(scores).toHaveLength(2);
      expect(scores[0]?.playerId).toBe(bob.id); // Bob has higher score
      expect(scores[0]?.score).toBe(30);
      expect(scores[1]?.playerId).toBe(alice.id);
      expect(scores[1]?.score).toBe(20);
    });

    test('should track turn history', () => {
      playerManager.recordTurnResult('Turn 1', 10);
      playerManager.nextTurn();
      playerManager.recordTurnResult('Turn 2', 15);
      
      const history = playerManager.getTurnHistory();
      expect(history).toHaveLength(2);
      expect(history[0]?.result).toBe('Turn 1');
      expect(history[1]?.result).toBe('Turn 2');
    });
  });

  describe('Game End Conditions', () => {
    beforeEach(() => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
    });

    test('should detect game end by round limit', () => {
      // Play through rounds to exceed limit
      for (let i = 0; i < 6; i++) { // 3 full rounds
        playerManager.recordTurnResult(`Turn ${i}`, 10);
        playerManager.nextTurn();
      }
      
      const shouldEnd = playerManager.shouldGameEnd({ roundLimit: 3 });
      expect(shouldEnd).toBe(true);
    });

    test('should detect game end by score limit', () => {
      playerManager.recordTurnResult('High Score', 100);
      
      const shouldEnd = playerManager.shouldGameEnd({ scoreLimit: 50 });
      expect(shouldEnd).toBe(true);
    });

    test('should not end game when limits not reached', () => {
      playerManager.recordTurnResult('Low Score', 10);
      
      const shouldEnd = playerManager.shouldGameEnd({ 
        roundLimit: 5, 
        scoreLimit: 50, 
      });
      expect(shouldEnd).toBe(false);
    });

    test('should determine winners correctly', () => {
      const alice = playerManager.getCurrentPlayer()!;
      playerManager.recordTurnResult('Alice Result', 30);
      
      playerManager.nextTurn();
      playerManager.recordTurnResult('Bob Result', 20);
      
      const winners = playerManager.getWinners();
      expect(winners).toHaveLength(1);
      expect(winners[0]?.id).toBe(alice.id);
    });

    test('should handle tie games', () => {
      const alice = playerManager.getCurrentPlayer()!;
      playerManager.recordTurnResult('Alice Result', 25);
      
      playerManager.nextTurn();
      const bob = playerManager.getCurrentPlayer()!;
      playerManager.recordTurnResult('Bob Result', 25);
      
      const winners = playerManager.getWinners();
      expect(winners).toHaveLength(2);
      expect(winners.map(w => w.id)).toContain(alice.id);
      expect(winners.map(w => w.id)).toContain(bob.id);
    });
  });

  describe('State Persistence', () => {
    beforeEach(() => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      playerManager.recordTurnResult('Test Result', 15);
      playerManager.nextTurn();
    });

    test('should export game state', () => {
      const state = playerManager.exportState();
      
      expect(state.players).toHaveLength(2);
      expect(state.currentPlayerIndex).toBe(1); // Bob's turn
      expect(state.scores).toHaveLength(2);
      expect(state.turnHistory).toHaveLength(1);
      expect(state.roundNumber).toBe(1);
    });

    test('should import game state', () => {
      const exportedState = playerManager.exportState();
      const newManager = new PlayerManager();
      
      newManager.importState(exportedState);
      
      expect(newManager.getPlayers()).toHaveLength(2);
      expect(newManager.getCurrentPlayer()?.name).toBe('Bob');
      expect(newManager.getPlayerScores()).toHaveLength(2);
      expect(newManager.getTurnHistory()).toHaveLength(1);
      expect(newManager.getCurrentRound()).toBe(1);
    });

    test('should reset to initial state', () => {
      playerManager.reset();
      
      expect(playerManager.getPlayers()).toHaveLength(0);
      expect(playerManager.getCurrentPlayer()).toBeNull();
      expect(playerManager.getPlayerScores()).toHaveLength(0);
      expect(playerManager.getTurnHistory()).toHaveLength(0);
      expect(playerManager.getCurrentRound()).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle single player game', () => {
      playerManager.addPlayer('Solo');
      
      expect(playerManager.getCurrentPlayer()?.name).toBe('Solo');
      
      playerManager.nextTurn();
      expect(playerManager.getCurrentPlayer()?.name).toBe('Solo');
      expect(playerManager.getCurrentRound()).toBe(2);
    });

    test('should handle removing current player', () => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      playerManager.addPlayer('Charlie');
      
      const currentPlayerId = playerManager.getCurrentPlayer()?.id!;
      playerManager.removePlayer(currentPlayerId);
      
      // Should advance to next player
      expect(playerManager.getCurrentPlayer()?.name).toBe('Bob');
    });

    test('should handle removing last player when they are current', () => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      
      // Advance to Bob (last player)
      playerManager.nextTurn();
      expect(playerManager.getCurrentPlayer()?.name).toBe('Bob');
      
      // Remove Bob
      const bobId = playerManager.getCurrentPlayer()?.id!;
      playerManager.removePlayer(bobId);
      
      // Should cycle back to Alice
      expect(playerManager.getCurrentPlayer()?.name).toBe('Alice');
    });
  });
});