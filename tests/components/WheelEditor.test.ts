/**
 * Unit tests for WheelEditor component
 * Tests enhanced game editor interface functionality
 */

import { WheelEditor } from '../../src/components/WheelEditor';
import { Wheel } from '../../src/models';

// Mock DOM environment
const mockContainer = {
  innerHTML: '',
  className: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  id: 'test-editor',
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => null),
} as unknown as HTMLElement;

const mockElement = {
  innerHTML: '',
  className: '',
  textContent: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  onclick: null as any,
  onchange: null as any,
  dataset: {},
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => null),
} as unknown as HTMLElement;

const mockInput = {
  type: 'text',
  value: '',
  min: '',
  max: '',
  step: '',
  placeholder: '',
  className: '',
  title: '',
  style: {} as CSSStyleDeclaration,
  onchange: null as any,
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
} as unknown as HTMLInputElement;

// Mock document.getElementById
const originalGetElementById = document.getElementById;
beforeAll(() => {
  document.getElementById = jest.fn((id: string) => {
    if (id === 'test-editor') {return mockContainer;}
    return null;
  });
});

afterAll(() => {
  document.getElementById = originalGetElementById;
});

// Mock document.createElement
const originalCreateElement = document.createElement;
beforeAll(() => {
  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'input') {
      return { ...mockInput } as unknown as HTMLElement;
    }
    if (tagName === 'button') {
      return {
        ...mockElement,
        textContent: '',
        onclick: null,
        type: 'button',
      } as unknown as HTMLElement;
    }
    if (tagName === 'select') {
      return {
        ...mockElement,
        onchange: null,
        value: '',
      } as unknown as HTMLElement;
    }
    return { ...mockElement } as unknown as HTMLElement;
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

describe('WheelEditor', () => {
  let wheelEditor: WheelEditor;
  let mockCallbacks: any;
  let testWheel: Wheel;

  beforeEach(() => {
    jest.clearAllMocks();
    
    testWheel = {
      id: 'test-wheel',
      label: 'Test Wheel',
      wedges: [
        { id: 'wedge-1', label: 'A', weight: 1, color: '#ff6b6b' },
        { id: 'wedge-2', label: 'B', weight: 1, color: '#4ecdc4' },
        { id: 'wedge-3', label: 'C', weight: 1, color: '#45b7d1' },
        { id: 'wedge-4', label: 'D', weight: 1, color: '#96ceb4' },
      ],
      frictionCoefficient: 0.02,
      clutchRatio: 0.8,
      radius: 150,
      position: { x: 0, y: 0 },
      currentAngle: 0,
      angularVelocity: 0,
    };
    
    mockCallbacks = {
      onWedgeAdd: jest.fn(),
      onWedgeRemove: jest.fn(),
      onWedgeUpdate: jest.fn(),
      onWheelUpdate: jest.fn(),
      onPreviewUpdate: jest.fn(),
    };
    
    wheelEditor = new WheelEditor({
      containerId: 'test-editor',
      wheel: testWheel,
    }, mockCallbacks);
  });

  describe('constructor', () => {
    it('should initialize with valid container', () => {
      expect(wheelEditor).toBeInstanceOf(WheelEditor);
      expect(document.getElementById).toHaveBeenCalledWith('test-editor');
    });

    it('should throw error with invalid container', () => {
      expect(() => new WheelEditor({
        containerId: 'invalid-container',
      })).toThrow('Container element with id \'invalid-container\' not found');
    });

    it('should initialize with provided wheel', () => {
      const wheel = wheelEditor.getWheel();
      expect(wheel.label).toBe('Test Wheel');
      expect(wheel.wedges).toHaveLength(4);
    });

    it('should create default wheel when none provided', () => {
      const defaultEditor = new WheelEditor({
        containerId: 'test-editor',
      });
      
      const wheel = defaultEditor.getWheel();
      expect(wheel.label).toBe('New Wheel');
      expect(wheel.wedges).toHaveLength(4);
      
      defaultEditor.destroy();
    });
  });

  describe('getWheel', () => {
    it('should return current wheel data', () => {
      const wheel = wheelEditor.getWheel();
      expect(wheel.label).toBe('Test Wheel');
      expect(wheel.wedges).toHaveLength(4);
      expect(wheel.frictionCoefficient).toBe(0.02);
    });

    it('should return a copy of the wheel object', () => {
      const wheel1 = wheelEditor.getWheel();
      const wheel2 = wheelEditor.getWheel();
      expect(wheel1).not.toBe(wheel2); // Different object instances
      expect(wheel1).toEqual(wheel2); // Same content
    });
  });

  describe('getWedges', () => {
    it('should return current wedges array', () => {
      const wedges = wheelEditor.getWedges();
      expect(wedges).toHaveLength(4);
      expect(wedges[0]?.label).toBe('A');
      expect(wedges[1]?.label).toBe('B');
    });

    it('should return a copy of the wedges array', () => {
      const wedges1 = wheelEditor.getWedges();
      const wedges2 = wheelEditor.getWedges();
      expect(wedges1).not.toBe(wedges2); // Different array instances
      expect(wedges1).toEqual(wedges2); // Same content
    });
  });

  describe('addWedgePublic', () => {
    it('should add a new wedge with default properties', () => {
      const initialCount = wheelEditor.getWedgeCount();
      wheelEditor.addWedgePublic();
      
      const newCount = wheelEditor.getWedgeCount();
      expect(newCount).toBe(initialCount + 1);
      
      const wedges = wheelEditor.getWedges();
      const newWedge = wedges[wedges.length - 1];
      expect(newWedge?.label).toBe('Option 5');
      expect(newWedge?.weight).toBe(1);
    });

    it('should add a wedge with custom properties', () => {
      wheelEditor.addWedgePublic({
        label: 'Custom Wedge',
        weight: 2.5,
        color: '#ff0000',
      });
      
      const wedges = wheelEditor.getWedges();
      const newWedge = wedges[wedges.length - 1];
      expect(newWedge?.label).toBe('Custom Wedge');
      expect(newWedge?.weight).toBe(2.5);
      expect(newWedge?.color).toBe('#ff0000');
    });
  });

  describe('removeWedgePublic', () => {
    it('should remove a wedge by id', () => {
      const initialCount = wheelEditor.getWedgeCount();
      const wedgeToRemove = wheelEditor.getWedges()[0];
      if (!wedgeToRemove) {throw new Error('No wedge found');}
      
      const result = wheelEditor.removeWedgePublic(wedgeToRemove.id);
      
      expect(result).toBe(true);
      expect(wheelEditor.getWedgeCount()).toBe(initialCount - 1);
      
      const remainingWedges = wheelEditor.getWedges();
      expect(remainingWedges.find(w => w.id === wedgeToRemove.id)).toBeUndefined();
    });

    it('should not remove wedge if only 2 remain', () => {
      // Remove wedges until only 2 remain
      const wedges = wheelEditor.getWedges();
      if (wedges[0]) {wheelEditor.removeWedgePublic(wedges[0].id);}
      if (wedges[1]) {wheelEditor.removeWedgePublic(wedges[1].id);}
      
      expect(wheelEditor.getWedgeCount()).toBe(2);
      
      // Try to remove another - should fail
      const remainingWedges = wheelEditor.getWedges();
      const result = wheelEditor.removeWedgePublic(remainingWedges[0]?.id || 'invalid');
      
      expect(result).toBe(false);
      expect(wheelEditor.getWedgeCount()).toBe(2);
    });

    it('should return false for non-existent wedge id', () => {
      const result = wheelEditor.removeWedgePublic('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('updateWedgePublic', () => {
    it('should update wedge properties', () => {
      const wedges = wheelEditor.getWedges();
      const wedgeId = wedges[0]?.id;
      if (!wedgeId) {throw new Error('No wedge found');}
      
      const result = wheelEditor.updateWedgePublic(wedgeId, {
        label: 'Updated Label',
        weight: 3.5,
        color: '#00ff00',
      });
      
      expect(result).toBe(true);
      
      const updatedWedges = wheelEditor.getWedges();
      const updatedWedge = updatedWedges.find(w => w.id === wedgeId);
      
      expect(updatedWedge?.label).toBe('Updated Label');
      expect(updatedWedge?.weight).toBe(3.5);
      expect(updatedWedge?.color).toBe('#00ff00');
    });

    it('should return false for non-existent wedge id', () => {
      const result = wheelEditor.updateWedgePublic('non-existent-id', {
        label: 'New Label',
      });
      expect(result).toBe(false);
    });
  });

  describe('validateWheel', () => {
    it('should validate a valid wheel', () => {
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect empty labels', () => {
      wheelEditor.updateWedgePublic(testWheel.wedges[0]?.id || 'invalid', { label: '' });
      
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Label cannot be empty'))).toBe(true);
    });

    it('should detect negative weights', () => {
      wheelEditor.updateWedgePublic(testWheel.wedges[0]?.id || 'invalid', { weight: -1 });
      
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Weight must be a non-negative number'))).toBe(true);
    });

    it('should warn about zero weights', () => {
      wheelEditor.updateWedgePublic(testWheel.wedges[0]?.id || 'invalid', { weight: 0 });
      
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('Zero weight means this wedge will never be selected'))).toBe(true);
    });

    it('should detect all zero weights as error', () => {
      testWheel.wedges.forEach(wedge => {
        wheelEditor.updateWedgePublic(wedge.id, { weight: 0 });
      });
      
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('At least one wedge must have a weight greater than 0'))).toBe(true);
    });
  });

  describe('setWheel', () => {
    it('should replace the current wheel', () => {
      const newWheel: Wheel = {
        id: 'new-wheel',
        label: 'New Wheel',
        wedges: [
          { id: 'new-wedge-1', label: 'X', weight: 2, color: '#000000' },
          { id: 'new-wedge-2', label: 'Y', weight: 3, color: '#ffffff' },
        ],
        frictionCoefficient: 0.05,
        clutchRatio: 0.5,
        radius: 200,
        position: { x: 10, y: 20 },
        currentAngle: 45,
        angularVelocity: 1.5,
      };
      
      wheelEditor.setWheel(newWheel);
      
      const currentWheel = wheelEditor.getWheel();
      expect(currentWheel.label).toBe('New Wheel');
      expect(currentWheel.wedges).toHaveLength(2);
      expect(currentWheel.wedges[0]?.label).toBe('X');
      expect(currentWheel.frictionCoefficient).toBe(0.05);
    });
  });

  // Legacy compatibility tests
  describe('legacy compatibility', () => {
    it('should support getWedgeTexts', () => {
      const texts = wheelEditor.getWedgeTexts();
      expect(texts).toEqual(['A', 'B', 'C', 'D']);
    });

    it('should support getWedgeWeights', () => {
      const weights = wheelEditor.getWedgeWeights();
      expect(weights).toEqual([1, 1, 1, 1]);
    });

    it('should support getWedgeCount', () => {
      expect(wheelEditor.getWedgeCount()).toBe(4);
    });

    it('should support updateWedgeText', () => {
      wheelEditor.updateWedgeText(0, 'Updated A');
      const texts = wheelEditor.getWedgeTexts();
      expect(texts[0]).toBe('Updated A');
    });

    it('should support updateWedgeWeight', () => {
      wheelEditor.updateWedgeWeight(0, 2.5);
      const weights = wheelEditor.getWedgeWeights();
      expect(weights[0]).toBe(2.5);
    });

    it('should handle negative weights by setting to 0', () => {
      wheelEditor.updateWedgeWeight(0, -1);
      const weights = wheelEditor.getWedgeWeights();
      expect(weights[0]).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('should handle missing callbacks gracefully', () => {
      const editorWithoutCallbacks = new WheelEditor({
        containerId: 'test-editor',
      });
      
      expect(editorWithoutCallbacks).toBeInstanceOf(WheelEditor);
      editorWithoutCallbacks.destroy();
    });

    it('should trigger onWheelUpdate callback', () => {
      wheelEditor.updateWedgeText(0, 'New Text');
      expect(mockCallbacks.onWheelUpdate).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up DOM', () => {
      wheelEditor.destroy();
      expect(mockContainer.innerHTML).toBe('');
    });
  });
});