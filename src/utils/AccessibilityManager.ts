/**
 * Accessibility Manager for ARIA labels and screen reader support
 * Provides comprehensive accessibility features throughout the application
 */

export interface AccessibilityOptions {
  announceChanges?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  keyboardNavigation?: boolean;
  screenReaderOptimizations?: boolean;
}

export interface AriaLiveRegion {
  element: HTMLElement;
  politeness: 'polite' | 'assertive';
  atomic?: boolean;
}

export class AccessibilityManager {
  private options: Required<AccessibilityOptions>;
  private liveRegions: Map<string, AriaLiveRegion> = new Map();
  private focusHistory: HTMLElement[] = [];
  private lastAnnouncementTime = 0;
  private announcementQueue: string[] = [];
  private isProcessingQueue = false;

  constructor(options: AccessibilityOptions = {}) {
    this.options = {
      announceChanges: options.announceChanges !== false,
      highContrast: options.highContrast || false,
      reducedMotion: options.reducedMotion || false,
      keyboardNavigation: options.keyboardNavigation !== false,
      screenReaderOptimizations: options.screenReaderOptimizations !== false,
    };

    this.init();
  }

  private init(): void {
    this.createLiveRegions();
    this.setupAccessibilityFeatures();
    this.bindEvents();
    this.detectUserPreferences();
  }

  private createLiveRegions(): void {
    // Create polite live region for general announcements
    const politeRegion = document.createElement('div');
    politeRegion.id = 'aria-live-polite';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    document.body.appendChild(politeRegion);

    this.liveRegions.set('polite', {
      element: politeRegion,
      politeness: 'polite',
      atomic: true,
    });

    // Create assertive live region for urgent announcements
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'aria-live-assertive';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    document.body.appendChild(assertiveRegion);

    this.liveRegions.set('assertive', {
      element: assertiveRegion,
      politeness: 'assertive',
      atomic: true,
    });

    // Create status region for game state changes
    const statusRegion = document.createElement('div');
    statusRegion.id = 'aria-live-status';
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('role', 'status');
    statusRegion.className = 'sr-only';
    document.body.appendChild(statusRegion);

    this.liveRegions.set('status', {
      element: statusRegion,
      politeness: 'polite',
    });
  }

  private setupAccessibilityFeatures(): void {
    // Add skip links
    this.createSkipLinks();

    // Setup focus management
    this.setupFocusManagement();

    // Add ARIA landmarks
    this.addLandmarks();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Apply user preferences
    this.applyAccessibilityPreferences();
  }

  private createSkipLinks(): void {
    const skipLinksContainer = document.createElement('nav');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.setAttribute('aria-label', 'Skip navigation');

    const skipLinks = [
      { text: 'Skip to main content', target: 'wheel-container' },
      { text: 'Skip to game controls', target: 'power-meter-container' },
      { text: 'Skip to game editor', target: 'editors-container' },
      { text: 'Skip to player information', target: 'player-ui-container' },
    ];

    skipLinks.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = `#${link.target}`;
      skipLink.textContent = link.text;
      skipLink.className = 'skip-link';
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.target);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
      skipLinksContainer.appendChild(skipLink);
    });

    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  private setupFocusManagement(): void {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== document.body) {
        this.focusHistory.push(target);
        // Keep only last 10 focus changes
        if (this.focusHistory.length > 10) {
          this.focusHistory.shift();
        }
      }
    });

    // Handle focus trapping in modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const modal = document.querySelector('.turn-transition-overlay.visible, .game-end-overlay.visible');
        if (modal) {
          this.trapFocus(event, modal as HTMLElement);
        }
      }
    });
  }

  private addLandmarks(): void {
    // Add main landmark
    const wheelContainer = document.getElementById('wheel-container');
    if (wheelContainer) {
      wheelContainer.setAttribute('role', 'main');
      wheelContainer.setAttribute('aria-label', 'Wheel spinning game area');
    }

    // Add navigation landmark for controls
    const gameControls = document.getElementById('power-meter-container');
    if (gameControls) {
      gameControls.setAttribute('role', 'navigation');
      gameControls.setAttribute('aria-label', 'Game controls');
    }

    // Add complementary landmark for editor
    const editorsContainer = document.getElementById('editors-container');
    if (editorsContainer) {
      editorsContainer.setAttribute('role', 'complementary');
      editorsContainer.setAttribute('aria-label', 'Game editor');
    }

    // Add aside landmark for player info
    const playerContainer = document.getElementById('player-ui-container');
    if (playerContainer) {
      playerContainer.setAttribute('role', 'complementary');
      playerContainer.setAttribute('aria-label', 'Player information and scores');
    }
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Alt + number keys for quick navigation
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        switch (event.key) {
        case '1':
          event.preventDefault();
          this.focusElement('wheel-container');
          this.announce('Focused on wheel area');
          break;
        case '2':
          event.preventDefault();
          this.focusElement('power-meter-container');
          this.announce('Focused on game controls');
          break;
        case '3':
          event.preventDefault();
          this.focusElement('editors-container');
          this.announce('Focused on game editor');
          break;
        case '4':
          event.preventDefault();
          this.focusElement('player-ui-container');
          this.announce('Focused on player information');
          break;
        }
      }

      // Escape key to return to main content
      if (event.key === 'Escape') {
        const modal = document.querySelector('.turn-transition-overlay.visible, .game-end-overlay.visible');
        if (!modal) {
          this.focusElement('wheel-container');
          this.announce('Returned to main content');
        }
      }
    });
  }

  private bindEvents(): void {
    // Listen for game state changes
    document.addEventListener('gameStateChange', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.announceGameStateChange(customEvent.detail);
    });

    // Listen for wheel spin events
    document.addEventListener('wheelSpinStart', () => {
      this.announce('Wheel spinning started', 'assertive');
    });

    document.addEventListener('wheelSpinEnd', (event: Event) => {
      const customEvent = event as CustomEvent;
      const result = customEvent.detail;
      this.announce(`Wheel stopped. Result: ${result.wedgeLabel}`, 'assertive');
    });

    // Listen for player turn changes
    document.addEventListener('playerTurnChange', (event: Event) => {
      const customEvent = event as CustomEvent;
      const player = customEvent.detail;
      this.announce(`It's ${player.name}'s turn`, 'polite');
    });

    // Listen for error events
    document.addEventListener('gameError', (event: Event) => {
      const customEvent = event as CustomEvent;
      const error = customEvent.detail;
      this.announce(`Error: ${error.message}`, 'assertive');
    });
  }

  private detectUserPreferences(): void {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.options.reducedMotion = true;
      document.body.classList.add('reduced-motion');
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.options.highContrast = true;
      document.body.classList.add('high-contrast');
    }

    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.options.reducedMotion = e.matches;
      document.body.classList.toggle('reduced-motion', e.matches);
      this.announce(e.matches ? 'Reduced motion enabled' : 'Reduced motion disabled');
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.options.highContrast = e.matches;
      document.body.classList.toggle('high-contrast', e.matches);
      this.announce(e.matches ? 'High contrast enabled' : 'High contrast disabled');
    });
  }

  private applyAccessibilityPreferences(): void {
    if (this.options.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }

    if (this.options.highContrast) {
      document.body.classList.add('high-contrast');
    }

    if (this.options.keyboardNavigation) {
      document.body.classList.add('keyboard-navigation');
    }
  }

  private trapFocus(event: KeyboardEvent, container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) {return;}

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement && lastElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement && firstElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  private announceGameStateChange(gameState: any): void {
    switch (gameState.phase) {
    case 'setup':
      this.announce('Game setup phase');
      break;
    case 'playing':
      this.announce('Game started');
      break;
    case 'spinning':
      this.announce('Wheel is spinning');
      break;
    case 'result':
      this.announce('Spin complete, showing result');
      break;
    case 'finished':
      this.announce('Game finished');
      break;
    }
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.options.announceChanges) {return;}

    // Prevent announcement spam
    const now = Date.now();
    if (now - this.lastAnnouncementTime < 100) {
      this.announcementQueue.push(message);
      this.processAnnouncementQueue();
      return;
    }

    this.lastAnnouncementTime = now;
    const region = this.liveRegions.get(priority);
    if (region) {
      region.element.textContent = message;
    }
  }

  private processAnnouncementQueue(): void {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) {return;}

    this.isProcessingQueue = true;
    setTimeout(() => {
      if (this.announcementQueue.length > 0) {
        const message = this.announcementQueue.shift();
        if (message) {
          this.announce(message);
        }
      }
      this.isProcessingQueue = false;
      if (this.announcementQueue.length > 0) {
        this.processAnnouncementQueue();
      }
    }, 200);
  }

  public announceStatus(message: string): void {
    const statusRegion = this.liveRegions.get('status');
    if (statusRegion) {
      statusRegion.element.textContent = message;
    }
  }

  public focusElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  public restoreFocus(): void {
    if (this.focusHistory.length > 0) {
      const lastFocused = this.focusHistory[this.focusHistory.length - 1];
      if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus();
      }
    }
  }

  public addAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  public addAriaDescription(element: HTMLElement, description: string): void {
    const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const descElement = document.createElement('div');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    
    element.appendChild(descElement);
    element.setAttribute('aria-describedby', descId);
  }

  public setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  public setAriaPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  public setAriaSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString());
  }

  public addLiveRegion(id: string, politeness: 'polite' | 'assertive' = 'polite'): HTMLElement {
    const region = document.createElement('div');
    region.id = `aria-live-${id}`;
    region.setAttribute('aria-live', politeness);
    region.className = 'sr-only';
    document.body.appendChild(region);

    this.liveRegions.set(id, {
      element: region,
      politeness,
    });

    return region;
  }

  public updateLiveRegion(id: string, message: string): void {
    const region = this.liveRegions.get(id);
    if (region) {
      region.element.textContent = message;
    }
  }

  public enableReducedMotion(enable: boolean = true): void {
    this.options.reducedMotion = enable;
    document.body.classList.toggle('reduced-motion', enable);
    this.announce(enable ? 'Reduced motion enabled' : 'Reduced motion disabled');
  }

  public enableHighContrast(enable: boolean = true): void {
    this.options.highContrast = enable;
    document.body.classList.toggle('high-contrast', enable);
    this.announce(enable ? 'High contrast enabled' : 'High contrast disabled');
  }

  public dispose(): void {
    // Remove created live regions
    this.liveRegions.forEach(region => {
      if (region.element.parentNode) {
        region.element.parentNode.removeChild(region.element);
      }
    });

    // Clear arrays and maps
    this.liveRegions.clear();
    this.focusHistory = [];
    this.announcementQueue = [];

    // Remove skip links
    const skipLinks = document.querySelector('.skip-links');
    if (skipLinks && skipLinks.parentNode) {
      skipLinks.parentNode.removeChild(skipLinks);
    }
  }
}