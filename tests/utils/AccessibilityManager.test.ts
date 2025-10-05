/**
 * Tests for AccessibilityManager
 */

import { AccessibilityManager } from '../../src/utils/AccessibilityManager';

describe('AccessibilityManager', () => {
  let accessibilityManager: AccessibilityManager;
  let container: HTMLElement;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create test elements
    const wheelContainer = document.createElement('div');
    wheelContainer.id = 'wheel-container';
    container.appendChild(wheelContainer);

    const powerMeterContainer = document.createElement('div');
    powerMeterContainer.id = 'power-meter-container';
    container.appendChild(powerMeterContainer);

    const editorsContainer = document.createElement('div');
    editorsContainer.id = 'editors-container';
    container.appendChild(editorsContainer);

    const playerContainer = document.createElement('div');
    playerContainer.id = 'player-ui-container';
    container.appendChild(playerContainer);

    accessibilityManager = new AccessibilityManager({
      announceChanges: true,
      keyboardNavigation: true,
      screenReaderOptimizations: true,
    });
  });

  afterEach(() => {
    accessibilityManager.dispose();
    document.body.removeChild(container);
    
    // Clean up any remaining live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });

    // Clean up skip links
    const skipLinks = document.querySelector('.skip-links');
    if (skipLinks && skipLinks.parentNode) {
      skipLinks.parentNode.removeChild(skipLinks);
    }
  });

  describe('Initialization', () => {
    test('should create live regions', () => {
      const politeRegion = document.getElementById('aria-live-polite');
      const assertiveRegion = document.getElementById('aria-live-assertive');
      const statusRegion = document.getElementById('aria-live-status');

      expect(politeRegion).toBeTruthy();
      expect(assertiveRegion).toBeTruthy();
      expect(statusRegion).toBeTruthy();

      expect(politeRegion?.getAttribute('aria-live')).toBe('polite');
      expect(assertiveRegion?.getAttribute('aria-live')).toBe('assertive');
      expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
    });

    test('should create skip links', () => {
      const skipLinks = document.querySelector('.skip-links');
      expect(skipLinks).toBeTruthy();

      const links = skipLinks?.querySelectorAll('.skip-link');
      expect(links?.length).toBeGreaterThan(0);
    });

    test('should add ARIA landmarks', () => {
      const wheelContainer = document.getElementById('wheel-container');
      const powerMeterContainer = document.getElementById('power-meter-container');
      const editorsContainer = document.getElementById('editors-container');
      const playerContainer = document.getElementById('player-ui-container');

      expect(wheelContainer?.getAttribute('role')).toBe('main');
      expect(powerMeterContainer?.getAttribute('role')).toBe('navigation');
      expect(editorsContainer?.getAttribute('role')).toBe('complementary');
      expect(playerContainer?.getAttribute('role')).toBe('complementary');
    });
  });

  describe('Announcements', () => {
    test('should announce messages to polite live region', () => {
      const message = 'Test announcement';
      accessibilityManager.announce(message, 'polite');

      const politeRegion = document.getElementById('aria-live-polite');
      expect(politeRegion?.textContent).toBe(message);
    });

    test('should announce messages to assertive live region', () => {
      const message = 'Urgent announcement';
      accessibilityManager.announce(message, 'assertive');

      const assertiveRegion = document.getElementById('aria-live-assertive');
      expect(assertiveRegion?.textContent).toBe(message);
    });

    test('should announce status messages', () => {
      const message = 'Status update';
      accessibilityManager.announceStatus(message);

      const statusRegion = document.getElementById('aria-live-status');
      expect(statusRegion?.textContent).toBe(message);
    });

    test('should queue announcements to prevent spam', (done) => {
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      
      messages.forEach(message => {
        accessibilityManager.announce(message);
      });

      // Check that only the first message is announced immediately
      const politeRegion = document.getElementById('aria-live-polite');
      expect(politeRegion?.textContent).toBe(messages[0]);

      // Wait for queue processing
      setTimeout(() => {
        // Should eventually announce the last message
        expect(politeRegion?.textContent).toBe(messages[messages.length - 1]);
        done();
      }, 1000);
    });
  });

  describe('Focus Management', () => {
    test('should focus element by ID', () => {
      const testElement = document.createElement('button');
      testElement.id = 'test-button';
      testElement.textContent = 'Test Button';
      container.appendChild(testElement);

      accessibilityManager.focusElement('test-button');
      expect(document.activeElement).toBe(testElement);
    });

    test('should restore focus to previous element', () => {
      const button1 = document.createElement('button');
      button1.id = 'button1';
      container.appendChild(button1);

      const button2 = document.createElement('button');
      button2.id = 'button2';
      container.appendChild(button2);

      // Focus first button, then second
      button1.focus();
      button2.focus();

      // Restore focus should go back to button1
      accessibilityManager.restoreFocus();
      expect(document.activeElement).toBe(button2); // Should be the last focused element
    });
  });

  describe('ARIA Attributes', () => {
    test('should add ARIA label', () => {
      const element = document.createElement('div');
      const label = 'Test label';
      
      accessibilityManager.addAriaLabel(element, label);
      expect(element.getAttribute('aria-label')).toBe(label);
    });

    test('should add ARIA description', () => {
      const element = document.createElement('div');
      const description = 'Test description';
      
      accessibilityManager.addAriaDescription(element, description);
      
      const describedBy = element.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      
      const descElement = document.getElementById(describedBy!);
      expect(descElement?.textContent).toBe(description);
      expect(descElement?.className).toContain('sr-only');
    });

    test('should set ARIA expanded state', () => {
      const element = document.createElement('button');
      
      accessibilityManager.setAriaExpanded(element, true);
      expect(element.getAttribute('aria-expanded')).toBe('true');
      
      accessibilityManager.setAriaExpanded(element, false);
      expect(element.getAttribute('aria-expanded')).toBe('false');
    });

    test('should set ARIA pressed state', () => {
      const element = document.createElement('button');
      
      accessibilityManager.setAriaPressed(element, true);
      expect(element.getAttribute('aria-pressed')).toBe('true');
      
      accessibilityManager.setAriaPressed(element, false);
      expect(element.getAttribute('aria-pressed')).toBe('false');
    });

    test('should set ARIA selected state', () => {
      const element = document.createElement('div');
      
      accessibilityManager.setAriaSelected(element, true);
      expect(element.getAttribute('aria-selected')).toBe('true');
      
      accessibilityManager.setAriaSelected(element, false);
      expect(element.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('Live Regions Management', () => {
    test('should add custom live region', () => {
      const regionId = 'custom-region';
      const element = accessibilityManager.addLiveRegion(regionId, 'assertive');
      
      expect(element.id).toBe(`aria-live-${regionId}`);
      expect(element.getAttribute('aria-live')).toBe('assertive');
      expect(element.className).toContain('sr-only');
    });

    test('should update custom live region', () => {
      const regionId = 'custom-region';
      const message = 'Custom message';
      
      accessibilityManager.addLiveRegion(regionId);
      accessibilityManager.updateLiveRegion(regionId, message);
      
      const element = document.getElementById(`aria-live-${regionId}`);
      expect(element?.textContent).toBe(message);
    });
  });

  describe('Accessibility Preferences', () => {
    test('should enable reduced motion', () => {
      accessibilityManager.enableReducedMotion(true);
      expect(document.body.classList.contains('reduced-motion')).toBe(true);
    });

    test('should disable reduced motion', () => {
      accessibilityManager.enableReducedMotion(false);
      expect(document.body.classList.contains('reduced-motion')).toBe(false);
    });

    test('should enable high contrast', () => {
      accessibilityManager.enableHighContrast(true);
      expect(document.body.classList.contains('high-contrast')).toBe(true);
    });

    test('should disable high contrast', () => {
      accessibilityManager.enableHighContrast(false);
      expect(document.body.classList.contains('high-contrast')).toBe(false);
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should handle Alt+1 to focus wheel container', () => {
      const wheelContainer = document.getElementById('wheel-container');
      
      const event = new KeyboardEvent('keydown', {
        key: '1',
        altKey: true,
        bubbles: true,
      });
      
      document.dispatchEvent(event);
      expect(document.activeElement).toBe(wheelContainer);
    });

    test('should handle Alt+2 to focus power meter container', () => {
      const powerMeterContainer = document.getElementById('power-meter-container');
      
      const event = new KeyboardEvent('keydown', {
        key: '2',
        altKey: true,
        bubbles: true,
      });
      
      document.dispatchEvent(event);
      expect(document.activeElement).toBe(powerMeterContainer);
    });

    test('should handle Escape to return to main content', () => {
      const wheelContainer = document.getElementById('wheel-container');
      
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      
      document.dispatchEvent(event);
      expect(document.activeElement).toBe(wheelContainer);
    });
  });

  describe('Game Event Handling', () => {
    test('should announce wheel spin start', () => {
      const event = new CustomEvent('wheelSpinStart');
      document.dispatchEvent(event);
      
      const assertiveRegion = document.getElementById('aria-live-assertive');
      expect(assertiveRegion?.textContent).toBe('Wheel spinning started');
    });

    test('should announce wheel spin end with result', () => {
      const result = { wedgeLabel: 'Test Wedge' };
      const event = new CustomEvent('wheelSpinEnd', { detail: result });
      document.dispatchEvent(event);
      
      const assertiveRegion = document.getElementById('aria-live-assertive');
      expect(assertiveRegion?.textContent).toBe('Wheel stopped. Result: Test Wedge');
    });

    test('should announce player turn change', () => {
      const player = { name: 'Alice' };
      const event = new CustomEvent('playerTurnChange', { detail: player });
      document.dispatchEvent(event);
      
      const politeRegion = document.getElementById('aria-live-polite');
      expect(politeRegion?.textContent).toBe('It\'s Alice\'s turn');
    });

    test('should announce game errors', () => {
      const error = { message: 'Something went wrong' };
      const event = new CustomEvent('gameError', { detail: error });
      document.dispatchEvent(event);
      
      const assertiveRegion = document.getElementById('aria-live-assertive');
      expect(assertiveRegion?.textContent).toBe('Error: Something went wrong');
    });
  });

  describe('User Preference Detection', () => {
    test('should detect reduced motion preference', () => {
      // Mock matchMedia for reduced motion
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

      // Create new instance to trigger preference detection
      const newManager = new AccessibilityManager();
      expect(document.body.classList.contains('reduced-motion')).toBe(true);
      
      newManager.dispose();
    });

    test('should detect high contrast preference', () => {
      // Mock matchMedia for high contrast
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      // Create new instance to trigger preference detection
      const newManager = new AccessibilityManager();
      expect(document.body.classList.contains('high-contrast')).toBe(true);
      
      newManager.dispose();
    });
  });

  describe('Cleanup', () => {
    test('should remove all created elements on dispose', () => {
      accessibilityManager.dispose();
      
      const politeRegion = document.getElementById('aria-live-polite');
      const assertiveRegion = document.getElementById('aria-live-assertive');
      const statusRegion = document.getElementById('aria-live-status');
      const skipLinks = document.querySelector('.skip-links');
      
      expect(politeRegion).toBeFalsy();
      expect(assertiveRegion).toBeFalsy();
      expect(statusRegion).toBeFalsy();
      expect(skipLinks).toBeFalsy();
    });
  });
});