import { RuleEngine } from '../../src/engines/RuleEngine';
import { RuleEditor } from '../../src/components/RuleEditor';
import { GameController } from '../../src/components/GameController';
import { Rule, RuleEvaluationContext, Wheel, GameState } from '../../src/models';

describe('Rule System Integration', () => {
  let ruleEngine: RuleEngine;
  let gameController: GameController;
  let mockWheels: Wheel[];
  let mockGameState: GameState;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
    mockWheels = createMockWheels();
    mockGameState = createMockGameState();
    
    // Set up DOM for GameController
    document.body.innerHTML = '<div id="game-container"></div>';
    const container = document.getElementById('game-container')!;
    gameController = new GameController(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('End-to-End Rule Evaluation', () => {
    it('should evaluate win condition correctly during gameplay', () => {
      // Create a win rule for specific wedge
      const winRule: Rule = {
        id: 'win-rule',
        name: 'Win on Red',
        description: 'Player wins when red wedge is selected',
        isActive: true,
        priority: 100,
        conditions: [{
          id: 'cond1',
          type: 'specific_wedge',
          parameters: { wedgeId: 'red-wedge', wheel: 'outer' },
        }],
        outcome: 'win',
        points: 100,
        message: 'Congratulations! You hit the red wedge!',
        createdAt: '2023-01-01T00:00:00Z',
        modifiedAt: '2023-01-01T00:00:00Z',
      };

      ruleEngine.addRule(winRule);

      // Simulate spin result that should trigger win
      const context: RuleEvaluationContext = {
        playerId: 'player1',
        currentSpin: {
          outerWedgeId: 'red-wedge',
          innerWedgeId: 'blue-wedge',
          outerWedgeLabel: 'Red',
          innerWedgeLabel: 'Blue',
        },
        playerScore: 50,
        gameHistory: [],
        roundNumber: 1,
      };

      const results = ruleEngine.evaluateRules(context);

      expect(results).toHaveLength(1);
      expect(results[0].triggered).toBe(true);
      expect(results[0].outcome).toBe('win');
      expect(results[0].points).toBe(100);
      expect(results[0].message).toBe('Congratulations! You hit the red wedge!');
    });

    it('should handle multiple rules with different priorities', () => {
      // High priority lose rule
      const loseRule: Rule = {
        id: 'lose-rule',
        name: 'Avoid Black',
        description: 'Player loses when black wedge is selected',
        isActive: true,
        priority: 90,
        conditions: [{
          id: 'cond1',
          type: 'avoid_wedge',
          parameters: { wedgeId: 'black-wedge', wheel: 'outer' },
        }],
        outcome: 'lose',
        points: -50,
        message: 'Game Over! You hit the black wedge!',
        createdAt: '2023-01-01T00:00:00Z',
        modifiedAt: '2023-01-01T00:00:00Z',
      };

      // Lower priority continue rule
      const continueRule: Rule = {
        id: 'continue-rule',
        name: 'Normal Points',
        description: 'Award points for any other wedge',
        isActive: true,
        priority: 10,
        conditions: [{
          id: 'cond1',
          type: 'score_threshold',
          parameters: { threshold: 0, operator: 'gte' },
        }],
        outcome: 'continue',
        points: 10,
        message: 'Keep playing!',
        createdAt: '2023-01-01T00:00:00Z',
        modifiedAt: '2023-01-01T00:00:00Z',
      };

      ruleEngine.addRule(loseRule);
      ruleEngine.addRule(continueRule);

      // Test lose condition
      const loseContext: RuleEvaluationContext = {
        playerId: 'player1',
        currentSpin: {
          outerWedgeId: 'black-wedge',
          innerWedgeId: 'blue-wedge',
          outerWedgeLabel: 'Black',
          innerWedgeLabel: 'Blue',
        },
        playerScore: 50,
        gameHistory: [],
        roundNumber: 1,
      };

      const loseResults = ruleEngine.evaluateRules(loseContext);
      expect(loseResults).toHaveLength(1); // Should stop after lose rule
      expect(loseResults[0].outcome).toBe('lose');

      // Test continue condition
      const continueContext: RuleEvaluationContext = {
        playerId: 'player1',
        currentSpin: {
          outerWedgeId: 'red-wedge',
          innerWedgeId: 'blue-wedge',
          outerWedgeLabel: 'Red',
          innerWedgeLabel: 'Blue',
        },
        playerScore: 50,
        gameHistory: [],
        roundNumber: 1,
      };

      const continueResults = ruleEngine.evaluateRules(continueContext);
      expect(continueResults).toHaveLength(1);
      expect(continueResults[0].outcome).toBe('continue');
    });

    it('should handle complex combination rules', () => {
      // Rule that requires specific combination AND score threshold
      const complexRule: Rule = {
        id: 'complex-rule',
        name: 'Jackpot Combination',
        description: 'Win big with red+blue combination and high score',
        isActive: true,
        priority: 100,
        conditions: [
          {
            id: 'cond1',
            type: 'wedge_combination',
            parameters: { 
              outerWedgeId: 'red-wedge', 
              innerWedgeId: 'blue-wedge', 
              matchType: 'exact', 
            },
          },
          {
            id: 'cond2',
            type: 'score_threshold',
            parameters: { threshold: 100, operator: 'gte' },
            operator: 'AND',
          },
        ],
        outcome: 'win',
        points: 500,
        message: 'JACKPOT! Perfect combination with high score!',
        createdAt: '2023-01-01T00:00:00Z',
        modifiedAt: '2023-01-01T00:00:00Z',
      };

      ruleEngine.addRule(complexRule);

      // Test with matching combination but low score
      const lowScoreContext: RuleEvaluationContext = {
        playerId: 'player1',
        currentSpin: {
          outerWedgeId: 'red-wedge',
          innerWedgeId: 'blue-wedge',
          outerWedgeLabel: 'Red',
          innerWedgeLabel: 'Blue',
        },
        playerScore: 50, // Below threshold
        gameHistory: [],
        roundNumber: 1,
      };

      const lowScoreResults = ruleEngine.evaluateRules(lowScoreContext);
      expect(lowScoreResults[0].triggered).toBe(false);

      // Test with matching combination and high score
      const highScoreContext: RuleEvaluationContext = {
        ...lowScoreContext,
        playerScore: 150, // Above threshold
      };

      const highScoreResults = ruleEngine.evaluateRules(highScoreContext);
      expect(highScoreResults[0].triggered).toBe(true);
      expect(highScoreResults[0].outcome).toBe('win');
      expect(highScoreResults[0].points).toBe(500);
    });

    it('should handle consecutive wins rule with game history', () => {
      const streakRule: Rule = {
        id: 'streak-rule',
        name: 'Win Streak Bonus',
        description: 'Bonus for 3 consecutive wins',
        isActive: true,
        priority: 80,
        conditions: [{
          id: 'cond1',
          type: 'consecutive_wins',
          parameters: { count: 3 },
        }],
        outcome: 'continue',
        points: 50,
        message: 'Win streak bonus!',
        createdAt: '2023-01-01T00:00:00Z',
        modifiedAt: '2023-01-01T00:00:00Z',
      };

      ruleEngine.addRule(streakRule);

      // Create context with 3 consecutive wins
      const streakContext: RuleEvaluationContext = {
        playerId: 'player1',
        currentSpin: {
          outerWedgeId: 'red-wedge',
          innerWedgeId: 'blue-wedge',
          outerWedgeLabel: 'Red',
          innerWedgeLabel: 'Blue',
        },
        playerScore: 100,
        gameHistory: [
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 10, timestamp: '2023-01-01' },
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 15, timestamp: '2023-01-02' },
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 20, timestamp: '2023-01-03' },
        ],
        roundNumber: 4,
      };

      const results = ruleEngine.evaluateRules(streakContext);
      expect(results[0].triggered).toBe(true);
      expect(results[0].points).toBe(50);
    });
  });

  describe('Rule Editor Integration', () => {
    let ruleEditor: RuleEditor;
    let container: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = '<div id="editor-container"></div>';
      container = document.getElementById('editor-container')!;
      ruleEditor = new RuleEditor(container, ruleEngine, mockWheels);
    });

    it('should create and save functional rules through UI', () => {
      // Create new rule through UI
      const newRuleBtn = container.querySelector('#new-rule-btn') as HTMLButtonElement;
      newRuleBtn.click();

      // Set rule properties
      const nameInput = container.querySelector('#rule-name') as HTMLInputElement;
      nameInput.value = 'UI Test Rule';
      nameInput.dispatchEvent(new Event('input'));

      const outcomeSelect = container.querySelector('#rule-outcome') as HTMLSelectElement;
      outcomeSelect.value = 'win';
      outcomeSelect.dispatchEvent(new Event('change'));

      const pointsInput = container.querySelector('#rule-points') as HTMLInputElement;
      pointsInput.value = '100';
      pointsInput.dispatchEvent(new Event('input'));

      // Add condition
      const addConditionBtn = container.querySelector('#add-condition-btn') as HTMLButtonElement;
      addConditionBtn.click();

      const specificWedgeOption = document.querySelector('[data-type="specific_wedge"]') as HTMLElement;
      specificWedgeOption.click();

      // Configure condition
      const wheelSelect = container.querySelector('[data-param="wheel"]') as HTMLSelectElement;
      wheelSelect.value = 'outer';
      wheelSelect.dispatchEvent(new Event('change'));

      const wedgeSelect = container.querySelector('[data-param="wedgeId"]') as HTMLSelectElement;
      wedgeSelect.value = 'red-wedge';
      wedgeSelect.dispatchEvent(new Event('change'));

      // Save rule
      const saveBtn = container.querySelector('#save-rule-btn') as HTMLButtonElement;
      saveBtn.click();

      // Verify rule was created and is functional
      const savedRules = ruleEngine.getAllRules();
      expect(savedRules).toHaveLength(1);
      expect(savedRules[0].name).toBe('UI Test Rule');
      expect(savedRules[0].outcome).toBe('win');

      // Test the rule works
      const context: RuleEvaluationContext = {
        playerId: 'player1',
        currentSpin: {
          outerWedgeId: 'red-wedge',
          innerWedgeId: 'blue-wedge',
          outerWedgeLabel: 'Red',
          innerWedgeLabel: 'Blue',
        },
        playerScore: 50,
        gameHistory: [],
        roundNumber: 1,
      };

      const results = ruleEngine.evaluateRules(context);
      expect(results[0].triggered).toBe(true);
      expect(results[0].outcome).toBe('win');
    });

    it('should prevent saving invalid rules', () => {
      // Mock alert to capture error messages
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      // Create new rule without conditions
      const newRuleBtn = container.querySelector('#new-rule-btn') as HTMLButtonElement;
      newRuleBtn.click();

      // Try to save without adding conditions
      const saveBtn = container.querySelector('#save-rule-btn') as HTMLButtonElement;
      saveBtn.click();

      // Should show error and not save
      expect(alertSpy).toHaveBeenCalled();
      expect(ruleEngine.getAllRules()).toHaveLength(0);

      alertSpy.mockRestore();
    });

    it('should show validation errors in real-time', () => {
      // Create new rule
      const newRuleBtn = container.querySelector('#new-rule-btn') as HTMLButtonElement;
      newRuleBtn.click();

      // Should show validation errors for rule with no conditions
      expect(container.querySelector('.validation-errors')).toBeTruthy();

      // Add condition
      const addConditionBtn = container.querySelector('#add-condition-btn') as HTMLButtonElement;
      addConditionBtn.click();

      const specificWedgeOption = document.querySelector('[data-type="specific_wedge"]') as HTMLElement;
      specificWedgeOption.click();

      // Should now show validation success
      expect(container.querySelector('.validation-success')).toBeTruthy();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of rules efficiently', () => {
      // Add 100 rules
      for (let i = 0; i < 100; i++) {
        const rule: Rule = {
          id: `rule-${i}`,
          name: `Rule ${i}`,
          description: `Test rule ${i}`,
          isActive: i % 2 === 0, // Half active, half inactive
          priority: i,
          conditions: [{
            id: `cond-${i}`,
            type: 'score_threshold',
            parameters: { threshold: i * 10, operator: 'gte' },
          }],
          outcome: 'continue',
          points: i,
          createdAt: '2023-01-01T00:00:00Z',
          modifiedAt: '2023-01-01T00:00:00Z',
        };
        ruleEngine.addRule(rule);
      }

      const context: RuleEvaluationContext = {
        playerId: 'player1',
        currentSpin: {
          outerWedgeId: 'red-wedge',
          innerWedgeId: 'blue-wedge',
          outerWedgeLabel: 'Red',
          innerWedgeLabel: 'Blue',
        },
        playerScore: 500,
        gameHistory: [],
        roundNumber: 1,
      };

      const startTime = performance.now();
      const results = ruleEngine.evaluateRules(context);
      const endTime = performance.now();

      // Should complete quickly (under 10ms for 100 rules)
      expect(endTime - startTime).toBeLessThan(10);
      
      // Should only return active rules that match
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.triggered)).toBe(true);
    });

    it('should handle malformed rule data gracefully', () => {
      const malformedRule = {
        id: 'malformed',
        name: 'Malformed Rule',
        conditions: [{
          id: 'bad-condition',
          type: 'unknown_type' as any,
          parameters: { invalid: 'data' },
        }],
      } as Rule;

      // Should not throw when adding malformed rule
      expect(() => ruleEngine.addRule(malformedRule)).not.toThrow();

      const context: RuleEvaluationContext = {
        playerId: 'player1',
        currentSpin: {
          outerWedgeId: 'red-wedge',
          innerWedgeId: 'blue-wedge',
          outerWedgeLabel: 'Red',
          innerWedgeLabel: 'Blue',
        },
        playerScore: 50,
        gameHistory: [],
        roundNumber: 1,
      };

      // Should not throw during evaluation
      expect(() => ruleEngine.evaluateRules(context)).not.toThrow();
    });
  });

  // Helper functions
  function createMockWheels(): Wheel[] {
    return [
      {
        id: 'outer-wheel',
        label: 'Outer Wheel',
        wedges: [
          { id: 'red-wedge', label: 'Red', weight: 1, color: '#ff0000' },
          { id: 'black-wedge', label: 'Black', weight: 1, color: '#000000' },
          { id: 'green-wedge', label: 'Green', weight: 1, color: '#00ff00' },
        ],
        frictionCoefficient: 0.1,
        radius: 150,
        position: { x: 200, y: 200 },
        currentAngle: 0,
        angularVelocity: 0,
      },
      {
        id: 'inner-wheel',
        label: 'Inner Wheel',
        wedges: [
          { id: 'blue-wedge', label: 'Blue', weight: 1, color: '#0000ff' },
          { id: 'yellow-wedge', label: 'Yellow', weight: 1, color: '#ffff00' },
        ],
        frictionCoefficient: 0.1,
        clutchRatio: 0.5,
        radius: 75,
        position: { x: 200, y: 200 },
        currentAngle: 0,
        angularVelocity: 0,
      },
    ];
  }

  function createMockGameState(): GameState {
    return {
      wheels: mockWheels,
      players: [
        { id: 'player1', name: 'Player 1', isActive: true },
        { id: 'player2', name: 'Player 2', isActive: false },
      ],
      currentPlayerIndex: 0,
      gamePhase: 'playing',
      scores: new Map([['player1', 50], ['player2', 30]]),
      settings: {
        maxPlayers: 4,
        enableSound: true,
        theme: 'default',
        deterministic: false,
      },
    };
  }
});