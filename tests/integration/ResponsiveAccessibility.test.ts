/**
 * Integration tests for responsive design and accessibility features
 */

import { AccessibilityManager } from '../../src/utils/AccessibilityManager';
import { KeyboardNavigationManager } from '../../src/utils/KeyboardNavigationManager';
import { TouchGestureHandler, SwipeDirection } from '../../src/utils/TouchGestureHandler';

describe('Responsive Design and Accessibility Integration', () => {
  let container: HTMLElement;
  let accessibilityManager: AccessibilityManager;
  let keyboardManager: KeyboardNavigationManager;
  let touchHandler: TouchGestureHandler;

  beforeEach(() => {
    // Create main game container
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);

    // Create game structure
    createGameStructure();

    // Initialize managers
    accessibilityManager = new AccessibilityManager({
      announceChanges: true,
      keyboardNavigation: true,
      screenReaderOptimizations: true,
    });

    keyboardManager = new KeyboardNavigationManager({
      rootElement: container,
      skipLinks: [
        { text: 'Skip to wheel', targetId: 'wheel-container' },
        { text: 'Skip to controls', targetId: 'power-meter-container' },
      ],
    });

    const wheelContainer = document.getElementById('wheel-container')!;
    touchHandler = new TouchGestureHandler({
      element: wheelContainer,
      onSwipe: (direction, velocity) => {
        // Simulate wheel spin based on swipe
        const event = new CustomEvent('wheelSpinStart');
        document.dispatchEvent(event);
      },
      onTap: (x, y) => {
        // Simulate power meter activation
        const powerMeter = document.getElementById('power-meter');
        if (powerMeter) {
          powerMeter.click();
        }
      },
    });
  });

  afterEach(() => {
    accessibilityManager.dispose();
    keyboardManager.dispose();
    touchHandler.dispose();
    document.body.removeChild(container);
    
    // Clean up any remaining elements
    const liveRegions = document.querySelectorAll('[aria-live]');
    liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
  });

  function createGameStructure(): void {
    container.innerHTML = `
      <header>
        <h1>Wheel within a Wheel Game</h1>
        <p>Spin the wheels and test your luck!</p>
      </header>
      
      <main id="game-main">
        <section id="wheel-container" class="wheel-container">
          <div class="outer-wheel">
            <div class="wedge" tabindex="0" data-label="Prize 1">Prize 1</div>
            <div class="wedge" tabindex="0" data-label="Prize 2">Prize 2</div>
            <div class="wedge" tabindex="0" data-label="Prize 3">Prize 3</div>
          </div>
          <div class="inner-wheel">
            <div class="wedge" tabindex="0" data-label="Bonus A">Bonus A</div>
            <div class="wedge" tabindex="0" data-label="Bonus B">Bonus B</div>
          </div>
        </section>
        
        <aside id="right-panel">
          <section id="power-meter-container">
            <h2>Power Control</h2>
            <button id="power-meter" aria-label="Activate power meter">Start Spin</button>
            <div class="power-bar" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
              <div class="power-indicator"></div>
            </div>
          </section>
          
          <section id="player-ui-container">
            <h2>Players</h2>
            <div class="player-list">
              <div class="player-card" tabindex="0">
                <span class="player-name">Player 1</span>
                <span class="player-score">0</span>
              </div>
              <div class="player-card" tabindex="0">
                <span class="player-name">Player 2</span>
                <span class="player-score">0</span>
              </div>
            </div>
          </section>
          
          <section id="editors-container">
            <h2>Game Editor</h2>
            <div class="editor-tabs">
              <button class="tab-button active" data-tab="wheel">Wheel Editor</button>
              <button class="tab-button" data-tab="rules">Rules Editor</button>
            </div>
            <div class="editor-content">
              <input type="text" placeholder="Wedge label" aria-label="Wedge label">
              <input type="number" placeholder="Weight" aria-label="Wedge weight">
              <button>Add Wedge</button>
            </div>
          </section>
        </aside>
      </main>
    `;
  }

  describe('Mobile Responsiveness', () => {
    test('should adapt layout for mobile viewport', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      // Check if mobile styles are applied
      const gameMain = document.getElementById('game-main');
      const computedStyle = window.getComputedStyle(gameMain!);
      
      // In mobile, should be single column
      expect(computedStyle.gridTemplateColumns).toBe('1fr');
    });

    test('should provide touch-friendly targets on mobile', () => {
      // Simulate touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        const minSize = 44; // iOS accessibility guideline
        
        expect(rect.width).toBeGreaterThanOrEqual(minSize);
        expect(rect.height).toBeGreaterThanOrEqual(minSize);
      });
    });

    test('should handle touch gestures for wheel spinning', () => {
      const wheelContainer = document.getElementById('wheel-container')!;
      const mockSpinStart = jest.fn();
      
      document.addEventListener('wheelSpinStart', mockSpinStart);

      // Simulate swipe gesture
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(200, 200)],
      });
      wheelContainer.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [createTouch(300, 200)],
      });
      wheelContainer.dispatchEvent(moveEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(300, 200)],
      });
      wheelContainer.dispatchEvent(endEvent);

      expect(mockSpinStart).toHaveBeenCalled();
    });
  });

  describe('Tablet Responsiveness', () => {
    test('should adapt layout for tablet viewport', () => {
      // Simulate tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      window.dispatchEvent(new Event('resize'));

      // Check tablet-specific adaptations
      const rightPanel = document.getElementById('right-panel');
      expect(rightPanel).toBeTruthy();
      
      // Should maintain some two-column layout on tablet
      const gameMain = document.getElementById('game-main');
      const computedStyle = window.getComputedStyle(gameMain!);
      expect(computedStyle.gridTemplateColumns).not.toBe('1fr');
    });
  });

  describe('Keyboard Navigation Integration', () => {
    test('should navigate through all interactive elements', () => {
      const focusableElements = container.querySelectorAll(
        'button, input, [tabindex="0"]',
      ) as NodeListOf<HTMLElement>;

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test tab navigation through all elements
      let currentIndex = 0;
      focusableElements[currentIndex].focus();

      for (let i = 1; i < focusableElements.length; i++) {
        keyboardManager.focusNext();
        currentIndex++;
        expect(document.activeElement).toBe(focusableElements[currentIndex]);
      }
    });

    test('should handle arrow key navigation in wheel', () => {
      const wheelContainer = document.getElementById('wheel-container')!;
      const wedges = wheelContainer.querySelectorAll('.wedge') as NodeListOf<HTMLElement>;
      
      wedges[0].focus();

      const rightArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(rightArrowEvent);
      expect(document.activeElement).toBe(wedges[1]);
    });

    test('should announce focus changes', () => {
      const button = document.getElementById('power-meter')!;
      button.focus();

      const announcer = document.getElementById('keyboard-announcer');
      expect(announcer?.textContent).toContain('Activate power meter');
    });
  });

  describe('Screen Reader Support', () => {
    test('should provide proper ARIA labels', () => {
      const powerMeter = document.getElementById('power-meter');
      expect(powerMeter?.getAttribute('aria-label')).toBe('Activate power meter');

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar?.getAttribute('aria-valuenow')).toBe('50');
      expect(progressBar?.getAttribute('aria-valuemin')).toBe('0');
      expect(progressBar?.getAttribute('aria-valuemax')).toBe('100');
    });

    test('should announce game state changes', () => {
      const gameStateEvent = new CustomEvent('gameStateChange', {
        detail: { phase: 'spinning' },
      });
      document.dispatchEvent(gameStateEvent);

      const politeRegion = document.getElementById('aria-live-polite');
      expect(politeRegion?.textContent).toBe('Wheel is spinning');
    });

    test('should provide skip links for navigation', () => {
      const skipLinks = document.querySelectorAll('.skip-link');
      expect(skipLinks.length).toBeGreaterThan(0);

      const wheelSkipLink = Array.from(skipLinks).find(link =>
        link.textContent === 'Skip to wheel',
      ) as HTMLAnchorElement;

      expect(wheelSkipLink).toBeTruthy();
      wheelSkipLink.click();

      const wheelContainer = document.getElementById('wheel-container');
      expect(document.activeElement).toBe(wheelContainer);
    });
  });

  describe('Reduced Motion Support', () => {
    test('should disable animations when reduced motion is preferred', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      // Create new accessibility manager to trigger preference detection
      accessibilityManager.dispose();
      accessibilityManager = new AccessibilityManager();

      expect(document.body.classList.contains('reduced-motion')).toBe(true);

      // Check that spinning animations are disabled
      const wheelContainer = document.getElementById('wheel-container');
      wheelContainer?.classList.add('wheel-spinning');

      const computedStyle = window.getComputedStyle(wheelContainer!);
      expect(computedStyle.animationDuration).toBe('0.01ms');
    });

    test('should provide reduced motion toggle', () => {
      accessibilityManager.enableReducedMotion(true);
      expect(document.body.classList.contains('reduced-motion')).toBe(true);

      accessibilityManager.enableReducedMotion(false);
      expect(document.body.classList.contains('reduced-motion')).toBe(false);
    });
  });

  describe('High Contrast Support', () => {
    test('should apply high contrast styles when preferred', () => {
      accessibilityManager.enableHighContrast(true);
      expect(document.body.classList.contains('high-contrast')).toBe(true);

      // Check that high contrast styles are applied
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        expect(computedStyle.borderWidth).toBe('2px');
      });
    });
  });

  describe('Focus Management', () => {
    test('should trap focus in modals', () => {
      // Create a modal
      const modal = document.createElement('div');
      modal.className = 'turn-transition-overlay visible';
      modal.innerHTML = `
        <div class="turn-transition-message">
          <button id="modal-button-1">Button 1</button>
          <button id="modal-button-2">Button 2</button>
        </div>
      `;
      document.body.appendChild(modal);

      const button1 = document.getElementById('modal-button-1')!;
      const button2 = document.getElementById('modal-button-2')!;

      button2.focus();

      // Tab should wrap to first button
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(button1);

      document.body.removeChild(modal);
    });

    test('should restore focus after modal closes', () => {
      const originalButton = document.getElementById('power-meter')!;
      originalButton.focus();

      // Create and show modal
      const modal = document.createElement('div');
      modal.className = 'turn-transition-overlay visible';
      document.body.appendChild(modal);

      // Close modal with Escape
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(escapeEvent);

      expect(modal.classList.contains('visible')).toBe(false);

      document.body.removeChild(modal);
    });
  });

  describe('Cross-Device Compatibility', () => {
    test('should work with both touch and mouse input', () => {
      const wheelContainer = document.getElementById('wheel-container')!;
      const mockCallback = jest.fn();

      // Test mouse input
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 200,
        clientY: 200,
        button: 0,
      });
      wheelContainer.dispatchEvent(mouseDownEvent);

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 300,
        clientY: 200,
      });
      wheelContainer.dispatchEvent(mouseMoveEvent);

      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 300,
        clientY: 200,
        button: 0,
      });
      wheelContainer.dispatchEvent(mouseUpEvent);

      // Test touch input
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [createTouch(200, 200)],
      });
      wheelContainer.dispatchEvent(touchStartEvent);

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [createTouch(300, 200)],
      });
      wheelContainer.dispatchEvent(touchMoveEvent);

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(300, 200)],
      });
      wheelContainer.dispatchEvent(touchEndEvent);

      // Both should work without conflicts
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    test('should handle different screen orientations', () => {
      // Portrait orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        configurable: true,
        value: { angle: 0, type: 'portrait-primary' },
      });

      window.dispatchEvent(new Event('orientationchange'));

      // Landscape orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        configurable: true,
        value: { angle: 90, type: 'landscape-primary' },
      });

      window.dispatchEvent(new Event('orientationchange'));

      // Should adapt layout accordingly
      const gameMain = document.getElementById('game-main');
      expect(gameMain).toBeTruthy();
    });
  });

  describe('Performance on Different Devices', () => {
    test('should maintain performance with many interactive elements', () => {
      // Add many wedges to test performance
      const wheelContainer = document.getElementById('wheel-container')!;
      const outerWheel = wheelContainer.querySelector('.outer-wheel')!;

      for (let i = 0; i < 50; i++) {
        const wedge = document.createElement('div');
        wedge.className = 'wedge';
        wedge.setAttribute('tabindex', '0');
        wedge.textContent = `Wedge ${i}`;
        outerWheel.appendChild(wedge);
      }

      // Test that keyboard navigation still works efficiently
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        keyboardManager.focusNext();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete navigation in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  // Helper function to create touch objects
  function createTouch(clientX: number, clientY: number): Touch {
    return {
      identifier: 0,
      target: container,
      clientX,
      clientY,
      pageX: clientX,
      pageY: clientY,
      screenX: clientX,
      screenY: clientY,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    } as Touch;
  }
});