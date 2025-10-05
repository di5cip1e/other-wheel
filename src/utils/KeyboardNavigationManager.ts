/**
 * Keyboard Navigation Manager for full accessibility support
 * Provides comprehensive keyboard navigation throughout the application
 */

export interface KeyboardNavigationOptions {
  rootElement: HTMLElement;
  focusableSelectors?: string[];
  skipLinks?: SkipLink[];
  onFocusChange?: (element: HTMLElement, index: number) => void;
  onActivate?: (element: HTMLElement, event: KeyboardEvent) => void;
  trapFocus?: boolean;
  announceChanges?: boolean;
}

export interface SkipLink {
  text: string;
  targetId: string;
  key?: string;
}

export interface FocusableElement {
  element: HTMLElement;
  index: number;
  group?: string;
}

export class KeyboardNavigationManager {
  private rootElement: HTMLElement;
  private options: Required<KeyboardNavigationOptions>;
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex = -1;
  private skipLinksContainer: HTMLElement | null = null;
  private _isKeyboardMode = false;

  public get isKeyboardMode(): boolean {
    return this._isKeyboardMode;
  }
  private announcer: HTMLElement | null = null;

  private readonly defaultFocusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '.focusable:not([disabled])',
    '.wheel-container',
    '.power-meter',
    '.wedge-item',
    '.player-card',
  ];

  constructor(options: KeyboardNavigationOptions) {
    this.rootElement = options.rootElement;
    this.options = {
      rootElement: options.rootElement,
      focusableSelectors: options.focusableSelectors || this.defaultFocusableSelectors,
      skipLinks: options.skipLinks || [],
      onFocusChange: options.onFocusChange || (() => {}),
      onActivate: options.onActivate || (() => {}),
      trapFocus: options.trapFocus || false,
      announceChanges: options.announceChanges !== false,
    };

    this.init();
  }

  private init(): void {
    this.createSkipLinks();
    this.createAnnouncer();
    this.bindEvents();
    this.updateFocusableElements();
    this.addKeyboardModeDetection();
  }

  private createSkipLinks(): void {
    if (this.options.skipLinks.length === 0) {return;}

    this.skipLinksContainer = document.createElement('div');
    this.skipLinksContainer.className = 'skip-links';
    this.skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');

    this.options.skipLinks.forEach(skipLink => {
      const link = document.createElement('a');
      link.href = `#${skipLink.targetId}`;
      link.className = 'skip-link';
      link.textContent = skipLink.text;
      link.setAttribute('aria-label', `Skip to ${skipLink.text}`);

      if (skipLink.key) {
        link.setAttribute('data-key', skipLink.key);
      }

      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.focusElement(skipLink.targetId);
      });

      if (this.skipLinksContainer) {
        this.skipLinksContainer.appendChild(link);
      }
    });

    // Insert skip links at the beginning of the document
    if (this.skipLinksContainer) {
      document.body.insertBefore(this.skipLinksContainer, document.body.firstChild);
    }
  }

  private createAnnouncer(): void {
    if (!this.options.announceChanges) {return;}

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.id = 'keyboard-announcer';
    document.body.appendChild(this.announcer);
  }

  private bindEvents(): void {
    // Global keyboard event handlers
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Focus tracking
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));

    // Mouse interaction detection
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));

    // Update focusable elements when DOM changes
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });

    observer.observe(this.rootElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'hidden'],
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this._isKeyboardMode = true;
    document.body.classList.add('keyboard-navigation');

    const { key, ctrlKey, altKey, shiftKey } = event;

    // Handle skip link shortcuts
    if (altKey && !ctrlKey && !shiftKey) {
      const skipLink = this.options.skipLinks.find(link => link.key === key);
      if (skipLink) {
        event.preventDefault();
        this.focusElement(skipLink.targetId);
        return;
      }
    }

    // Handle navigation keys
    switch (key) {
    case 'Tab':
      this.handleTabNavigation(event);
      break;
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      this.handleArrowNavigation(event);
      break;
    case 'Enter':
    case ' ':
      this.handleActivation(event);
      break;
    case 'Escape':
      this.handleEscape(event);
      break;
    case 'Home':
      this.handleHome(event);
      break;
    case 'End':
      this.handleEnd(event);
      break;
    case 'F6':
      this.handleF6Navigation(event);
      break;
    }
  }

  private handleKeyUp(_event: KeyboardEvent): void {
    // Handle any key-up specific logic
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    if (this.options.trapFocus && this.focusableElements.length > 0) {
      event.preventDefault();
      
      if (event.shiftKey) {
        this.focusPrevious();
      } else {
        this.focusNext();
      }
    }
  }

  private handleArrowNavigation(event: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) {return;}

    // Check if we're in a specific component that handles arrow keys
    const component = activeElement.closest('.wheel-container, .wedge-list, .player-list, .score-list');
    if (!component) {return;}

    event.preventDefault();

    switch (event.key) {
    case 'ArrowUp':
      this.focusPrevious();
      break;
    case 'ArrowDown':
      this.focusNext();
      break;
    case 'ArrowLeft':
      if (component.classList.contains('wheel-container')) {
        // Navigate wedges counter-clockwise
        this.navigateWheelWedges(-1);
      } else {
        this.focusPrevious();
      }
      break;
    case 'ArrowRight':
      if (component.classList.contains('wheel-container')) {
        // Navigate wedges clockwise
        this.navigateWheelWedges(1);
      } else {
        this.focusNext();
      }
      break;
    }
  }

  private handleActivation(event: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) {return;}

    // Let the default behavior handle buttons and inputs
    if (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'INPUT') {
      return;
    }

    // Handle custom activatable elements
    if (activeElement.classList.contains('focusable') || 
        activeElement.classList.contains('wedge-item') ||
        activeElement.classList.contains('player-card')) {
      event.preventDefault();
      this.options.onActivate(activeElement, event);
      
      // Trigger click event for compatibility
      activeElement.click();
    }
  }

  private handleEscape(event: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const modal = document.querySelector('.turn-transition-overlay.visible, .game-end-overlay.visible');
    if (modal) {
      event.preventDefault();
      modal.classList.remove('visible');
      return;
    }

    // Return focus to main content
    const mainContent = document.getElementById('wheel-container');
    if (mainContent) {
      mainContent.focus();
    }
  }

  private handleHome(event: KeyboardEvent): void {
    if (this.focusableElements.length > 0) {
      event.preventDefault();
      this.focusElementByIndex(0);
    }
  }

  private handleEnd(event: KeyboardEvent): void {
    if (this.focusableElements.length > 0) {
      event.preventDefault();
      this.focusElementByIndex(this.focusableElements.length - 1);
    }
  }

  private handleF6Navigation(event: KeyboardEvent): void {
    // Navigate between major sections
    event.preventDefault();
    
    const sections = [
      'wheel-container',
      'power-meter-container',
      'editors-container',
      'player-ui-container',
      'multiplayer-controls',
    ];

    const currentSection = this.getCurrentSection();
    const currentIndex = sections.indexOf(currentSection);
    const nextIndex = event.shiftKey 
      ? (currentIndex - 1 + sections.length) % sections.length
      : (currentIndex + 1) % sections.length;

    const targetSection = sections[nextIndex];
    if (targetSection) {
      this.focusElement(targetSection);
    }
  }

  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (!target) {return;}

    const focusableIndex = this.focusableElements.findIndex(f => f.element === target);
    if (focusableIndex !== -1) {
      this.currentFocusIndex = focusableIndex;
      this.options.onFocusChange(target, focusableIndex);
      this.announceElement(target);
    }
  }

  private handleFocusOut(_event: FocusEvent): void {
    // Handle focus leaving elements
  }

  private handleMouseDown(): void {
    this._isKeyboardMode = false;
    document.body.classList.remove('keyboard-navigation');
  }

  private addKeyboardModeDetection(): void {
    // Add visual indicators for keyboard navigation
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-navigation *:focus {
        outline: 3px solid #007bff !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 6px rgba(0, 123, 255, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
  }

  private updateFocusableElements(): void {
    this.focusableElements = [];
    
    const selector = this.options.focusableSelectors.join(', ');
    const elements = this.rootElement.querySelectorAll(selector) as NodeListOf<HTMLElement>;

    elements.forEach((element, index) => {
      if (this.isElementFocusable(element)) {
        this.focusableElements.push({
          element,
          index,
          group: this.getElementGroup(element),
        });
      }
    });

    // Add tabindex to custom focusable elements
    this.focusableElements.forEach(({ element }) => {
      if (!element.hasAttribute('tabindex') && 
          !['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName)) {
        element.setAttribute('tabindex', '0');
      }
    });
  }

  private isElementFocusable(element: HTMLElement): boolean {
    // Check if element is visible and not disabled
    if (element.hidden || 
        element.style.display === 'none' || 
        element.style.visibility === 'hidden' ||
        element.hasAttribute('disabled')) {
      return false;
    }

    // Check if element or any parent has display: none
    let parent = element.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
      parent = parent.parentElement;
    }

    return true;
  }

  private getElementGroup(element: HTMLElement): string {
    // Determine which group/section the element belongs to
    const container = element.closest('[id]') as HTMLElement;
    return container?.id || 'default';
  }

  private getCurrentSection(): string {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) {return 'wheel-container';}

    const section = activeElement.closest('[id]') as HTMLElement;
    return section?.id || 'wheel-container';
  }

  private navigateWheelWedges(direction: number): void {
    // Custom navigation for wheel wedges
    const wheelContainer = document.querySelector('.wheel-container');
    if (!wheelContainer) {return;}

    const wedges = wheelContainer.querySelectorAll('.wedge') as NodeListOf<HTMLElement>;
    if (wedges.length === 0) {return;}

    const currentWedge = document.activeElement as HTMLElement;
    const currentIndex = Array.from(wedges).indexOf(currentWedge);
    
    let nextIndex;
    if (currentIndex === -1) {
      nextIndex = 0;
    } else {
      nextIndex = (currentIndex + direction + wedges.length) % wedges.length;
    }

    const targetWedge = wedges[nextIndex];
    if (targetWedge) {
      targetWedge.focus();
    }
  }

  public focusNext(): void {
    if (this.focusableElements.length === 0) {return;}

    const nextIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.focusElementByIndex(nextIndex);
  }

  public focusPrevious(): void {
    if (this.focusableElements.length === 0) {return;}

    const prevIndex = (this.currentFocusIndex - 1 + this.focusableElements.length) % this.focusableElements.length;
    this.focusElementByIndex(prevIndex);
  }

  public focusElement(elementOrId: string | HTMLElement): void {
    let element: HTMLElement | null;

    if (typeof elementOrId === 'string') {
      element = document.getElementById(elementOrId);
    } else {
      element = elementOrId;
    }

    if (element) {
      element.focus();
      // Fallback for environments that don't support scrollIntoView
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  public focusElementByIndex(index: number): void {
    if (index >= 0 && index < this.focusableElements.length) {
      const focusableElement = this.focusableElements[index];
      if (focusableElement) {
        focusableElement.element.focus();
        this.currentFocusIndex = index;
      }
    }
  }

  private announceElement(element: HTMLElement): void {
    if (!this.announcer || !this.options.announceChanges) {return;}

    let announcement = '';

    // Get element description
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const title = element.getAttribute('title');
    const textContent = element.textContent?.trim();

    if (ariaLabel) {
      announcement = ariaLabel;
    } else if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      announcement = labelElement?.textContent?.trim() || '';
    } else if (title) {
      announcement = title;
    } else if (textContent && textContent.length < 100) {
      announcement = textContent;
    } else {
      announcement = this.getElementDescription(element);
    }

    // Add role information
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    if (role === 'button') {
      announcement += ', button';
    } else if (role === 'input') {
      announcement += ', input';
    }

    // Add state information
    if (element.hasAttribute('disabled')) {
      announcement += ', disabled';
    }
    if (element.getAttribute('aria-expanded') === 'true') {
      announcement += ', expanded';
    }
    if (element.getAttribute('aria-expanded') === 'false') {
      announcement += ', collapsed';
    }

    this.announcer.textContent = announcement;
  }

  private getElementDescription(element: HTMLElement): string {
    const className = element.className;
    
    if (className.includes('wheel-container')) {
      return 'Wheel spinning area';
    } else if (className.includes('power-meter')) {
      return 'Power meter control';
    } else if (className.includes('wedge-item')) {
      return 'Wheel wedge';
    } else if (className.includes('player-card')) {
      return 'Player information';
    } else if (element.tagName === 'BUTTON') {
      return 'Button';
    } else if (element.tagName === 'INPUT') {
      return 'Input field';
    }

    return 'Interactive element';
  }

  public announce(message: string): void {
    if (this.announcer) {
      this.announcer.textContent = message;
    }
  }

  public dispose(): void {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    document.removeEventListener('focusout', this.handleFocusOut.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));

    // Remove created elements
    if (this.skipLinksContainer) {
      this.skipLinksContainer.remove();
    }
    if (this.announcer) {
      this.announcer.remove();
    }

    // Clear arrays
    this.focusableElements = [];
  }
}