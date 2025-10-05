import { 
  Rule, 
  RuleCondition, 
  RuleEvaluationContext, 
  RuleEvaluationResult, 
  RuleValidationError, 
  RuleConflict,
} from '../models/Rule';

/**
 * RuleEngine evaluates game rules and determines win/loss conditions
 */
export class RuleEngine {
  private rules: Map<string, Rule> = new Map();

  /**
   * Add a rule to the engine
   */
  addRule(rule: Rule): void {
    const validationErrors = this.validateRule(rule);
    if (validationErrors.length > 0) {
      throw new Error(`Rule validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }
    
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a rule from the engine
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Update an existing rule
   */
  updateRule(rule: Rule): void {
    if (!this.rules.has(rule.id)) {
      throw new Error(`Rule with id ${rule.id} not found`);
    }
    
    const validationErrors = this.validateRule(rule);
    if (validationErrors.length > 0) {
      throw new Error(`Rule validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }
    
    this.rules.set(rule.id, rule);
  }

  /**
   * Get all rules
   */
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get active rules sorted by priority
   */
  getActiveRules(): Rule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate all active rules against the current context
   */
  evaluateRules(context: RuleEvaluationContext): RuleEvaluationResult[] {
    const activeRules = this.getActiveRules();
    const results: RuleEvaluationResult[] = [];

    for (const rule of activeRules) {
      const result = this.evaluateRule(rule, context);
      results.push(result);
      
      // If a rule triggers with win/lose outcome, stop evaluating lower priority rules
      if (result.triggered && result.outcome !== 'continue') {
        break;
      }
    }

    return results;
  }

  /**
   * Evaluate a single rule against the context
   */
  private evaluateRule(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
    const conditionResults = rule.conditions.map(condition => 
      this.evaluateCondition(condition, context),
    );

    // Combine condition results based on operators
    const triggered = this.combineConditionResults(conditionResults, rule.conditions);

    const result: RuleEvaluationResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered,
      priority: rule.priority,
    };

    if (triggered) {
      result.outcome = rule.outcome;
      if (rule.points !== undefined) {
        result.points = rule.points;
      }
      if (rule.message !== undefined) {
        result.message = rule.message;
      }
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    switch (condition.type) {
    case 'specific_wedge':
      return this.evaluateSpecificWedge(condition, context);
      
    case 'wedge_combination':
      return this.evaluateWedgeCombination(condition, context);
      
    case 'score_threshold':
      return this.evaluateScoreThreshold(condition, context);
      
    case 'consecutive_wins':
      return this.evaluateConsecutiveWins(condition, context);
      
    case 'avoid_wedge':
      return this.evaluateAvoidWedge(condition, context);
      
    default:
      console.warn(`Unknown condition type: ${condition.type}`);
      return false;
    }
  }

  /**
   * Evaluate specific wedge condition
   */
  private evaluateSpecificWedge(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    const { wedgeId, wheel } = condition.parameters;
    
    if (wheel === 'outer' || wheel === 'both') {
      if (context.currentSpin.outerWedgeId === wedgeId) {
        return true;
      }
    }
    
    if (wheel === 'inner' || wheel === 'both') {
      if (context.currentSpin.innerWedgeId === wedgeId) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Evaluate wedge combination condition
   */
  private evaluateWedgeCombination(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    const { outerWedgeId, innerWedgeId, matchType } = condition.parameters;
    
    if (matchType === 'exact') {
      return context.currentSpin.outerWedgeId === outerWedgeId && 
             context.currentSpin.innerWedgeId === innerWedgeId;
    }
    
    if (matchType === 'any') {
      return context.currentSpin.outerWedgeId === outerWedgeId || 
             context.currentSpin.innerWedgeId === innerWedgeId;
    }
    
    return false;
  }

  /**
   * Evaluate score threshold condition
   */
  private evaluateScoreThreshold(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    const { threshold, operator } = condition.parameters;
    
    switch (operator) {
    case 'gte':
      return context.playerScore >= threshold;
    case 'lte':
      return context.playerScore <= threshold;
    case 'eq':
      return context.playerScore === threshold;
    default:
      return false;
    }
  }

  /**
   * Evaluate consecutive wins condition
   */
  private evaluateConsecutiveWins(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    const { count } = condition.parameters;
    const playerHistory = context.gameHistory
      .filter(result => result.playerId === context.playerId)
      .slice(-count);
    
    if (playerHistory.length < count) {
      return false;
    }
    
    return playerHistory.every(result => result.points > 0);
  }

  /**
   * Evaluate avoid wedge condition
   */
  private evaluateAvoidWedge(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    const { wedgeId, wheel } = condition.parameters;
    
    if (wheel === 'outer' || wheel === 'both') {
      if (context.currentSpin.outerWedgeId === wedgeId) {
        return true;
      }
    }
    
    if (wheel === 'inner' || wheel === 'both') {
      if (context.currentSpin.innerWedgeId === wedgeId) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Combine condition results based on operators
   */
  private combineConditionResults(results: boolean[], conditions: RuleCondition[]): boolean {
    if (results.length === 0) {return false;}
    if (results.length === 1) {return results[0] || false;}

    // Default to AND operation if no operators specified
    let combinedResult = results[0] || false;
    
    for (let i = 1; i < results.length; i++) {
      const condition = conditions[i];
      if (!condition) {continue;}
      
      const operator = condition.operator || 'AND';
      const currentResult = results[i] || false;
      
      switch (operator) {
      case 'AND':
        combinedResult = combinedResult && currentResult;
        break;
      case 'OR':
        combinedResult = combinedResult || currentResult;
        break;
      case 'NOT':
        combinedResult = combinedResult && !currentResult;
        break;
      }
    }
    
    return combinedResult;
  }

  /**
   * Validate a rule for correctness
   */
  validateRule(rule: Rule): RuleValidationError[] {
    const errors: RuleValidationError[] = [];

    // Basic validation
    if (!rule.id || rule.id.trim() === '') {
      errors.push({
        ruleId: rule.id,
        field: 'id',
        message: 'Rule ID is required',
        severity: 'error',
      });
    }

    if (!rule.name || rule.name.trim() === '') {
      errors.push({
        ruleId: rule.id,
        field: 'name',
        message: 'Rule name is required',
        severity: 'error',
      });
    }

    if (rule.priority < 0 || rule.priority > 100) {
      errors.push({
        ruleId: rule.id,
        field: 'priority',
        message: 'Priority must be between 0 and 100',
        severity: 'error',
      });
    }

    if (rule.conditions.length === 0) {
      errors.push({
        ruleId: rule.id,
        field: 'conditions',
        message: 'Rule must have at least one condition',
        severity: 'error',
      });
    }

    // Validate each condition
    rule.conditions.forEach((condition, index) => {
      const conditionErrors = this.validateCondition(condition, rule.id, index);
      errors.push(...conditionErrors);
    });

    return errors;
  }

  /**
   * Validate a single condition
   */
  private validateCondition(condition: RuleCondition, ruleId: string, index: number): RuleValidationError[] {
    const errors: RuleValidationError[] = [];
    const fieldPrefix = `conditions[${index}]`;

    if (!condition.id || condition.id.trim() === '') {
      errors.push({
        ruleId,
        field: `${fieldPrefix}.id`,
        message: 'Condition ID is required',
        severity: 'error',
      });
    }

    // Validate condition-specific parameters
    switch (condition.type) {
    case 'specific_wedge':
    case 'avoid_wedge':
      if (!condition.parameters['wedgeId']) {
        errors.push({
          ruleId,
          field: `${fieldPrefix}.parameters.wedgeId`,
          message: 'Wedge ID is required for this condition type',
          severity: 'error',
        });
      }
      if (!['outer', 'inner', 'both'].includes(condition.parameters['wheel'])) {
        errors.push({
          ruleId,
          field: `${fieldPrefix}.parameters.wheel`,
          message: 'Wheel must be "outer", "inner", or "both"',
          severity: 'error',
        });
      }
      break;

    case 'wedge_combination':
      if (!condition.parameters['outerWedgeId'] || !condition.parameters['innerWedgeId']) {
        errors.push({
          ruleId,
          field: `${fieldPrefix}.parameters`,
          message: 'Both outer and inner wedge IDs are required',
          severity: 'error',
        });
      }
      if (!['exact', 'any'].includes(condition.parameters['matchType'])) {
        errors.push({
          ruleId,
          field: `${fieldPrefix}.parameters.matchType`,
          message: 'Match type must be "exact" or "any"',
          severity: 'error',
        });
      }
      break;

    case 'score_threshold':
      if (typeof condition.parameters['threshold'] !== 'number') {
        errors.push({
          ruleId,
          field: `${fieldPrefix}.parameters.threshold`,
          message: 'Threshold must be a number',
          severity: 'error',
        });
      }
      if (!['gte', 'lte', 'eq'].includes(condition.parameters['operator'])) {
        errors.push({
          ruleId,
          field: `${fieldPrefix}.parameters.operator`,
          message: 'Operator must be "gte", "lte", or "eq"',
          severity: 'error',
        });
      }
      break;

    case 'consecutive_wins':
      if (!Number.isInteger(condition.parameters['count']) || condition.parameters['count'] < 1) {
        errors.push({
          ruleId,
          field: `${fieldPrefix}.parameters.count`,
          message: 'Count must be a positive integer',
          severity: 'error',
        });
      }
      break;
    }

    return errors;
  }

  /**
   * Detect conflicts between rules
   */
  detectConflicts(): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    const rules = Array.from(this.rules.values());

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];
        
        if (!rule1 || !rule2) {continue;}
        
        // Check for contradictory outcomes with same priority
        if (rule1.priority === rule2.priority && 
            rule1.outcome !== rule2.outcome && 
            this.rulesHaveOverlappingConditions(rule1, rule2)) {
          conflicts.push({
            rule1Id: rule1.id,
            rule2Id: rule2.id,
            conflictType: 'contradictory_outcomes',
            description: `Rules have same priority but contradictory outcomes: ${rule1.outcome} vs ${rule2.outcome}`,
            severity: 'error',
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two rules have overlapping conditions
   */
  private rulesHaveOverlappingConditions(rule1: Rule, rule2: Rule): boolean {
    // Simplified overlap detection - could be made more sophisticated
    for (const condition1 of rule1.conditions) {
      for (const condition2 of rule2.conditions) {
        if (condition1.type === condition2.type) {
          // Basic parameter comparison
          const params1 = JSON.stringify(condition1.parameters);
          const params2 = JSON.stringify(condition2.parameters);
          if (params1 === params2) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.clear();
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }
}