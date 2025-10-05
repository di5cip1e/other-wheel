/**
 * Unit tests for PowerMeter component
 * Tests enhanced skill-based timing mechanics and power-to-velocity mapping
 */

import { PowerMeter, PowerMeterOptions } from '../../src/components/PowerMeter';

// Mock DOM environment
const mockContainer = {
  innerHTML: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  id: 'test-power-meter',
} as unknown as HTMLElement;

// Mock document.getElementById
const originalGetElementById = document.getElementById;
beforeAll(() => {
  document.getElementById = jest.fn((id: string) => {
    if (id === 'test-power-meter') {return mockContainer;}
    return null;
  });
});

afterAll(() => {
  document.getElementById = originalGetElementById;
});

// Mock document.createElement
const originalCreateElement = document.createElement;
beforeAll(() => {
  document.createElement = jest.fn((_tagName: string) => {
    const element = {
      innerHTML: '',
      style: {} as CSSStyleDeclaration,
      appendChild: jest.fn(),
      textContent: '',
      onclick: null,
      disabled: false,
      id: '',
    } as unknown as HTMLElement;
    return element;
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

// Mock requestAnimationFrame and cancelAnimationFrame
const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCancelAnimationFrame = window.cancelAnimationFrame;
const originalPerformanceNow = performance.now;
let animationFrameId = 1;
let mockTime = 0;

beforeAll(() => {
  window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
    const id = animationFrameId++;
    // Execute callback immediately for testing
    setTimeout(() => callback(mockTime), 0);
    return id;
  }) as any;

  window.cancelAnimationFrame = jest.fn((_id: number) => {
    // Mock implementation
  }) as any;

  performance.now = jest.fn(() => mockTime);
});

afterAll(() => {
  window.requestAnimationFrame = originalRequestAnimationFrame;
  window.cancelAnimationFrame = originalCancelAnimationFrame;
  performance.now = originalPerformanceNow;
});

describe('PowerMeter', () => {
  let powerMeter: PowerMeter;
  let mockCallbacks: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTime = 0;
    mockCallbacks = {
      onStart: jest.fn(),
      onStop: jest.fn(),
    };
    
    powerMeter = new PowerMeter(
      { containerId: 'test-power-meter' },
      mockCallbacks,
    );
  });

  afterEach(() => {
    if (powerMeter) {
      powerMeter.destroy();
    }
  });

  describe('constructor', () => {
    it('should initialize with valid container', () => {
      expect(powerMeter).toBeInstanceOf(PowerMeter);
      expect(document.getElementById).toHaveBeenCalledWith('test-power-meter');
    });

    it('should throw error with invalid container', () => {
      expect(() => new PowerMeter({ containerId: 'invalid-container' })).toThrow(
        'Container element with id \'invalid-container\' not found',
      );
    });

    it('should initialize with default state', () => {
      const state = powerMeter.getState();
      expect(state.value).toBe(50); // Default middle position
      expect(state.isActive).toBe(false);
      expect(state.oscillationSpeed).toBe(2.0); // Default oscillations per second
    });
  });

  describe('startMeter', () => {
    it('should start the meter animation', () => {
      powerMeter.startMeter();
      
      expect(powerMeter.isActive()).toBe(true);
      expect(window.requestAnimationFrame).toHaveBeenCalled();
      expect(mockCallbacks.onStart).toHaveBeenCalled();
    });

    it('should not start if already active', () => {
      powerMeter.startMeter();
      const firstCallCount = (window.requestAnimationFrame as jest.Mock).mock.calls.length;
      
      powerMeter.startMeter(); // Try to start again
      
      expect((window.requestAnimationFrame as jest.Mock).mock.calls.length).toBe(firstCallCount);
    });
  });

  describe('stopMeter', () => {
    it('should stop the meter and call callback with enhanced data', () => {
      powerMeter.startMeter();
      powerMeter.stopMeter();
      
      expect(powerMeter.isActive()).toBe(false);
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
      expect(mockCallbacks.onStop).toHaveBeenCalledWith(
        expect.any(Number), // power
        expect.any(Number), // angular velocity
        expect.any(Number),  // timing accuracy
      );
    });

    it('should not stop if not active', () => {
      powerMeter.stopMeter();
      
      expect(window.cancelAnimationFrame).not.toHaveBeenCalled();
      expect(mockCallbacks.onStop).not.toHaveBeenCalled();
    });
  });

  describe('resetMeter', () => {
    it('should reset meter to initial state', () => {
      powerMeter.startMeter();
      powerMeter.resetMeter();
      
      const state = powerMeter.getState();
      expect(state.value).toBe(50); // Reset to middle position
      expect(state.isActive).toBe(false);
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('getCurrentPower', () => {
    it('should return current power value', () => {
      const power = powerMeter.getCurrentPower();
      expect(power).toBe(50); // Initial value
      expect(typeof power).toBe('number');
      expect(power).toBeGreaterThanOrEqual(0);
      expect(power).toBeLessThanOrEqual(100);
    });
  });

  describe('getState', () => {
    it('should return complete state object', () => {
      const state = powerMeter.getState();
      expect(state).toHaveProperty('value');
      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('oscillationSpeed');
      expect(typeof state.value).toBe('number');
      expect(typeof state.isActive).toBe('boolean');
      expect(typeof state.oscillationSpeed).toBe('number');
    });
  });

  describe('destroy', () => {
    it('should clean up animation frames and DOM', () => {
      powerMeter.startMeter();
      powerMeter.destroy();
      
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
      expect(mockContainer.innerHTML).toBe('');
    });
  });

  describe('powerToAngularVelocity', () => {
    it('should map power to angular velocity using linear curve', () => {
      const linearPowerMeter = new PowerMeter({
        containerId: 'test-power-meter',
        powerCurve: 'linear',
        minAngularVelocity: 1.0,
        maxAngularVelocity: 10.0,
      });
      
      expect(linearPowerMeter.powerToAngularVelocity(0)).toBe(1.0);
      expect(linearPowerMeter.powerToAngularVelocity(50)).toBe(5.5);
      expect(linearPowerMeter.powerToAngularVelocity(100)).toBe(10.0);
      
      linearPowerMeter.destroy();
    });

    it('should map power to angular velocity using quadratic curve', () => {
      const quadraticPowerMeter = new PowerMeter({
        containerId: 'test-power-meter',
        powerCurve: 'quadratic',
        minAngularVelocity: 0.5,
        maxAngularVelocity: 8.0,
      });
      
      expect(quadraticPowerMeter.powerToAngularVelocity(0)).toBe(0.5);
      expect(quadraticPowerMeter.powerToAngularVelocity(50)).toBe(2.375); // 0.5 + (8-0.5) * 0.25
      expect(quadraticPowerMeter.powerToAngularVelocity(100)).toBe(8.0);
      
      quadraticPowerMeter.destroy();
    });

    it('should map power to angular velocity using cubic curve', () => {
      const cubicPowerMeter = new PowerMeter({
        containerId: 'test-power-meter',
        powerCurve: 'cubic',
        minAngularVelocity: 1.0,
        maxAngularVelocity: 9.0,
      });
      
      expect(cubicPowerMeter.powerToAngularVelocity(0)).toBe(1.0);
      expect(cubicPowerMeter.powerToAngularVelocity(50)).toBe(2.0); // 1 + 8 * 0.125
      expect(cubicPowerMeter.powerToAngularVelocity(100)).toBe(9.0);
      
      cubicPowerMeter.destroy();
    });

    it('should clamp power values to valid range', () => {
      expect(powerMeter.powerToAngularVelocity(-10)).toBeGreaterThanOrEqual(0.5);
      expect(powerMeter.powerToAngularVelocity(150)).toBeLessThanOrEqual(8.0);
    });
  });

  describe('oscillation patterns', () => {
    it('should support sine wave oscillation', () => {
      const sinePowerMeter = new PowerMeter({
        containerId: 'test-power-meter',
        oscillationPattern: 'sine',
      });
      
      expect(sinePowerMeter).toBeInstanceOf(PowerMeter);
      sinePowerMeter.destroy();
    });

    it('should support triangle wave oscillation', () => {
      const trianglePowerMeter = new PowerMeter({
        containerId: 'test-power-meter',
        oscillationPattern: 'triangle',
      });
      
      expect(trianglePowerMeter).toBeInstanceOf(PowerMeter);
      trianglePowerMeter.destroy();
    });

    it('should support sawtooth wave oscillation', () => {
      const sawtoothPowerMeter = new PowerMeter({
        containerId: 'test-power-meter',
        oscillationPattern: 'sawtooth',
      });
      
      expect(sawtoothPowerMeter).toBeInstanceOf(PowerMeter);
      sawtoothPowerMeter.destroy();
    });
  });

  describe('timing feedback', () => {
    it('should calculate perfect timing feedback for center values', () => {
      const feedback = powerMeter.getTimingFeedback();
      // Initial value is 50, which should be perfect
      expect(feedback.zone).toBe('perfect');
      expect(feedback.accuracy).toBe(1.0);
      expect(feedback.color).toBe('#00ff00');
    });

    it('should calculate excellent timing feedback for near-center values', () => {
      // Simulate stopping at 60% power
      powerMeter.startMeter();
      // Mock the internal state to 60
      (powerMeter as any).state.value = 60;
      
      const feedback = powerMeter.getTimingFeedback();
      expect(feedback.zone).toBe('excellent');
      expect(feedback.accuracy).toBeGreaterThan(0.8);
      expect(feedback.color).toBe('#44ff44');
    });

    it('should calculate poor timing feedback for extreme values', () => {
      // Simulate stopping at 10% power
      powerMeter.startMeter();
      (powerMeter as any).state.value = 10;
      
      const feedback = powerMeter.getTimingFeedback();
      expect(feedback.zone).toBe('poor');
      expect(feedback.accuracy).toBeLessThan(0.6);
      expect(feedback.color).toBe('#ff4444');
    });
  });

  describe('dynamic configuration', () => {
    it('should update oscillation speed dynamically', () => {
      powerMeter.setOscillationSpeed(5.0);
      const state = powerMeter.getState();
      expect(state.oscillationSpeed).toBe(5.0);
    });

    it('should clamp oscillation speed to valid range', () => {
      powerMeter.setOscillationSpeed(-1.0);
      expect(powerMeter.getState().oscillationSpeed).toBe(0.1);
      
      powerMeter.setOscillationSpeed(20.0);
      expect(powerMeter.getState().oscillationSpeed).toBe(10.0);
    });

    it('should update oscillation pattern dynamically', () => {
      powerMeter.setOscillationPattern('triangle');
      expect((powerMeter as any).options.oscillationPattern).toBe('triangle');
    });

    it('should update power curve dynamically', () => {
      powerMeter.setPowerCurve('cubic');
      expect((powerMeter as any).options.powerCurve).toBe('cubic');
    });
  });

  describe('enhanced options', () => {
    it('should accept all enhanced options', () => {
      const enhancedOptions: PowerMeterOptions = {
        containerId: 'test-power-meter',
        width: 400,
        height: 50,
        oscillationSpeed: 3.0,
        oscillationPattern: 'triangle',
        minAngularVelocity: 1.0,
        maxAngularVelocity: 12.0,
        showTimingFeedback: true,
        powerCurve: 'cubic',
      };
      
      const enhancedPowerMeter = new PowerMeter(enhancedOptions);
      expect(enhancedPowerMeter).toBeInstanceOf(PowerMeter);
      
      const state = enhancedPowerMeter.getState();
      expect(state.oscillationSpeed).toBe(3.0);
      
      enhancedPowerMeter.destroy();
    });

    it('should use default values for optional parameters', () => {
      const minimalPowerMeter = new PowerMeter({
        containerId: 'test-power-meter',
      });
      
      expect(minimalPowerMeter).toBeInstanceOf(PowerMeter);
      expect((minimalPowerMeter as any).options.oscillationPattern).toBe('sine');
      expect((minimalPowerMeter as any).options.powerCurve).toBe('quadratic');
      expect((minimalPowerMeter as any).options.showTimingFeedback).toBe(true);
      
      minimalPowerMeter.destroy();
    });
  });
});