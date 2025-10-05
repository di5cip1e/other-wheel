/**
 * Rule system for defining win/loss conditions in the wheel game
 */

export type RuleConditionType = 
  | 'specific_wedge'      // Win if specific wedge is selected
  | 'wedge_combination'   // Win if specific combination of wedges selected
  | 'score_threshold'     // Win if score reaches threshold
  | 'consecutive_wins'    // Win if player wins N times in a row
  | 'avoid_wedge';        // Lose if specific wedge is selected

export type RuleOperator = 'AND' | 'OR' | 'NOT';

export interface RuleCondition {
  id: string;
  type: RuleConditionType;
  parameters: Record<string, any>;
  operator?: RuleOperator;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number; // Higher priority rules evaluated first
  conditions: RuleCondition[];
  outcome: 'win' | 'lose' | 'continue';
  points?: number; // Points awarded/deducted when rule triggers
  message?: string; // Message to display when rule triggers
  createdAt: string;
  modifiedAt: string;
}

export interface RuleEvaluationContext {
  playerId: string;
  currentSpin: {
    outerWedgeId: string;
    innerWedgeId: string;
    outerWedgeLabel: string;
    innerWedgeLabel: string;
  };
  playerScore: number;
  gameHistory: RuleSpinResult[];
  roundNumber: number;
}

export interface RuleSpinResult {
  playerId: string;
  outerWedgeId: string;
  innerWedgeId: string;
  points: number;
  timestamp: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  outcome?: 'win' | 'lose' | 'continue';
  points?: number;
  message?: string;
  priority: number;
}

export interface RuleValidationError {
  ruleId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface RuleConflict {
  rule1Id: string;
  rule2Id: string;
  conflictType: 'contradictory_outcomes' | 'overlapping_conditions' | 'priority_conflict';
  description: string;
  severity: 'error' | 'warning';
}