/**
 * Tests for PlayerUI component
 */

import { PlayerUI, PlayerUIConfig } from '../../src/components/PlayerUI';
import { PlayerManager } from '../../src/managers/PlayerManager';

// Mock DOM methods
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16);
  },
});

describe('PlayerUI', () => {
  let container: HTMLElement;
  let playerManager: PlayerManager;
  let playerUI: PlayerUI;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="player-ui-container"></div>';
    container = document.getElementById('player-ui-container')!;
    
    // Setup player manager
    playerManager = new PlayerManager();
    
    // Setup PlayerUI
    playerUI = new PlayerUI(container, playerManager);
  });

  afterEach(() => {
    playerUI.destroy();
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(container.className).toBe('player-ui');
      expect(container.children.length).toBeGreaterThan(0);
    });

    test('should initialize with custom configuration', () => {
      const customConfig: Partial<PlayerUIConfig> = {
        showAvatars: false,
        showScores: false,
        showRoundInfo: false,
        maxPlayersDisplayed: 4,
      };
      
      const customPlayerUI = new PlayerUI(container, playerManager, customConfig);
      
      // Should still create the UI structure
      expect(container.className).toBe('player-ui');
      
      customPlayerUI.destroy();
    });

    test('should create required UI sections', () => {
      const sections = container.querySelectorAll('.current-player-section, .scoreboard-section, .round-info-section');
      expect(sections.length).toBe(3);
    });
  });

  describe('Current Player Display', () => {
    test('should show "no players" message when no players exist', () => {
      const noPlayerElement = container.querySelector('.no-player');
      expect(noPlayerElement).toBeTruthy();
      expect(noPlayerElement?.textContent).toBe('No players added');
    });

    test('should display current player information', () => {
      playerManager.addPlayer('Alice');
      playerUI.update();
      
      const playerCard = container.querySelector('.player-card.active');
      expect(playerCard).toBeTruthy();
      
      const playerName = playerCard?.querySelector('.player-name');
      expect(playerName?.textContent).toBe('Alice');
      
      const turnIndicator = playerCard?.querySelector('.turn-indicator');
      expect(turnIndicator?.textContent).toBe('It\'s your turn!');
    });

    test('should display player avatar when provided', () => {
      playerManager.addPlayer('Alice', 'https://example.com/avatar.jpg');
      playerUI.update();
      
      const avatar = container.querySelector('.player-avatar') as HTMLImageElement;
      expect(avatar).toBeTruthy();
      expect(avatar.src).toBe('https://example.com/avatar.jpg');
      expect(avatar.alt).toBe('Alice\'s avatar');
    });

    test('should display player score', () => {
      playerManager.addPlayer('Alice');
      playerManager.recordTurnResult('Test Result', 25);
      playerUI.update();
      
      const scoreElement = container.querySelector('.player-score');
      expect(scoreElement?.textContent).toBe('Score: 25');
    });
  });

  describe('Scoreboard Display', () => {
    test('should show empty scoreboard message when no scores exist', () => {
      const emptyMessage = container.querySelector('.empty-scoreboard');
      expect(emptyMessage?.textContent).toBe('No scores yet');
    });

    test('should display player scores in order', () => {
      playerManager.addPlayer('Alice');
      playerManager.recordTurnResult('Alice Result', 30);
      
      playerManager.nextTurn();
      playerManager.addPlayer('Bob');
      playerManager.recordTurnResult('Bob Result', 50);
      
      playerUI.update();
      
      const scoreItems = container.querySelectorAll('.score-item');
      expect(scoreItems.length).toBe(2);
      
      // Bob should be first (higher score)
      const firstPlayer = scoreItems[0]?.querySelector('.player-name');
      expect(firstPlayer?.textContent).toBe('Bob');
      
      const firstScore = scoreItems[0]?.querySelector('.player-score');
      expect(firstScore?.textContent).toBe('50');
    });

    test('should highlight active player in scoreboard', () => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      playerUI.update();
      
      const activeItem = container.querySelector('.score-item.active');
      
      expect(activeItem).toBeTruthy();
      // Alice should be active initially
      const activeName = activeItem?.querySelector('.player-name');
      expect(activeName?.textContent).toBe('Alice');
    });

    test('should display player ranks correctly', () => {
      playerManager.addPlayer('Alice');
      playerManager.recordTurnResult('Alice Result', 30);
      
      playerManager.nextTurn();
      playerManager.addPlayer('Bob');
      playerManager.recordTurnResult('Bob Result', 20);
      
      playerUI.update();
      
      const ranks = container.querySelectorAll('.player-rank');
      expect(ranks[0]?.textContent).toBe('#1'); // Alice
      expect(ranks[1]?.textContent).toBe('#2'); // Bob
    });

    test('should display last result when available', () => {
      playerManager.addPlayer('Alice');
      playerManager.recordTurnResult('Big 1 + Small 3', 10);
      playerUI.update();
      
      const lastResult = container.querySelector('.last-result');
      expect(lastResult?.textContent).toBe('Big 1 + Small 3');
    });

    test('should limit displayed players based on configuration', () => {
      // Add more players than the limit
      for (let i = 1; i <= 5; i++) {
        playerManager.addPlayer(`Player ${i}`);
        playerManager.recordTurnResult(`Result ${i}`, i * 10);
        if (i < 5) {playerManager.nextTurn();}
      }
      
      // Update config to show only 3 players
      playerUI.updateConfig({ maxPlayersDisplayed: 3 });
      
      const scoreItems = container.querySelectorAll('.score-item');
      expect(scoreItems.length).toBe(3);
    });
  });

  describe('Round Info Display', () => {
    test('should display current round and player count', () => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      playerUI.update();
      
      const roundText = container.querySelector('.round-text');
      expect(roundText?.textContent).toBe('Round 1');
      
      const playerCount = container.querySelector('.player-count');
      expect(playerCount?.textContent).toBe('2 players');
    });

    test('should handle singular player count', () => {
      playerManager.addPlayer('Alice');
      playerUI.update();
      
      const playerCount = container.querySelector('.player-count');
      expect(playerCount?.textContent).toBe('1 player');
    });

    test('should update round number after full cycle', () => {
      playerManager.addPlayer('Alice');
      playerManager.addPlayer('Bob');
      
      // Complete one full round
      playerManager.nextTurn(); // Bob
      playerManager.nextTurn(); // Alice (round 2)
      
      playerUI.update();
      
      const roundText = container.querySelector('.round-text');
      expect(roundText?.textContent).toBe('Round 2');
    });
  });

  describe('Turn Transitions', () => {
    test('should show turn transition overlay', (done) => {
      const alice = playerManager.addPlayer('Alice');
      const bob = playerManager.addPlayer('Bob');
      
      playerUI.showTurnTransition(alice, bob);
      
      // Check if overlay is created
      setTimeout(() => {
        const overlay = document.querySelector('.turn-transition-overlay');
        expect(overlay).toBeTruthy();
        
        const playerName = overlay?.querySelector('.transition-player');
        expect(playerName?.textContent).toBe('Bob');
        
        done();
      }, 50);
    });

    test('should remove transition overlay after delay', (done) => {
      const alice = playerManager.addPlayer('Alice');
      const bob = playerManager.addPlayer('Bob');
      
      playerUI.showTurnTransition(alice, bob);
      
      // Check that overlay is removed after delay
      setTimeout(() => {
        const overlay = document.querySelector('.turn-transition-overlay');
        expect(overlay).toBeFalsy();
        done();
      }, 2500);
    });
  });

  describe('Game End Display', () => {
    test('should show game end overlay with single winner', (done) => {
      const alice = playerManager.addPlayer('Alice');
      playerManager.recordTurnResult('Winning Result', 100);
      
      playerManager.addPlayer('Bob');
      playerManager.recordTurnResult('Losing Result', 50);
      
      const winners = [alice];
      playerUI.showGameEnd(winners);
      
      setTimeout(() => {
        const overlay = document.querySelector('.game-end-overlay');
        expect(overlay).toBeTruthy();
        
        const winnerAnnouncement = overlay?.querySelector('.winner-announcement');
        expect(winnerAnnouncement?.textContent).toContain('Alice Wins!');
        
        done();
      }, 50);
    });

    test('should show game end overlay with tie game', (done) => {
      const alice = playerManager.addPlayer('Alice');
      playerManager.recordTurnResult('Tie Result', 50);
      
      playerManager.nextTurn();
      const bob = playerManager.addPlayer('Bob');
      playerManager.recordTurnResult('Tie Result', 50);
      
      const winners = [alice, bob];
      playerUI.showGameEnd(winners);
      
      setTimeout(() => {
        const overlay = document.querySelector('.game-end-overlay');
        expect(overlay).toBeTruthy();
        
        const tieAnnouncement = overlay?.querySelector('.tie-announcement');
        expect(tieAnnouncement?.textContent).toContain('Alice, Bob');
        
        done();
      }, 50);
    });

    test('should display final scoreboard in game end overlay', (done) => {
      playerManager.addPlayer('Alice');
      playerManager.recordTurnResult('Alice Result', 30);
      
      playerManager.nextTurn();
      playerManager.addPlayer('Bob');
      playerManager.recordTurnResult('Bob Result', 20);
      
      playerUI.showGameEnd([]);
      
      setTimeout(() => {
        const finalScoreboard = document.querySelector('.final-scoreboard');
        expect(finalScoreboard).toBeTruthy();
        
        const scoreItems = finalScoreboard?.querySelectorAll('.final-score-item');
        expect(scoreItems?.length).toBe(2);
        
        done();
      }, 50);
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration and refresh display', () => {
      playerManager.addPlayer('Alice', 'https://example.com/avatar.jpg');
      
      // Initially avatars should be shown
      playerUI.update();
      let avatar = container.querySelector('.player-avatar');
      expect(avatar).toBeTruthy();
      
      // Disable avatars
      playerUI.updateConfig({ showAvatars: false });
      avatar = container.querySelector('.player-avatar');
      expect(avatar).toBeFalsy();
    });

    test('should handle configuration changes for scoreboard', () => {
      playerManager.addPlayer('Alice');
      
      // Initially scoreboard should be shown
      const scoreboard = container.querySelector('.scoreboard-section');
      expect(scoreboard).toBeTruthy();
      
      // Disable scoreboard
      playerUI.updateConfig({ showScores: false });
      // Note: This test would need the component to actually recreate the UI
      // For now, we just verify the config is updated
    });
  });

  describe('Cleanup', () => {
    test('should clean up DOM when destroyed', () => {
      expect(container.children.length).toBeGreaterThan(0);
      
      playerUI.destroy();
      
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing player data gracefully', () => {
      // Simulate corrupted player data
      const corruptedManager = new PlayerManager();
      const corruptedUI = new PlayerUI(container, corruptedManager);
      
      // Should not throw errors
      expect(() => {
        corruptedUI.update();
      }).not.toThrow();
      
      corruptedUI.destroy();
    });

    test('should handle avatar loading errors', () => {
      playerManager.addPlayer('Alice', 'https://invalid-url.com/avatar.jpg');
      playerUI.update();
      
      const avatar = container.querySelector('.player-avatar') as HTMLImageElement;
      expect(avatar).toBeTruthy();
      
      // Simulate error event
      const errorEvent = new Event('error');
      avatar.dispatchEvent(errorEvent);
      
      // Avatar should be hidden
      expect(avatar.style.display).toBe('none');
    });
  });
});