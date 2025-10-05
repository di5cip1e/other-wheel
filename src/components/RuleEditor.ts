import { Rule, RuleCondition, RuleConditionType } from '../models/Rule';
import { RuleEngine } from '../engines/RuleEngine';
import { Wheel } from '../models';

/**
 * RuleEditor provides UI for creating and editing game rules
 */
export class RuleEditor {
  private container: HTMLElement;
  private ruleEngine: RuleEngine;
  private wheels: Wheel[];
  private currentRule: Rule | null = null;
  private onRuleChange?: (rule: Rule) => void;
  private onRuleDelete?: (ruleId: string) => void;

  constructor(container: HTMLElement, ruleEngine: RuleEngine, wheels: Wheel[]) {
    this.container = container;
    this.ruleEngine = ruleEngine;
    this.wheels = wheels;
    this.render();
  }

  /**
   * Set callback for rule changes
   */
  setOnRuleChange(callback: (rule: Rule) => void): void {
    this.onRuleChange = callback;
  }

  /**
   * Set callback for rule deletion
   */
  setOnRuleDelete(callback: (ruleId: string) => void): void {
    this.onRuleDelete = callback;
  }

  /**
   * Load a rule for editing
   */
  loadRule(rule: Rule): void {
    this.currentRule = { ...rule };
    this.render();
  }

  /**
   * Create a new rule
   */
  createNewRule(): void {
    this.currentRule = {
      id: `rule_${Date.now()}`,
      name: 'New Rule',
      description: '',
      isActive: true,
      priority: 50,
      conditions: [],
      outcome: 'continue',
      points: 0,
      message: '',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    this.render();
  }

  /**
   * Render the rule editor interface
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="rule-editor">
        <div class="rule-editor-header">
          <h3>Rule Editor</h3>
          <div class="rule-editor-actions">
            <button class="btn btn-primary" id="new-rule-btn">New Rule</button>
            <button class="btn btn-secondary" id="save-rule-btn" ${!this.currentRule ? 'disabled' : ''}>Save Rule</button>
            <button class="btn btn-danger" id="delete-rule-btn" ${!this.currentRule ? 'disabled' : ''}>Delete Rule</button>
          </div>
        </div>

        <div class="rule-list">
          <h4>Existing Rules</h4>
          <div id="rules-list-container">
            ${this.renderRulesList()}
          </div>
        </div>

        ${this.currentRule ? this.renderRuleForm() : '<div class="no-rule-selected">Select a rule to edit or create a new one</div>'}
        
        <div class="rule-validation">
          <div id="validation-errors"></div>
          <div id="rule-conflicts"></div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.validateCurrentRule();
    this.checkForConflicts();
  }

  /**
   * Render the list of existing rules
   */
  private renderRulesList(): string {
    const rules = this.ruleEngine.getAllRules();
    
    if (rules.length === 0) {
      return '<div class="no-rules">No rules defined</div>';
    }

    return rules.map(rule => `
      <div class="rule-item ${rule.id === this.currentRule?.id ? 'active' : ''}" data-rule-id="${rule.id}">
        <div class="rule-item-header">
          <span class="rule-name">${rule.name}</span>
          <span class="rule-priority">Priority: ${rule.priority}</span>
          <span class="rule-status ${rule.isActive ? 'active' : 'inactive'}">${rule.isActive ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="rule-description">${rule.description || 'No description'}</div>
        <div class="rule-outcome">Outcome: ${rule.outcome} ${rule.points ? `(${rule.points} points)` : ''}</div>
      </div>
    `).join('');
  }

  /**
   * Render the rule editing form
   */
  private renderRuleForm(): string {
    if (!this.currentRule) {return '';}

    return `
      <div class="rule-form">
        <h4>Edit Rule: ${this.currentRule.name}</h4>
        
        <div class="form-section">
          <h5>Basic Information</h5>
          <div class="form-group">
            <label for="rule-name">Name:</label>
            <input type="text" id="rule-name" value="${this.currentRule.name}" />
          </div>
          
          <div class="form-group">
            <label for="rule-description">Description:</label>
            <textarea id="rule-description">${this.currentRule.description}</textarea>
          </div>
          
          <div class="form-group">
            <label for="rule-priority">Priority (0-100):</label>
            <input type="number" id="rule-priority" min="0" max="100" value="${this.currentRule.priority}" />
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="rule-active" ${this.currentRule.isActive ? 'checked' : ''} />
              Active
            </label>
          </div>
        </div>

        <div class="form-section">
          <h5>Outcome</h5>
          <div class="form-group">
            <label for="rule-outcome">When conditions are met:</label>
            <select id="rule-outcome">
              <option value="continue" ${this.currentRule.outcome === 'continue' ? 'selected' : ''}>Continue Game</option>
              <option value="win" ${this.currentRule.outcome === 'win' ? 'selected' : ''}>Player Wins</option>
              <option value="lose" ${this.currentRule.outcome === 'lose' ? 'selected' : ''}>Player Loses</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="rule-points">Points awarded/deducted:</label>
            <input type="number" id="rule-points" value="${this.currentRule.points || 0}" />
          </div>
          
          <div class="form-group">
            <label for="rule-message">Message to display:</label>
            <input type="text" id="rule-message" value="${this.currentRule.message || ''}" placeholder="Optional message" />
          </div>
        </div>

        <div class="form-section">
          <h5>Conditions</h5>
          <div class="conditions-container">
            ${this.renderConditions()}
          </div>
          <button class="btn btn-secondary" id="add-condition-btn">Add Condition</button>
        </div>
      </div>
    `;
  }

  /**
   * Render the conditions list
   */
  private renderConditions(): string {
    if (!this.currentRule || this.currentRule.conditions.length === 0) {
      return '<div class="no-conditions">No conditions defined. Add a condition to get started.</div>';
    }

    return this.currentRule.conditions.map((condition, index) => `
      <div class="condition-item" data-condition-index="${index}">
        <div class="condition-header">
          <span class="condition-type">${this.getConditionTypeLabel(condition.type)}</span>
          <button class="btn btn-small btn-danger remove-condition-btn" data-condition-index="${index}">Remove</button>
        </div>
        <div class="condition-details">
          ${this.renderConditionDetails(condition, index)}
        </div>
        ${index > 0 ? this.renderConditionOperator(condition, index) : ''}
      </div>
    `).join('');
  }

  /**
   * Render condition operator selector
   */
  private renderConditionOperator(condition: RuleCondition, index: number): string {
    return `
      <div class="condition-operator">
        <label>Combine with previous condition using:</label>
        <select class="condition-operator-select" data-condition-index="${index}">
          <option value="AND" ${condition.operator === 'AND' ? 'selected' : ''}>AND</option>
          <option value="OR" ${condition.operator === 'OR' ? 'selected' : ''}>OR</option>
          <option value="NOT" ${condition.operator === 'NOT' ? 'selected' : ''}>NOT</option>
        </select>
      </div>
    `;
  }

  /**
   * Render condition-specific details
   */
  private renderConditionDetails(condition: RuleCondition, index: number): string {
    switch (condition.type) {
    case 'specific_wedge':
    case 'avoid_wedge':
      return this.renderWedgeCondition(condition, index);
    case 'wedge_combination':
      return this.renderCombinationCondition(condition, index);
    case 'score_threshold':
      return this.renderScoreCondition(condition, index);
    case 'consecutive_wins':
      return this.renderConsecutiveCondition(condition, index);
    default:
      return '<div>Unknown condition type</div>';
    }
  }

  /**
   * Render wedge-specific condition
   */
  private renderWedgeCondition(condition: RuleCondition, index: number): string {
    return `
      <div class="condition-params">
        <div class="form-group">
          <label>Wheel:</label>
          <select class="condition-param" data-condition-index="${index}" data-param="wheel">
            <option value="outer" ${condition.parameters['wheel'] === 'outer' ? 'selected' : ''}>Outer Wheel</option>
            <option value="inner" ${condition.parameters['wheel'] === 'inner' ? 'selected' : ''}>Inner Wheel</option>
            <option value="both" ${condition.parameters['wheel'] === 'both' ? 'selected' : ''}>Either Wheel</option>
          </select>
        </div>
        <div class="form-group">
          <label>Wedge:</label>
          <select class="condition-param" data-condition-index="${index}" data-param="wedgeId">
            <option value="">Select a wedge...</option>
            ${this.renderWedgeOptions(condition.parameters['wedgeId'])}
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Render combination condition
   */
  private renderCombinationCondition(condition: RuleCondition, index: number): string {
    return `
      <div class="condition-params">
        <div class="form-group">
          <label>Outer Wheel Wedge:</label>
          <select class="condition-param" data-condition-index="${index}" data-param="outerWedgeId">
            <option value="">Select outer wedge...</option>
            ${this.renderWedgeOptions(condition.parameters['outerWedgeId'])}
          </select>
        </div>
        <div class="form-group">
          <label>Inner Wheel Wedge:</label>
          <select class="condition-param" data-condition-index="${index}" data-param="innerWedgeId">
            <option value="">Select inner wedge...</option>
            ${this.renderWedgeOptions(condition.parameters['innerWedgeId'])}
          </select>
        </div>
        <div class="form-group">
          <label>Match Type:</label>
          <select class="condition-param" data-condition-index="${index}" data-param="matchType">
            <option value="exact" ${condition.parameters['matchType'] === 'exact' ? 'selected' : ''}>Exact Match (Both)</option>
            <option value="any" ${condition.parameters['matchType'] === 'any' ? 'selected' : ''}>Any Match (Either)</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Render score threshold condition
   */
  private renderScoreCondition(condition: RuleCondition, index: number): string {
    return `
      <div class="condition-params">
        <div class="form-group">
          <label>Score:</label>
          <select class="condition-param" data-condition-index="${index}" data-param="operator">
            <option value="gte" ${condition.parameters['operator'] === 'gte' ? 'selected' : ''}>Greater than or equal to</option>
            <option value="lte" ${condition.parameters['operator'] === 'lte' ? 'selected' : ''}>Less than or equal to</option>
            <option value="eq" ${condition.parameters['operator'] === 'eq' ? 'selected' : ''}>Equal to</option>
          </select>
          <input type="number" class="condition-param" data-condition-index="${index}" data-param="threshold" 
                 value="${condition.parameters['threshold'] || 0}" />
        </div>
      </div>
    `;
  }

  /**
   * Render consecutive wins condition
   */
  private renderConsecutiveCondition(condition: RuleCondition, index: number): string {
    return `
      <div class="condition-params">
        <div class="form-group">
          <label>Number of consecutive wins:</label>
          <input type="number" min="1" class="condition-param" data-condition-index="${index}" data-param="count" 
                 value="${condition.parameters['count'] || 1}" />
        </div>
      </div>
    `;
  }

  /**
   * Render wedge options for select dropdowns
   */
  private renderWedgeOptions(selectedWedgeId?: string): string {
    let options = '';
    
    this.wheels.forEach(wheel => {
      wheel.wedges.forEach(wedge => {
        const selected = wedge.id === selectedWedgeId ? 'selected' : '';
        options += `<option value="${wedge.id}" ${selected}>${wheel.label} - ${wedge.label}</option>`;
      });
    });
    
    return options;
  }

  /**
   * Get human-readable label for condition type
   */
  private getConditionTypeLabel(type: RuleConditionType): string {
    switch (type) {
    case 'specific_wedge': return 'Specific Wedge';
    case 'wedge_combination': return 'Wedge Combination';
    case 'score_threshold': return 'Score Threshold';
    case 'consecutive_wins': return 'Consecutive Wins';
    case 'avoid_wedge': return 'Avoid Wedge';
    default: return type;
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // New rule button
    const newRuleBtn = this.container.querySelector('#new-rule-btn');
    newRuleBtn?.addEventListener('click', () => this.createNewRule());

    // Save rule button
    const saveRuleBtn = this.container.querySelector('#save-rule-btn');
    saveRuleBtn?.addEventListener('click', () => this.saveCurrentRule());

    // Delete rule button
    const deleteRuleBtn = this.container.querySelector('#delete-rule-btn');
    deleteRuleBtn?.addEventListener('click', () => this.deleteCurrentRule());

    // Rule list items
    this.container.querySelectorAll('.rule-item').forEach(item => {
      item.addEventListener('click', () => {
        const ruleId = item.getAttribute('data-rule-id');
        if (ruleId) {
          const rule = this.ruleEngine.getRule(ruleId);
          if (rule) {
            this.loadRule(rule);
          }
        }
      });
    });

    // Form inputs
    this.attachFormListeners();

    // Add condition button
    const addConditionBtn = this.container.querySelector('#add-condition-btn');
    addConditionBtn?.addEventListener('click', () => this.showAddConditionDialog());

    // Remove condition buttons
    this.container.querySelectorAll('.remove-condition-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-condition-index') || '0');
        this.removeCondition(index);
      });
    });
  }

  /**
   * Attach form field listeners
   */
  private attachFormListeners(): void {
    if (!this.currentRule) {return;}

    // Basic form fields
    const nameInput = this.container.querySelector('#rule-name') as HTMLInputElement;
    nameInput?.addEventListener('input', (e) => {
      if (this.currentRule) {
        this.currentRule.name = (e.target as HTMLInputElement).value;
        this.currentRule.modifiedAt = new Date().toISOString();
      }
    });

    const descInput = this.container.querySelector('#rule-description') as HTMLTextAreaElement;
    descInput?.addEventListener('input', (e) => {
      if (this.currentRule) {
        this.currentRule.description = (e.target as HTMLTextAreaElement).value;
        this.currentRule.modifiedAt = new Date().toISOString();
      }
    });

    const priorityInput = this.container.querySelector('#rule-priority') as HTMLInputElement;
    priorityInput?.addEventListener('input', (e) => {
      if (this.currentRule) {
        this.currentRule.priority = parseInt((e.target as HTMLInputElement).value) || 0;
        this.currentRule.modifiedAt = new Date().toISOString();
      }
    });

    const activeInput = this.container.querySelector('#rule-active') as HTMLInputElement;
    activeInput?.addEventListener('change', (e) => {
      if (this.currentRule) {
        this.currentRule.isActive = (e.target as HTMLInputElement).checked;
        this.currentRule.modifiedAt = new Date().toISOString();
      }
    });

    const outcomeSelect = this.container.querySelector('#rule-outcome') as HTMLSelectElement;
    outcomeSelect?.addEventListener('change', (e) => {
      if (this.currentRule) {
        this.currentRule.outcome = (e.target as HTMLSelectElement).value as 'win' | 'lose' | 'continue';
        this.currentRule.modifiedAt = new Date().toISOString();
      }
    });

    const pointsInput = this.container.querySelector('#rule-points') as HTMLInputElement;
    pointsInput?.addEventListener('input', (e) => {
      if (this.currentRule) {
        this.currentRule.points = parseInt((e.target as HTMLInputElement).value) || 0;
        this.currentRule.modifiedAt = new Date().toISOString();
      }
    });

    const messageInput = this.container.querySelector('#rule-message') as HTMLInputElement;
    messageInput?.addEventListener('input', (e) => {
      if (this.currentRule) {
        this.currentRule.message = (e.target as HTMLInputElement).value;
        this.currentRule.modifiedAt = new Date().toISOString();
      }
    });

    // Condition parameter inputs
    this.container.querySelectorAll('.condition-param').forEach(input => {
      input.addEventListener('change', (e) => this.updateConditionParameter(e));
    });

    // Condition operator selects
    this.container.querySelectorAll('.condition-operator-select').forEach(select => {
      select.addEventListener('change', (e) => this.updateConditionOperator(e));
    });
  }

  /**
   * Update condition parameter
   */
  private updateConditionParameter(event: Event): void {
    if (!this.currentRule) {return;}

    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const conditionIndex = parseInt(target.getAttribute('data-condition-index') || '0');
    const paramName = target.getAttribute('data-param');
    
    if (conditionIndex < this.currentRule.conditions.length && paramName) {
      const condition = this.currentRule.conditions[conditionIndex];
      if (!condition) {return;}
      
      let value: any = target.value;
      
      // Convert numeric values
      if (target.type === 'number') {
        value = parseInt(value) || 0;
      }
      
      condition.parameters[paramName] = value;
      this.currentRule.modifiedAt = new Date().toISOString();
      this.validateCurrentRule();
    }
  }

  /**
   * Update condition operator
   */
  private updateConditionOperator(event: Event): void {
    if (!this.currentRule) {return;}

    const target = event.target as HTMLSelectElement;
    const conditionIndex = parseInt(target.getAttribute('data-condition-index') || '0');
    
    if (conditionIndex < this.currentRule.conditions.length) {
      const condition = this.currentRule.conditions[conditionIndex];
      if (condition) {
        condition.operator = target.value as 'AND' | 'OR' | 'NOT';
      }
      this.currentRule.modifiedAt = new Date().toISOString();
    }
  }

  /**
   * Show dialog to add new condition
   */
  private showAddConditionDialog(): void {
    const conditionTypes: { value: RuleConditionType; label: string; description: string }[] = [
      { value: 'specific_wedge', label: 'Specific Wedge', description: 'Trigger when a specific wedge is selected' },
      { value: 'wedge_combination', label: 'Wedge Combination', description: 'Trigger when specific combination of wedges is selected' },
      { value: 'score_threshold', label: 'Score Threshold', description: 'Trigger when player score reaches a threshold' },
      { value: 'consecutive_wins', label: 'Consecutive Wins', description: 'Trigger after consecutive winning spins' },
      { value: 'avoid_wedge', label: 'Avoid Wedge', description: 'Trigger when player should avoid a specific wedge' },
    ];

    const dialog = document.createElement('div');
    dialog.className = 'condition-type-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay">
        <div class="dialog-content">
          <h4>Add Condition</h4>
          <p>Select the type of condition to add:</p>
          <div class="condition-types">
            ${conditionTypes.map(type => `
              <div class="condition-type-option" data-type="${type.value}">
                <h5>${type.label}</h5>
                <p>${type.description}</p>
              </div>
            `).join('')}
          </div>
          <div class="dialog-actions">
            <button class="btn btn-secondary" id="cancel-condition">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    dialog.querySelectorAll('.condition-type-option').forEach(option => {
      option.addEventListener('click', () => {
        const type = option.getAttribute('data-type') as RuleConditionType;
        this.addCondition(type);
        document.body.removeChild(dialog);
      });
    });

    dialog.querySelector('#cancel-condition')?.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  }

  /**
   * Add a new condition
   */
  private addCondition(type: RuleConditionType): void {
    if (!this.currentRule) {return;}

    const newCondition: RuleCondition = {
      id: `condition_${Date.now()}`,
      type,
      parameters: this.getDefaultParameters(type),
    };
    
    if (this.currentRule.conditions.length > 0) {
      newCondition.operator = 'AND';
    }

    this.currentRule.conditions.push(newCondition);
    this.currentRule.modifiedAt = new Date().toISOString();
    this.render();
  }

  /**
   * Get default parameters for condition type
   */
  private getDefaultParameters(type: RuleConditionType): Record<string, any> {
    switch (type) {
    case 'specific_wedge':
    case 'avoid_wedge':
      return { wedgeId: '', wheel: 'outer' };
    case 'wedge_combination':
      return { outerWedgeId: '', innerWedgeId: '', matchType: 'exact' };
    case 'score_threshold':
      return { threshold: 100, operator: 'gte' };
    case 'consecutive_wins':
      return { count: 3 };
    default:
      return {};
    }
  }

  /**
   * Remove a condition
   */
  private removeCondition(index: number): void {
    if (!this.currentRule || index < 0 || index >= this.currentRule.conditions.length) {return;}

    this.currentRule.conditions.splice(index, 1);
    this.currentRule.modifiedAt = new Date().toISOString();
    this.render();
  }

  /**
   * Save the current rule
   */
  private saveCurrentRule(): void {
    if (!this.currentRule) {return;}

    try {
      if (this.ruleEngine.getRule(this.currentRule.id)) {
        this.ruleEngine.updateRule(this.currentRule);
      } else {
        this.ruleEngine.addRule(this.currentRule);
      }
      
      this.onRuleChange?.(this.currentRule);
      this.render();
    } catch (error) {
      alert(`Failed to save rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete the current rule
   */
  private deleteCurrentRule(): void {
    if (!this.currentRule) {return;}

    if (confirm(`Are you sure you want to delete the rule "${this.currentRule.name}"?`)) {
      this.ruleEngine.removeRule(this.currentRule.id);
      this.onRuleDelete?.(this.currentRule.id);
      this.currentRule = null;
      this.render();
    }
  }

  /**
   * Validate the current rule and display errors
   */
  private validateCurrentRule(): void {
    const errorsContainer = this.container.querySelector('#validation-errors');
    if (!errorsContainer || !this.currentRule) {return;}

    const errors = this.ruleEngine.validateRule(this.currentRule);
    
    if (errors.length === 0) {
      errorsContainer.innerHTML = '<div class="validation-success">✓ Rule is valid</div>';
    } else {
      errorsContainer.innerHTML = `
        <div class="validation-errors">
          <h5>Validation Errors:</h5>
          ${errors.map(error => `
            <div class="validation-error ${error.severity}">
              <strong>${error.field}:</strong> ${error.message}
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  /**
   * Check for rule conflicts and display them
   */
  private checkForConflicts(): void {
    const conflictsContainer = this.container.querySelector('#rule-conflicts');
    if (!conflictsContainer) {return;}

    const conflicts = this.ruleEngine.detectConflicts();
    
    if (conflicts.length === 0) {
      conflictsContainer.innerHTML = '';
    } else {
      conflictsContainer.innerHTML = `
        <div class="rule-conflicts">
          <h5>Rule Conflicts:</h5>
          ${conflicts.map(conflict => `
            <div class="rule-conflict ${conflict.severity}">
              <strong>${conflict.conflictType}:</strong> ${conflict.description}
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  /**
   * Update wheels data
   */
  updateWheels(wheels: Wheel[]): void {
    this.wheels = wheels;
    if (this.currentRule) {
      this.render();
    }
  }
}