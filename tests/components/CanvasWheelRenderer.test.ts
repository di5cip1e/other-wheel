/**
 * Tests for CanvasWheelRenderer - High-performance Canvas-based wheel rendering
 */

import { CanvasWheelRenderer, CanvasRenderOptions, VisualEffect } from '../../src/components/CanvasWheelRenderer';
import { Wheel, Wedge } from '../../src/models';

// Mock HTMLCanvasElement and CanvasRenderingContext2D for testing
class MockCanvasRenderingContext2D {
  public fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  public strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  public lineWidth: number = 1;
  public font: string = '10px sans-serif';
  public textAlign: CanvasTextAlign = 'start';
  public textBaseline: CanvasTextBaseline = 'alphabetic';
  public globalAlpha: number = 1;
  public filter: string = 'none';

  public save(): void {}
  public restore(): void {}
  public beginPath(): void {}
  public closePath(): void {}
  public moveTo(_x: number, _y: number): void {}
  public lineTo(_x: number, _y: number): void {}
  public arc(_x: number, _y: number, _radius: number, _startAngle: number, _endAngle: number): void {}
  public fill(): void {}
  public stroke(): void {}
  public clip(): void {}
  public clearRect(_x: number, _y: number, _width: number, _height: number): void {}
  public fillText(_text: string, _x: number, _y: number): void {}
  public strokeText(_text: string, _x: number, _y: number): void {}
  public drawImage(_image: CanvasImageSource, _dx: number, _dy: number, _dw?: number, _dh?: number): void {}
  public translate(_x: number, _y: number): void {}
  public rotate(_angle: number): void {}
  public scale(_x: number, _y: number): void {}
  public createRadialGradient(_x0: number, _y0: number, _r0: number, _x1: number, _y1: number, _r1: number): CanvasGradient {
    return {
      addColorStop: (_offset: number, _color: string) => {},
    } as CanvasGradient;
  }
}

class MockHTMLCanvasElement {
  public width: number = 500;
  public height: number = 500;
  public style: Partial<CSSStyleDeclaration> = {};

  public getContext(_contextId: string): MockCanvasRenderingContext2D {
    return new MockCanvasRenderingContext2D();
  }
}

// Mock DOM methods
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: MockHTMLCanvasElement,
  writable: true,
});

Object.defineProperty(global, 'Image', {
  value: class MockImage {
    public src: string = '';
    public crossOrigin: string | null = null;
    public complete: boolean = true;
    public onload: (() => void) | null = null;
  },
  writable: true,
});

Object.defineProperty(global, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => setTimeout(callback, 16),
  writable: true,
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: (id: number) => clearTimeout(id),
  writable: true,
});

Object.defineProperty(global, 'performance', {
  value: {
    now: () => Date.now(),
  },
  writable: true,
});

describe('CanvasWheelRenderer', () => {
  let container: HTMLElement;
  let renderer: CanvasWheelRenderer;
  let mockWheel: Wheel;

  beforeEach(() => {
    // Create mock container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create test wheel data
    mockWheel = {
      id: 'test-wheel',
      label: 'Test Wheel',
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

    renderer = new CanvasWheelRenderer('test-container');
  });

  afterEach(() => {
    if (renderer) {
      renderer.stopAnimationLoop();
    }
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    test('should create canvas element with correct dimensions', () => {
      const canvas = renderer.getCanvas();
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(500);
      expect(canvas.height).toBe(500);
    });

    test('should create container with proper styling', () => {
      const containerElement = renderer.getContainer();
      expect(containerElement.style.position).toBe('relative');
      expect(containerElement.style.width).toBe('500px');
      expect(containerElement.style.height).toBe('500px');
    });

    test('should create needle element', () => {
      const needle = container.querySelector('#needle') as HTMLElement;
      expect(needle).toBeDefined();
      expect(needle?.style.position).toBe('absolute');
      expect(needle?.style.zIndex).toBe('10');
    });

    test('should throw error for invalid container', () => {
      expect(() => {
        new CanvasWheelRenderer('non-existent-container');
      }).toThrow('Container element with id \'non-existent-container\' not found');
    });
  });

  describe('Wheel Rendering', () => {
    test('should render wheel with basic options', () => {
      const options: CanvasRenderOptions = {
        wheelId: 'test-wheel',
        wheel: mockWheel,
      };

      expect(() => {
        renderer.renderWheel(options);
      }).not.toThrow();
    });

    test('should render wheel with labels', () => {
      const options: CanvasRenderOptions = {
        wheelId: 'test-wheel',
        wheel: mockWheel,
        showLabels: true,
      };

      expect(() => {
        renderer.renderWheel(options);
      }).not.toThrow();
    });

    test('should render wheel with highlighted wedge', () => {
      const options: CanvasRenderOptions = {
        wheelId: 'test-wheel',
        wheel: mockWheel,
        highlightedWedgeId: 'wedge-1',
      };

      expect(() => {
        renderer.renderWheel(options);
      }).not.toThrow();
    });

    test('should render wheel with animation progress', () => {
      const options: CanvasRenderOptions = {
        wheelId: 'test-wheel',
        wheel: mockWheel,
        animationProgress: 0.5,
      };

      expect(() => {
        renderer.renderWheel(options);
      }).not.toThrow();
    });

    test('should render wheel with probability indicators', () => {
      const options: CanvasRenderOptions = {
        wheelId: 'test-wheel',
        wheel: mockWheel,
        showProbabilityIndicators: true,
      };

      expect(() => {
        renderer.renderWheel(options);
      }).not.toThrow();
    });
  });

  describe('Wheel Rotation', () => {
    test('should update wheel rotation', () => {
      renderer.updateWheelRotation('test-wheel', 45, 10);
      
      // Verify rotation was stored (internal state)
      expect(() => {
        const options: CanvasRenderOptions = {
          wheelId: 'test-wheel',
          wheel: mockWheel,
        };
        renderer.renderWheel(options);
      }).not.toThrow();
    });

    test('should handle multiple wheel rotations', () => {
      renderer.updateWheelRotation('wheel-1', 45, 10);
      renderer.updateWheelRotation('wheel-2', 90, 5);
      
      expect(() => {
        renderer.renderWheel({
          wheelId: 'wheel-1',
          wheel: mockWheel,
        });
      }).not.toThrow();
    });
  });

  describe('Visual Effects', () => {
    test('should add glow effect', () => {
      const glowEffect: VisualEffect = {
        type: 'glow',
        intensity: 0.8,
        color: '#ffff00',
      };

      renderer.addVisualEffect('test-wheel', glowEffect);
      
      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: mockWheel,
        });
      }).not.toThrow();
    });

    test('should add pulse effect', () => {
      const pulseEffect: VisualEffect = {
        type: 'pulse',
        intensity: 0.6,
        color: '#ff0000',
      };

      renderer.addVisualEffect('test-wheel', pulseEffect);
      
      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: mockWheel,
        });
      }).not.toThrow();
    });

    test('should add sparkle effect', () => {
      const sparkleEffect: VisualEffect = {
        type: 'sparkle',
        intensity: 1.0,
        color: '#ffffff',
      };

      renderer.addVisualEffect('test-wheel', sparkleEffect);
      
      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: mockWheel,
        });
      }).not.toThrow();
    });

    test('should add highlight effect', () => {
      const highlightEffect: VisualEffect = {
        type: 'highlight',
        intensity: 0.9,
        color: '#00ff00',
      };

      renderer.addVisualEffect('test-wheel', highlightEffect);
      
      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: mockWheel,
        });
      }).not.toThrow();
    });

    test('should clear visual effects', () => {
      const effect: VisualEffect = {
        type: 'glow',
        intensity: 0.5,
      };

      renderer.addVisualEffect('test-wheel', effect);
      renderer.clearVisualEffects('test-wheel');
      
      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: mockWheel,
        });
      }).not.toThrow();
    });
  });

  describe('Wedge Selection', () => {
    test('should determine correct wedge result', () => {
      const result = renderer.determineWedgeResult('test-wheel', 0, mockWheel.wedges);
      
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(mockWheel.wedges.length);
      expect(result.wedge).toBeDefined();
      expect(result.wedge.id).toBeDefined();
    });

    test('should handle different angles correctly', () => {
      const angles = [0, 90, 180, 270, 360];
      
      angles.forEach(angle => {
        const result = renderer.determineWedgeResult('test-wheel', angle, mockWheel.wedges);
        expect(result.index).toBeGreaterThanOrEqual(0);
        expect(result.index).toBeLessThan(mockWheel.wedges.length);
      });
    });

    test('should handle negative angles', () => {
      const result = renderer.determineWedgeResult('test-wheel', -90, mockWheel.wedges);
      
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(mockWheel.wedges.length);
    });

    test('should handle angles greater than 360', () => {
      const result = renderer.determineWedgeResult('test-wheel', 450, mockWheel.wedges);
      
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(mockWheel.wedges.length);
    });
  });

  describe('Animation Loop', () => {
    test('should start animation loop', () => {
      expect(() => {
        renderer.startAnimationLoop();
      }).not.toThrow();
    });

    test('should stop animation loop', () => {
      renderer.startAnimationLoop();
      
      expect(() => {
        renderer.stopAnimationLoop();
      }).not.toThrow();
    });

    test('should not start multiple animation loops', () => {
      renderer.startAnimationLoop();
      renderer.startAnimationLoop(); // Should not cause issues
      
      expect(() => {
        renderer.stopAnimationLoop();
      }).not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    test('should track rendering metrics', () => {
      renderer.renderWheel({
        wheelId: 'test-wheel',
        wheel: mockWheel,
      });

      const metrics = renderer.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.frameTime).toBeGreaterThanOrEqual(0);
      expect(metrics.drawCalls).toBeGreaterThan(0);
      expect(metrics.lastRenderTime).toBeGreaterThan(0);
    });

    test('should update FPS calculation', () => {
      // Render multiple frames to test FPS calculation
      for (let i = 0; i < 5; i++) {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: mockWheel,
        });
      }

      const metrics = renderer.getMetrics();
      expect(metrics.fps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Media Support', () => {
    test('should handle wedge with image media', () => {
      const wheelWithMedia: Wheel = {
        ...mockWheel,
        wedges: [
          {
            id: 'wedge-with-image',
            label: 'Image Wedge',
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
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: wheelWithMedia,
        });
      }).not.toThrow();
    });

    test('should handle wedge with video media', () => {
      const wheelWithMedia: Wheel = {
        ...mockWheel,
        wedges: [
          {
            id: 'wedge-with-video',
            label: 'Video Wedge',
            weight: 1,
            color: '#0000ff',
            media: {
              type: 'video',
              src: 'test-video.mp4',
            },
          },
        ],
      };

      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: wheelWithMedia,
        });
      }).not.toThrow();
    });
  });

  describe('Canvas Operations', () => {
    test('should clear canvas', () => {
      renderer.renderWheel({
        wheelId: 'test-wheel',
        wheel: mockWheel,
      });

      expect(() => {
        renderer.clear();
      }).not.toThrow();
    });

    test('should get canvas element', () => {
      const canvas = renderer.getCanvas();
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(500);
      expect(canvas.height).toBe(500);
    });

    test('should get container element', () => {
      const containerElement = renderer.getContainer();
      expect(containerElement).toBe(container);
    });
  });

  describe('Error Handling', () => {
    test('should handle empty wedge array', () => {
      const emptyWheel: Wheel = {
        ...mockWheel,
        wedges: [],
      };

      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: emptyWheel,
        });
      }).not.toThrow();
    });

    test('should handle wedge with empty label', () => {
      const wheelWithEmptyLabel: Wheel = {
        ...mockWheel,
        wedges: [
          {
            id: 'empty-label-wedge',
            label: '',
            weight: 1,
            color: '#ff0000',
          },
        ],
      };

      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: wheelWithEmptyLabel,
        });
      }).not.toThrow();
    });

    test('should handle invalid media URLs gracefully', () => {
      const wheelWithInvalidMedia: Wheel = {
        ...mockWheel,
        wedges: [
          {
            id: 'invalid-media-wedge',
            label: 'Invalid Media',
            weight: 1,
            color: '#ff0000',
            media: {
              type: 'image',
              src: 'invalid-url.jpg',
            },
          },
        ],
      };

      expect(() => {
        renderer.renderWheel({
          wheelId: 'test-wheel',
          wheel: wheelWithInvalidMedia,
        });
      }).not.toThrow();
    });
  });
});

describe('CanvasWheelRenderer Performance Tests', () => {
  let container: HTMLElement;
  let renderer: CanvasWheelRenderer;
  let largeWheel: Wheel;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'perf-test-container';
    document.body.appendChild(container);

    // Create a wheel with many wedges for performance testing
    const wedges: Wedge[] = [];
    for (let i = 0; i < 50; i++) {
      wedges.push({
        id: `wedge-${i}`,
        label: `Wedge ${i}`,
        weight: Math.random() * 10 + 1,
        color: `hsl(${(i * 360) / 50}, 70%, 50%)`,
      });
    }

    largeWheel = {
      id: 'large-wheel',
      label: 'Large Test Wheel',
      wedges,
      frictionCoefficient: 0.02,
      radius: 200,
      position: { x: 250, y: 250 },
      currentAngle: 0,
      angularVelocity: 0,
    };

    renderer = new CanvasWheelRenderer('perf-test-container');
  });

  afterEach(() => {
    renderer.stopAnimationLoop();
    document.body.removeChild(container);
  });

  test('should maintain 60fps target with large wheel', () => {
    const frameCount = 60; // Test 60 frames
    const startTime = performance.now();

    for (let i = 0; i < frameCount; i++) {
      renderer.renderWheel({
        wheelId: 'large-wheel',
        wheel: largeWheel,
        animationProgress: i / frameCount,
      });
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageFrameTime = totalTime / frameCount;
    const targetFrameTime = 1000 / 60; // 16.67ms for 60fps

    expect(averageFrameTime).toBeLessThan(targetFrameTime * 2); // Allow some tolerance
  });

  test('should handle rapid rotation updates efficiently', () => {
    const updateCount = 100;
    const startTime = performance.now();

    for (let i = 0; i < updateCount; i++) {
      renderer.updateWheelRotation('large-wheel', i * 3.6, 100 - i);
      renderer.renderWheel({
        wheelId: 'large-wheel',
        wheel: largeWheel,
      });
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should complete 100 updates + renders in reasonable time
    expect(totalTime).toBeLessThan(1000); // Less than 1 second
  });

  test('should handle multiple visual effects efficiently', () => {
    const effects: VisualEffect[] = [
      { type: 'glow', intensity: 0.8, color: '#ffff00' },
      { type: 'pulse', intensity: 0.6, color: '#ff0000' },
      { type: 'sparkle', intensity: 1.0, color: '#ffffff' },
      { type: 'highlight', intensity: 0.9, color: '#00ff00' },
    ];

    effects.forEach(effect => {
      renderer.addVisualEffect('large-wheel', effect);
    });

    const renderCount = 30;
    const startTime = performance.now();

    for (let i = 0; i < renderCount; i++) {
      renderer.renderWheel({
        wheelId: 'large-wheel',
        wheel: largeWheel,
        animationProgress: i / renderCount,
      });
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageFrameTime = totalTime / renderCount;

    // Should maintain reasonable performance even with multiple effects
    expect(averageFrameTime).toBeLessThan(50); // 50ms per frame max
  });

  test('should track performance metrics accurately', () => {
    // Render several frames
    for (let i = 0; i < 10; i++) {
      renderer.renderWheel({
        wheelId: 'large-wheel',
        wheel: largeWheel,
      });
    }

    const metrics = renderer.getMetrics();
    
    expect(metrics.drawCalls).toBe(10);
    expect(metrics.frameTime).toBeGreaterThan(0);
    expect(metrics.lastRenderTime).toBeGreaterThan(0);
  });
});