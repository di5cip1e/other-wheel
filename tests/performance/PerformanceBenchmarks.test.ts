import { GameController } from '../../src/components/GameController';
import { PhysicsEngine } from '../../src/engines/PhysicsEngine';
import { CanvasWheelRenderer } from '../../src/components/CanvasWheelRenderer';
import { PlayerManager } from '../../src/managers/PlayerManager';
import { PresetManager } from '../../src/managers/PresetManager';
import { MediaManager } from '../../src/managers/MediaManager';
import { RandomUtils } from '../../src/utils/RandomUtils';
import { Wheel, Wedge, Player } from '../../src/models';

interface PerformanceMetrics {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameTimeVariance: number;
  memoryUsage: number;
  renderTime: number;
  physicsTime: number;
}

interface BenchmarkResult {
  testName: string;
  metrics: PerformanceMetrics;
  passed: boolean;
  requirements: {
    minFPS: number;
    maxMemoryMB: number;
    maxRenderTimeMs: number;
  };
}

describe('Performance Benchmarks', () => {
  let gameController: GameController;
  let physicsEngine: PhysicsEngine;
  let renderer: CanvasWheelRenderer;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Setup test environment
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;
    
    physicsEngine = new PhysicsEngine();
    renderer = new CanvasWheelRenderer(canvas);
    
    const playerManager = new PlayerManager();
    const presetManager = new PresetManager();
    gameController = new GameController(physicsEngine, playerManager, presetManager);

    // Set deterministic seed for consistent benchmarks
    RandomUtils.setSeed(42);
  });

  afterEach(() => {
    RandomUtils.setSeed(Date.now());
  });

  describe('Frame Rate Benchmarks', () => {
    it('should maintain 60fps during wheel spinning animation', async () => {
      const wheels = createPerformanceTestWheels(8, 12); // 8 outer, 12 inner wedges
      const player: Player = { id: 'p1', name: 'Test', isActive: true };
      
      await gameController.initializeGame(wheels, [player]);
      await gameController.startGame();

      const metrics = await measureSpinningPerformance(wheels, 3000); // 3 second test
      
      const result: BenchmarkResult = {
        testName: 'Basic Spinning Performance',
        metrics,
        passed: metrics.averageFPS >= 58 && metrics.minFPS >= 45,
        requirements: {
          minFPS: 60,
          maxMemoryMB: 50,
          maxRenderTimeMs: 16,
        },
      };

      console.log('Basic Spinning Performance:', result);
      
      expect(result.metrics.averageFPS).toBeGreaterThanOrEqual(58);
      expect(result.metrics.minFPS).toBeGreaterThanOrEqual(45);
      expect(result.metrics.frameTimeVariance).toBeLessThan(5);
    });

    it('should handle complex wheels with many wedges efficiently', async () => {
      const wheels = createPerformanceTestWheels(24, 32); // Large number of wedges
      const player: Player = { id: 'p1', name: 'Test', isActive: true };
      
      await gameController.initializeGame(wheels, [player]);
      await gameController.startGame();

      const metrics = await measureSpinningPerformance(wheels, 2000);
      
      const result: BenchmarkResult = {
        testName: 'Complex Wheel Performance',
        metrics,
        passed: metrics.averageFPS >= 50 && metrics.minFPS >= 35,
        requirements: {
          minFPS: 50,
          maxMemoryMB: 100,
          maxRenderTimeMs: 20,
        },
      };

      console.log('Complex Wheel Performance:', result);
      
      expect(result.metrics.averageFPS).toBeGreaterThanOrEqual(50);
      expect(result.metrics.minFPS).toBeGreaterThanOrEqual(35);
    });

    it('should maintain performance with multiple simultaneous animations', async () => {
      const wheels = createPerformanceTestWheels(12, 8);
      const player: Player = { id: 'p1', name: 'Test', isActive: true };
      
      await gameController.initializeGame(wheels, [player]);
      await gameController.startGame();

      // Start multiple animations simultaneously
      const animationPromises = [
        measureSpinningPerformance(wheels, 1500),
        measurePowerMeterPerformance(1500),
        measureUIUpdatePerformance(1500),
      ];

      const [spinMetrics, powerMetrics, uiMetrics] = await Promise.all(animationPromises);
      
      const combinedMetrics: PerformanceMetrics = {
        averageFPS: Math.min(spinMetrics.averageFPS, powerMetrics.averageFPS, uiMetrics.averageFPS),
        minFPS: Math.min(spinMetrics.minFPS, powerMetrics.minFPS, uiMetrics.minFPS),
        maxFPS: Math.max(spinMetrics.maxFPS, powerMetrics.maxFPS, uiMetrics.maxFPS),
        frameTimeVariance: Math.max(spinMetrics.frameTimeVariance, powerMetrics.frameTimeVariance, uiMetrics.frameTimeVariance),
        memoryUsage: spinMetrics.memoryUsage + powerMetrics.memoryUsage + uiMetrics.memoryUsage,
        renderTime: spinMetrics.renderTime + powerMetrics.renderTime + uiMetrics.renderTime,
        physicsTime: spinMetrics.physicsTime,
      };

      const result: BenchmarkResult = {
        testName: 'Multiple Animations Performance',
        metrics: combinedMetrics,
        passed: combinedMetrics.averageFPS >= 45 && combinedMetrics.minFPS >= 30,
        requirements: {
          minFPS: 45,
          maxMemoryMB: 150,
          maxRenderTimeMs: 25,
        },
      };

      console.log('Multiple Animations Performance:', result);
      
      expect(result.metrics.averageFPS).toBeGreaterThanOrEqual(45);
      expect(result.metrics.minFPS).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should not exceed memory limits during extended gameplay', async () => {
      const wheels = createPerformanceTestWheels(16, 20);
      const players: Player[] = Array.from({ length: 4 }, (_, i) => ({
        id: `player${i}`,
        name: `Player ${i + 1}`,
        isActive: i === 0,
      }));

      await gameController.initializeGame(wheels, players);
      await gameController.startGame();

      const initialMemory = getMemoryUsage();
      let maxMemoryUsage = initialMemory;
      
      // Simulate extended gameplay (50 turns)
      for (let turn = 0; turn < 50; turn++) {
        gameController.startPowerMeter();
        await gameController.stopPowerMeter(Math.random());
        await gameController.waitForSpinComplete();
        await gameController.completeTurn();
        
        const currentMemory = getMemoryUsage();
        maxMemoryUsage = Math.max(maxMemoryUsage, currentMemory);
        
        // Check for memory leaks every 10 turns
        if (turn % 10 === 9) {
          const memoryGrowth = currentMemory - initialMemory;
          expect(memoryGrowth).toBeLessThan(20); // Less than 20MB growth
        }
      }

      const finalMemory = getMemoryUsage();
      const totalGrowth = finalMemory - initialMemory;
      
      console.log(`Memory Usage - Initial: ${initialMemory}MB, Final: ${finalMemory}MB, Growth: ${totalGrowth}MB`);
      
      expect(totalGrowth).toBeLessThan(30); // Total growth should be less than 30MB
      expect(maxMemoryUsage).toBeLessThan(100); // Peak usage should be less than 100MB
    });

    it('should handle large media files without memory issues', async () => {
      const wheels = createWheelsWithMedia();
      const player: Player = { id: 'p1', name: 'Test', isActive: true };
      
      const initialMemory = getMemoryUsage();
      
      await gameController.initializeGame(wheels, [player]);
      await gameController.startGame();

      // Simulate multiple spins to trigger media loading
      for (let i = 0; i < 10; i++) {
        gameController.startPowerMeter();
        await gameController.stopPowerMeter(Math.random());
        await gameController.waitForSpinComplete();
        await gameController.completeTurn();
      }

      const finalMemory = getMemoryUsage();
      const memoryGrowth = finalMemory - initialMemory;
      
      console.log(`Media Memory Usage - Growth: ${memoryGrowth}MB`);
      
      expect(memoryGrowth).toBeLessThan(50); // Should handle media efficiently
    });
  });

  describe('Physics Performance Benchmarks', () => {
    it('should complete physics calculations within frame budget', async () => {
      const wheels = createPerformanceTestWheels(20, 24);
      
      // Set high angular velocities for stress test
      wheels[0].angularVelocity = 50; // High initial velocity
      wheels[1].angularVelocity = 30;
      
      const physicsTimings: number[] = [];
      const frameCount = 300; // 5 seconds at 60fps
      
      for (let frame = 0; frame < frameCount; frame++) {
        const startTime = performance.now();
        
        physicsEngine.stepSimulation(1/60); // 60fps timestep
        
        const endTime = performance.now();
        const frameTime = endTime - startTime;
        physicsTimings.push(frameTime);
      }

      const averagePhysicsTime = physicsTimings.reduce((a, b) => a + b, 0) / physicsTimings.length;
      const maxPhysicsTime = Math.max(...physicsTimings);
      const physicsTimeVariance = calculateVariance(physicsTimings);
      
      console.log(`Physics Performance - Avg: ${averagePhysicsTime.toFixed(2)}ms, Max: ${maxPhysicsTime.toFixed(2)}ms`);
      
      expect(averagePhysicsTime).toBeLessThan(2); // Should average less than 2ms per frame
      expect(maxPhysicsTime).toBeLessThan(5); // Should never exceed 5ms per frame
      expect(physicsTimeVariance).toBeLessThan(1); // Should be consistent
    });

    it('should handle extreme physics scenarios without performance degradation', async () => {
      const wheels = createPerformanceTestWheels(8, 8);
      
      // Test extreme scenarios
      const scenarios = [
        { name: 'High Velocity', outerVel: 100, innerVel: 80, clutch: 0.9 },
        { name: 'High Friction', outerVel: 20, innerVel: 15, friction: 0.5 },
        { name: 'Zero Clutch', outerVel: 30, innerVel: 0, clutch: 0.0 },
        { name: 'Full Clutch', outerVel: 25, innerVel: 25, clutch: 1.0 },
      ];

      for (const scenario of scenarios) {
        wheels[0].angularVelocity = scenario.outerVel;
        wheels[1].angularVelocity = scenario.innerVel;
        wheels[1].clutchRatio = scenario.clutch || 0.5;
        wheels[0].frictionCoefficient = scenario.friction || 0.02;
        wheels[1].frictionCoefficient = scenario.friction || 0.03;

        const startTime = performance.now();
        
        // Run simulation until stable
        let steps = 0;
        while (!physicsEngine.isStable() && steps < 1000) {
          physicsEngine.stepSimulation(1/60);
          steps++;
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        console.log(`${scenario.name} - Steps: ${steps}, Time: ${totalTime.toFixed(2)}ms`);
        
        expect(steps).toBeLessThan(1000); // Should stabilize within reasonable time
        expect(totalTime).toBeLessThan(100); // Should complete quickly
      }
    });
  });

  describe('Rendering Performance Benchmarks', () => {
    it('should render complex wheels within frame budget', async () => {
      const wheels = createPerformanceTestWheels(32, 40); // Very complex wheels
      
      const renderTimings: number[] = [];
      const frameCount = 180; // 3 seconds at 60fps
      
      for (let frame = 0; frame < frameCount; frame++) {
        const startTime = performance.now();
        
        renderer.render(wheels, ctx);
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        renderTimings.push(renderTime);
      }

      const averageRenderTime = renderTimings.reduce((a, b) => a + b, 0) / renderTimings.length;
      const maxRenderTime = Math.max(...renderTimings);
      
      console.log(`Render Performance - Avg: ${averageRenderTime.toFixed(2)}ms, Max: ${maxRenderTime.toFixed(2)}ms`);
      
      expect(averageRenderTime).toBeLessThan(8); // Should average less than 8ms per frame
      expect(maxRenderTime).toBeLessThan(16); // Should never exceed one frame budget
    });
  });

  // Helper functions
  async function measureSpinningPerformance(wheels: Wheel[], durationMs: number): Promise<PerformanceMetrics> {
    const frameTimes: number[] = [];
    const startTime = performance.now();
    let lastFrameTime = startTime;
    
    // Start spinning
    wheels[0].angularVelocity = 20;
    wheels[1].angularVelocity = 15;
    
    while (performance.now() - startTime < durationMs) {
      const frameStart = performance.now();
      
      // Simulate frame
      physicsEngine.stepSimulation(1/60);
      renderer.render(wheels, ctx);
      
      const frameEnd = performance.now();
      const frameTime = frameEnd - frameStart;
      frameTimes.push(frameTime);
      
      lastFrameTime = frameEnd;
      
      // Maintain 60fps timing
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 16 - frameTime)));
    }

    return calculatePerformanceMetrics(frameTimes);
  }

  async function measurePowerMeterPerformance(durationMs: number): Promise<PerformanceMetrics> {
    const frameTimes: number[] = [];
    const startTime = performance.now();
    
    while (performance.now() - startTime < durationMs) {
      const frameStart = performance.now();
      
      // Simulate power meter animation
      const progress = ((performance.now() - startTime) % 1000) / 1000;
      const powerLevel = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
      
      // Render power meter (simplified)
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(10, 10, powerLevel * 200, 20);
      
      const frameEnd = performance.now();
      frameTimes.push(frameEnd - frameStart);
      
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    return calculatePerformanceMetrics(frameTimes);
  }

  async function measureUIUpdatePerformance(durationMs: number): Promise<PerformanceMetrics> {
    const frameTimes: number[] = [];
    const startTime = performance.now();
    
    while (performance.now() - startTime < durationMs) {
      const frameStart = performance.now();
      
      // Simulate UI updates
      const gameState = gameController.getGameState();
      const score = gameState.scores.get('p1') || 0;
      
      // Render UI elements (simplified)
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Score: ${score}`, 10, 50);
      ctx.fillText(`Player: ${gameState.players[gameState.currentPlayerIndex]?.name}`, 10, 70);
      
      const frameEnd = performance.now();
      frameTimes.push(frameEnd - frameStart);
      
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    return calculatePerformanceMetrics(frameTimes);
  }

  function calculatePerformanceMetrics(frameTimes: number[]): PerformanceMetrics {
    const fps = frameTimes.map(time => 1000 / Math.max(time, 1));
    const averageFPS = fps.reduce((a, b) => a + b, 0) / fps.length;
    const minFPS = Math.min(...fps);
    const maxFPS = Math.max(...fps);
    const frameTimeVariance = calculateVariance(frameTimes);
    
    return {
      averageFPS,
      minFPS,
      maxFPS,
      frameTimeVariance,
      memoryUsage: getMemoryUsage(),
      renderTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
      physicsTime: 0, // Would be measured separately
    };
  }

  function calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  }

  function getMemoryUsage(): number {
    // Simplified memory usage calculation
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  function createPerformanceTestWheels(outerWedgeCount: number, innerWedgeCount: number): Wheel[] {
    const outerWedges: Wedge[] = Array.from({ length: outerWedgeCount }, (_, i) => ({
      id: `outer${i}`,
      label: `Outer ${i + 1}`,
      weight: 1,
      color: `hsl(${(i * 360) / outerWedgeCount}, 70%, 50%)`,
    }));

    const innerWedges: Wedge[] = Array.from({ length: innerWedgeCount }, (_, i) => ({
      id: `inner${i}`,
      label: `Inner ${i + 1}`,
      weight: 1,
      color: `hsl(${(i * 360) / innerWedgeCount}, 70%, 70%)`,
    }));

    return [
      {
        id: 'outer',
        label: 'Outer Wheel',
        wedges: outerWedges,
        frictionCoefficient: 0.02,
        clutchRatio: 0,
        radius: 200,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      },
      {
        id: 'inner',
        label: 'Inner Wheel',
        wedges: innerWedges,
        frictionCoefficient: 0.03,
        clutchRatio: 0.5,
        radius: 100,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      },
    ];
  }

  function createWheelsWithMedia(): Wheel[] {
    const wheels = createPerformanceTestWheels(8, 6);
    
    // Add media to some wedges
    wheels[0].wedges[0].media = {
      type: 'image',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      alt: 'Test image',
    };
    
    wheels[1].wedges[0].media = {
      type: 'video',
      src: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr1tZGF0',
      alt: 'Test video',
    };

    return wheels;
  }
});