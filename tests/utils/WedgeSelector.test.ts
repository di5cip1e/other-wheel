/**
 * Unit tests for WedgeSelector utility class
 * Tests weighted probability selection with deterministic RNG
 */

import { WedgeSelector, createDeterministicWedgeSelector, createGlobalWedgeSelector } from '../../src/utils/WedgeSelector';
import { Wedge } from '../../src/models';

describe('WedgeSelector', () => {
  let wedgeSelector: WedgeSelector;
  let testWedges: Wedge[];

  beforeEach(() => {
    // Create deterministic selector with fixed seed
    wedgeSelector = createDeterministicWedgeSelector(12345);
    
    // Create test wedges with different weights
    testWedges = [
      {
        id: 'wedge1',
        label: 'Low Weight',
        weight: 1,
        color: '#ff0000',
      },
      {
        id: 'wedge2',
        label: 'Medium Weight',
        weight: 3,
        color: '#00ff00',
      },
      {
        id: 'wedge3',
        label: 'High Weight',
        weight: 6,
        color: '#0000ff',
      },
    ];
  });

  describe('selectWedge', () => {
    it('should select a wedge based on weights', () => {
      const result = wedgeSelector.selectWedge(testWedges);
      
      expect(result).toHaveProperty('wedge');
      expect(result).toHaveProperty('index');
      expect(result).toHaveProperty('probability');
      expect(result.wedge).toBeInstanceOf(Object);
      expect(typeof result.index).toBe('number');
      expect(typeof result.probability).toBe('number');
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(testWedges.length);
    });

    it('should calculate correct probabilities', () => {
      const result = wedgeSelector.selectWedge(testWedges);
      const totalWeight = testWedges.reduce((sum, w) => sum + w.weight, 0); // 1+3+6 = 10
      const expectedProbability = result.wedge.weight / totalWeight;
      
      expect(result.probability).toBeCloseTo(expectedProbability, 6);
    });

    it('should throw error for empty wedge array', () => {
      expect(() => wedgeSelector.selectWedge([])).toThrow('Cannot select from empty wedge array');
    });

    it('should handle single wedge', () => {
      const singleWedge = [testWedges[0]!];
      const result = wedgeSelector.selectWedge(singleWedge);
      
      expect(result.wedge).toBe(singleWedge[0]);
      expect(result.index).toBe(0);
      expect(result.probability).toBe(1);
    });

    it('should be deterministic with same seed', () => {
      const selector1 = createDeterministicWedgeSelector(42);
      const selector2 = createDeterministicWedgeSelector(42);
      
      const result1 = selector1.selectWedge(testWedges);
      const result2 = selector2.selectWedge(testWedges);
      
      expect(result1.wedge.id).toBe(result2.wedge.id);
      expect(result1.index).toBe(result2.index);
    });
  });

  describe('selectMultipleWedges', () => {
    it('should select wedges from multiple wheel sets', () => {
      const wheel1Wedges = testWedges.slice(0, 2);
      const wheel2Wedges = testWedges.slice(1, 3);
      
      const results = wedgeSelector.selectMultipleWedges([wheel1Wedges, wheel2Wedges]);
      
      expect(results).toHaveLength(2);
      expect(results[0]!.wedge).toBeDefined();
      expect(results[1]!.wedge).toBeDefined();
      expect(wheel1Wedges).toContain(results[0]!.wedge);
      expect(wheel2Wedges).toContain(results[1]!.wedge);
    });

    it('should handle empty wheel sets array', () => {
      const results = wedgeSelector.selectMultipleWedges([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('analyzeWeightDistribution', () => {
    it('should analyze weight distribution correctly', () => {
      const analysis = wedgeSelector.analyzeWeightDistribution(testWedges);
      
      expect(analysis.totalWeight).toBe(10); // 1+3+6
      expect(analysis.probabilities).toHaveLength(3);
      expect(analysis.probabilities[0]).toBeCloseTo(0.1, 6); // 1/10
      expect(analysis.probabilities[1]).toBeCloseTo(0.3, 6); // 3/10
      expect(analysis.probabilities[2]).toBeCloseTo(0.6, 6); // 6/10
      expect(analysis.visualAngles).toHaveLength(3);
      expect(analysis.probabilityVsVisualDifferences).toHaveLength(3);
      expect(typeof analysis.isBalanced).toBe('boolean');
      expect(typeof analysis.maxDeviation).toBe('number');
    });

    it('should handle wedges with visual angles', () => {
      const wedgesWithVisualAngles: Wedge[] = [
        { ...testWedges[0]!, visualAngle: 90 },
        { ...testWedges[1]!, visualAngle: 180 },
        { ...testWedges[2]!, visualAngle: 90 },
      ];
      
      const analysis = wedgeSelector.analyzeWeightDistribution(wedgesWithVisualAngles);
      
      expect(analysis.visualAngles).toEqual([90, 180, 90]);
      expect(analysis.probabilityVsVisualDifferences[0]).toBeGreaterThan(0); // Should show mismatch
    });

    it('should throw error for empty wedge array', () => {
      expect(() => wedgeSelector.analyzeWeightDistribution([])).toThrow('Cannot analyze empty wedge array');
    });
  });

  describe('calculateExpectedProbabilities', () => {
    it('should calculate correct expected probabilities', () => {
      const probabilities = wedgeSelector.calculateExpectedProbabilities(testWedges);
      
      expect(probabilities).toHaveLength(3);
      expect(probabilities[0]).toBeCloseTo(0.1, 6); // 1/10
      expect(probabilities[1]).toBeCloseTo(0.3, 6); // 3/10
      expect(probabilities[2]).toBeCloseTo(0.6, 6); // 6/10
      expect(probabilities.reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 6);
    });

    it('should handle equal weights', () => {
      const equalWeightWedges = testWedges.map(w => ({ ...w, weight: 1 }));
      const probabilities = wedgeSelector.calculateExpectedProbabilities(equalWeightWedges);
      
      probabilities.forEach(p => {
        expect(p).toBeCloseTo(1/3, 6);
      });
    });
  });

  describe('testWeightDistributionAccuracy', () => {
    it('should test weight distribution over large samples', () => {
      const testResult = wedgeSelector.testWeightDistributionAccuracy(testWedges, 10000, 0.05, 12345);
      
      expect(testResult.passed).toBeDefined();
      expect(testResult.actualProbabilities).toHaveLength(3);
      expect(testResult.expectedProbabilities).toHaveLength(3);
      expect(testResult.deviations).toHaveLength(3);
      expect(testResult.maxDeviation).toBeGreaterThanOrEqual(0);
      expect(testResult.sampleCount).toBe(10000);
      
      // With 10000 samples and deterministic RNG, should be quite accurate
      expect(testResult.maxDeviation).toBeLessThan(0.05);
      expect(testResult.passed).toBe(true);
    });

    it('should be deterministic with same seed', () => {
      const result1 = wedgeSelector.testWeightDistributionAccuracy(testWedges, 1000, 0.05, 42);
      const result2 = wedgeSelector.testWeightDistributionAccuracy(testWedges, 1000, 0.05, 42);
      
      expect(result1.actualProbabilities).toEqual(result2.actualProbabilities);
      expect(result1.deviations).toEqual(result2.deviations);
    });

    it('should handle different tolerance levels', () => {
      const strictResult = wedgeSelector.testWeightDistributionAccuracy(testWedges, 1000, 0.01, 12345);
      const lenientResult = wedgeSelector.testWeightDistributionAccuracy(testWedges, 1000, 0.1, 12345);
      
      // Same deviations, but different pass/fail based on tolerance
      expect(strictResult.deviations).toEqual(lenientResult.deviations);
      expect(lenientResult.passed).toBe(true); // More likely to pass with higher tolerance
    });

    it('should throw error for empty wedge array', () => {
      expect(() => wedgeSelector.testWeightDistributionAccuracy([], 1000)).toThrow('Cannot test empty wedge array');
    });
  });

  describe('generateVisualIndicators', () => {
    it('should generate visual indicators for probability vs visual differences', () => {
      const indicators = wedgeSelector.generateVisualIndicators(testWedges);
      
      expect(indicators).toHaveLength(3);
      indicators.forEach(indicator => {
        expect(indicator).toHaveProperty('wedgeId');
        expect(indicator).toHaveProperty('label');
        expect(indicator).toHaveProperty('probabilityWeight');
        expect(indicator).toHaveProperty('visualWeight');
        expect(indicator).toHaveProperty('difference');
        expect(indicator).toHaveProperty('severity');
        expect(indicator).toHaveProperty('recommendation');
        expect(['low', 'medium', 'high']).toContain(indicator.severity);
        expect(typeof indicator.recommendation).toBe('string');
      });
    });

    it('should classify severity levels correctly', () => {
      const wedgesWithMismatch: Wedge[] = [
        { ...testWedges[0]!, visualAngle: 180 }, // High visual, low weight = high severity
        { ...testWedges[1]!, visualAngle: 120 }, // Medium mismatch
        { ...testWedges[2]!, visualAngle: 60 },   // Low visual, high weight = high severity
      ];
      
      const indicators = wedgeSelector.generateVisualIndicators(wedgesWithMismatch);
      
      // Should have some high severity indicators due to mismatches
      const severities = indicators.map(i => i.severity);
      expect(severities).toContain('high');
    });
  });

  describe('weight validation', () => {
    it('should throw error for negative weights', () => {
      const invalidWedges = [
        { ...testWedges[0]!, weight: -1 },
      ];
      
      expect(() => wedgeSelector.selectWedge(invalidWedges)).toThrow('All weights must be non-negative');
    });

    it('should throw error for zero total weight', () => {
      const zeroWeightWedges = testWedges.map(w => ({ ...w, weight: 0 }));
      
      expect(() => wedgeSelector.selectWedge(zeroWeightWedges)).toThrow('Total weight must be greater than 0');
    });

    it('should throw error for infinite weights', () => {
      const infiniteWeightWedges = [
        { ...testWedges[0]!, weight: Infinity },
      ];
      
      expect(() => wedgeSelector.selectWedge(infiniteWeightWedges)).toThrow('All weights must be finite numbers');
    });

    it('should throw error for NaN weights', () => {
      const nanWeightWedges = [
        { ...testWedges[0]!, weight: NaN },
      ];
      
      expect(() => wedgeSelector.selectWedge(nanWeightWedges)).toThrow('All weights must be finite numbers');
    });
  });

  describe('factory functions', () => {
    it('should create deterministic selector with seed', () => {
      const selector1 = createDeterministicWedgeSelector(123);
      const selector2 = createDeterministicWedgeSelector(123);
      
      const result1 = selector1.selectWedge(testWedges);
      const result2 = selector2.selectWedge(testWedges);
      
      expect(result1.wedge.id).toBe(result2.wedge.id);
    });

    it('should create global selector', () => {
      const selector = createGlobalWedgeSelector();
      const result = selector.selectWedge(testWedges);
      
      expect(result).toHaveProperty('wedge');
      expect(result).toHaveProperty('index');
      expect(result).toHaveProperty('probability');
    });
  });

  describe('statistical accuracy over large samples', () => {
    it('should maintain statistical accuracy with 50000 samples', () => {
      const largeTestResult = wedgeSelector.testWeightDistributionAccuracy(testWedges, 50000, 0.02, 12345);
      
      expect(largeTestResult.passed).toBe(true);
      expect(largeTestResult.maxDeviation).toBeLessThan(0.02);
      
      // Check that actual probabilities are close to expected
      largeTestResult.actualProbabilities.forEach((actual, i) => {
        const expected = largeTestResult.expectedProbabilities[i]!;
        expect(Math.abs(actual - expected)).toBeLessThan(0.02);
      });
    });

    it('should handle extreme weight distributions', () => {
      const extremeWedges: Wedge[] = [
        { id: 'rare', label: 'Rare', weight: 1, color: '#ff0000' },
        { id: 'common', label: 'Common', weight: 99, color: '#00ff00' },
      ];
      
      const testResult = wedgeSelector.testWeightDistributionAccuracy(extremeWedges, 10000, 0.05, 12345);
      
      expect(testResult.passed).toBe(true);
      expect(testResult.actualProbabilities[0]).toBeCloseTo(0.01, 2); // 1/100
      expect(testResult.actualProbabilities[1]).toBeCloseTo(0.99, 2); // 99/100
    });

    it('should handle many wedges with different weights', () => {
      const manyWedges: Wedge[] = Array.from({ length: 10 }, (_, i) => ({
        id: `wedge${i}`,
        label: `Wedge ${i}`,
        weight: i + 1, // weights 1, 2, 3, ..., 10
        color: `#${i.toString(16).repeat(6).slice(0, 6)}`,
      }));
      
      const testResult = wedgeSelector.testWeightDistributionAccuracy(manyWedges, 20000, 0.05, 12345);
      
      expect(testResult.passed).toBe(true);
      expect(testResult.actualProbabilities).toHaveLength(10);
      
      // Total weight is 1+2+...+10 = 55
      // So wedge i should have probability (i+1)/55
      testResult.actualProbabilities.forEach((actual, i) => {
        const expected = (i + 1) / 55;
        expect(Math.abs(actual - expected)).toBeLessThan(0.05);
      });
    });
  });
});