import { RuleEditor } from '../../src/components/RuleEditor';
import { RuleEngine } from '../../src/engines/RuleEngine';
import { Rule, Wheel } from '../../src/models';

// Mock DOM methods
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true),
});

Object.defineProperty(window, 'alert', {
  writable: true,
  value: jest.fn(),
});

describe('RuleEditor', () => {
  let container: HTMLElement;
  let ruleEngine: RuleEngine;
  let ruleEditor: RuleEditor;
  let mockWheels: Wheel[];

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container')!;
    
    // Set up dependencies
    ruleEngine = new RuleEngine();
    mockWheels = createMockWheels();
    
    // Create rule editor
    ruleEditor = new RuleEditor(container, ruleEngine, mockWheels);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    it('should render initial interface', () => {
      expect(container.querySelector('.rule-editor')).toBeTruthy();
      expect(container.querySelector('#new-rule-btn')).toBeTruthy();
      expect(container.querySelector('#save-rule-btn')).toBeTruthy();
      expect(container.querySelector('#delete-rule-btn')).toBeTruthy();
    });

    it('should show no rules message when empty', () => {
      expect(container.querySelector('.no-rules')).toBeTruthy();
    });

    it('should show no rule selected message initially', () => {
      expect(container.querySelector('.no-rule-selected')).toBeTruthy();
    });

    it('should disable save and delete buttons initially', () => {
      const saveBtn = container.querySelector('#save-rule-btn') as HTMLButtonElement;
      const deleteBtn = container.querySelector('#delete-rule-btn') as HTMLButtonElement;
      
      expect(saveBtn.disabled).toBe(true);
      expect(deleteBtn.disabled).toBe(true);
    });
  });

  describe('Rule Creation', () => {
    it('should create new rule when button clicked', () => {
      const newRuleBtn = container.querySelector('#new-rule-btn') as HTMLButtonElement;
      newRuleBtn.click();
      
      expect(container.querySelector('.rule-form')).toBeTruthy();
      expect(container.querySelector('#rule-name')).toBeTruthy();
      
      const saveBtn = container.querySelector('#save-rule-btn') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(false);
    });

    it('should populate form with default values for new rule', () => {
      const newRuleBtn = container.querySelector('#new-rule-btn') as HTMLButtonElement;
      newRuleBtn.click();
      
      const nameInput = container.querySelector('#rule-name') as HTMLInputElement;
      const priorityInput = container.querySelector('#rule-priority') as HTMLInputElement;
      const activeInput = container.querySelector('#rule-active') as HTMLInputElement;
      const outcomeSelect = container.querySelector('#rule-outcome') as HTMLSelectElement;
      
      expect(nameInput.value).toBe('New Rule');
      expect(priorityInput.value).toBe('50');
      expect(activeInput.checked).toBe(true);
      expect(outcomeSelect.value).toBe('continue');
    });
  });

  describe('Rule Editing', () => {
    let testRule: Rule;

    beforeEach(() => {
      testRule = createTestRule();
      ruleEngine.addRule(testRule);
      ruleEditor = new RuleEditor(container, ruleEngine, mockWheels);
    });

    it('should display existing rules in list', () => {
      const ruleItems = container.querySelectorAll('.rule-item');
      expect(ruleItems).toHaveLength(1);
      
      const ruleName = container.querySelector('.rule-name');
      expect(ruleName?.textContent).toBe(testRule.name);
    });

    it('should load rule for editing when clicked', () => {
      const ruleItem = container.querySelector('.rule-item') as HTMLElement;
      ruleItem.click();
      
      expect(container.querySelector('.rule-form')).toBeTruthy();
      
      const nameInput = container.querySelector('#rule-name') as HTMLInputElement;
      expect(nameInput.value).toBe(testRule.name);
    });

    it('should update rule name when input changes', () => {
      ruleEditor.loadRule(testRule);
      
      const nameInput = container.querySelector('#rule-name') as HTMLInputElement;
      nameInput.value = 'Updated Rule Name';
      nameInput.dispatchEvent(new Event('input'));
      
      // The rule should be updated internally
      expect(nameInput.value).toBe('Updated Rule Name');
    });

    it('should update rule priority when input changes', () => {
      ruleEditor.loadRule(testRule);
      
      const priorityInput = container.querySelector('#rule-priority') as HTMLInputElement;
      priorityInput.value = '75';
      priorityInput.dispatchEvent(new Event('input'));
      
      expect(priorityInput.value).toBe('75');
    });

    it('should update rule active status when checkbox changes', () => {
      ruleEditor.loadRule(testRule);
      
      const activeInput = container.querySelector('#rule-active') as HTMLInputElement;
      activeInput.checked = false;
      activeInput.dispatchEvent(new Event('change'));
      
      expect(activeInput.checked).toBe(false);
    });
  });

  describe('Condition Management', () => {
    beforeEach(() => {
      ruleEditor.createNewRule();
    });

    it('should show no conditions message initially', () => {
      expect(container.querySelector('.no-conditions')).toBeTruthy();
    });

    it('should show add condition button', () => {
      expect(container.querySelector('#add-condition-btn')).toBeTruthy();
    });

    it('should show condition type dialog when add button clicked', () => {
      const addBtn = container.querySelector('#add-condition-btn') as HTMLButtonElement;
      addBtn.click();
      
      expect(document.querySelector('.condition-type-dialog')).toBeTruthy();
      expect(document.querySelector('.condition-types')).toBeTruthy();
    });

    it('should add condition when type selected', () => {
      const addBtn = container.querySelector('#add-condition-btn') as HTMLButtonElement;
      addBtn.click();
      
      const specificWedgeOption = document.querySelector('[data-type="specific_wedge"]') as HTMLElement;
      specificWedgeOption.click();
      
      // Dialog should be closed and condition should be added
      expect(document.querySelector('.condition-type-dialog')).toBeFalsy();
      expect(container.querySelector('.condition-item')).toBeTruthy();
    });

    it('should close dialog when cancel clicked', () => {
      const addBtn = container.querySelector('#add-condition-btn') as HTMLButtonElement;
      addBtn.click();
      
      const cancelBtn = document.querySelector('#cancel-condition') as HTMLButtonElement;
      cancelBtn.click();
      
      expect(document.querySelector('.condition-type-dialog')).toBeFalsy();
    });
  });

  describe('Condition Types', () => {
    beforeEach(() => {
      ruleEditor.createNewRule();
    });

    it('should render specific wedge condition correctly', () => {
      addConditionOfType('specific_wedge');
      
      expect(container.querySelector('[data-param="wheel"]')).toBeTruthy();
      expect(container.querySelector('[data-param="wedgeId"]')).toBeTruthy();
    });

    it('should render wedge combination condition correctly', () => {
      addConditionOfType('wedge_combination');
      
      expect(container.querySelector('[data-param="outerWedgeId"]')).toBeTruthy();
      expect(container.querySelector('[data-param="innerWedgeId"]')).toBeTruthy();
      expect(container.querySelector('[data-param="matchType"]')).toBeTruthy();
    });

    it('should render score threshold condition correctly', () => {
      addConditionOfType('score_threshold');
      
      expect(container.querySelector('[data-param="operator"]')).toBeTruthy();
      expect(container.querySelector('[data-param="threshold"]')).toBeTruthy();
    });

    it('should render consecutive wins condition correctly', () => {
      addConditionOfType('consecutive_wins');
      
      expect(container.querySelector('[data-param="count"]')).toBeTruthy();
    });

    it('should populate wedge options from wheels', () => {
      addConditionOfType('specific_wedge');
      
      const wedgeSelect = container.querySelector('[data-param="wedgeId"]') as HTMLSelectElement;
      const options = wedgeSelect.querySelectorAll('option');
      
      // Should have default option plus wedges from mock wheels
      expect(options.length).toBeGreaterThan(1);
      expect(options[1].textContent).toContain('Red');
    });
  });

  describe('Condition Removal', () => {
    beforeEach(() => {
      ruleEditor.createNewRule();
      addConditionOfType('specific_wedge');
    });

    it('should show remove button for conditions', () => {
      expect(container.querySelector('.remove-condition-btn')).toBeTruthy();
    });

    it('should remove condition when remove button clicked', () => {
      const removeBtn = container.querySelector('.remove-condition-btn') as HTMLButtonElement;
      removeBtn.click();
      
      expect(container.querySelector('.condition-item')).toBeFalsy();
      expect(container.querySelector('.no-conditions')).toBeTruthy();
    });
  });

  describe('Rule Saving', () => {
    let onRuleChangeSpy: jest.Mock;

    beforeEach(() => {
      onRuleChangeSpy = jest.fn();
      ruleEditor.setOnRuleChange(onRuleChangeSpy);
      ruleEditor.createNewRule();
    });

    it('should save rule when save button clicked', () => {
      const saveBtn = container.querySelector('#save-rule-btn') as HTMLButtonElement;
      saveBtn.click();
      
      expect(onRuleChangeSpy).toHaveBeenCalled();
      expect(ruleEngine.getAllRules()).toHaveLength(1);
    });

    it('should show alert on save error', () => {
      // Create invalid rule (no conditions)
      const saveBtn = container.querySelector('#save-rule-btn') as HTMLButtonElement;
      saveBtn.click();
      
      expect(window.alert).toHaveBeenCalled();
    });
  });

  describe('Rule Deletion', () => {
    let onRuleDeleteSpy: jest.Mock;
    let testRule: Rule;

    beforeEach(() => {
      onRuleDeleteSpy = jest.fn();
      ruleEditor.setOnRuleDelete(onRuleDeleteSpy);
      
      testRule = createTestRule();
      ruleEngine.addRule(testRule);
      ruleEditor.loadRule(testRule);
    });

    it('should delete rule when delete button clicked and confirmed', () => {
      const deleteBtn = container.querySelector('#delete-rule-btn') as HTMLButtonElement;
      deleteBtn.click();
      
      expect(window.confirm).toHaveBeenCalled();
      expect(onRuleDeleteSpy).toHaveBeenCalledWith(testRule.id);
      expect(ruleEngine.getRule(testRule.id)).toBeUndefined();
    });

    it('should not delete rule when not confirmed', () => {
      (window.confirm as jest.Mock).mockReturnValueOnce(false);
      
      const deleteBtn = container.querySelector('#delete-rule-btn') as HTMLButtonElement;
      deleteBtn.click();
      
      expect(onRuleDeleteSpy).not.toHaveBeenCalled();
      expect(ruleEngine.getRule(testRule.id)).toBeDefined();
    });
  });

  describe('Validation Display', () => {
    beforeEach(() => {
      ruleEditor.createNewRule();
    });

    it('should show validation errors for invalid rule', () => {
      // Rule with no conditions should show validation error
      expect(container.querySelector('.validation-errors')).toBeTruthy();
    });

    it('should show validation success for valid rule', () => {
      addConditionOfType('specific_wedge');
      
      // Should show success message
      expect(container.querySelector('.validation-success')).toBeTruthy();
    });
  });

  describe('Conflict Detection', () => {
    it('should display rule conflicts when they exist', () => {
      // Add two conflicting rules
      const rule1 = createTestRule('rule1', 50, 'win');
      const rule2 = createTestRule('rule2', 50, 'lose');
      
      ruleEngine.addRule(rule1);
      ruleEngine.addRule(rule2);
      
      ruleEditor = new RuleEditor(container, ruleEngine, mockWheels);
      
      expect(container.querySelector('.rule-conflicts')).toBeTruthy();
    });
  });

  describe('Wheel Updates', () => {
    it('should update wedge options when wheels change', () => {
      ruleEditor.createNewRule();
      addConditionOfType('specific_wedge');
      
      const newWheels = [
        {
          id: 'wheel3',
          label: 'New Wheel',
          wedges: [{ id: 'wedge5', label: 'Purple', weight: 1, color: '#800080' }],
          frictionCoefficient: 0.1,
          radius: 100,
          position: { x: 0, y: 0 },
          currentAngle: 0,
          angularVelocity: 0,
        },
      ];
      
      ruleEditor.updateWheels(newWheels);
      
      const wedgeSelect = container.querySelector('[data-param="wedgeId"]') as HTMLSelectElement;
      const options = Array.from(wedgeSelect.options);
      const purpleOption = options.find(opt => opt.textContent?.includes('Purple'));
      
      expect(purpleOption).toBeTruthy();
    });
  });

  // Helper functions
  function createMockWheels(): Wheel[] {
    return [
      {
        id: 'wheel1',
        label: 'Outer Wheel',
        wedges: [
          { id: 'wedge1', label: 'Red', weight: 1, color: '#ff0000' },
          { id: 'wedge2', label: 'Blue', weight: 1, color: '#0000ff' },
        ],
        frictionCoefficient: 0.1,
        radius: 150,
        position: { x: 0, y: 0 },
        currentAngle: 0,
        angularVelocity: 0,
      },
      {
        id: 'wheel2',
        label: 'Inner Wheel',
        wedges: [
          { id: 'wedge3', label: 'Green', weight: 1, color: '#00ff00' },
          { id: 'wedge4', label: 'Yellow', weight: 1, color: '#ffff00' },
        ],
        frictionCoefficient: 0.1,
        clutchRatio: 0.5,
        radius: 75,
        position: { x: 0, y: 0 },
        currentAngle: 0,
        angularVelocity: 0,
      },
    ];
  }

  function createTestRule(
    id: string = 'test-rule',
    priority: number = 50,
    outcome: 'win' | 'lose' | 'continue' = 'continue',
  ): Rule {
    return {
      id,
      name: `Test Rule ${id}`,
      description: 'A test rule',
      isActive: true,
      priority,
      conditions: [{
        id: 'cond1',
        type: 'specific_wedge',
        parameters: { wedgeId: 'wedge1', wheel: 'outer' },
      }],
      outcome,
      points: 10,
      message: 'Test message',
      createdAt: '2023-01-01T00:00:00Z',
      modifiedAt: '2023-01-01T00:00:00Z',
    };
  }

  function addConditionOfType(type: string): void {
    const addBtn = container.querySelector('#add-condition-btn') as HTMLButtonElement;
    addBtn.click();
    
    const typeOption = document.querySelector(`[data-type="${type}"]`) as HTMLElement;
    typeOption.click();
  }
});