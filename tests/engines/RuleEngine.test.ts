import { RuleEngine } from '../../src/engines/RuleEngine';
import { Rule, RuleEvaluationContext, RuleCondition } from '../../src/models/Rule';

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine;
  let mockContext: RuleEvaluationContext;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
    mockContext = {
      playerId: 'player1',
      currentSpin: {
        outerWedgeId: 'wedge1',
        innerWedgeId: 'wedge2',
        outerWedgeLabel: 'Red',
        innerWedgeLabel: 'Blue',
      },
      playerScore: 50,
      gameHistory: [],
      roundNumber: 1,
    };
  });

  describe('Rule Management', () => {
    it('should add a valid rule', () => {
      const rule: Rule = createValidRule();
      
      expect(() => ruleEngine.addRule(rule)).not.toThrow();
      expect(ruleEngine.getRule(rule.id)).toEqual(rule);
    });

    it('should reject invalid rule', () => {
      const invalidRule: Rule = {
        ...createValidRule(),
        name: '', // Invalid empty name
        conditions: [], // Invalid empty conditions
      };
      
      expect(() => ruleEngine.addRule(invalidRule)).toThrow();
    });

    it('should update existing rule', () => {
      const rule = createValidRule();
      ruleEngine.addRule(rule);
      
      const updatedRule = { ...rule, name: 'Updated Rule' };
      ruleEngine.updateRule(updatedRule);
      
      expect(ruleEngine.getRule(rule.id)?.name).toBe('Updated Rule');
    });

    it('should remove rule', () => {
      const rule = createValidRule();
      ruleEngine.addRule(rule);
      
      const removed = ruleEngine.removeRule(rule.id);
      
      expect(removed).toBe(true);
      expect(ruleEngine.getRule(rule.id)).toBeUndefined();
    });

    it('should return false when removing non-existent rule', () => {
      const removed = ruleEngine.removeRule('non-existent');
      expect(removed).toBe(false);
    });

    it('should get all rules', () => {
      const rule1 = createValidRule('rule1');
      const rule2 = createValidRule('rule2');
      
      ruleEngine.addRule(rule1);
      ruleEngine.addRule(rule2);
      
      const allRules = ruleEngine.getAllRules();
      expect(allRules).toHaveLength(2);
      expect(allRules).toContainEqual(rule1);
      expect(allRules).toContainEqual(rule2);
    });

    it('should get active rules sorted by priority', () => {
      const lowPriorityRule = createValidRule('low', 10, false);
      const highPriorityRule = createValidRule('high', 90, true);
      const mediumPriorityRule = createValidRule('medium', 50, true);
      
      ruleEngine.addRule(lowPriorityRule);
      ruleEngine.addRule(highPriorityRule);
      ruleEngine.addRule(mediumPriorityRule);
      
      const activeRules = ruleEngine.getActiveRules();
      expect(activeRules).toHaveLength(2);
      expect(activeRules[0].id).toBe('high');
      expect(activeRules[1].id).toBe('medium');
    });
  });

  describe('Specific Wedge Condition', () => {
    it('should trigger when outer wedge matches', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'specific_wedge',
        parameters: { wedgeId: 'wedge1', wheel: 'outer' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should trigger when inner wedge matches', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'specific_wedge',
        parameters: { wedgeId: 'wedge2', wheel: 'inner' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should trigger when either wheel matches (both option)', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'specific_wedge',
        parameters: { wedgeId: 'wedge1', wheel: 'both' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should not trigger when wedge does not match', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'specific_wedge',
        parameters: { wedgeId: 'wedge3', wheel: 'outer' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(false);
    });
  });

  describe('Wedge Combination Condition', () => {
    it('should trigger on exact match', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'wedge_combination',
        parameters: { 
          outerWedgeId: 'wedge1', 
          innerWedgeId: 'wedge2', 
          matchType: 'exact', 
        },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should trigger on any match', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'wedge_combination',
        parameters: { 
          outerWedgeId: 'wedge1', 
          innerWedgeId: 'wedge3', 
          matchType: 'any', 
        },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should not trigger when neither matches', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'wedge_combination',
        parameters: { 
          outerWedgeId: 'wedge3', 
          innerWedgeId: 'wedge4', 
          matchType: 'any', 
        },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(false);
    });
  });

  describe('Score Threshold Condition', () => {
    it('should trigger when score is greater than or equal to threshold', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'score_threshold',
        parameters: { threshold: 50, operator: 'gte' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should trigger when score is less than or equal to threshold', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'score_threshold',
        parameters: { threshold: 100, operator: 'lte' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should trigger when score equals threshold', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'score_threshold',
        parameters: { threshold: 50, operator: 'eq' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should not trigger when condition is not met', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'score_threshold',
        parameters: { threshold: 100, operator: 'gte' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(false);
    });
  });

  describe('Consecutive Wins Condition', () => {
    it('should trigger when player has enough consecutive wins', () => {
      const contextWithWins: RuleEvaluationContext = {
        ...mockContext,
        gameHistory: [
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 10, timestamp: '2023-01-01' },
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 15, timestamp: '2023-01-02' },
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 20, timestamp: '2023-01-03' },
        ],
      };
      
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'consecutive_wins',
        parameters: { count: 3 },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(contextWithWins);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should not trigger when player has losses in history', () => {
      const contextWithLosses: RuleEvaluationContext = {
        ...mockContext,
        gameHistory: [
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 10, timestamp: '2023-01-01' },
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 0, timestamp: '2023-01-02' },
          { playerId: 'player1', outerWedgeId: 'w1', innerWedgeId: 'w2', points: 20, timestamp: '2023-01-03' },
        ],
      };
      
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'consecutive_wins',
        parameters: { count: 3 },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(contextWithLosses);
      
      expect(results[0].triggered).toBe(false);
    });

    it('should not trigger when insufficient history', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'consecutive_wins',
        parameters: { count: 5 },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(false);
    });
  });

  describe('Avoid Wedge Condition', () => {
    it('should trigger when forbidden wedge is selected', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'avoid_wedge',
        parameters: { wedgeId: 'wedge1', wheel: 'outer' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should not trigger when forbidden wedge is not selected', () => {
      const rule = createRuleWithCondition({
        id: 'cond1',
        type: 'avoid_wedge',
        parameters: { wedgeId: 'wedge3', wheel: 'outer' },
      });
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(false);
    });
  });

  describe('Multiple Conditions with Operators', () => {
    it('should handle AND operator correctly', () => {
      const rule: Rule = {
        ...createValidRule(),
        conditions: [
          {
            id: 'cond1',
            type: 'specific_wedge',
            parameters: { wedgeId: 'wedge1', wheel: 'outer' },
          },
          {
            id: 'cond2',
            type: 'score_threshold',
            parameters: { threshold: 40, operator: 'gte' },
            operator: 'AND',
          },
        ],
      };
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should handle OR operator correctly', () => {
      const rule: Rule = {
        ...createValidRule(),
        conditions: [
          {
            id: 'cond1',
            type: 'specific_wedge',
            parameters: { wedgeId: 'wedge3', wheel: 'outer' }, // Won't match
          },
          {
            id: 'cond2',
            type: 'score_threshold',
            parameters: { threshold: 40, operator: 'gte' }, // Will match
            operator: 'OR',
          },
        ],
      };
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });

    it('should handle NOT operator correctly', () => {
      const rule: Rule = {
        ...createValidRule(),
        conditions: [
          {
            id: 'cond1',
            type: 'specific_wedge',
            parameters: { wedgeId: 'wedge1', wheel: 'outer' }, // Will match
          },
          {
            id: 'cond2',
            type: 'specific_wedge',
            parameters: { wedgeId: 'wedge3', wheel: 'outer' }, // Won't match, so NOT will be true
            operator: 'NOT',
          },
        ],
      };
      
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].triggered).toBe(true);
    });
  });

  describe('Rule Priority and Evaluation Order', () => {
    it('should evaluate rules in priority order', () => {
      const lowPriorityRule = createValidRule('low', 10);
      const highPriorityRule = createValidRule('high', 90);
      
      ruleEngine.addRule(lowPriorityRule);
      ruleEngine.addRule(highPriorityRule);
      
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results[0].ruleId).toBe('high');
      expect(results[1].ruleId).toBe('low');
    });

    it('should stop evaluation after win/lose outcome', () => {
      const winRule = createValidRule('win', 90, true, 'win');
      const continueRule = createValidRule('continue', 50, true, 'continue');
      
      ruleEngine.addRule(winRule);
      ruleEngine.addRule(continueRule);
      
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].ruleId).toBe('win');
    });

    it('should continue evaluation after continue outcome', () => {
      const continueRule = createValidRule('continue', 90, true, 'continue');
      const winRule = createValidRule('win', 50, true, 'win');
      
      ruleEngine.addRule(continueRule);
      ruleEngine.addRule(winRule);
      
      const results = ruleEngine.evaluateRules(mockContext);
      
      expect(results).toHaveLength(2);
      expect(results[0].ruleId).toBe('continue');
      expect(results[1].ruleId).toBe('win');
    });
  });

  describe('Rule Validation', () => {
    it('should validate rule with missing ID', () => {
      const invalidRule: Rule = {
        ...createValidRule(),
        id: '',
      };
      
      const errors = ruleEngine.validateRule(invalidRule);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('id');
      expect(errors[0].severity).toBe('error');
    });

    it('should validate rule with missing name', () => {
      const invalidRule: Rule = {
        ...createValidRule(),
        name: '',
      };
      
      const errors = ruleEngine.validateRule(invalidRule);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
    });

    it('should validate rule with invalid priority', () => {
      const invalidRule: Rule = {
        ...createValidRule(),
        priority: 150,
      };
      
      const errors = ruleEngine.validateRule(invalidRule);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('priority');
    });

    it('should validate rule with no conditions', () => {
      const invalidRule: Rule = {
        ...createValidRule(),
        conditions: [],
      };
      
      const errors = ruleEngine.validateRule(invalidRule);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('conditions');
    });

    it('should validate condition parameters', () => {
      const invalidRule: Rule = {
        ...createValidRule(),
        conditions: [{
          id: 'cond1',
          type: 'specific_wedge',
          parameters: { wedgeId: '', wheel: 'invalid' }, // Invalid parameters
        }],
      };
      
      const errors = ruleEngine.validateRule(invalidRule);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect contradictory outcomes with same priority', () => {
      const winRule = createValidRule('win', 50, true, 'win');
      const loseRule = createValidRule('lose', 50, true, 'lose');
      
      // Make them have overlapping conditions
      winRule.conditions = [{
        id: 'cond1',
        type: 'specific_wedge',
        parameters: { wedgeId: 'wedge1', wheel: 'outer' },
      }];
      loseRule.conditions = [{
        id: 'cond2',
        type: 'specific_wedge',
        parameters: { wedgeId: 'wedge1', wheel: 'outer' },
      }];
      
      ruleEngine.addRule(winRule);
      ruleEngine.addRule(loseRule);
      
      const conflicts = ruleEngine.detectConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('contradictory_outcomes');
    });

    it('should not detect conflicts for different priorities', () => {
      const winRule = createValidRule('win', 60, true, 'win');
      const loseRule = createValidRule('lose', 50, true, 'lose');
      
      ruleEngine.addRule(winRule);
      ruleEngine.addRule(loseRule);
      
      const conflicts = ruleEngine.detectConflicts();
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rule engine', () => {
      const results = ruleEngine.evaluateRules(mockContext);
      expect(results).toHaveLength(0);
    });

    it('should handle unknown condition type gracefully', () => {
      const rule: Rule = {
        ...createValidRule(),
        conditions: [{
          id: 'cond1',
          type: 'unknown_type' as any,
          parameters: {},
        }],
      };
      
      // Should not throw during evaluation
      ruleEngine.addRule(rule);
      const results = ruleEngine.evaluateRules(mockContext);
      expect(results[0].triggered).toBe(false);
    });

    it('should clear all rules', () => {
      ruleEngine.addRule(createValidRule('rule1'));
      ruleEngine.addRule(createValidRule('rule2'));
      
      ruleEngine.clearRules();
      
      expect(ruleEngine.getAllRules()).toHaveLength(0);
    });
  });

  // Helper functions
  function createValidRule(
    id: string = 'test-rule',
    priority: number = 50,
    isActive: boolean = true,
    outcome: 'win' | 'lose' | 'continue' = 'continue',
  ): Rule {
    return {
      id,
      name: `Test Rule ${id}`,
      description: 'A test rule',
      isActive,
      priority,
      conditions: [{
        id: 'cond1',
        type: 'specific_wedge',
        parameters: { wedgeId: 'wedge1', wheel: 'outer' },
      }],
      outcome,
      points: outcome === 'win' ? 10 : outcome === 'lose' ? -5 : 0,
      message: `Rule ${id} triggered`,
      createdAt: '2023-01-01T00:00:00Z',
      modifiedAt: '2023-01-01T00:00:00Z',
    };
  }

  function createRuleWithCondition(condition: RuleCondition): Rule {
    return {
      ...createValidRule(),
      conditions: [condition],
    };
  }
});