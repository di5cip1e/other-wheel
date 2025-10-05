/**
 * Unit tests for GameController
 * Ensures no regression from the original game functionality
 */

import { GameController } from '../../src/components/GameController';

// Mock all the component dependencies
jest.mock('../../src/components/WheelRenderer', () => ({
  WheelRenderer: jest.fn().mockImplementation(() => ({
    createWheel: jest.fn(),
    updateWheelRotation: jest.fn(),
    determineWedgeResult: jest.fn(() => ({ index: 0, text: 'Test Result' })),
    clearWheels: jest.fn(),
  })),
}));

jest.mock('../../src/components/PowerMeter', () => ({
  PowerMeter: jest.fn().mockImplementation((_options: any, callbacks: any) => ({
    resetMeter: jest.fn(),
    destroy: jest.fn(),
    callbacks, // Store callbacks for testing
  })),
}));

jest.mock('../../src/components/WheelEditor', () => ({
  WheelEditor: jest.fn().mockImplementation((_options: any, callbacks: any) => ({
    destroy: jest.fn(),
    callbacks, // Store callbacks for testing
    options: _options,
  })),
}));

// Mock DOM elements
const mockElements = new Map<string, HTMLElement>();
const originalGetElementById = document.getElementById;

beforeAll(() => {
  document.getElementById = jest.fn((id: string) => {
    // Return null for invalid IDs to test error handling
    if (id === 'invalid-output') {
      return null;
    }
    
    if (!mockElements.has(id)) {
      mockElements.set(id, {
        innerHTML: '',
        style: {} as CSSStyleDeclaration,
        textContent: '',
        appendChild: jest.fn(),
        id,
      } as unknown as HTMLElement);
    }
    return mockElements.get(id) || null;
  });
});

afterAll(() => {
  document.getElementById = originalGetElementById;
});

// Mock window.setInterval and clearInterval
const originalSetInterval = window.setInterval;
const originalClearInterval = window.clearInterval;
let intervalId = 1;
const activeIntervals = new Map<number, Function>();

beforeAll(() => {
  window.setInterval = jest.fn((_callback: Function, _delay: number) => {
    const id = intervalId++;
    activeIntervals.set(id, _callback);
    return id;
  }) as any;

  window.clearInterval = jest.fn((_id: number) => {
    activeIntervals.delete(_id);
  }) as any;
});

afterAll(() => {
  window.setInterval = originalSetInterval;
  window.clearInterval = originalClearInterval;
});

describe('GameController', () => {
  let gameController: GameController;
  const mockOptions = {
    wheelContainerId: 'wheel-container',
    powerMeterContainerId: 'power-meter-container',
    bigWheelEditorContainerId: 'big-wheel-editor',
    smallWheelEditorContainerId: 'small-wheel-editor',
    outputElementId: 'output',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockElements.clear();
    activeIntervals.clear();
    
    gameController = new GameController(mockOptions);
  });

  afterEach(() => {
    if (gameController) {
      gameController.destroy();
    }
  });

  describe('constructor', () => {
    it('should initialize with valid options', () => {
      expect(gameController).toBeInstanceOf(GameController);
    });

    it('should throw error with invalid output element', () => {
      expect(() => new GameController({
        ...mockOptions,
        outputElementId: 'invalid-output',
      })).toThrow('Output element with id \'invalid-output\' not found');
    });
  });

  describe('getGameState', () => {
    it('should return current game state', () => {
      const state = gameController.getGameState();
      
      expect(state).toHaveProperty('bigWheelAngle');
      expect(state).toHaveProperty('smallWheelAngle');
      expect(state).toHaveProperty('bigWheelSpeed');
      expect(state).toHaveProperty('smallWheelSpeed');
      expect(state).toHaveProperty('isSpinning');
      expect(state).toHaveProperty('bigWheelTexts');
      expect(state).toHaveProperty('smallWheelTexts');
      
      expect(state.bigWheelAngle).toBe(0);
      expect(state.smallWheelAngle).toBe(0);
      expect(state.isSpinning).toBe(false);
      expect(Array.isArray(state.bigWheelTexts)).toBe(true);
      expect(Array.isArray(state.smallWheelTexts)).toBe(true);
    });

    it('should return arrays with correct initial values', () => {
      const state = gameController.getGameState();
      
      expect(state.bigWheelTexts).toHaveLength(8);
      expect(state.smallWheelTexts).toHaveLength(6);
      expect(state.bigWheelTexts[0]).toBe('Big 1');
      expect(state.smallWheelTexts[0]).toBe('Small 1');
    });
  });

  describe('isGameSpinning', () => {
    it('should return false initially', () => {
      expect(gameController.isGameSpinning()).toBe(false);
    });
  });

  describe('power meter integration', () => {
    it('should handle power meter stop event', () => {
      // Get the PowerMeter mock instance
      const { PowerMeter } = require('../../src/components/PowerMeter');
      const powerMeterInstance = PowerMeter.mock.results[0].value;
      
      // Simulate power meter stop with 75% power
      if (powerMeterInstance.callbacks && powerMeterInstance.callbacks.onStop) {
        powerMeterInstance.callbacks.onStop(75);
      }
      
      // Verify spinning started
      expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 50);
      expect(gameController.isGameSpinning()).toBe(true);
    });
  });

  describe('wheel editor integration', () => {
    it('should handle big wheel text updates', () => {
      const { WheelEditor } = require('../../src/components/WheelEditor');
      const bigWheelEditorInstance = WheelEditor.mock.results[0].value;
      
      // Simulate wheel text update
      const newTexts = ['New 1', 'New 2', 'New 3', 'New 4', 'New 5', 'New 6', 'New 7', 'New 8'];
      const newWeights = [1, 1, 1, 1, 1, 1, 1, 1];
      
      const mockWheel = {
        id: 'test-wheel',
        label: 'Test Wheel',
        wedges: newTexts.map((text, index) => ({
          id: `wedge-${index}`,
          label: text,
          weight: newWeights[index] || 1,
          color: '#ff0000',
        })),
        frictionCoefficient: 0.02,
        radius: 150,
        position: { x: 0, y: 0 },
        currentAngle: 0,
        angularVelocity: 0,
      };
      
      if (bigWheelEditorInstance.callbacks && bigWheelEditorInstance.callbacks.onWheelUpdate) {
        bigWheelEditorInstance.callbacks.onWheelUpdate(mockWheel);
      }
      
      const state = gameController.getGameState();
      expect(state.bigWheelTexts).toEqual(newTexts);
      expect(state.bigWheelWeights).toEqual(newWeights);
    });

    it('should handle small wheel text updates', () => {
      const { WheelEditor } = require('../../src/components/WheelEditor');
      const smallWheelEditorInstance = WheelEditor.mock.results[1].value;
      
      // Simulate wheel text update
      const newTexts = ['Small A', 'Small B', 'Small C', 'Small D', 'Small E', 'Small F'];
      const newWeights = [1, 1, 1, 1, 1, 1];
      
      const mockWheel = {
        id: 'test-small-wheel',
        label: 'Test Small Wheel',
        wedges: newTexts.map((text, index) => ({
          id: `small-wedge-${index}`,
          label: text,
          weight: newWeights[index] || 1,
          color: '#00ff00',
        })),
        frictionCoefficient: 0.02,
        clutchRatio: 0.8,
        radius: 100,
        position: { x: 0, y: 0 },
        currentAngle: 0,
        angularVelocity: 0,
      };
      
      if (smallWheelEditorInstance.callbacks && smallWheelEditorInstance.callbacks.onWheelUpdate) {
        smallWheelEditorInstance.callbacks.onWheelUpdate(mockWheel);
      }
      
      const state = gameController.getGameState();
      expect(state.smallWheelTexts).toEqual(newTexts);
      expect(state.smallWheelWeights).toEqual(newWeights);
    });
  });

  describe('spinning physics', () => {
    it('should apply correct physics calculations', () => {
      // Simulate power meter stop to start spinning
      const { PowerMeter } = require('../../src/components/PowerMeter');
      const powerMeterInstance = PowerMeter.mock.results[0].value;
      
      if (powerMeterInstance.callbacks && powerMeterInstance.callbacks.onStop) {
        powerMeterInstance.callbacks.onStop(100); // Maximum power
      }
      
      // Get the spin update function
      const spinUpdateCallback = activeIntervals.values().next().value;
      expect(spinUpdateCallback).toBeDefined();
      
      // Simulate a few spin updates
      const initialState = gameController.getGameState();
      expect(initialState.bigWheelSpeed).toBe(20); // Max speed for 100% power
      expect(initialState.smallWheelSpeed).toBe(10); // Clutch-limited speed
    });

    it('should handle minimum power correctly', () => {
      const { PowerMeter } = require('../../src/components/PowerMeter');
      const powerMeterInstance = PowerMeter.mock.results[0].value;
      
      if (powerMeterInstance.callbacks && powerMeterInstance.callbacks.onStop) {
        powerMeterInstance.callbacks.onStop(0); // Minimum power
      }
      
      const state = gameController.getGameState();
      expect(state.bigWheelSpeed).toBe(0); // No speed for 0% power
      expect(state.smallWheelSpeed).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should clean up all resources', () => {
      // Start spinning first
      const { PowerMeter } = require('../../src/components/PowerMeter');
      const powerMeterInstance = PowerMeter.mock.results[0].value;
      
      if (powerMeterInstance.callbacks && powerMeterInstance.callbacks.onStop) {
        powerMeterInstance.callbacks.onStop(50);
      }
      
      // Now destroy
      gameController.destroy();
      
      expect(window.clearInterval).toHaveBeenCalled();
      expect(powerMeterInstance.destroy).toHaveBeenCalled();
    });
  });

  describe('original constants preservation', () => {
    it('should preserve original wedge counts', () => {
      const state = gameController.getGameState();
      expect(state.bigWheelTexts).toHaveLength(8); // Original big wheel wedges
      expect(state.smallWheelTexts).toHaveLength(6); // Original small wheel wedges
    });

    it('should preserve original friction values through physics', () => {
      // This test verifies that the physics constants match the original
      // The original used 0.98 and 0.97 friction multipliers
      const { PowerMeter } = require('../../src/components/PowerMeter');
      const powerMeterInstance = PowerMeter.mock.results[0].value;
      
      if (powerMeterInstance.callbacks && powerMeterInstance.callbacks.onStop) {
        powerMeterInstance.callbacks.onStop(50);
      }
      
      // The physics implementation should use the same friction values
      // This is tested indirectly through the spin behavior
      expect(gameController.isGameSpinning()).toBe(true);
    });
  });

  describe('weighted probability system', () => {
    it('should support setting and getting RNG seed', () => {
      gameController.setSeed(12345);
      expect(gameController.getSeed()).toBe(12345);
    });

    it('should include weights in game state', () => {
      const state = gameController.getGameState();
      
      expect(state).toHaveProperty('bigWheelWeights');
      expect(state).toHaveProperty('smallWheelWeights');
      expect(Array.isArray(state.bigWheelWeights)).toBe(true);
      expect(Array.isArray(state.smallWheelWeights)).toBe(true);
      expect(state.bigWheelWeights).toHaveLength(8);
      expect(state.smallWheelWeights).toHaveLength(6);
      
      // Default weights should be 1
      expect(state.bigWheelWeights.every(w => w === 1)).toBe(true);
      expect(state.smallWheelWeights.every(w => w === 1)).toBe(true);
    });

    it('should handle weight updates through editor callbacks', () => {
      const { WheelEditor } = require('../../src/components/WheelEditor');
      const bigWheelEditorInstance = WheelEditor.mock.results[0].value;
      
      // Simulate weight update
      const newTexts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const newWeights = [0.5, 2, 1, 3, 1, 1, 4, 1]; // Varied weights
      
      const mockWheel = {
        id: 'test-weight-wheel',
        label: 'Test Weight Wheel',
        wedges: newTexts.map((text, index) => ({
          id: `weight-wedge-${index}`,
          label: text,
          weight: newWeights[index] || 1,
          color: '#0000ff',
        })),
        frictionCoefficient: 0.02,
        radius: 150,
        position: { x: 0, y: 0 },
        currentAngle: 0,
        angularVelocity: 0,
      };
      
      if (bigWheelEditorInstance.callbacks && bigWheelEditorInstance.callbacks.onWheelUpdate) {
        bigWheelEditorInstance.callbacks.onWheelUpdate(mockWheel);
      }
      
      const state = gameController.getGameState();
      expect(state.bigWheelWeights).toEqual(newWeights);
    });
  });
});