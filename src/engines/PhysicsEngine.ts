/**
 * Physics Engine for Wheel within a Wheel game
 * Implements semi-implicit Euler integration with clutch mechanics and friction
 */

export interface PhysicsState {
  angle: number;
  angularVelocity: number;
  angularAcceleration: number;
  momentOfInertia: number;
}

export interface WheelPhysicsConfig {
  momentOfInertia: number;
  frictionCoefficient: number;
  clutchRatio?: number; // Only for inner wheel, 0.0-1.0
}

export interface PhysicsEngineConfig {
  timeStep: number; // Fixed timestep for deterministic behavior
  maxIterations: number; // Safety limit for simulation steps
  stabilityThreshold: number; // Angular velocity below which wheel is considered stopped
}

export class PhysicsEngine {
  private wheels: Map<string, PhysicsState> = new Map();
  private wheelConfigs: Map<string, WheelPhysicsConfig> = new Map();
  private clutchConnections: Map<string, string> = new Map(); // inner -> outer wheel mapping
  private config: PhysicsEngineConfig;
  private accumulatedTime: number = 0;

  constructor(config: Partial<PhysicsEngineConfig> = {}) {
    this.config = {
      timeStep: 1 / 60, // 60 FPS fixed timestep
      maxIterations: 1000,
      stabilityThreshold: 0.01, // rad/s
      ...config,
    };
  }

  /**
   * Add a wheel to the physics simulation
   */
  addWheel(
    wheelId: string, 
    config: WheelPhysicsConfig, 
    initialState: Partial<PhysicsState> = {},
  ): void {
    const state: PhysicsState = {
      angle: 0,
      angularVelocity: 0,
      angularAcceleration: 0,
      momentOfInertia: config.momentOfInertia,
      ...initialState,
    };

    this.wheels.set(wheelId, state);
    this.wheelConfigs.set(wheelId, config);
  }

  /**
   * Remove a wheel from the physics simulation
   */
  removeWheel(wheelId: string): void {
    this.wheels.delete(wheelId);
    this.wheelConfigs.delete(wheelId);
    
    // Remove any clutch connections involving this wheel
    for (const [inner, outer] of this.clutchConnections.entries()) {
      if (inner === wheelId || outer === wheelId) {
        this.clutchConnections.delete(inner);
      }
    }
  }

  /**
   * Set up clutch connection between outer and inner wheel
   */
  setClutchConnection(outerWheelId: string, innerWheelId: string): void {
    if (!this.wheels.has(outerWheelId) || !this.wheels.has(innerWheelId)) {
      throw new Error('Both wheels must be added before setting clutch connection');
    }
    
    this.clutchConnections.set(innerWheelId, outerWheelId);
  }

  /**
   * Apply external torque to a wheel (accumulates until next physics step)
   */
  applyTorque(wheelId: string, torque: number): void {
    const state = this.wheels.get(wheelId);
    if (!state) {
      throw new Error(`Wheel ${wheelId} not found`);
    }

    // τ = I * α, so α = τ / I
    state.angularAcceleration += torque / state.momentOfInertia;
  }

  /**
   * Step the physics simulation forward by deltaTime
   * Uses semi-implicit Euler integration for stability
   */
  stepSimulation(deltaTime: number): void {
    this.accumulatedTime += deltaTime;
    
    let iterations = 0;
    while (this.accumulatedTime >= this.config.timeStep && iterations < this.config.maxIterations) {
      this.performPhysicsStep(this.config.timeStep);
      this.accumulatedTime -= this.config.timeStep;
      iterations++;
    }
  }

  /**
   * Perform a single physics step using semi-implicit Euler integration
   */
  private performPhysicsStep(dt: number): void {
    // Apply friction forces (adds to existing acceleration)
    this.applyFriction();

    // Apply clutch torques (adds to existing acceleration)
    this.applyClutchTorques();

    // Semi-implicit Euler integration
    for (const state of this.wheels.values()) {
      // Update velocity first (semi-implicit)
      state.angularVelocity += state.angularAcceleration * dt;
      
      // Then update position using new velocity
      state.angle += state.angularVelocity * dt;
      
      // Normalize angle to [0, 2π]
      state.angle = this.normalizeAngle(state.angle);
      
      // Reset acceleration for next step (external torques need to be reapplied each step)
      state.angularAcceleration = 0;
    }
  }

  /**
   * Apply friction forces to all wheels
   * Friction model: τ_friction = -sign(ω) * |ω| * frictionCoeff * momentOfInertia
   */
  private applyFriction(): void {
    for (const [wheelId, state] of this.wheels.entries()) {
      const config = this.wheelConfigs.get(wheelId)!;
      
      if (Math.abs(state.angularVelocity) > this.config.stabilityThreshold) {
        const frictionTorque = -Math.sign(state.angularVelocity) * 
                              Math.abs(state.angularVelocity) * 
                              config.frictionCoefficient * 
                              state.momentOfInertia;
        
        state.angularAcceleration += frictionTorque / state.momentOfInertia;
      } else {
        // Stop very slow wheels to prevent jitter
        state.angularVelocity = 0;
      }
    }
  }

  /**
   * Apply clutch torque transfer between connected wheels
   */
  private applyClutchTorques(): void {
    for (const [innerWheelId, outerWheelId] of this.clutchConnections.entries()) {
      const innerState = this.wheels.get(innerWheelId)!;
      const outerState = this.wheels.get(outerWheelId)!;
      const innerConfig = this.wheelConfigs.get(innerWheelId)!;
      
      if (innerConfig.clutchRatio && innerConfig.clutchRatio > 0) {
        // Calculate velocity difference
        const velocityDiff = outerState.angularVelocity - innerState.angularVelocity;
        
        // Clutch torque proportional to velocity difference and clutch ratio
        const clutchTorque = velocityDiff * innerConfig.clutchRatio * innerState.momentOfInertia;
        
        // Apply torque to inner wheel (positive)
        innerState.angularAcceleration += clutchTorque / innerState.momentOfInertia;
        
        // Apply equal and opposite torque to outer wheel (Newton's 3rd law)
        outerState.angularAcceleration -= clutchTorque / outerState.momentOfInertia;
      }
    }
  }

  /**
   * Normalize angle to [0, 2π] range
   */
  private normalizeAngle(angle: number): number {
    const TWO_PI = 2 * Math.PI;
    while (angle < 0) {angle += TWO_PI;}
    while (angle >= TWO_PI) {angle -= TWO_PI;}
    return angle;
  }

  /**
   * Check if all wheels have stopped (stable state)
   */
  isStable(): boolean {
    for (const state of this.wheels.values()) {
      if (Math.abs(state.angularVelocity) > this.config.stabilityThreshold) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get current physics state of a wheel
   */
  getWheelState(wheelId: string): PhysicsState | null {
    const state = this.wheels.get(wheelId);
    return state ? { ...state } : null; // Return copy to prevent external modification
  }

  /**
   * Get all wheel states
   */
  getAllWheelStates(): Map<string, PhysicsState> {
    const states = new Map<string, PhysicsState>();
    for (const [wheelId, state] of this.wheels.entries()) {
      states.set(wheelId, { ...state });
    }
    return states;
  }

  /**
   * Reset all wheels to initial state
   */
  reset(): void {
    for (const state of this.wheels.values()) {
      state.angle = 0;
      state.angularVelocity = 0;
      state.angularAcceleration = 0;
    }
    this.accumulatedTime = 0;
  }

  /**
   * Set the angular velocity of a wheel (for initial spin)
   */
  setWheelVelocity(wheelId: string, angularVelocity: number): void {
    const state = this.wheels.get(wheelId);
    if (!state) {
      throw new Error(`Wheel ${wheelId} not found`);
    }
    state.angularVelocity = angularVelocity;
  }

  /**
   * Get the configuration of the physics engine
   */
  getConfig(): PhysicsEngineConfig {
    return { ...this.config };
  }

  /**
   * Update physics engine configuration
   */
  updateConfig(newConfig: Partial<PhysicsEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}