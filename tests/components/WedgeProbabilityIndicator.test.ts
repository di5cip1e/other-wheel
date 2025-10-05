/**
 * Unit tests for WedgeProbabilityIndicator component
 * Tests visual indicator functionality for probability vs visual size differences
 */

import { WedgeProbabilityIndicator, createProbabilityIndicator } from '../../src/components/WedgeProbabilityIndicator';
import { Wedge } from '../../src/models';

// Mock DOM environment
const createMockElement = () => {
  const element = {
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    classList: {
      remove: jest.fn(),
      add: jest.fn(),
    },
    parentNode: null as any,
    id: '',
  };
  
  // Allow parentNode to be set for testing
  Object.defineProperty(element, 'parentNode', {
    value: null,
    writable: true,
    configurable: true,
  });
  
  return element;
};

const mockDocument = {
  createElement: jest.fn(),
  getElementById: jest.fn(),
  head: { appendChild: jest.fn() },
};

// Setup DOM mocks
beforeAll(() => {
  global.document = mockDocument as any;
  mockDocument.createElement.mockImplementation(() => createMockElement());
});

describe('WedgeProbabilityIndicator', () => {
  let indicator: WedgeProbabilityIndicator;
  let testWedges: Wedge[];
  let mockContainer: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    
    indicator = new WedgeProbabilityIndicator();
    
    testWedges = [
      {
        id: 'wedge1',
        label: 'Low Weight',
        weight: 1,
        color: '#ff0000',
        visualAngle: 120, // Mismatch: low weight, high visual
      },
      {
        id: 'wedge2',
        label: 'Medium Weight',
        weight: 3,
        color: '#00ff00',
        visualAngle: 120, // Balanced
      },
      {
        id: 'wedge3',
        label: 'High Weight',
        weight: 6,
        color: '#0000ff',
        visualAngle: 120, // Mismatch: high weight, low visual
      },
    ];

    mockContainer = {
      appendChild: jest.fn(),
    } as any;
  });

  describe('constructor', () => {
    it('should create indicator with default config', () => {
      const defaultIndicator = new WedgeProbabilityIndicator();
      expect(defaultIndicator).toBeInstanceOf(WedgeProbabilityIndicator);
    });

    it('should create indicator with custom config', () => {
      const customConfig = {
        showPercentages: false,
        showRecommendations: false,
        highlightMismatches: false,
      };
      
      const customIndicator = new WedgeProbabilityIndicator(customConfig);
      expect(customIndicator).toBeInstanceOf(WedgeProbabilityIndicator);
    });
  });

  describe('createIndicator', () => {
    it('should create indicator element for a wedge', () => {
      const indicatorElement = indicator.createIndicator(testWedges[0]!, testWedges, mockContainer);
      
      expect(indicatorElement).toHaveProperty('element');
      expect(indicatorElement).toHaveProperty('wedgeId');
      expect(indicatorElement).toHaveProperty('update');
      expect(indicatorElement).toHaveProperty('destroy');
      expect(indicatorElement.wedgeId).toBe('wedge1');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should set correct attributes on indicator element', () => {
      const indicatorElement = indicator.createIndicator(testWedges[0]!, testWedges, mockContainer);
      
      expect(indicatorElement.element.className).toContain('wedge-probability-indicator');
      expect(indicatorElement.wedgeId).toBe('wedge1');
    });
  });

  describe('updateAllIndicators', () => {
    it('should update all existing indicators', () => {
      const indicator1 = indicator.createIndicator(testWedges[0]!, testWedges, mockContainer);
      const indicator2 = indicator.createIndicator(testWedges[1]!, testWedges, mockContainer);
      
      const updateSpy1 = jest.spyOn(indicator1, 'update');
      const updateSpy2 = jest.spyOn(indicator2, 'update');
      
      indicator.updateAllIndicators(testWedges);
      
      expect(updateSpy1).toHaveBeenCalledWith(testWedges[0], testWedges);
      expect(updateSpy2).toHaveBeenCalledWith(testWedges[1], testWedges);
    });

    it('should handle empty wedges array', () => {
      indicator.updateAllIndicators([]);
      // Should not throw error
    });
  });

  describe('removeIndicator', () => {
    it('should remove specific indicator', () => {
      const indicatorElement = indicator.createIndicator(testWedges[0]!, testWedges, mockContainer);
      const destroySpy = jest.spyOn(indicatorElement, 'destroy');
      
      indicator.removeIndicator('wedge1');
      
      expect(destroySpy).toHaveBeenCalled();
      expect(indicator.getIndicator('wedge1')).toBeUndefined();
    });

    it('should handle non-existent indicator', () => {
      indicator.removeIndicator('non-existent');
      // Should not throw error
    });
  });

  describe('clearAllIndicators', () => {
    it('should remove all indicators', () => {
      const indicator1 = indicator.createIndicator(testWedges[0]!, testWedges, mockContainer);
      const indicator2 = indicator.createIndicator(testWedges[1]!, testWedges, mockContainer);
      
      const destroySpy1 = jest.spyOn(indicator1, 'destroy');
      const destroySpy2 = jest.spyOn(indicator2, 'destroy');
      
      indicator.clearAllIndicators();
      
      expect(destroySpy1).toHaveBeenCalled();
      expect(destroySpy2).toHaveBeenCalled();
      expect(indicator.getIndicator('wedge1')).toBeUndefined();
      expect(indicator.getIndicator('wedge2')).toBeUndefined();
    });
  });

  describe('getIndicator', () => {
    it('should return existing indicator', () => {
      const created = indicator.createIndicator(testWedges[0]!, testWedges, mockContainer);
      const retrieved = indicator.getIndicator('wedge1');
      
      expect(retrieved).toBe(created);
    });

    it('should return undefined for non-existent indicator', () => {
      const retrieved = indicator.getIndicator('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        showPercentages: false,
        highlightMismatches: false,
      };
      
      indicator.updateConfig(newConfig);
      // Should not throw error
    });
  });

  describe('indicator element functionality', () => {
    it('should have working update method', () => {
      const indicatorElement = indicator.createIndicator(testWedges[0]!, testWedges, mockContainer);
      
      // Update with modified wedge
      const modifiedWedge = { ...testWedges[0]!, weight: 5 };
      const modifiedWedges = [modifiedWedge, ...testWedges.slice(1)];
      
      indicatorElement.update(modifiedWedge, modifiedWedges);
      // Should not throw error
    });

    it('should have working destroy method', () => {
      const indicatorElement = indicator.createIndicator(testWedges[0]!, testWedges, mockContainer);
      
      indicatorElement.destroy();
      // Should not throw error and should remove from indicators map
      expect(indicator.getIndicator('wedge1')).toBeUndefined();
    });
  });

  describe('CSS generation', () => {
    it('should generate CSS styles', () => {
      const css = WedgeProbabilityIndicator.generateCSS();
      
      expect(typeof css).toBe('string');
      expect(css.length).toBeGreaterThan(0);
      expect(css).toContain('.wedge-probability-indicator');
      expect(css).toContain('.severity-badge');
      expect(css).toContain('.probability-info');
    });

    it('should include all severity levels in CSS', () => {
      const css = WedgeProbabilityIndicator.generateCSS();
      
      expect(css).toContain('severity-low');
      expect(css).toContain('severity-medium');
      expect(css).toContain('severity-high');
    });
  });
});

describe('utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProbabilityIndicator', () => {
    it('should create indicator with default config', () => {
      const indicator = createProbabilityIndicator();
      
      expect(indicator).toBeInstanceOf(WedgeProbabilityIndicator);
    });

    it('should create indicator with custom config', () => {
      const config = { showPercentages: false };
      const indicator = createProbabilityIndicator(config);
      
      expect(indicator).toBeInstanceOf(WedgeProbabilityIndicator);
    });
  });
});

describe('integration scenarios', () => {
  let indicator: WedgeProbabilityIndicator;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    indicator = new WedgeProbabilityIndicator();
    mockContainer = { appendChild: jest.fn() } as any;
  });

  it('should handle wedges with extreme weight differences', () => {
    const extremeWedges: Wedge[] = [
      { id: 'rare', label: 'Rare', weight: 1, color: '#ff0000', visualAngle: 180 },
      { id: 'common', label: 'Common', weight: 99, color: '#00ff00', visualAngle: 180 },
    ];
    
    const indicator1 = indicator.createIndicator(extremeWedges[0]!, extremeWedges, mockContainer);
    const indicator2 = indicator.createIndicator(extremeWedges[1]!, extremeWedges, mockContainer);
    
    expect(indicator1.wedgeId).toBe('rare');
    expect(indicator2.wedgeId).toBe('common');
  });

  it('should handle wedges without visual angles', () => {
    const wedgesWithoutAngles: Wedge[] = [
      { id: 'wedge1', label: 'Wedge 1', weight: 1, color: '#ff0000' },
      { id: 'wedge2', label: 'Wedge 2', weight: 2, color: '#00ff00' },
    ];
    
    const indicatorElement = indicator.createIndicator(wedgesWithoutAngles[0]!, wedgesWithoutAngles, mockContainer);
    
    expect(indicatorElement.wedgeId).toBe('wedge1');
  });

  it('should handle single wedge scenario', () => {
    const singleWedge: Wedge[] = [
      { id: 'only', label: 'Only Wedge', weight: 1, color: '#ff0000' },
    ];
    
    const indicatorElement = indicator.createIndicator(singleWedge[0]!, singleWedge, mockContainer);
    
    expect(indicatorElement.wedgeId).toBe('only');
  });

  it('should handle dynamic wedge updates', () => {
    const initialWedges: Wedge[] = [
      { id: 'dynamic', label: 'Dynamic', weight: 1, color: '#ff0000' },
    ];
    
    const indicatorElement = indicator.createIndicator(initialWedges[0]!, initialWedges, mockContainer);
    
    // Update wedge weight
    const updatedWedges: Wedge[] = [
      { id: 'dynamic', label: 'Dynamic', weight: 5, color: '#ff0000' },
    ];
    
    indicatorElement.update(updatedWedges[0]!, updatedWedges);
    // Should not throw error
  });
});