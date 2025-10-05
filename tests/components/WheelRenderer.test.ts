/**
 * Unit tests for WheelRenderer component
 * Ensures no regression from the original wheel creation functionality
 */

import { WheelRenderer } from '../../src/components/WheelRenderer';

// Mock DOM environment
const mockContainer = {
  innerHTML: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  remove: jest.fn(),
  id: 'test-container',
} as unknown as HTMLElement;

const mockWheel = {
  innerHTML: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  remove: jest.fn(),
  id: 'test-wheel',
} as unknown as HTMLElement;

// Mock document.getElementById
const originalGetElementById = document.getElementById;
beforeAll(() => {
  document.getElementById = jest.fn((id: string) => {
    if (id === 'test-container') {return mockContainer;}
    if (id === 'test-wheel') {return mockWheel;}
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
      remove: jest.fn(),
      textContent: '',
      id: '',
    } as unknown as HTMLElement;
    return element;
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

describe('WheelRenderer', () => {
  let wheelRenderer: WheelRenderer;

  beforeEach(() => {
    jest.clearAllMocks();
    wheelRenderer = new WheelRenderer('test-container');
  });

  describe('constructor', () => {
    it('should initialize with valid container', () => {
      expect(wheelRenderer).toBeInstanceOf(WheelRenderer);
      expect(document.getElementById).toHaveBeenCalledWith('test-container');
    });

    it('should throw error with invalid container', () => {
      expect(() => new WheelRenderer('invalid-container')).toThrow(
        'Container element with id \'invalid-container\' not found',
      );
    });
  });

  describe('createWheel', () => {
    it('should create wheel with correct wedge count', () => {
      const options = {
        wheelId: 'test-wheel',
        wedgeCount: 8,
        texts: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        radius: 200,
      };

      const wheel = wheelRenderer.createWheel(options);
      expect(wheel).toBeDefined();
      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    it('should handle big wheel styling', () => {
      const options = {
        wheelId: 'bigWheel',
        wedgeCount: 8,
        texts: Array(8).fill('test'),
        colors: ['#ff0000'],
        radius: 200,
      };

      const wheel = wheelRenderer.createWheel(options);
      expect(wheel).toBeDefined();
    });

    it('should handle small wheel styling', () => {
      const options = {
        wheelId: 'smallWheel',
        wedgeCount: 6,
        texts: Array(6).fill('test'),
        colors: ['#ff0000'],
        radius: 100,
      };

      const wheel = wheelRenderer.createWheel(options);
      expect(wheel).toBeDefined();
    });
  });

  describe('determineWedgeResult', () => {
    it('should calculate correct wedge index for 8 wedges', () => {
      const result = wheelRenderer.determineWedgeResult('test', 0, 8, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(8);
      expect(result.text).toBe(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][result.index]);
    });

    it('should calculate correct wedge index for 6 wedges', () => {
      const result = wheelRenderer.determineWedgeResult('test', 180, 6, ['1', '2', '3', '4', '5', '6']);
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(6);
      expect(result.text).toBe(['1', '2', '3', '4', '5', '6'][result.index]);
    });

    it('should handle negative angles correctly', () => {
      const result = wheelRenderer.determineWedgeResult('test', -90, 4, ['A', 'B', 'C', 'D']);
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(4);
    });

    it('should handle angles greater than 360', () => {
      const result = wheelRenderer.determineWedgeResult('test', 450, 4, ['A', 'B', 'C', 'D']);
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(4);
    });
  });

  describe('updateWheelRotation', () => {
    it('should update wheel rotation', () => {
      const options = {
        wheelId: 'test-wheel',
        wedgeCount: 4,
        texts: ['A', 'B', 'C', 'D'],
        colors: ['#ff0000'],
        radius: 100,
      };

      wheelRenderer.createWheel(options);
      wheelRenderer.updateWheelRotation('test-wheel', 90);
      
      // Verify the wheel exists in the internal map
      const wheel = wheelRenderer.getWheel('test-wheel');
      expect(wheel).toBeDefined();
    });
  });

  describe('clearWheels', () => {
    it('should clear all wheels', () => {
      const options = {
        wheelId: 'test-wheel',
        wedgeCount: 4,
        texts: ['A', 'B', 'C', 'D'],
        colors: ['#ff0000'],
        radius: 100,
      };

      wheelRenderer.createWheel(options);
      wheelRenderer.clearWheels();
      
      const wheel = wheelRenderer.getWheel('test-wheel');
      expect(wheel).toBeUndefined();
    });
  });
});