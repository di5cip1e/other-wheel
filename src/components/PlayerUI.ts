/**
 * PlayerUI - Component for displaying current player and game status
 */

import { Player } from '../models';
import { PlayerManager } from '../managers/PlayerManager';

export interface PlayerUIConfig {
  showAvatars: boolean;
  showScores: boolean;
  showRoundInfo: boolean;
  maxPlayersDisplayed: number;
}

export class PlayerUI {
  private container: HTMLElement;
  private playerManager: PlayerManager;
  private config: PlayerUIConfig;
  private currentPlayerElement: HTMLElement | null = null;
  private scoreboardElement: HTMLElement | null = null;
  private roundInfoElement: HTMLElement | null = null;

  constructor(container: HTMLElement, playerManager: PlayerManager, config: Partial<PlayerUIConfig> = {}) {
    this.container = container;
    this.playerManager = playerManager;
    this.config = {
      showAvatars: true,
      showScores: true,
      showRoundInfo: true,
      maxPlayersDisplayed: 8,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the UI components
   */
  private initialize(): void {
    this.container.innerHTML = '';
    this.container.className = 'player-ui';

    // Create current player display
    this.createCurrentPlayerDisplay();

    // Create scoreboard
    if (this.config.showScores) {
      this.createScoreboard();
    }

    // Create round info
    if (this.config.showRoundInfo) {
      this.createRoundInfo();
    }

    this.update();
  }

  /**
   * Create current player display section
   */
  private createCurrentPlayerDisplay(): void {
    const section = document.createElement('div');
    section.className = 'current-player-section';

    const title = document.createElement('h3');
    title.textContent = 'Current Player';
    title.className = 'current-player-title';

    this.currentPlayerElement = document.createElement('div');
    this.currentPlayerElement.className = 'current-player-display';

    section.appendChild(title);
    section.appendChild(this.currentPlayerElement);
    this.container.appendChild(section);
  }

  /**
   * Create scoreboard section
   */
  private createScoreboard(): void {
    const section = document.createElement('div');
    section.className = 'scoreboard-section';

    const title = document.createElement('h3');
    title.textContent = 'Scoreboard';
    title.className = 'scoreboard-title';

    this.scoreboardElement = document.createElement('div');
    this.scoreboardElement.className = 'scoreboard';

    section.appendChild(title);
    section.appendChild(this.scoreboardElement);
    this.container.appendChild(section);
  }

  /**
   * Create round info section
   */
  private createRoundInfo(): void {
    const section = document.createElement('div');
    section.className = 'round-info-section';

    this.roundInfoElement = document.createElement('div');
    this.roundInfoElement.className = 'round-info';

    section.appendChild(this.roundInfoElement);
    this.container.appendChild(section);
  }

  /**
   * Update all UI elements
   */
  update(): void {
    this.updateCurrentPlayer();
    
    if (this.config.showScores) {
      this.updateScoreboard();
    }
    
    if (this.config.showRoundInfo) {
      this.updateRoundInfo();
    }
  }

  /**
   * Update current player display
   */
  private updateCurrentPlayer(): void {
    if (!this.currentPlayerElement) return;

    const currentPlayer = this.playerManager.getCurrentPlayer();
    
    if (!currentPlayer) {
      this.currentPlayerElement.innerHTML = '<div class="no-player">No players added</div>';
      return;
    }

    const playerCard = document.createElement('div');
    playerCard.className = 'player-card active';

    // Avatar
    if (this.config.showAvatars && currentPlayer.avatarUrl) {
      const avatar = document.createElement('img');
      avatar.src = currentPlayer.avatarUrl;
      avatar.alt = `${currentPlayer.name}'s avatar`;
      avatar.className = 'player-avatar';
      avatar.onerror = () => {
        avatar.style.display = 'none';
      };
      playerCard.appendChild(avatar);
    }

    // Name
    const nameElement = document.createElement('div');
    nameElement.className = 'player-name';
    nameElement.textContent = currentPlayer.name;
    playerCard.appendChild(nameElement);

    // Score
    const playerScore = this.playerManager.getPlayerScore(currentPlayer.id);
    if (playerScore) {
      const scoreElement = document.createElement('div');
      scoreElement.className = 'player-score';
      scoreElement.textContent = `Score: ${playerScore.score}`;
      playerCard.appendChild(scoreElement);
    }

    // Turn indicator
    const turnIndicator = document.createElement('div');
    turnIndicator.className = 'turn-indicator';
    turnIndicator.textContent = "It's your turn!";
    playerCard.appendChild(turnIndicator);

    this.currentPlayerElement.innerHTML = '';
    this.currentPlayerElement.appendChild(playerCard);
  }

  /**
   * Update scoreboard display
   */
  private updateScoreboard(): void {
    if (!this.scoreboardElement) return;

    const scores = this.playerManager.getPlayerScores();
    const players = this.playerManager.getPlayers();
    
    this.scoreboardElement.innerHTML = '';

    if (scores.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-scoreboard';
      emptyMessage.textContent = 'No scores yet';
      this.scoreboardElement.appendChild(emptyMessage);
      return;
    }

    const scoreList = document.createElement('div');
    scoreList.className = 'score-list';

    scores.slice(0, this.config.maxPlayersDisplayed).forEach((playerScore, index) => {
      const player = players.find(p => p.id === playerScore.playerId);
      if (!player) return;

      const scoreItem = document.createElement('div');
      scoreItem.className = `score-item ${player.isActive ? 'active' : ''}`;

      // Rank
      const rank = document.createElement('div');
      rank.className = 'player-rank';
      rank.textContent = `#${index + 1}`;
      scoreItem.appendChild(rank);

      // Avatar (if enabled and available)
      if (this.config.showAvatars && player.avatarUrl) {
        const avatar = document.createElement('img');
        avatar.src = player.avatarUrl;
        avatar.alt = `${player.name}'s avatar`;
        avatar.className = 'player-avatar-small';
        avatar.onerror = () => {
          avatar.style.display = 'none';
        };
        scoreItem.appendChild(avatar);
      }

      // Name
      const name = document.createElement('div');
      name.className = 'player-name';
      name.textContent = player.name;
      scoreItem.appendChild(name);

      // Score
      const score = document.createElement('div');
      score.className = 'player-score';
      score.textContent = playerScore.score.toString();
      scoreItem.appendChild(score);

      // Last result (if available)
      if (playerScore.lastResult) {
        const lastResult = document.createElement('div');
        lastResult.className = 'last-result';
        lastResult.textContent = playerScore.lastResult;
        lastResult.title = 'Last result';
        scoreItem.appendChild(lastResult);
      }

      scoreList.appendChild(scoreItem);
    });

    this.scoreboardElement.appendChild(scoreList);
  }

  /**
   * Update round info display
   */
  private updateRoundInfo(): void {
    if (!this.roundInfoElement) return;

    const currentRound = this.playerManager.getCurrentRound();
    const totalPlayers = this.playerManager.getPlayers().length;

    this.roundInfoElement.innerHTML = '';

    if (totalPlayers === 0) {
      return;
    }

    const roundDisplay = document.createElement('div');
    roundDisplay.className = 'round-display';

    const roundText = document.createElement('span');
    roundText.className = 'round-text';
    roundText.textContent = `Round ${currentRound}`;

    const playerCount = document.createElement('span');
    playerCount.className = 'player-count';
    playerCount.textContent = `${totalPlayers} player${totalPlayers !== 1 ? 's' : ''}`;

    roundDisplay.appendChild(roundText);
    roundDisplay.appendChild(playerCount);
    this.roundInfoElement.appendChild(roundDisplay);
  }

  /**
   * Show turn transition animation
   */
  showTurnTransition(_previousPlayer: Player | null, currentPlayer: Player | null): void {
    if (!currentPlayer) return;

    // Create transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'turn-transition-overlay';

    const message = document.createElement('div');
    message.className = 'turn-transition-message';
    message.innerHTML = `
      <div class="transition-title">Next Turn</div>
      <div class="transition-player">${currentPlayer.name}</div>
      <div class="transition-subtitle">Get ready to spin!</div>
    `;

    overlay.appendChild(message);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    // Remove after delay
    setTimeout(() => {
      overlay.classList.remove('visible');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }, 2000);

    // Update UI
    this.update();
  }

  /**
   * Show game end screen
   */
  showGameEnd(winners: Player[], ruleMessage?: string): void {
    const overlay = document.createElement('div');
    overlay.className = 'game-end-overlay';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'game-end-message';

    if (winners.length === 1) {
      messageDiv.innerHTML = `
        <div class="end-title">Game Over!</div>
        <div class="winner-announcement">🎉 ${winners[0]?.name} Wins! 🎉</div>
        ${ruleMessage ? `<div class="rule-message" style="color: #007bff; font-weight: bold; margin: 15px 0;">${ruleMessage}</div>` : ''}
        <div class="final-scores-title">Final Scores:</div>
      `;
    } else if (winners.length > 1) {
      const winnerNames = winners.map(w => w.name).join(', ');
      messageDiv.innerHTML = `
        <div class="end-title">Game Over!</div>
        <div class="winner-announcement">🎉 Tie Game! 🎉</div>
        <div class="tie-announcement">Winners: ${winnerNames}</div>
        ${ruleMessage ? `<div class="rule-message" style="color: #007bff; font-weight: bold; margin: 15px 0;">${ruleMessage}</div>` : ''}
        <div class="final-scores-title">Final Scores:</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="end-title">Game Over!</div>
        ${ruleMessage ? `<div class="rule-message" style="color: #007bff; font-weight: bold; margin: 15px 0;">${ruleMessage}</div>` : ''}
        <div class="final-scores-title">Final Scores:</div>
      `;
    }

    // Add final scoreboard
    const finalScores = document.createElement('div');
    finalScores.className = 'final-scoreboard';
    
    const scores = this.playerManager.getPlayerScores();
    scores.forEach((playerScore, index) => {
      const player = this.playerManager.getPlayers().find(p => p.id === playerScore.playerId);
      if (!player) return;

      const scoreItem = document.createElement('div');
      scoreItem.className = `final-score-item ${winners.includes(player) ? 'winner' : ''}`;
      scoreItem.innerHTML = `
        <span class="final-rank">#${index + 1}</span>
        <span class="final-name">${player.name}</span>
        <span class="final-score">${playerScore.score}</span>
      `;
      finalScores.appendChild(scoreItem);
    });

    messageDiv.appendChild(finalScores);
    overlay.appendChild(messageDiv);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PlayerUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.update();
  }

  /**
   * Destroy the UI component
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}