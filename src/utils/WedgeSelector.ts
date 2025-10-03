/**
 * WedgeSelector utility class for probability-based wedge selection
 * Implements weighted random selection algorithm independent of visual wedge sizes
 */

import { Wedge } from '../models';
import { DeterministicRNG, RandomGenerator, LCGRandom } from './RandomUtils';

export interface WedgeSelectionResult {
  wedge: Wedge;
  index: number;
  probability: number;
}

export interface WeightDistributionAnalysis {
  totalWeight: number;
  probabilities: number[];
  visualAngles: number[];
  probabilityVsVisualDifferences: number[];
  isBalanced: boolean;
  maxDeviation: number;
}

/**
 * Utility class for selecting wedges based on probability weights
 * Independent of visual wedge sizes
 */
export class WedgeSelector {
  private rng: RandomGenerator;

  constructor(rng?: RandomGenerator) {
    this.rng = rng || DeterministicRNG.getInstance();
  }

  /**
   * Select a wedge based on probability weights
   * @param wedges Array of wedges to select from
   * @returns Selection result with wedge, index, and probability
   */
  selectWedge(wedges: Wedge[]): WedgeSelectionResult {
    if (wedges.length === 0) {
      throw new Error('Cannot select from empty wedge array');
    }

    const weights = wedges.map(wedge => wedge.weight);
    this.validateWeights(weights);

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const selectedIndex = this.selectWeightedIndex(weights);
    const selectedWedge = wedges[selectedIndex]!;
    const probability = selectedWedge.weight / totalWeight;

    return {
      wedge: selectedWedge,
      index: selectedIndex,
      probability
    };
  }

  /**
   * Select multiple wedges (for multiple wheels)
   * @param wedgeSets Array of wedge arrays (one per wheel)
   * @returns Array of selection results
   */
  selectMultipleWedges(wedgeSets: Wedge[][]): WedgeSelectionResult[] {
    return wedgeSets.map(wedges => this.selectWedge(wedges));
  }

  /**
   * Analyze weight distribution for a set of wedges
   * @param wedges Array of wedges to analyze
   * @returns Distribution analysis including probability vs visual differences
   */
  analyzeWeightDistribution(wedges: Wedge[]): WeightDistributionAnalysis {
    if (wedges.length === 0) {
      throw new Error('Cannot analyze empty wedge array');
    }

    const weights = wedges.map(wedge => wedge.weight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const probabilities = weights.map(weight => weight / totalWeight);

    // Calculate visual angles (default to equal if not specified)
    const totalVisualAngle = 360; // degrees
    const visualAngles = wedges.map(wedge => {
      if (wedge.visualAngle !== undefined) {
        return wedge.visualAngle;
      }
      // Default to equal visual distribution
      return totalVisualAngle / wedges.length;
    });

    // Normalize visual angles to probabilities for comparison
    const totalVisualAngleSum = visualAngles.reduce((sum, angle) => sum + angle, 0);
    const visualProbabilities = visualAngles.map(angle => angle / totalVisualAngleSum);

    // Calculate differences between probability weights and visual representation
    const probabilityVsVisualDifferences = probabilities.map((prob, i) => 
      Math.abs(prob - visualProbabilities[i]!)
    );

    const maxDeviation = Math.max(...probabilityVsVisualDifferences);
    const isBalanced = maxDeviation < 0.05; // 5% tolerance

    return {
      totalWeight,
      probabilities,
      visualAngles,
      probabilityVsVisualDifferences,
      isBalanced,
      maxDeviation
    };
  }

  /**
   * Calculate expected probabilities for wedges
   * @param wedges Array of wedges
   * @returns Array of expected probabilities
   */
  calculateExpectedProbabilities(wedges: Wedge[]): number[] {
    const weights = wedges.map(wedge => wedge.weight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    return weights.map(weight => weight / totalWeight);
  }

  /**
   * Test weight distribution accuracy over large samples
   * @param wedges Array of wedges to test
   * @param samples Number of samples to run (default: 10000)
   * @param tolerance Acceptable deviation from expected probability (default: 0.05)
   * @param seed Optional seed for reproducible testing
   * @returns Test results
   */
  testWeightDistributionAccuracy(
    wedges: Wedge[], 
    samples: number = 10000, 
    tolerance: number = 0.05,
    seed?: number
  ): {
    passed: boolean;
    actualProbabilities: number[];
    expectedProbabilities: number[];
    deviations: number[];
    maxDeviation: number;
    sampleCount: number;
  } {
    if (wedges.length === 0) {
      throw new Error('Cannot test empty wedge array');
    }

    const originalSeed = this.rng.getSeed();
    
    if (seed !== undefined) {
      this.rng.setSeed(seed);
    }

    const expectedProbabilities = this.calculateExpectedProbabilities(wedges);
    const counts = new Array(wedges.length).fill(0);

    // Perform sampling
    for (let i = 0; i < samples; i++) {
      const result = this.selectWedge(wedges);
      counts[result.index]++;
    }

    // Calculate actual probabilities and deviations
    const actualProbabilities = counts.map(count => count / samples);
    const deviations = actualProbabilities.map((actual, i) => 
      Math.abs(actual - expectedProbabilities[i]!)
    );
    
    const maxDeviation = Math.max(...deviations);
    const passed = deviations.every(deviation => deviation <= tolerance);

    // Restore original seed
    if (seed !== undefined) {
      this.rng.setSeed(originalSeed);
    }

    return {
      passed,
      actualProbabilities,
      expectedProbabilities,
      deviations,
      maxDeviation,
      sampleCount: samples
    };
  }

  /**
   * Generate visual indicators for probability vs visual size differences
   * @param wedges Array of wedges to analyze
   * @returns Array of indicator objects for UI display
   */
  generateVisualIndicators(wedges: Wedge[]): Array<{
    wedgeId: string;
    label: string;
    probabilityWeight: number;
    visualWeight: number;
    difference: number;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }> {
    const analysis = this.analyzeWeightDistribution(wedges);
    
    return wedges.map((wedge, i) => {
      const probabilityWeight = analysis.probabilities[i]!;
      const visualWeight = analysis.visualAngles[i]! / 360; // Normalize to 0-1
      const difference = analysis.probabilityVsVisualDifferences[i]!;
      
      let severity: 'low' | 'medium' | 'high';
      let recommendation: string;
      
      if (difference < 0.02) {
        severity = 'low';
        recommendation = 'Probability and visual size are well balanced';
      } else if (difference < 0.1) {
        severity = 'medium';
        recommendation = 'Consider adjusting visual size or weight for better balance';
      } else {
        severity = 'high';
        recommendation = 'Significant mismatch between probability and visual size';
      }

      return {
        wedgeId: wedge.id,
        label: wedge.label,
        probabilityWeight,
        visualWeight,
        difference,
        severity,
        recommendation
      };
    });
  }

  /**
   * Private method to select index based on weights
   */
  private selectWeightedIndex(weights: number[]): number {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const randomValue = this.rng.next() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i]!;
      if (randomValue <= cumulativeWeight) {
        return i;
      }
    }

    // Fallback (should never reach here due to floating point precision)
    return weights.length - 1;
  }

  /**
   * Private method to validate weights
   */
  private validateWeights(weights: number[]): void {
    if (weights.length === 0) {
      throw new Error('Weights array cannot be empty');
    }

    const totalWeight = weights.reduce((sum, weight) => {
      if (weight < 0) {
        throw new Error('All weights must be non-negative');
      }
      if (!Number.isFinite(weight)) {
        throw new Error('All weights must be finite numbers');
      }
      return sum + weight;
    }, 0);

    if (totalWeight === 0) {
      throw new Error('Total weight must be greater than 0');
    }
  }
}

/**
 * Factory function to create a WedgeSelector with deterministic RNG
 * @param seed Optional seed for reproducible results
 * @returns WedgeSelector instance
 */
export function createDeterministicWedgeSelector(seed?: number): WedgeSelector {
  const rng = new LCGRandom(seed);
  return new WedgeSelector(rng);
}

/**
 * Factory function to create a WedgeSelector with global RNG
 * @returns WedgeSelector instance using global deterministic RNG
 */
export function createGlobalWedgeSelector(): WedgeSelector {
  return new WedgeSelector(DeterministicRNG.getInstance());
}