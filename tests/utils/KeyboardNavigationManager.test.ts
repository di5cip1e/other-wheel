/**
 * Tests for KeyboardNavigationManager
 */

import { KeyboardNavigationManager } from '../../src/utils/KeyboardNavigationManager';

describe('KeyboardNavigationManager', () => {
  let keyboardManager: KeyboardNavigationManager;
  let container: HTMLElement;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create focusable elements
    const button1 = document.createElement('button');
    button1.id = 'button1';
    button1.textContent = 'Button 1';
    container.appendChild(button1);

    const input1 = document.createElement('input');
    input1.id = 'input1';
    input1.type = 'text';
    container.appendChild(input1);

    const button2 = document.createElement('button');
    button2.id = 'button2';
    button2.textContent = 'Button 2';
    container.appendChild(button2);

    const wheelContainer = document.createElement('div');
    wheelContainer.id = 'wheel-container';
    wheelContainer.className = 'wheel-container';
    wheelContainer.setAttribute('tabindex', '0');
    container.appendChild(wheelContainer);

    keyboardManager = new KeyboardNavigationManager({
      rootElement: container,
      skipLinks: [
        { text: 'Skip to main', targetId: 'wheel-container' },
        { text: 'Skip to controls', targetId: 'button1', key: 'c' },
      ],
    });
  });

  afterEach(() => {
    keyboardManager.dispose();
    document.body.removeChild(container);
    
    // Clean up skip links
    const skipLinks = document.querySelector('.skip-links');
    if (skipLinks && skipLinks.parentNode) {
      skipLinks.parentNode.removeChild(skipLinks);
    }

    // Clean up announcer
    const announcer = document.getElementById('keyboard-announcer');
    if (announcer && announcer.parentNode) {
      announcer.parentNode.removeChild(announcer);
    }
  });

  describe('Initialization', () => {
    test('should create skip links', () => {
      const skipLinks = document.querySelector('.skip-links');
      expect(skipLinks).toBeTruthy();

      const links = skipLinks?.querySelectorAll('.skip-link');
      expect(links?.length).toBe(2);
    });

    test('should create announcer element', () => {
      const announcer = document.getElementById('keyboard-announcer');
      expect(announcer).toBeTruthy();
      expect(announcer?.getAttribute('aria-live')).toBe('polite');
      expect(announcer?.className).toContain('sr-only');
    });

    test('should add keyboard navigation class on key press', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(event);
      
      expect(document.body.classList.contains('keyboard-navigation')).toBe(true);
    });

    test('should remove keyboard navigation class on mouse down', () => {
      // First add the class
      document.body.classList.add('keyboard-navigation');
      
      const event = new MouseEvent('mousedown', { bubbles: true });
      document.dispatchEvent(event);
      
      expect(document.body.classList.contains('keyboard-navigation')).toBe(false);
    });
  });

  describe('Tab Navigation', () => {
    test('should focus next element on Tab', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      const input1 = document.getElementById('input1') as HTMLElement;
      
      button1.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true,
        cancelable: true, 
      });
      
      // Simulate tab navigation with focus trap enabled
      keyboardManager = new KeyboardNavigationManager({
        rootElement: container,
        trapFocus: true,
      });
      
      document.dispatchEvent(event);
      
      // Should move to next focusable element
      expect(document.activeElement).toBe(input1);
    });

    test('should focus previous element on Shift+Tab', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      const input1 = document.getElementById('input1') as HTMLElement;
      
      input1.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true,
        bubbles: true,
        cancelable: true, 
      });
      
      // Simulate shift+tab navigation with focus trap enabled
      keyboardManager = new KeyboardNavigationManager({
        rootElement: container,
        trapFocus: true,
      });
      
      document.dispatchEvent(event);
      
      // Should move to previous focusable element
      expect(document.activeElement).toBe(button1);
    });
  });

  describe('Arrow Navigation', () => {
    test('should navigate with arrow keys in wheel container', () => {
      const wheelContainer = document.getElementById('wheel-container') as HTMLElement;
      
      // Create wedge elements
      const wedge1 = document.createElement('div');
      wedge1.className = 'wedge';
      wedge1.setAttribute('tabindex', '0');
      wheelContainer.appendChild(wedge1);
      
      const wedge2 = document.createElement('div');
      wedge2.className = 'wedge';
      wedge2.setAttribute('tabindex', '0');
      wheelContainer.appendChild(wedge2);
      
      wedge1.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'ArrowRight', 
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(document.activeElement).toBe(wedge2);
    });

    test('should navigate up and down with arrow keys', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      const input1 = document.getElementById('input1') as HTMLElement;
      
      // Create a container that handles arrow navigation
      const listContainer = document.createElement('div');
      listContainer.className = 'wedge-list';
      listContainer.appendChild(button1);
      listContainer.appendChild(input1);
      container.appendChild(listContainer);
      
      button1.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'ArrowDown', 
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(document.activeElement).toBe(input1);
    });
  });

  describe('Activation', () => {
    test('should activate focusable elements on Enter', () => {
      const mockActivate = jest.fn();
      
      keyboardManager = new KeyboardNavigationManager({
        rootElement: container,
        onActivate: mockActivate,
      });
      
      const focusableDiv = document.createElement('div');
      focusableDiv.className = 'focusable';
      focusableDiv.setAttribute('tabindex', '0');
      container.appendChild(focusableDiv);
      
      focusableDiv.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(mockActivate).toHaveBeenCalledWith(focusableDiv, event);
    });

    test('should activate focusable elements on Space', () => {
      const mockActivate = jest.fn();
      
      keyboardManager = new KeyboardNavigationManager({
        rootElement: container,
        onActivate: mockActivate,
      });
      
      const focusableDiv = document.createElement('div');
      focusableDiv.className = 'wedge-item';
      focusableDiv.setAttribute('tabindex', '0');
      container.appendChild(focusableDiv);
      
      focusableDiv.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: ' ', 
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(mockActivate).toHaveBeenCalledWith(focusableDiv, event);
    });
  });

  describe('Skip Links', () => {
    test('should focus target element when skip link is clicked', () => {
      const wheelContainer = document.getElementById('wheel-container') as HTMLElement;
      const skipLinks = document.querySelectorAll('.skip-link');
      const mainSkipLink = Array.from(skipLinks).find(link => 
        link.textContent === 'Skip to main',
      ) as HTMLAnchorElement;
      
      expect(mainSkipLink).toBeTruthy();
      
      mainSkipLink.click();
      
      expect(document.activeElement).toBe(wheelContainer);
    });

    test('should handle keyboard shortcuts for skip links', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      
      const event = new KeyboardEvent('keydown', { 
        key: 'c',
        altKey: true,
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(document.activeElement).toBe(button1);
    });
  });

  describe('Home and End Navigation', () => {
    test('should focus first element on Home key', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      const button2 = document.getElementById('button2') as HTMLElement;
      
      button2.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'Home', 
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(document.activeElement).toBe(button1);
    });

    test('should focus last element on End key', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      const wheelContainer = document.getElementById('wheel-container') as HTMLElement;
      
      button1.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'End', 
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(document.activeElement).toBe(wheelContainer);
    });
  });

  describe('F6 Section Navigation', () => {
    test('should navigate between sections with F6', () => {
      // Create sections
      const powerMeterContainer = document.createElement('div');
      powerMeterContainer.id = 'power-meter-container';
      container.appendChild(powerMeterContainer);
      
      const wheelContainer = document.getElementById('wheel-container') as HTMLElement;
      wheelContainer.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'F6', 
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(document.activeElement).toBe(powerMeterContainer);
    });

    test('should navigate backwards between sections with Shift+F6', () => {
      // Create sections
      const powerMeterContainer = document.createElement('div');
      powerMeterContainer.id = 'power-meter-container';
      container.appendChild(powerMeterContainer);
      
      const wheelContainer = document.getElementById('wheel-container') as HTMLElement;
      powerMeterContainer.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'F6', 
        shiftKey: true,
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(document.activeElement).toBe(wheelContainer);
    });
  });

  describe('Escape Key Handling', () => {
    test('should close visible modals on Escape', () => {
      // Create a modal
      const modal = document.createElement('div');
      modal.className = 'turn-transition-overlay visible';
      document.body.appendChild(modal);
      
      const event = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true,
        cancelable: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(modal.classList.contains('visible')).toBe(false);
      
      document.body.removeChild(modal);
    });

    test('should return to main content when no modal is open', () => {
      const wheelContainer = document.getElementById('wheel-container') as HTMLElement;
      const button1 = document.getElementById('button1') as HTMLElement;
      
      button1.focus();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true, 
      });
      
      document.dispatchEvent(event);
      
      expect(document.activeElement).toBe(wheelContainer);
    });
  });

  describe('Focus Management', () => {
    test('should track focus changes', () => {
      const mockFocusChange = jest.fn();
      
      keyboardManager = new KeyboardNavigationManager({
        rootElement: container,
        onFocusChange: mockFocusChange,
      });
      
      const button1 = document.getElementById('button1') as HTMLElement;
      button1.focus();
      
      expect(mockFocusChange).toHaveBeenCalledWith(button1, expect.any(Number));
    });

    test('should announce element changes', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      button1.setAttribute('aria-label', 'Test button');
      
      button1.focus();
      
      const announcer = document.getElementById('keyboard-announcer');
      expect(announcer?.textContent).toContain('Test button');
    });
  });

  describe('Public Methods', () => {
    test('should focus next element', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      const input1 = document.getElementById('input1') as HTMLElement;
      
      button1.focus();
      keyboardManager.focusNext();
      
      expect(document.activeElement).toBe(input1);
    });

    test('should focus previous element', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      const input1 = document.getElementById('input1') as HTMLElement;
      
      input1.focus();
      keyboardManager.focusPrevious();
      
      expect(document.activeElement).toBe(button1);
    });

    test('should focus element by ID', () => {
      const wheelContainer = document.getElementById('wheel-container') as HTMLElement;
      
      keyboardManager.focusElement('wheel-container');
      
      expect(document.activeElement).toBe(wheelContainer);
    });

    test('should focus element by reference', () => {
      const button1 = document.getElementById('button1') as HTMLElement;
      
      keyboardManager.focusElement(button1);
      
      expect(document.activeElement).toBe(button1);
    });

    test('should announce messages', () => {
      const message = 'Test announcement';
      keyboardManager.announce(message);
      
      const announcer = document.getElementById('keyboard-announcer');
      expect(announcer?.textContent).toBe(message);
    });
  });

  describe('Element Filtering', () => {
    test('should ignore disabled elements', () => {
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;
      disabledButton.textContent = 'Disabled';
      container.appendChild(disabledButton);
      
      const button1 = document.getElementById('button1') as HTMLElement;
      button1.focus();
      
      keyboardManager.focusNext();
      
      // Should skip disabled button
      expect(document.activeElement).not.toBe(disabledButton);
    });

    test('should ignore hidden elements', () => {
      const hiddenButton = document.createElement('button');
      hiddenButton.style.display = 'none';
      hiddenButton.textContent = 'Hidden';
      container.appendChild(hiddenButton);
      
      const button1 = document.getElementById('button1') as HTMLElement;
      button1.focus();
      
      keyboardManager.focusNext();
      
      // Should skip hidden button
      expect(document.activeElement).not.toBe(hiddenButton);
    });
  });
});