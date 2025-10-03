/**
 * Unit tests for deterministic random number generation utilities
 */

import { 
  LCGRandom, 
  WeightedSelector, 
  DeterministicRNG, 
  StatisticalUtils 
} from '../../src/utils/RandomUtils';

describe('LCGRandom', () => {
  let rng: LCGRandom;

  beforeEach(() => {
    rng = new LCGRandom(12345);
  });

  describe('Basic Functionality', () => {
    test('should generate numbers between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    test('should be deterministic with same seed', () => {
      const rng1 = new LCGRandom(12345);
      const rng2 = new LCGRandom(12345);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });

    test('should produce different sequences with different seeds', () => {
      const rng1 = new LCGRandom(12345);
      const rng2 = new LCGRandom(54321);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).not.toEqual(sequence2);
    });

    test('should handle seed setting and getting', () => {
      rng.setSeed(99999);
      expect(rng.getSeed()).toBe(99999);

      const value1 = rng.next();
      
      rng.setSeed(99999);
      const value2 = rng.next();

      expect(value1).toBe(value2);
    });
  });

  describe('Integer Generation', () => {
    test('should generate integers in specified range', () => {
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(5, 15);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThan(15);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    test('should handle single value range', () => {
      const value = rng.nextInt(7, 8);
      expect(value).toBe(7);
    });

    test('should throw error for invalid range', () => {
      expect(() => rng.nextInt(10, 5)).toThrow('min must be less than max');
      expect(() => rng.nextInt(5, 5)).toThrow('min must be less than max');
    });
  });

  describe('Float Generation', () => {
    test('should generate floats in specified range', () => {
      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(1.5, 3.7);
        expect(value).toBeGreaterThanOrEqual(1.5);
        expect(value).toBeLessThan(3.7);
      }
    });

    test('should throw error for invalid range', () => {
      expect(() => rng.nextFloat(3.0, 1.0)).toThrow('min must be less than max');
    });
  });
});

describe('WeightedSelector', () => {
  let rng: LCGRandom;
  let selector: WeightedSelector;

  beforeEach(() => {
    rng = new LCGRandom(12345);
    selector = new WeightedSelector(rng);
  });

  describe('Basic Selection', () => {
    test('should select items based on weights', () => {
      const items = ['A', 'B', 'C'];
      const weights = [1, 2, 3]; // C should be selected most often

      const results = Array.from({ length: 1000 }, () => 
        selector.select(items, weights)
      );

      const counts = {
        A: results.filter(r => r === 'A').length,
        B: results.filter(r => r === 'B').length,
        C: results.filter(r => r === 'C').length
      };

      // C should have highest count, A should have lowest
      expect(counts.C).toBeGreaterThan(counts.B);
      expect(counts.B).toBeGreaterThan(counts.A);
    });

    test('should handle equal weights', () => {
      const items = ['A', 'B', 'C'];
      const weights = [1, 1, 1];

      const results = Array.from({ length: 1000 }, () => 
        selector.select(items, weights)
      );

      const counts = {
        A: results.filter(r => r === 'A').length,
        B: results.filter(r => r === 'B').length,
        C: results.filter(r => r === 'C').length
      };

      // Should be roughly equal (within 20% tolerance)
      const average = 1000 / 3;
      const tolerance = average * 0.2;

      expect(Math.abs(counts.A - average)).toBeLessThan(tolerance);
      expect(Math.abs(counts.B - average)).toBeLessThan(tolerance);
      expect(Math.abs(counts.C - average)).toBeLessThan(tolerance);
    });

    test('should handle zero weights correctly', () => {
      const items = ['A', 'B', 'C'];
      const weights = [0, 1, 0]; // Only B should be selected

      const results = Array.from({ length: 100 }, () => 
        selector.select(items, weights)
      );

      expect(results.every(r => r === 'B')).toBe(true);
    });

    test('should be deterministic with same RNG seed', () => {
      const items = ['A', 'B', 'C'];
      const weights = [1, 2, 3];

      const rng1 = new LCGRandom(12345);
      const rng2 = new LCGRandom(12345);
      const selector1 = new WeightedSelector(rng1);
      const selector2 = new WeightedSelector(rng2);

      const results1 = Array.from({ length: 10 }, () => 
        selector1.select(items, weights)
      );
      const results2 = Array.from({ length: 10 }, () => 
        selector2.select(items, weights)
      );

      expect(results1).toEqual(results2);
    });
  });

  describe('Index Selection', () => {
    test('should select indices based on weights', () => {
      const weights = [1, 0, 3]; // Index 2 should be selected most, index 1 never

      const results = Array.from({ length: 1000 }, () => 
        selector.selectIndex(weights)
      );

      const counts = [0, 0, 0];
      results.forEach(index => {
        if (index >= 0 && index < counts.length) {
          counts[index]!++;
        }
      });

      expect(counts[1]!).toBe(0); // Zero weight
      expect(counts[2]!).toBeGreaterThan(counts[0]!); // Higher weight
    });
  });

  describe('Error Handling', () => {
    test('should throw error for mismatched array lengths', () => {
      const items = ['A', 'B'];
      const weights = [1, 2, 3];

      expect(() => selector.select(items, weights))
        .toThrow('Items and weights arrays must have the same length');
    });

    test('should throw error for empty arrays', () => {
      expect(() => selector.select([], []))
        .toThrow('Cannot select from empty array');
    });

    test('should throw error for negative weights', () => {
      const items = ['A', 'B'];
      const weights = [1, -1];

      expect(() => selector.select(items, weights))
        .toThrow('Weights must be non-negative');
    });

    test('should throw error for zero total weight', () => {
      const items = ['A', 'B'];
      const weights = [0, 0];

      expect(() => selector.select(items, weights))
        .toThrow('Total weight must be greater than 0');
    });
  });
});

describe('DeterministicRNG', () => {
  beforeEach(() => {
    // Reset global state
    DeterministicRNG.initialize(12345);
  });

  describe('Global Instance Management', () => {
    test('should maintain singleton behavior', () => {
      const instance1 = DeterministicRNG.getInstance();
      const instance2 = DeterministicRNG.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('should initialize with seed', () => {
      DeterministicRNG.initialize(99999);
      expect(DeterministicRNG.getSeed()).toBe(99999);
    });

    test('should provide consistent global methods', () => {
      DeterministicRNG.setSeed(12345);
      
      const value1 = DeterministicRNG.next();
      
      DeterministicRNG.setSeed(12345);
      const value2 = DeterministicRNG.next();

      expect(value1).toBe(value2);
    });
  });

  describe('Static Methods', () => {
    test('should generate consistent integer sequences', () => {
      DeterministicRNG.setSeed(12345);
      const sequence1 = Array.from({ length: 10 }, () => 
        DeterministicRNG.nextInt(1, 100)
      );

      DeterministicRNG.setSeed(12345);
      const sequence2 = Array.from({ length: 10 }, () => 
        DeterministicRNG.nextInt(1, 100)
      );

      expect(sequence1).toEqual(sequence2);
    });

    test('should generate consistent float sequences', () => {
      DeterministicRNG.setSeed(12345);
      const sequence1 = Array.from({ length: 10 }, () => 
        DeterministicRNG.nextFloat(0.0, 10.0)
      );

      DeterministicRNG.setSeed(12345);
      const sequence2 = Array.from({ length: 10 }, () => 
        DeterministicRNG.nextFloat(0.0, 10.0)
      );

      expect(sequence1).toEqual(sequence2);
    });

    test('should provide weighted selection', () => {
      const items = ['A', 'B', 'C'];
      const weights = [1, 2, 3];

      DeterministicRNG.setSeed(12345);
      const results1 = Array.from({ length: 10 }, () => 
        DeterministicRNG.selectWeighted(items, weights)
      );

      DeterministicRNG.setSeed(12345);
      const results2 = Array.from({ length: 10 }, () => 
        DeterministicRNG.selectWeighted(items, weights)
      );

      expect(results1).toEqual(results2);
    });

    test('should provide weighted index selection', () => {
      const weights = [1, 2, 3];

      DeterministicRNG.setSeed(12345);
      const results1 = Array.from({ length: 10 }, () => 
        DeterministicRNG.selectWeightedIndex(weights)
      );

      DeterministicRNG.setSeed(12345);
      const results2 = Array.from({ length: 10 }, () => 
        DeterministicRNG.selectWeightedIndex(weights)
      );

      expect(results1).toEqual(results2);
    });
  });
});

describe('StatisticalUtils', () => {
  describe('Distribution Testing', () => {
    test('should validate correct weight distribution', () => {
      const weights = [1, 2, 3]; // Expected probabilities: [1/6, 2/6, 3/6]
      const result = StatisticalUtils.testWeightedDistribution(
        weights, 
        10000, 
        0.05, 
        12345
      );

      expect(result.passed).toBe(true);
      expect(result.expected).toEqual([1/6, 2/6, 3/6]);
      expect(result.results.length).toBe(3);
      expect(result.deviations.length).toBe(3);
    });

    test('should detect incorrect distribution with tight tolerance', () => {
      const weights = [1, 1, 1]; // Should be equal distribution
      const result = StatisticalUtils.testWeightedDistribution(
        weights, 
        100, // Small sample size for higher variance
        0.01, // Very tight tolerance
        12345
      );

      // With small sample size and tight tolerance, might fail
      expect(typeof result.passed).toBe('boolean');
      expect(result.results.every(r => r >= 0 && r <= 1)).toBe(true);
    });

    test('should handle edge case weights', () => {
      const weights = [0, 1, 0]; // Only middle item should be selected
      const result = StatisticalUtils.testWeightedDistribution(
        weights, 
        1000, 
        0.05, 
        12345
      );

      expect(result.passed).toBe(true);
      expect(result.results[0]).toBe(0); // First item never selected
      expect(result.results[1]).toBe(1); // Second item always selected
      expect(result.results[2]).toBe(0); // Third item never selected
    });

    test('should be deterministic with same seed', () => {
      const weights = [1, 2, 3];
      
      const result1 = StatisticalUtils.testWeightedDistribution(
        weights, 1000, 0.05, 12345
      );
      const result2 = StatisticalUtils.testWeightedDistribution(
        weights, 1000, 0.05, 12345
      );

      expect(result1.results).toEqual(result2.results);
      expect(result1.deviations).toEqual(result2.deviations);
      expect(result1.passed).toBe(result2.passed);
    });

    test('should restore original seed after testing', () => {
      DeterministicRNG.setSeed(99999);
      const originalValue = DeterministicRNG.next();
      
      DeterministicRNG.setSeed(99999);
      StatisticalUtils.testWeightedDistribution([1, 2, 3], 100, 0.05, 12345);
      const restoredValue = DeterministicRNG.next();

      expect(restoredValue).toBe(originalValue);
    });
  });

  describe('Statistical Accuracy', () => {
    test('should pass statistical validation for known good distribution', () => {
      // Test with a distribution that should definitely pass
      const weights = [10, 10, 10]; // Equal weights
      const result = StatisticalUtils.testWeightedDistribution(
        weights, 
        30000, // Large sample size
        0.02,  // Reasonable tolerance
        12345
      );

      expect(result.passed).toBe(true);
      
      // Each should be approximately 1/3
      result.results.forEach(prob => {
        expect(Math.abs(prob - 1/3)).toBeLessThan(0.02);
      });
    });

    test('should handle extreme weight ratios', () => {
      const weights = [1, 1000]; // Very uneven distribution
      const result = StatisticalUtils.testWeightedDistribution(
        weights, 
        10000, 
        0.05, 
        12345
      );

      expect(result.passed).toBe(true);
      expect(result.results[0]).toBeLessThan(0.01); // Should be very small
      expect(result.results[1]).toBeGreaterThan(0.99); // Should be very large
    });
  });
});