import { PhysicsEngine } from '../../src/engines/PhysicsEngine';
import { WedgeSelector } from '../../src/utils/WedgeSelector';
import { RandomUtils } from '../../src/utils/RandomUtils';
import { Wheel, Wedge } from '../../src/models';

interface StatisticalTest {
  name: string;
  sampleSize: number;
  expectedDistribution: number[];
  actualDistribution: number[];
  chiSquareStatistic: number;
  pValue: number;
  passed: boolean;
  confidenceLevel: number;
}

interface PhysicsValidationResult {
  testName: string;
  iterations: number;
  energyConservationError: number;
  momentumConservationError: number;
  deterministicConsistency: boolean;
  stabilityTime: number;
  passed: boolean;
}

describe('Statistical Validation Tests', () => {
  beforeEach(() => {
    RandomUtils.setSeed(12345); // Deterministic testing
  });

  afterEach(() => {
    RandomUtils.setSeed(Date.now());
  });

  describe('Probability Distribution Validation', () => {
    it('should validate weighted selection follows expected distribution', () => {
      const wedges: Wedge[] = [
        { id: 'w1', label: 'Weight 1', weight: 1, color: '#ff0000' },
        { id: 'w2', label: 'Weight 2', weight: 2, color: '#00ff00' },
        { id: 'w3', label: 'Weight 3', weight: 3, color: '#0000ff' },
        { id: 'w4', label: 'Weight 4', weight: 4, color: '#ffff00' },
      ];

      const selector = new WedgeSelector(wedges);
      const sampleSize = 10000;
      const selections: number[] = new Array(wedges.length).fill(0);

      // Collect samples
      for (let i = 0; i < sampleSize; i++) {
        const selectedWedge = selector.selectWedge();
        const wedgeIndex = wedges.findIndex(w => w.id === selectedWedge.id);
        selections[wedgeIndex]++;
      }

      // Calculate expected distribution
      const totalWeight = wedges.reduce((sum, wedge) => sum + wedge.weight, 0);
      const expectedDistribution = wedges.map(wedge => (wedge.weight / totalWeight) * sampleSize);

      // Perform chi-square test
      const testResult = performChiSquareTest(
        'Weighted Selection Distribution',
        sampleSize,
        expectedDistribution,
        selections,
        0.95,
      );

      console.log('Weighted Selection Test:', testResult);

      expect(testResult.passed).toBe(true);
      expect(testResult.pValue).toBeGreaterThan(0.05); // 95% confidence
      expect(testResult.chiSquareStatistic).toBeLessThan(7.815); // Critical value for 3 degrees of freedom
    });

    it('should validate equal weights produce uniform distribution', () => {
      const wedges: Wedge[] = Array.from({ length: 6 }, (_, i) => ({
        id: `w${i}`,
        label: `Equal ${i}`,
        weight: 1, // All equal weights
        color: `hsl(${i * 60}, 70%, 50%)`,
      }));

      const selector = new WedgeSelector(wedges);
      const sampleSize = 12000; // Divisible by 6 for clean expected values
      const selections: number[] = new Array(wedges.length).fill(0);

      for (let i = 0; i < sampleSize; i++) {
        const selectedWedge = selector.selectWedge();
        const wedgeIndex = wedges.findIndex(w => w.id === selectedWedge.id);
        selections[wedgeIndex]++;
      }

      const expectedCount = sampleSize / wedges.length;
      const expectedDistribution = new Array(wedges.length).fill(expectedCount);

      const testResult = performChiSquareTest(
        'Uniform Distribution Test',
        sampleSize,
        expectedDistribution,
        selections,
        0.95,
      );

      console.log('Uniform Distribution Test:', testResult);

      expect(testResult.passed).toBe(true);
      expect(testResult.pValue).toBeGreaterThan(0.05);
    });

    it('should validate extreme weight ratios', () => {
      const wedges: Wedge[] = [
        { id: 'rare', label: 'Rare (0.1%)', weight: 0.001, color: '#ff0000' },
        { id: 'uncommon', label: 'Uncommon (9.9%)', weight: 0.099, color: '#ff8800' },
        { id: 'common', label: 'Common (90%)', weight: 0.9, color: '#00ff00' },
      ];

      const selector = new WedgeSelector(wedges);
      const sampleSize = 100000; // Large sample for rare events
      const selections: number[] = new Array(wedges.length).fill(0);

      for (let i = 0; i < sampleSize; i++) {
        const selectedWedge = selector.selectWedge();
        const wedgeIndex = wedges.findIndex(w => w.id === selectedWedge.id);
        selections[wedgeIndex]++;
      }

      const totalWeight = wedges.reduce((sum, wedge) => sum + wedge.weight, 0);
      const expectedDistribution = wedges.map(wedge => (wedge.weight / totalWeight) * sampleSize);

      const testResult = performChiSquareTest(
        'Extreme Weight Ratios Test',
        sampleSize,
        expectedDistribution,
        selections,
        0.99, // Higher confidence for extreme cases
      );

      console.log('Extreme Weight Ratios Test:', testResult);

      expect(testResult.passed).toBe(true);
      
      // Verify rare event actually occurred
      expect(selections[0]).toBeGreaterThan(50); // Should get ~100 rare events
      expect(selections[0]).toBeLessThan(200);
      
      // Verify common event dominates
      expect(selections[2]).toBeGreaterThan(85000); // Should get ~90000 common events
      expect(selections[2]).toBeLessThan(95000);
    });

    it('should validate deterministic consistency across multiple runs', () => {
      const wedges: Wedge[] = [
        { id: 'w1', label: 'Test 1', weight: 2, color: '#ff0000' },
        { id: 'w2', label: 'Test 2', weight: 3, color: '#00ff00' },
        { id: 'w3', label: 'Test 3', weight: 5, color: '#0000ff' },
      ];

      const sampleSize = 1000;
      const runs = 5;
      const allResults: number[][] = [];

      for (let run = 0; run < runs; run++) {
        RandomUtils.setSeed(54321); // Same seed for each run
        const selector = new WedgeSelector(wedges);
        const selections: number[] = new Array(wedges.length).fill(0);

        for (let i = 0; i < sampleSize; i++) {
          const selectedWedge = selector.selectWedge();
          const wedgeIndex = wedges.findIndex(w => w.id === selectedWedge.id);
          selections[wedgeIndex]++;
        }

        allResults.push([...selections]);
      }

      // Verify all runs produced identical results
      for (let run = 1; run < runs; run++) {
        for (let wedgeIndex = 0; wedgeIndex < wedges.length; wedgeIndex++) {
          expect(allResults[run][wedgeIndex]).toBe(allResults[0][wedgeIndex]);
        }
      }

      console.log('Deterministic consistency verified across', runs, 'runs');
    });
  });

  describe('Physics System Validation', () => {
    let physicsEngine: PhysicsEngine;

    beforeEach(() => {
      physicsEngine = new PhysicsEngine();
    });

    it('should validate energy conservation in isolated system', () => {
      const wheels = createPhysicsTestWheels();
      
      // Set initial conditions
      wheels[0].angularVelocity = 10;
      wheels[1].angularVelocity = 5;
      wheels[1].clutchRatio = 0; // Isolated wheels
      
      const initialEnergy = calculateTotalEnergy(wheels);
      const energyHistory: number[] = [initialEnergy];
      
      // Run simulation
      for (let step = 0; step < 1000; step++) {
        physicsEngine.stepSimulation(1/60);
        const currentEnergy = calculateTotalEnergy(wheels);
        energyHistory.push(currentEnergy);
      }

      const finalEnergy = energyHistory[energyHistory.length - 1];
      const energyLoss = initialEnergy - finalEnergy;
      const energyConservationError = Math.abs(energyLoss) / initialEnergy;

      const result: PhysicsValidationResult = {
        testName: 'Energy Conservation (Isolated)',
        iterations: 1000,
        energyConservationError,
        momentumConservationError: 0,
        deterministicConsistency: true,
        stabilityTime: findStabilityTime(energyHistory),
        passed: energyConservationError < 0.01, // Less than 1% error
      };

      console.log('Energy Conservation Test:', result);

      expect(result.passed).toBe(true);
      expect(energyConservationError).toBeLessThan(0.01);
    });

    it('should validate clutch torque transfer mechanics', () => {
      const wheels = createPhysicsTestWheels();
      const clutchRatios = [0.0, 0.25, 0.5, 0.75, 1.0];
      
      for (const clutchRatio of clutchRatios) {
        wheels[0].angularVelocity = 20; // Reset outer wheel
        wheels[1].angularVelocity = 0;  // Reset inner wheel
        wheels[1].clutchRatio = clutchRatio;

        const torqueTransferData: Array<{ time: number; outerVel: number; innerVel: number; torqueRatio: number }> = [];
        
        // Collect data during initial torque transfer
        for (let step = 0; step < 100; step++) {
          const outerVel = wheels[0].angularVelocity;
          const innerVel = wheels[1].angularVelocity;
          
          physicsEngine.stepSimulation(1/60);
          
          const newOuterVel = wheels[0].angularVelocity;
          const newInnerVel = wheels[1].angularVelocity;
          
          const outerAccel = (newOuterVel - outerVel) * 60; // Convert to per-second
          const innerAccel = (newInnerVel - innerVel) * 60;
          
          if (Math.abs(outerAccel) > 0.01) { // Only when significant acceleration
            const torqueRatio = Math.abs(innerAccel / outerAccel);
            torqueTransferData.push({
              time: step / 60,
              outerVel,
              innerVel,
              torqueRatio,
            });
          }
        }

        if (torqueTransferData.length > 10) {
          const avgTorqueRatio = torqueTransferData.reduce((sum, data) => sum + data.torqueRatio, 0) / torqueTransferData.length;
          const expectedRatio = clutchRatio;
          const ratioError = Math.abs(avgTorqueRatio - expectedRatio);
          
          console.log(`Clutch Ratio ${clutchRatio}: Expected ${expectedRatio}, Actual ${avgTorqueRatio.toFixed(3)}, Error ${ratioError.toFixed(3)}`);
          
          expect(ratioError).toBeLessThan(0.1); // Within 10% of expected ratio
        }
      }
    });

    it('should validate friction model accuracy', () => {
      const wheels = createPhysicsTestWheels();
      const frictionCoefficients = [0.01, 0.02, 0.05, 0.1];
      
      for (const friction of frictionCoefficients) {
        wheels[0].angularVelocity = 15;
        wheels[0].frictionCoefficient = friction;
        wheels[1].angularVelocity = 0;
        wheels[1].clutchRatio = 0; // Isolated for pure friction test
        
        const velocityHistory: number[] = [wheels[0].angularVelocity];
        
        // Run until nearly stopped
        while (Math.abs(wheels[0].angularVelocity) > 0.1) {
          physicsEngine.stepSimulation(1/60);
          velocityHistory.push(wheels[0].angularVelocity);
          
          if (velocityHistory.length > 3000) {break;} // Safety limit
        }

        // Analyze deceleration curve
        const decelerationRates: number[] = [];
        for (let i = 1; i < Math.min(velocityHistory.length, 100); i++) {
          const deceleration = (velocityHistory[i-1] - velocityHistory[i]) * 60; // Per second
          if (deceleration > 0) {
            decelerationRates.push(deceleration);
          }
        }

        if (decelerationRates.length > 10) {
          const avgDeceleration = decelerationRates.reduce((a, b) => a + b, 0) / decelerationRates.length;
          const expectedDeceleration = friction * 15; // Proportional to initial velocity and friction
          const decelerationError = Math.abs(avgDeceleration - expectedDeceleration) / expectedDeceleration;
          
          console.log(`Friction ${friction}: Expected decel ${expectedDeceleration.toFixed(3)}, Actual ${avgDeceleration.toFixed(3)}, Error ${(decelerationError * 100).toFixed(1)}%`);
          
          expect(decelerationError).toBeLessThan(0.2); // Within 20% of expected
        }
      }
    });

    it('should validate deterministic physics simulation', () => {
      const testConfigurations = [
        { outerVel: 10, innerVel: 5, clutch: 0.5, friction: 0.02 },
        { outerVel: 25, innerVel: 0, clutch: 0.8, friction: 0.01 },
        { outerVel: 5, innerVel: 15, clutch: 0.3, friction: 0.05 },
      ];

      for (const config of testConfigurations) {
        const results: Array<{ step: number; outerAngle: number; innerAngle: number }> = [];
        const runs = 3;
        
        for (let run = 0; run < runs; run++) {
          RandomUtils.setSeed(98765); // Same seed for deterministic behavior
          
          const wheels = createPhysicsTestWheels();
          wheels[0].angularVelocity = config.outerVel;
          wheels[1].angularVelocity = config.innerVel;
          wheels[1].clutchRatio = config.clutch;
          wheels[0].frictionCoefficient = config.friction;
          wheels[1].frictionCoefficient = config.friction;
          
          const runResults: Array<{ step: number; outerAngle: number; innerAngle: number }> = [];
          
          for (let step = 0; step < 100; step++) {
            physicsEngine.stepSimulation(1/60);
            runResults.push({
              step,
              outerAngle: wheels[0].currentAngle,
              innerAngle: wheels[1].currentAngle,
            });
          }
          
          if (run === 0) {
            results.push(...runResults);
          } else {
            // Compare with first run
            for (let step = 0; step < runResults.length; step++) {
              const expected = results[step];
              const actual = runResults[step];
              
              expect(Math.abs(actual.outerAngle - expected.outerAngle)).toBeLessThan(1e-10);
              expect(Math.abs(actual.innerAngle - expected.innerAngle)).toBeLessThan(1e-10);
            }
          }
        }
        
        console.log(`Deterministic physics validated for config: ${JSON.stringify(config)}`);
      }
    });

    it('should validate system stability and convergence', () => {
      const wheels = createPhysicsTestWheels();
      
      // Test various initial conditions
      const initialConditions = [
        { outerVel: 50, innerVel: 30 }, // High velocity
        { outerVel: 1, innerVel: 0.5 },  // Low velocity
        { outerVel: -20, innerVel: 15 }, // Opposite directions
        { outerVel: 0, innerVel: 25 },    // Only inner spinning
      ];

      for (const initial of initialConditions) {
        wheels[0].angularVelocity = initial.outerVel;
        wheels[1].angularVelocity = initial.innerVel;
        wheels[1].clutchRatio = 0.6;
        
        let step = 0;
        const maxSteps = 5000; // Maximum simulation steps
        
        while (!physicsEngine.isStable() && step < maxSteps) {
          physicsEngine.stepSimulation(1/60);
          step++;
          
          // Check for numerical instability
          const outerVel = wheels[0].angularVelocity;
          const innerVel = wheels[1].angularVelocity;
          
          expect(isFinite(outerVel)).toBe(true);
          expect(isFinite(innerVel)).toBe(true);
          expect(Math.abs(outerVel)).toBeLessThan(1000); // Reasonable bounds
          expect(Math.abs(innerVel)).toBeLessThan(1000);
        }
        
        expect(step).toBeLessThan(maxSteps);
        expect(physicsEngine.isStable()).toBe(true);
        
        console.log(`Stability achieved in ${step} steps for initial conditions: ${JSON.stringify(initial)}`);
      }
    });
  });

  // Helper functions
  function performChiSquareTest(
    name: string,
    sampleSize: number,
    expected: number[],
    observed: number[],
    confidenceLevel: number,
  ): StatisticalTest {
    let chiSquare = 0;
    
    for (let i = 0; i < expected.length; i++) {
      const diff = observed[i] - expected[i];
      chiSquare += (diff * diff) / expected[i];
    }
    
    const degreesOfFreedom = expected.length - 1;
    const pValue = calculatePValue(chiSquare, degreesOfFreedom);
    const criticalValue = getCriticalValue(degreesOfFreedom, confidenceLevel);
    
    return {
      name,
      sampleSize,
      expectedDistribution: [...expected],
      actualDistribution: [...observed],
      chiSquareStatistic: chiSquare,
      pValue,
      passed: chiSquare < criticalValue,
      confidenceLevel,
    };
  }

  function calculatePValue(chiSquare: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation (would use proper statistical library in production)
    // This is an approximation for testing purposes
    if (degreesOfFreedom === 1) {return chiSquare > 3.841 ? 0.05 : 0.95;}
    if (degreesOfFreedom === 2) {return chiSquare > 5.991 ? 0.05 : 0.95;}
    if (degreesOfFreedom === 3) {return chiSquare > 7.815 ? 0.05 : 0.95;}
    if (degreesOfFreedom === 5) {return chiSquare > 11.071 ? 0.05 : 0.95;}
    return chiSquare > (degreesOfFreedom * 2) ? 0.05 : 0.95;
  }

  function getCriticalValue(degreesOfFreedom: number, confidenceLevel: number): number {
    // Critical values for common confidence levels
    const alpha = 1 - confidenceLevel;
    
    if (alpha <= 0.05) {
      const criticalValues: { [key: number]: number } = {
        1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.071,
        6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307,
      };
      return criticalValues[degreesOfFreedom] || (degreesOfFreedom * 2);
    }
    
    return degreesOfFreedom * 3; // Conservative estimate
  }

  function calculateTotalEnergy(wheels: Wheel[]): number {
    return wheels.reduce((total, wheel) => {
      const kineticEnergy = 0.5 * wheel.angularVelocity * wheel.angularVelocity;
      return total + kineticEnergy;
    }, 0);
  }

  function findStabilityTime(energyHistory: number[]): number {
    const threshold = 0.001; // Energy change threshold
    
    for (let i = 100; i < energyHistory.length - 10; i++) {
      let stable = true;
      const baseEnergy = energyHistory[i];
      
      for (let j = 1; j <= 10; j++) {
        const energyChange = Math.abs(energyHistory[i + j] - baseEnergy) / baseEnergy;
        if (energyChange > threshold) {
          stable = false;
          break;
        }
      }
      
      if (stable) {
        return i / 60; // Convert to seconds
      }
    }
    
    return -1; // Not stable within test period
  }

  function createPhysicsTestWheels(): Wheel[] {
    return [
      {
        id: 'outer',
        label: 'Test Outer',
        wedges: [
          { id: 'o1', label: 'Outer 1', weight: 1, color: '#ff0000' },
          { id: 'o2', label: 'Outer 2', weight: 1, color: '#00ff00' },
        ],
        frictionCoefficient: 0.02,
        clutchRatio: 0,
        radius: 200,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      },
      {
        id: 'inner',
        label: 'Test Inner',
        wedges: [
          { id: 'i1', label: 'Inner 1', weight: 1, color: '#0000ff' },
          { id: 'i2', label: 'Inner 2', weight: 1, color: '#ffff00' },
        ],
        frictionCoefficient: 0.03,
        clutchRatio: 0.5,
        radius: 100,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      },
    ];
  }
});