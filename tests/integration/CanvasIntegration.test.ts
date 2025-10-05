/**
 * Integration tests for Canvas wheel rendering functionality
 * Tests the integration between WheelRenderer and CanvasWheelRenderer
 */

import { WheelRenderer } from '../../src/components/WheelRenderer';
import { Wheel } from '../../src/models';

describe('Canvas Integration Tests', () => {
  let container: HTMLElement;
  let renderer: WheelRenderer;
  let mockWheel: Wheel;

  beforeEach(() => {
    // Create mock container
    container = document.createElement('div');
    container.id = 'canvas-integration-container';
    document.body.appendChild(container);

    // Create test wheel data
    mockWheel = {
      id: 'integration-wheel',
      label: 'Integration Test Wheel',
      wedges: [
        {
          id: 'wedge-1',
          label: 'Red',
          weight: 1,
          color: '#ff0000',
        },
        {
          id: 'wedge-2',
          label: 'Blue',
          weight: 2,
          color: '#0000ff',
        },
        {
          id: 'wedge-3',
          label: 'Green',
          weight: 1,
          color: '#00ff00',
        },
      ],
      frictionCoefficient: 0.02,
      radius: 150,
      position: { x: 250, y: 250 },
      currentAngle: 0,
      angularVelocity: 0,
    };

    renderer = new WheelRenderer('canvas-integration-container');
  });

  afterEach(() => {
    if (renderer) {
      renderer.stopAnimationLoop();
    }
    document.body.removeChild(container);
  });

  describe('Enhanced Wheel Rendering', () => {
    test('should render enhanced wheel without errors', () => {
      expect(() => {
        renderer.renderEnhancedWheel({
          wheelId: 'integration-wheel',
          wheel: mockWheel,
        });
      }).not.toThrow();
    });

    test('should render enhanced wheel with labels', () => {
      expect(() => {
        renderer.renderEnhancedWheel({
          wheelId: 'integration-wheel',
          wheel: mockWheel,
          showLabels: true,
        });
      }).not.toThrow();
    });

    test('should render enhanced wheel with probability indicators', () => {
      expect(() => {
        renderer.renderEnhancedWheel({
          wheelId: 'integration-wheel',
          wheel: mockWheel,
          showProbabilityIndicators: true,
        });
      }).not.toThrow();
    });

    test('should render enhanced wheel with highlighted wedge', () => {
      expect(() => {
        renderer.renderEnhancedWheel({
          wheelId: 'integration-wheel',
          wheel: mockWheel,
          highlightedWedgeId: 'wedge-1',
        });
      }).not.toThrow();
    });

    test('should render enhanced wheel with animation progress', () => {
      expect(() => {
        renderer.renderEnhancedWheel({
          wheelId: 'integration-wheel',
          wheel: mockWheel,
          animationProgress: 0.5,
        });
      }).not.toThrow();
    });

    test('should force CSS rendering when Canvas is disabled', () => {
      expect(() => {
        renderer.renderEnhancedWheel({
          wheelId: 'integration-wheel',
          wheel: mockWheel,
          useCanvas: false,
        });
      }).not.toThrow();
    });
  });

  describe('Enhanced Wheel Rotation', () => {
    test('should update enhanced wheel rotation', () => {
      expect(() => {
        renderer.updateEnhancedWheelRotation('integration-wheel', 45, 10);
      }).not.toThrow();
    });

    test('should handle multiple rotation updates', () => {
      expect(() => {
        renderer.updateEnhancedWheelRotation('wheel-1', 45, 10);
        renderer.updateEnhancedWheelRotation('wheel-2', 90, 5);
      }).not.toThrow();
    });
  });

  describe('Visual Effects', () => {
    test('should add visual effects', () => {
      expect(() => {
        renderer.addVisualEffect('integration-wheel', {
          type: 'glow',
          intensity: 0.8,
          color: '#ffff00',
        });
      }).not.toThrow();
    });

    test('should clear visual effects', () => {
      renderer.addVisualEffect('integration-wheel', {
        type: 'glow',
        intensity: 0.8,
      });

      expect(() => {
        renderer.clearVisualEffects('integration-wheel');
      }).not.toThrow();
    });
  });

  describe('Animation Loop', () => {
    test('should start and stop animation loop', () => {
      expect(() => {
        renderer.startAnimationLoop();
      }).not.toThrow();

      expect(() => {
        renderer.stopAnimationLoop();
      }).not.toThrow();
    });
  });

  describe('Enhanced Wedge Result Calculation', () => {
    test('should determine enhanced wedge result', () => {
      const result = renderer.determineEnhancedWedgeResult('integration-wheel', 0, mockWheel);
      
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(mockWheel.wedges.length);
      expect(result.wedge).toBeDefined();
      expect(result.wedge.id).toBeDefined();
    });

    test('should handle different angles correctly', () => {
      const angles = [0, 90, 180, 270, 360, -90, 450];
      
      angles.forEach(angle => {
        const result = renderer.determineEnhancedWedgeResult('integration-wheel', angle, mockWheel);
        expect(result.index).toBeGreaterThanOrEqual(0);
        expect(result.index).toBeLessThan(mockWheel.wedges.length);
        expect(result.wedge).toBeDefined();
      });
    });
  });

  describe('Canvas Support Detection', () => {
    test('should detect Canvas support', () => {
      const isSupported = renderer.isCanvasSupported();
      expect(typeof isSupported).toBe('boolean');
    });

    test('should provide Canvas renderer when supported', () => {
      if (renderer.isCanvasSupported()) {
        const canvasRenderer = renderer.getCanvasRenderer();
        expect(canvasRenderer).toBeDefined();
      }
    });
  });

  describe('Performance Metrics', () => {
    test('should provide performance metrics when Canvas is supported', () => {
      const metrics = renderer.getPerformanceMetrics();
      
      if (renderer.isCanvasSupported()) {
        expect(metrics).toBeDefined();
        expect(typeof metrics!.frameTime).toBe('number');
        expect(typeof metrics!.fps).toBe('number');
        expect(typeof metrics!.drawCalls).toBe('number');
      } else {
        expect(metrics).toBeNull();
      }
    });
  });

  describe('Fallback Behavior', () => {
    test('should handle wheel clearing', () => {
      renderer.renderEnhancedWheel({
        wheelId: 'integration-wheel',
        wheel: mockWheel,
      });

      expect(() => {
        renderer.clearWheels();
      }).not.toThrow();
    });

    test('should maintain backward compatibility with legacy methods', () => {
      expect(() => {
        renderer.createWheel({
          wheelId: 'legacy-wheel',
          wedgeCount: 3,
          texts: ['Red', 'Blue', 'Green'],
          colors: ['#ff0000', '#0000ff', '#00ff00'],
          radius: 150,
        });
      }).not.toThrow();

      expect(() => {
        renderer.updateWheelRotation('legacy-wheel', 45);
      }).not.toThrow();

      const result = renderer.determineWedgeResult('legacy-wheel', 0, 3, ['Red', 'Blue', 'Green']);
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(3);
      expect(result.text).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty wedge arrays', () => {
      const emptyWheel: Wheel = {
        ...mockWheel,
        wedges: [],
      };

      expect(() => {
        renderer.renderEnhancedWheel({
          wheelId: 'empty-wheel',
          wheel: emptyWheel,
        });
      }).not.toThrow();
    });

    test('should handle invalid wheel IDs gracefully', () => {
      expect(() => {
        renderer.updateEnhancedWheelRotation('non-existent-wheel', 45);
      }).not.toThrow();

      expect(() => {
        renderer.addVisualEffect('non-existent-wheel', {
          type: 'glow',
          intensity: 0.5,
        });
      }).not.toThrow();
    });

    test('should handle wedges with media', () => {
      const wheelWithMedia: Wheel = {
        ...mockWheel,
        wedges: [
          {
            id: 'media-wedge',
            label: 'Media Wedge',
            weight: 1,
            color: '#ff0000',
            media: {
              type: 'image',
              src: 'test-image.jpg',
              alt: 'Test Image',
            },
          },
        ],
      };

      expect(() => {
        renderer.renderEnhancedWheel({
          wheelId: 'media-wheel',
          wheel: wheelWithMedia,
        });
      }).not.toThrow();
    });
  });
});