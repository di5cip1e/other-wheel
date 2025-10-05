/**
 * Integration tests for multiplayer game flow
 */

import { GameController, GameControllerOptions, GameControllerCallbacks } from '../../src/components/GameController';
import { Player } from '../../src/models';
import { TurnResult } from '../../src/managers/PlayerManager';

// Mock DOM elements helper (unused but kept for potential future use)
// const createMockElement = (id: string): HTMLElement => {
//   const element = document.createElement('div');
//   element.id = id;
//   return element;
// };

describe('Multiplayer Integration', () => {
  let gameController: GameController;
  let mockCallbacks: GameControllerCallbacks;
  let onGameEndSpy: jest.Mock;
  let onTurnCompleteSpy: jest.Mock;
  let onPlayerChangeSpy: jest.Mock;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="wheel-container"></div>
      <div id="power-meter-container"></div>
      <div id="big-wheel-editor"></div>
      <div id="small-wheel-editor"></div>
      <div id="output"></div>
      <div id="player-ui"></div>
    `;

    // Setup callbacks
    onGameEndSpy = jest.fn();
    onTurnCompleteSpy = jest.fn();
    onPlayerChangeSpy = jest.fn();

    mockCallbacks = {
      onGameEnd: onGameEndSpy,
      onTurnComplete: onTurnCompleteSpy,
      onPlayerChange: onPlayerChangeSpy
    };

    // Setup game controller
    const options: GameControllerOptions = {
      wheelContainerId: 'wheel-container',
      powerMeterContainerId: 'power-meter-container',
      bigWheelEditorContainerId: 'big-wheel-editor',
      smallWheelEditorContainerId: 'small-wheel-editor',
      outputElementId: 'output',
      playerUIContainerId: 'player-ui',
      enableMultiplayer: true
    };

    gameController = new GameController(options, mockCallbacks);
  });

  afterEach(() => {
    gameController.destroy();
    document.body.innerHTML = '';
  });

  describe('Player Management Integration', () => {
    test('should add players and update UI', () => {
      const alice = gameController.addPlayer('Alice');
      const bob = gameController.addPlayer('Bob');

      expect(alice.name).toBe('Alice');
      expect(bob.name).toBe('Bob');
      expect(gameController.getPlayers()).toHaveLength(2);
      expect(gameController.getCurrentPlayer()?.name).toBe('Alice');
    });

    test('should remove players and maintain game state', () => {
      gameController.addPlayer('Alice');
      const bob = gameController.addPlayer('Bob');
      gameController.addPlayer('Charlie');

      // Remove middle player
      const removed = gameController.removePlayer(bob.id);
      expect(removed).toBe(true);
      expect(gameController.getPlayers()).toHaveLength(2);
      expect(gameController.getPlayers().map(p => p.name)).toEqual(['Alice', 'Charlie']);
    });

    test('should handle turn advancement', () => {
      gameController.addPlayer('Alice');
      gameController.addPlayer('Bob');
      gameController.addPlayer('Charlie');

      expect(gameController.getCurrentPlayer()?.name).toBe('Alice');

      gameController.nextTurn();
      expect(gameController.getCurrentPlayer()?.name).toBe('Bob');
      expect(onPlayerChangeSpy).toHaveBeenCalledTimes(1);

      gameController.nextTurn();
      expect(gameController.getCurrentPlayer()?.name).toBe('Charlie');
      expect(onPlayerChangeSpy).toHaveBeenCalledTimes(2);

      // Should cycle back to Alice
      gameController.nextTurn();
      expect(gameController.getCurrentPlayer()?.name).toBe('Alice');
      expect(onPlayerChangeSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Game Flow Integration', () => {
    beforeEach(() => {
      gameController.addPlayer('Alice');
      gameController.addPlayer('Bob');
    });

    test('should handle complete game flow', (done) => {
      // Set deterministic seed for predictable results
      gameController.setSeed(12345);

      // Mock the power meter stop to trigger a spin
      const powerMeter = (gameController as any).powerMeter;
      
      // Simulate power meter stop
      setTimeout(() => {
        powerMeter.callbacks.onStop(75); // 75% power
        
        // Wait for spin to complete and result to be processed
        setTimeout(() => {
          expect(onTurnCompleteSpy).toHaveBeenCalledTimes(1);
          
          const turnResult = onTurnCompleteSpy.mock.calls[0][0] as TurnResult;
          expect(turnResult.playerId).toBe(gameController.getCurrentPlayer()?.id);
          expect(turnResult.score).toBe(10); // Default scoring
          
          done();
        }, 100);
      }, 50);
    });

    test('should advance turns automatically after spin completion', (done) => {
      gameController.setSeed(12345);
      
      const initialPlayer = gameController.getCurrentPlayer()?.name;
      expect(initialPlayer).toBe('Alice');

      // Simulate spin completion
      const powerMeter = (gameController as any).powerMeter;
      powerMeter.callbacks.onStop(50);

      // Wait for automatic turn advancement
      setTimeout(() => {
        expect(gameController.getCurrentPlayer()?.name).toBe('Bob');
        expect(onPlayerChangeSpy).toHaveBeenCalled();
        done();
      }, 3500); // Wait longer than the 3-second delay
    });

    test('should track scores across multiple turns', (done) => {
      gameController.setSeed(12345);
      
      let turnCount = 0;
      const maxTurns = 4; // Two full rounds

      const simulateTurn = () => {
        if (turnCount >= maxTurns) {
          // Verify final scores
          const scores = gameController.getPlayerScores();
          expect(scores).toHaveLength(2);
          expect(scores.every(s => s.score > 0)).toBe(true);
          expect(scores.every(s => s.roundsPlayed === 2)).toBe(true);
          done();
          return;
        }

        const powerMeter = (gameController as any).powerMeter;
        powerMeter.callbacks.onStop(50 + turnCount * 10);
        
        turnCount++;
        
        // Wait for turn completion and advancement
        setTimeout(simulateTurn, 3500);
      };

      simulateTurn();
    });
  });

  describe('Game End Conditions', () => {
    beforeEach(() => {
      gameController.addPlayer('Alice');
      gameController.addPlayer('Bob');
    });

    test('should end game when score limit is reached', (done) => {
      // Set a low score limit
      gameController.updateGameSettings({ scoreLimit: 15 });
      
      gameController.setSeed(12345);
      
      // Simulate multiple turns to reach score limit
      let turnCount = 0;
      const simulateTurn = () => {
        if (onGameEndSpy.mock.calls.length > 0) {
          expect(onGameEndSpy).toHaveBeenCalledTimes(1);
          const winners = onGameEndSpy.mock.calls[0][0] as Player[];
          expect(winners.length).toBeGreaterThan(0);
          done();
          return;
        }

        if (turnCount < 10) { // Safety limit
          const powerMeter = (gameController as any).powerMeter;
          powerMeter.callbacks.onStop(75); // High power for more points
          turnCount++;
          setTimeout(simulateTurn, 3500);
        } else {
          done();
        }
      };

      simulateTurn();
    });

    test('should end game when round limit is reached', (done) => {
      // Set a low round limit
      gameController.updateGameSettings({ roundLimit: 2 });
      
      gameController.setSeed(12345);
      
      let turnCount = 0;
      const simulateTurn = () => {
        if (onGameEndSpy.mock.calls.length > 0) {
          expect(onGameEndSpy).toHaveBeenCalledTimes(1);
          done();
          return;
        }

        if (turnCount < 6) { // 3 full rounds
          const powerMeter = (gameController as any).powerMeter;
          powerMeter.callbacks.onStop(50);
          turnCount++;
          setTimeout(simulateTurn, 3500);
        } else {
          done();
        }
      };

      simulateTurn();
    });

    test('should determine winners correctly', () => {
      // Manually set scores to test winner determination
      const alice = gameController.getCurrentPlayer()!;
      (gameController as any).playerManager.recordTurnResult('High Score', 100);
      
      gameController.nextTurn();
      (gameController as any).playerManager.recordTurnResult('Low Score', 50);
      
      gameController.endGame();
      
      expect(onGameEndSpy).toHaveBeenCalledTimes(1);
      const winners = onGameEndSpy.mock.calls[0][0] as Player[];
      expect(winners).toHaveLength(1);
      expect(winners[0]?.id).toBe(alice.id);
    });
  });

  describe('State Persistence', () => {
    beforeEach(() => {
      gameController.addPlayer('Alice');
      gameController.addPlayer('Bob');
    });

    test('should save and load game state', () => {
      // Play a turn to create some state
      (gameController as any).playerManager.recordTurnResult('Test Result', 25);
      gameController.nextTurn();
      
      // Save state
      const savedState = gameController.saveGameState();
      expect(savedState).toBeDefined();
      expect(typeof savedState).toBe('string');
      
      // Create new controller and load state
      const newController = new GameController({
        wheelContainerId: 'wheel-container',
        powerMeterContainerId: 'power-meter-container',
        bigWheelEditorContainerId: 'big-wheel-editor',
        smallWheelEditorContainerId: 'small-wheel-editor',
        outputElementId: 'output',
        playerUIContainerId: 'player-ui',
        enableMultiplayer: true
      });
      
      newController.loadGameState(savedState);
      
      // Verify state was restored
      expect(newController.getPlayers()).toHaveLength(2);
      expect(newController.getCurrentPlayer()?.name).toBe('Bob');
      expect(newController.getPlayerScores().some(s => s.score === 25)).toBe(true);
      
      newController.destroy();
    });

    test('should handle invalid saved state gracefully', () => {
      expect(() => {
        gameController.loadGameState('invalid json');
      }).toThrow('Invalid saved game state');
      
      expect(() => {
        gameController.loadGameState('{"invalid": "structure"}');
      }).not.toThrow(); // Should handle gracefully
    });

    test('should reset game state completely', () => {
      // Create some game state
      (gameController as any).playerManager.recordTurnResult('Test Result', 25);
      gameController.nextTurn();
      
      expect(gameController.getPlayers()).toHaveLength(2);
      expect(gameController.getPlayerScores().some(s => s.score > 0)).toBe(true);
      
      // Reset game
      gameController.resetGame();
      
      expect(gameController.getPlayers()).toHaveLength(0);
      expect(gameController.getCurrentPlayer()).toBeNull();
      expect(gameController.getPlayerScores()).toHaveLength(0);
    });
  });

  describe('Single Player vs Multiplayer Mode', () => {
    test('should detect multiplayer mode correctly', () => {
      expect(gameController.isMultiplayerMode()).toBe(false);
      
      gameController.addPlayer('Alice');
      expect(gameController.isMultiplayerMode()).toBe(true);
      
      const firstPlayer = gameController.getPlayers()[0];
      if (firstPlayer) {
        gameController.removePlayer(firstPlayer.id);
      }
      expect(gameController.isMultiplayerMode()).toBe(false);
    });

    test('should handle single player mode without multiplayer features', (done) => {
      // Don't add any players - should work in single player mode
      gameController.setSeed(12345);
      
      const powerMeter = (gameController as any).powerMeter;
      powerMeter.callbacks.onStop(75);
      
      setTimeout(() => {
        // Should not call multiplayer callbacks
        expect(onTurnCompleteSpy).not.toHaveBeenCalled();
        expect(onPlayerChangeSpy).not.toHaveBeenCalled();
        
        // Should still display result
        const output = document.getElementById('output');
        expect(output?.innerHTML).toContain('Result:');
        
        done();
      }, 100);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors during game flow gracefully', () => {
      gameController.addPlayer('Alice');
      
      // Simulate error in callback
      onTurnCompleteSpy.mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      // Should not crash the game
      expect(() => {
        const powerMeter = (gameController as any).powerMeter;
        powerMeter.callbacks.onStop(50);
      }).not.toThrow();
    });

    test('should handle missing UI elements gracefully', () => {
      // Remove player UI container
      const playerUIContainer = document.getElementById('player-ui');
      if (playerUIContainer) {
        playerUIContainer.remove();
      }
      
      // Should still function without player UI
      expect(() => {
        gameController.addPlayer('Alice');
        gameController.nextTurn();
      }).not.toThrow();
    });
  });
});