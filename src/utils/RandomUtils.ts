/**
 * Deterministic Random Number Generator utilities
 * Uses Linear Congruential Generator (LCG) for reproducible results
 */

export interface RandomGenerator {
  next(): number; // Returns value between 0 and 1
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  getSeed(): number;
  setSeed(seed: number): void;
}

/**
 * Linear Congruential Generator implementation
 * Uses parameters from Numerical Recipes (a = 1664525, c = 1013904223, m = 2^32)
 */
export class LCGRandom implements RandomGenerator {
  private seed: number;
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = Math.pow(2, 32);

  constructor(seed: number = Date.now()) {
    this.seed = seed >>> 0; // Ensure 32-bit unsigned integer
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    if (min >= max) {
      throw new Error('min must be less than max');
    }
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Generate random float between min (inclusive) and max (exclusive)
   */
  nextFloat(min: number, max: number): number {
    if (min >= max) {
      throw new Error('min must be less than max');
    }
    return this.next() * (max - min) + min;
  }

  /**
   * Get current seed value
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Set seed value for reproducible sequences
   */
  setSeed(seed: number): void {
    this.seed = seed >>> 0; // Ensure 32-bit unsigned integer
  }
}

/**
 * Weighted random selection utility
 */
export class WeightedSelector {
  private rng: RandomGenerator;

  constructor(rng: RandomGenerator) {
    this.rng = rng;
  }

  /**
   * Select an item based on weights
   * @param items Array of items to select from
   * @param weights Array of weights corresponding to items
   * @returns Selected item
   */
  select<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights arrays must have the same length');
    }

    if (items.length === 0) {
      throw new Error('Cannot select from empty array');
    }

    // Calculate total weight
    const totalWeight = weights.reduce((sum, weight) => {
      if (weight < 0) {
        throw new Error('Weights must be non-negative');
      }
      return sum + weight;
    }, 0);

    if (totalWeight === 0) {
      throw new Error('Total weight must be greater than 0');
    }

    // Generate random value between 0 and totalWeight
    const randomValue = this.rng.next() * totalWeight;

    // Find the selected item
    let cumulativeWeight = 0;
    for (let i = 0; i < items.length; i++) {
      cumulativeWeight += weights[i]!;
      if (randomValue <= cumulativeWeight) {
        return items[i]!;
      }
    }

    // Fallback (should never reach here due to floating point precision)
    return items[items.length - 1]!;
  }

  /**
   * Select an item by index based on weights
   * @param weights Array of weights
   * @returns Selected index
   */
  selectIndex(weights: number[]): number {
    const indices = Array.from({ length: weights.length }, (_, i) => i);
    return this.select(indices, weights);
  }
}

/**
 * Global deterministic RNG instance
 * Can be used throughout the application for consistent random behavior
 */
export class DeterministicRNG {
  private static instance: LCGRandom | null = null;
  private static selector: WeightedSelector | null = null;

  /**
   * Initialize the global RNG with a seed
   */
  static initialize(seed: number): void {
    this.instance = new LCGRandom(seed);
    this.selector = new WeightedSelector(this.instance);
  }

  /**
   * Get the global RNG instance
   */
  static getInstance(): LCGRandom {
    if (!this.instance) {
      this.initialize(Date.now());
    }
    return this.instance!;
  }

  /**
   * Get the global weighted selector
   */
  static getSelector(): WeightedSelector {
    if (!this.selector) {
      this.initialize(Date.now());
    }
    return this.selector!;
  }

  /**
   * Generate a random number between 0 and 1
   */
  static next(): number {
    return this.getInstance().next();
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  static nextInt(min: number, max: number): number {
    return this.getInstance().nextInt(min, max);
  }

  /**
   * Generate random float between min (inclusive) and max (exclusive)
   */
  static nextFloat(min: number, max: number): number {
    return this.getInstance().nextFloat(min, max);
  }

  /**
   * Set the global seed
   */
  static setSeed(seed: number): void {
    this.getInstance().setSeed(seed);
  }

  /**
   * Get the current seed
   */
  static getSeed(): number {
    return this.getInstance().getSeed();
  }

  /**
   * Select item based on weights using global selector
   */
  static selectWeighted<T>(items: T[], weights: number[]): T {
    return this.getSelector().select(items, weights);
  }

  /**
   * Select index based on weights using global selector
   */
  static selectWeightedIndex(weights: number[]): number {
    return this.getSelector().selectIndex(weights);
  }
}

/**
 * Utility functions for statistical validation
 */
export class StatisticalUtils {
  /**
   * Test if a weighted selection distribution matches expected probabilities
   * @param weights Array of weights
   * @param samples Number of samples to test
   * @param tolerance Acceptable deviation from expected probability
   * @param seed Optional seed for reproducible testing
   * @returns Object with test results
   */
  static testWeightedDistribution(
    weights: number[], 
    samples: number = 10000, 
    tolerance: number = 0.05,
    seed?: number
  ): { passed: boolean; results: number[]; expected: number[]; deviations: number[] } {
    const originalSeed = DeterministicRNG.getSeed();
    
    if (seed !== undefined) {
      DeterministicRNG.setSeed(seed);
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const expected = weights.map(w => w / totalWeight);
    const counts = new Array(weights.length).fill(0);

    // Perform sampling
    for (let i = 0; i < samples; i++) {
      const selectedIndex = DeterministicRNG.selectWeightedIndex(weights);
      counts[selectedIndex]++;
    }

    // Calculate actual probabilities and deviations
    const results = counts.map(count => count / samples);
    const deviations = results.map((actual, i) => Math.abs(actual - expected[i]!));
    
    // Check if all deviations are within tolerance
    const passed = deviations.every(deviation => deviation <= tolerance);

    // Restore original seed
    if (seed !== undefined) {
      DeterministicRNG.setSeed(originalSeed);
    }

    return { passed, results, expected, deviations };
  }
}