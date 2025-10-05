/**
 * Performance tests for CanvasWheelRenderer - Focused on 60fps requirement
 * These tests verify the performance requirements without relying on full Canvas API mocking
 */

import { CanvasWheelRenderer } from '../../src/components/CanvasWheelRenderer';
import { Wheel, Wedge } from '../../src/models';

// Simple performance test that focuses on the core requirement
describe('CanvasWheelRenderer Performance Requirements', () => {
  let container: HTMLElement;
  let mockWheel: Wheel;

  beforeEach(() => {
    // Create mock container
    container = document.createElement('div');
    container.id = 'perf-test-container';
    document.body.appendChild(container);

    // Create test wheel data with multiple wedges
    const wedges: Wedge[] = [];
    for (let i = 0; i < 20; i++) {
      wedges.push({
        id: `wedge-${i}`,
        label: `Wedge ${i}`,
        weight: Math.random() * 10 + 1,
        color: `hsl(${(i * 360) / 20}, 70%, 50%)`,
      });
    }

    mockWheel = {
      id: 'perf-test-wheel',
      label: 'Performance Test Wheel',
      wedges,
      frictionCoefficient: 0.02,
      radius: 200,
      position: { x: 250, y: 250 },
      currentAngle: 0,
      angularVelocity: 0,
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('should initialize CanvasWheelRenderer without errors', () => {
    expect(() => {
      new CanvasWheelRenderer('perf-test-container');
    }).not.toThrow();
  });

  test('should handle wedge result calculation efficiently', () => {
    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    const startTime = performance.now();
    
    // Test wedge result calculation performance
    for (let i = 0; i < 1000; i++) {
      const angle = Math.random() * 360;
      const result = renderer.determineWedgeResult('test-wheel', angle, mockWheel.wedges);
      
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(mockWheel.wedges.length);
      expect(result.wedge).toBeDefined();
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should complete 1000 calculations in reasonable time (less than 500ms)
    expect(totalTime).toBeLessThan(500);
  });

  test('should handle angle calculations for various inputs', () => {
    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    const testAngles = [
      0, 45, 90, 135, 180, 225, 270, 315, 360,
      -90, -180, 450, 720, -360,
    ];
    
    testAngles.forEach(angle => {
      const result = renderer.determineWedgeResult('test-wheel', angle, mockWheel.wedges);
      
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(mockWheel.wedges.length);
      expect(result.wedge.id).toBeDefined();
    });
  });

  test('should handle rotation updates efficiently', () => {
    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    const startTime = performance.now();
    
    // Test rotation update performance
    for (let i = 0; i < 1000; i++) {
      renderer.updateWheelRotation('test-wheel', i * 3.6, 100 - (i / 10));
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should complete 1000 rotation updates quickly (less than 50ms)
    expect(totalTime).toBeLessThan(50);
  });

  test('should handle visual effects management efficiently', () => {
    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    const effects = [
      { type: 'glow' as const, intensity: 0.8, color: '#ffff00' },
      { type: 'pulse' as const, intensity: 0.6, color: '#ff0000' },
      { type: 'sparkle' as const, intensity: 1.0, color: '#ffffff' },
      { type: 'highlight' as const, intensity: 0.9, color: '#00ff00' },
    ];
    
    const startTime = performance.now();
    
    // Test visual effects performance
    for (let i = 0; i < 100; i++) {
      effects.forEach(effect => {
        renderer.addVisualEffect('test-wheel', effect);
      });
      renderer.clearVisualEffects('test-wheel');
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should handle effects management efficiently (less than 100ms)
    expect(totalTime).toBeLessThan(100);
  });

  test('should provide performance metrics', () => {
    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    const metrics = renderer.getMetrics();
    
    expect(metrics).toBeDefined();
    expect(typeof metrics.frameTime).toBe('number');
    expect(typeof metrics.fps).toBe('number');
    expect(typeof metrics.drawCalls).toBe('number');
    expect(typeof metrics.lastRenderTime).toBe('number');
  });

  test('should handle animation loop lifecycle', () => {
    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    expect(() => {
      renderer.startAnimationLoop();
    }).not.toThrow();
    
    expect(() => {
      renderer.stopAnimationLoop();
    }).not.toThrow();
  });

  test('should handle canvas operations', () => {
    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    expect(() => {
      renderer.clear();
    }).not.toThrow();
    
    const canvas = renderer.getCanvas();
    expect(canvas).toBeDefined();
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(500);
    
    const containerElement = renderer.getContainer();
    expect(containerElement).toBe(container);
  });

  test('should verify Canvas support detection', () => {
    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    // The renderer should be created successfully, indicating Canvas support detection works
    expect(renderer).toBeDefined();
    expect(renderer.getCanvas()).toBeDefined();
  });

  test('should handle large number of wedges efficiently', () => {
    // Create a wheel with many wedges
    const largeWedges: Wedge[] = [];
    for (let i = 0; i < 100; i++) {
      largeWedges.push({
        id: `large-wedge-${i}`,
        label: `Large Wedge ${i}`,
        weight: Math.random() * 10 + 1,
        color: `hsl(${(i * 360) / 100}, 70%, 50%)`,
      });
    }

    const largeWheel: Wheel = {
      ...mockWheel,
      wedges: largeWedges,
    };

    const renderer = new CanvasWheelRenderer('perf-test-container');
    
    const startTime = performance.now();
    
    // Test performance with large number of wedges
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * 360;
      const result = renderer.determineWedgeResult('large-wheel', angle, largeWheel.wedges);
      
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(largeWheel.wedges.length);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should handle large wheels efficiently (less than 200ms for 100 calculations)
    expect(totalTime).toBeLessThan(200);
  });
});