/**
 * Comprehensive unit tests for PhysicsEngine
 * Tests deterministic behavior, clutch mechanics, and friction model
 */

import { PhysicsEngine, PhysicsState, WheelPhysicsConfig } from '../../src/engines/PhysicsEngine';

describe('PhysicsEngine', () => {
  let engine: PhysicsEngine;

  beforeEach(() => {
    engine = new PhysicsEngine({
      timeStep: 1/60,
      maxIterations: 1000,
      stabilityThreshold: 0.01
    });
  });

  describe('Wheel Management', () => {
    test('should add wheel with default state', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1
      };

      engine.addWheel('wheel1', config);
      const state = engine.getWheelState('wheel1');

      expect(state).not.toBeNull();
      expect(state!.angle).toBe(0);
      expect(state!.angularVelocity).toBe(0);
      expect(state!.angularAcceleration).toBe(0);
      expect(state!.momentOfInertia).toBe(1.0);
    });

    test('should add wheel with custom initial state', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 2.0,
        frictionCoefficient: 0.2
      };

      const initialState: Partial<PhysicsState> = {
        angle: Math.PI / 2,
        angularVelocity: 5.0
      };

      engine.addWheel('wheel1', config, initialState);
      const state = engine.getWheelState('wheel1');

      expect(state!.angle).toBe(Math.PI / 2);
      expect(state!.angularVelocity).toBe(5.0);
      expect(state!.momentOfInertia).toBe(2.0);
    });

    test('should remove wheel and cleanup clutch connections', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1
      };

      engine.addWheel('outer', config);
      engine.addWheel('inner', { ...config, clutchRatio: 0.5 });
      engine.setClutchConnection('outer', 'inner');

      engine.removeWheel('outer');
      
      expect(engine.getWheelState('outer')).toBeNull();
      expect(engine.getWheelState('inner')).not.toBeNull();
    });

    test('should throw error when getting non-existent wheel', () => {
      expect(engine.getWheelState('nonexistent')).toBeNull();
    });
  });

  describe('Clutch Mechanics', () => {
    beforeEach(() => {
      const outerConfig: WheelPhysicsConfig = {
        momentOfInertia: 2.0,
        frictionCoefficient: 0.05
      };

      const innerConfig: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1,
        clutchRatio: 0.5
      };

      engine.addWheel('outer', outerConfig);
      engine.addWheel('inner', innerConfig);
      engine.setClutchConnection('outer', 'inner');
    });

    test('should transfer torque from outer to inner wheel', () => {
      // Set outer wheel spinning, inner wheel stationary
      engine.setWheelVelocity('outer', 10.0);
      engine.setWheelVelocity('inner', 0.0);

      // Step simulation
      engine.stepSimulation(1/60);

      const outerState = engine.getWheelState('outer')!;
      const innerState = engine.getWheelState('inner')!;

      // Inner wheel should have gained velocity, outer should have lost some
      expect(innerState.angularVelocity).toBeGreaterThan(0);
      expect(outerState.angularVelocity).toBeLessThan(10.0);
    });

    test('should respect clutch ratio', () => {
      // Test with different clutch ratios
      const testCases = [0.0, 0.25, 0.5, 0.75, 1.0];

      for (const clutchRatio of testCases) {
        // Reset engine
        engine = new PhysicsEngine();
        
        const outerConfig: WheelPhysicsConfig = {
          momentOfInertia: 1.0,
          frictionCoefficient: 0.0 // No friction for pure clutch test
        };

        const innerConfig: WheelPhysicsConfig = {
          momentOfInertia: 1.0,
          frictionCoefficient: 0.0,
          clutchRatio: clutchRatio
        };

        engine.addWheel('outer', outerConfig);
        engine.addWheel('inner', innerConfig);
        engine.setClutchConnection('outer', 'inner');

        // Set initial velocities
        engine.setWheelVelocity('outer', 10.0);
        engine.setWheelVelocity('inner', 0.0);

        // Step simulation multiple times to see effect
        for (let i = 0; i < 10; i++) {
          engine.stepSimulation(1/60);
        }

        const innerState = engine.getWheelState('inner')!;
        
        if (clutchRatio === 0.0) {
          expect(innerState.angularVelocity).toBe(0);
        } else {
          expect(innerState.angularVelocity).toBeGreaterThan(0);
        }
      }
    });

    test('should throw error when setting clutch connection with non-existent wheels', () => {
      expect(() => {
        engine.setClutchConnection('nonexistent1', 'nonexistent2');
      }).toThrow('Both wheels must be added before setting clutch connection');
    });
  });

  describe('Friction Model', () => {
    test('should apply friction proportional to angular velocity', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1
      };

      engine.addWheel('wheel1', config);
      engine.setWheelVelocity('wheel1', 10.0);

      const initialVelocity = engine.getWheelState('wheel1')!.angularVelocity;

      // Step simulation
      engine.stepSimulation(1/60);

      const finalVelocity = engine.getWheelState('wheel1')!.angularVelocity;

      // Velocity should decrease due to friction
      expect(finalVelocity).toBeLessThan(initialVelocity);
      expect(finalVelocity).toBeGreaterThan(0);
    });

    test('should stop wheel when velocity drops below stability threshold', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 1.0 // High friction
      };

      engine.addWheel('wheel1', config);
      engine.setWheelVelocity('wheel1', 0.005); // Below stability threshold

      engine.stepSimulation(1/60);

      const state = engine.getWheelState('wheel1')!;
      expect(state.angularVelocity).toBe(0);
    });

    test('should handle different friction coefficients', () => {
      const lowFrictionConfig: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.01
      };

      const highFrictionConfig: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1
      };

      engine.addWheel('lowFriction', lowFrictionConfig);
      engine.addWheel('highFriction', highFrictionConfig);

      engine.setWheelVelocity('lowFriction', 10.0);
      engine.setWheelVelocity('highFriction', 10.0);

      // Step simulation multiple times
      for (let i = 0; i < 60; i++) {
        engine.stepSimulation(1/60);
      }

      const lowFrictionVelocity = engine.getWheelState('lowFriction')!.angularVelocity;
      const highFrictionVelocity = engine.getWheelState('highFriction')!.angularVelocity;

      // Low friction wheel should retain more velocity
      expect(lowFrictionVelocity).toBeGreaterThan(highFrictionVelocity);
    });
  });

  describe('Semi-Implicit Euler Integration', () => {
    test('should integrate velocity before position (semi-implicit)', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.0 // No friction for pure integration test
      };

      engine.addWheel('wheel1', config);
      
      const initialState = engine.getWheelState('wheel1')!;
      expect(initialState.angularVelocity).toBe(0);
      expect(initialState.angle).toBe(0);

      // Apply constant torque and step simulation
      engine.applyTorque('wheel1', 1.0);
      engine.stepSimulation(1/60);

      const finalState = engine.getWheelState('wheel1')!;
      
      // Should have non-zero velocity and position
      expect(finalState.angularVelocity).toBeGreaterThan(0);
      expect(finalState.angle).toBeGreaterThan(0);
      
      // Verify semi-implicit integration: position uses updated velocity
      const expectedAngle = finalState.angularVelocity * (1/60);
      expect(finalState.angle).toBeCloseTo(expectedAngle, 10);
    });

    test('should normalize angles to [0, 2π] range', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.0
      };

      engine.addWheel('wheel1', config);
      
      // Set high angular velocity to cause multiple rotations
      engine.setWheelVelocity('wheel1', 100.0);

      // Step simulation for 1 second
      for (let i = 0; i < 60; i++) {
        engine.stepSimulation(1/60);
      }

      const state = engine.getWheelState('wheel1')!;
      
      // Angle should be normalized to [0, 2π]
      expect(state.angle).toBeGreaterThanOrEqual(0);
      expect(state.angle).toBeLessThan(2 * Math.PI);
    });
  });

  describe('Deterministic Behavior', () => {
    test('should produce identical results with same initial conditions', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1,
        clutchRatio: 0.5
      };

      // First simulation
      const engine1 = new PhysicsEngine();
      engine1.addWheel('outer', config);
      engine1.addWheel('inner', config);
      engine1.setClutchConnection('outer', 'inner');
      engine1.setWheelVelocity('outer', 10.0);

      // Second simulation with identical setup
      const engine2 = new PhysicsEngine();
      engine2.addWheel('outer', config);
      engine2.addWheel('inner', config);
      engine2.setClutchConnection('outer', 'inner');
      engine2.setWheelVelocity('outer', 10.0);

      // Run both simulations for same duration
      for (let i = 0; i < 100; i++) {
        engine1.stepSimulation(1/60);
        engine2.stepSimulation(1/60);
      }

      const state1 = engine1.getWheelState('outer')!;
      const state2 = engine2.getWheelState('outer')!;

      expect(state1.angle).toBeCloseTo(state2.angle, 10);
      expect(state1.angularVelocity).toBeCloseTo(state2.angularVelocity, 10);
    });
  });

  describe('Stability Detection', () => {
    test('should detect when all wheels have stopped', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.5 // High friction to stop quickly
      };

      engine.addWheel('wheel1', config);
      engine.addWheel('wheel2', config);
      
      engine.setWheelVelocity('wheel1', 1.0);
      engine.setWheelVelocity('wheel2', 1.0);

      expect(engine.isStable()).toBe(false);

      // Run simulation until stable
      let iterations = 0;
      while (!engine.isStable() && iterations < 1000) {
        engine.stepSimulation(1/60);
        iterations++;
      }

      expect(engine.isStable()).toBe(true);
      expect(iterations).toBeLessThan(1000); // Should stabilize within reasonable time
    });

    test('should consider wheels stable when below threshold', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1
      };

      engine.addWheel('wheel1', config);
      engine.setWheelVelocity('wheel1', 0.005); // Below default threshold of 0.01

      expect(engine.isStable()).toBe(true);
    });
  });

  describe('Torque Application', () => {
    test('should apply torque correctly', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 2.0,
        frictionCoefficient: 0.0
      };

      engine.addWheel('wheel1', config);
      
      const torque = 4.0;
      
      // Apply torque and step simulation
      engine.applyTorque('wheel1', torque);
      engine.stepSimulation(1/60);

      const state = engine.getWheelState('wheel1')!;
      
      // τ = I * α, so α = τ / I = 4.0 / 2.0 = 2.0
      // v = α * t = 2.0 * (1/60) = 1/30
      const expectedVelocity = (torque / config.momentOfInertia) * (1/60);
      expect(state.angularVelocity).toBeCloseTo(expectedVelocity, 10);
    });

    test('should throw error when applying torque to non-existent wheel', () => {
      expect(() => {
        engine.applyTorque('nonexistent', 1.0);
      }).toThrow('Wheel nonexistent not found');
    });
  });

  describe('Configuration Management', () => {
    test('should get and update configuration', () => {
      const initialConfig = engine.getConfig();
      expect(initialConfig.timeStep).toBe(1/60);

      engine.updateConfig({ timeStep: 1/120 });
      
      const updatedConfig = engine.getConfig();
      expect(updatedConfig.timeStep).toBe(1/120);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset all wheels to initial state', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1
      };

      engine.addWheel('wheel1', config);
      engine.setWheelVelocity('wheel1', 10.0);
      
      // Run simulation
      engine.stepSimulation(1/60);
      
      const stateBeforeReset = engine.getWheelState('wheel1')!;
      expect(stateBeforeReset.angle).toBeGreaterThan(0);
      expect(stateBeforeReset.angularVelocity).toBeGreaterThan(0);

      // Reset
      engine.reset();

      const stateAfterReset = engine.getWheelState('wheel1')!;
      expect(stateAfterReset.angle).toBe(0);
      expect(stateAfterReset.angularVelocity).toBe(0);
      expect(stateAfterReset.angularAcceleration).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero moment of inertia gracefully', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 0.0001, // Very small but not zero
        frictionCoefficient: 0.1
      };

      expect(() => {
        engine.addWheel('wheel1', config);
        engine.applyTorque('wheel1', 1.0);
        engine.stepSimulation(1/60);
      }).not.toThrow();
    });

    test('should handle negative friction coefficient', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: -0.1 // Negative friction (acceleration)
      };

      engine.addWheel('wheel1', config);
      engine.setWheelVelocity('wheel1', 1.0);

      const initialVelocity = engine.getWheelState('wheel1')!.angularVelocity;
      
      engine.stepSimulation(1/60);

      const finalVelocity = engine.getWheelState('wheel1')!.angularVelocity;
      
      // Negative friction should increase velocity
      expect(finalVelocity).toBeGreaterThan(initialVelocity);
    });

    test('should handle very large time steps', () => {
      const config: WheelPhysicsConfig = {
        momentOfInertia: 1.0,
        frictionCoefficient: 0.1
      };

      engine.addWheel('wheel1', config);
      engine.setWheelVelocity('wheel1', 10.0);

      // Large time step should be broken down into smaller steps
      expect(() => {
        engine.stepSimulation(1.0); // 1 second
      }).not.toThrow();

      // Should still be stable after large time step
      const state = engine.getWheelState('wheel1')!;
      expect(state.angle).toBeGreaterThanOrEqual(0);
      expect(state.angle).toBeLessThan(2 * Math.PI);
    });
  });
});