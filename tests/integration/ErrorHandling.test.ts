/**
 * Integration tests for the complete error handling system
 */

import { ErrorHandler, GameErrorFactory, ErrorType } from '../../src/utils/ErrorHandler';
import { GameStateRecovery, AutoRecoveryCoordinator } from '../../src/utils/ErrorRecovery';
import { ErrorNotification } from '../../src/components/ErrorNotification';
import { ComponentErrorManager } from '../../src/utils/ErrorBoundary';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock DOM environment
Object.defineProperty(document, 'body', {
  value: document.createElement('body'),
  writable: true,
});

describe('Error Handling Integration', () => {
  let errorHandler: ErrorHandler;
  let gameStateRecovery: GameStateRecovery;
  let autoRecoveryCoordinator: AutoRecoveryCoordinator;
  let errorNotification: ErrorNotification;
  let componentErrorManager: ComponentErrorManager;

  beforeEach(() => {
    // Clear localStorage and DOM
    localStorageMock.clear();
    document.body.innerHTML = '';
    jest.clearAllMocks();

    // Initialize components
    errorHandler = ErrorHandler.getInstance();
    gameStateRecovery = new GameStateRecovery();
    autoRecoveryCoordinator = new AutoRecoveryCoordinator();
    errorNotification = ErrorNotification.getInstance();
    componentErrorManager = ComponentErrorManager.getInstance();

    // Clear error history
    errorHandler.clearErrorHistory();
    errorNotification.dismissAll();
    componentErrorManager.resetAllBoundaries();
  });

  describe('End-to-End Error Flow', () => {
    it('should handle physics error with full recovery flow', async () => {
      // Setup error callback to show notifications
      errorHandler.setErrorCallback((error) => {
        const recoveryOptions = errorHandler.getRecoveryOptions(error);
        errorNotification.showError(error, recoveryOptions);
      });

      // Create physics error
      const error = GameErrorFactory.createPhysicsError(
        'Physics simulation became unstable',
        'PHYSICS_UNSTABLE',
        { wheelId: 'outer-wheel', angularVelocity: Infinity },
      );

      // Handle the error
      const recovered = await errorHandler.handleError(error);

      // Verify error was handled
      expect(recovered).toBe(true);
      expect(errorHandler.getErrorHistory()).toContain(error);

      // Verify notification was shown
      expect(errorNotification.getActiveCount()).toBe(1);
      const notification = document.querySelector('.error-notification');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toContain('Physics simulation');

      // Verify feature degradation
      expect(errorHandler.isFeatureDegraded('advanced-physics')).toBe(true);

      // Verify recovery options are available
      const recoveryButtons = document.querySelectorAll('.error-notification-recovery-button');
      expect(recoveryButtons.length).toBeGreaterThan(0);
    });

    it('should handle game state corruption with backup restoration', async () => {
      // Create a valid game state and backup it
      const validGameState = {
        wheels: [
          {
            id: 'wheel1',
            wedges: [
              { id: 'wedge1', weight: 1, label: 'Option 1' },
              { id: 'wedge2', weight: 2, label: 'Option 2' },
            ],
          },
        ],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      gameStateRecovery.createBackup(validGameState);

      // Create corrupted game state
      const corruptedState = {
        wheels: null,
        players: 'invalid',
        gamePhase: undefined,
      };

      // Create game state error
      const error = GameErrorFactory.createGameStateError(
        'Game state corrupted during save',
        'STATE_CORRUPTED',
      );

      // Attempt full recovery
      const recovered = await autoRecoveryCoordinator.attemptFullRecovery(error, corruptedState);

      expect(recovered).toBe(true);

      // Verify backup restoration event was emitted
      let recoveryEventFired = false;
      window.addEventListener('game-state-recovered', (event: any) => {
        recoveryEventFired = true;
        expect(event.detail.method).toBeDefined();
      });

      // Trigger recovery again to test event
      await autoRecoveryCoordinator.attemptFullRecovery(error, corruptedState);
      expect(recoveryEventFired).toBe(true);
    });

    it('should handle media loading failure with graceful degradation', async () => {
      // Setup media error scenario
      const error = GameErrorFactory.createMediaError(
        'Failed to load wedge image: network timeout',
        'MEDIA_TIMEOUT',
        { url: 'https://example.com/image.jpg', wedgeId: 'wedge-1' },
      );

      // Setup notification callback
      let notificationShown = false;
      errorHandler.setErrorCallback((error) => {
        const recoveryOptions = errorHandler.getRecoveryOptions(error);
        errorNotification.showError(error, recoveryOptions);
        notificationShown = true;
      });

      // Handle the error
      const recovered = await errorHandler.handleError(error);

      expect(recovered).toBe(true);
      expect(notificationShown).toBe(true);
      expect(errorHandler.isFeatureDegraded('media-content')).toBe(true);

      // Verify user-friendly message
      const notification = document.querySelector('.error-notification');
      expect(notification?.textContent).toContain('Media content could not be loaded');
    });

    it('should handle storage quota exceeded with fallback to memory', async () => {
      // Create storage error
      const error = GameErrorFactory.createStorageError(
        'LocalStorage quota exceeded',
        'STORAGE_QUOTA_EXCEEDED',
      );

      // Handle the error
      const recovered = await errorHandler.handleError(error);

      expect(recovered).toBe(true);
      expect(errorHandler.isFeatureDegraded('persistent-storage')).toBe(true);

      // Verify recovery options include memory-only mode
      const recoveryOptions = errorHandler.getRecoveryOptions(error);
      const memoryOnlyOption = recoveryOptions.find(option => option.id === 'memory-only');
      expect(memoryOnlyOption).toBeDefined();
    });
  });

  describe('Component Error Boundaries', () => {
    it('should isolate component errors and provide recovery', async () => {
      // Create a mock component element
      const componentElement = document.createElement('div');
      componentElement.innerHTML = '<p>Component content</p>';
      componentElement.setAttribute('data-component', 'TestComponent');

      // Create error boundary
      const boundary = componentErrorManager.createBoundary(componentElement, {
        componentName: 'TestComponent',
        autoRecover: true,
        maxRetries: 2,
      });

      // Simulate component error
      const componentError = new Error('Component rendering failed');
      boundary.handleError(componentError);

      // Verify error state
      expect(boundary.isInErrorState()).toBe(true);
      expect(boundary.getRetryCount()).toBe(1);

      // Verify fallback content is shown
      expect(componentElement.innerHTML).toContain('TestComponent Error');

      // Attempt recovery
      const recovered = await boundary.attemptRecovery();
      expect(recovered).toBe(true);
      expect(boundary.isInErrorState()).toBe(false);
    });

    it('should handle multiple component errors independently', () => {
      // Create multiple components
      const component1 = document.createElement('div');
      const component2 = document.createElement('div');
      
      component1.innerHTML = '<p>Component 1</p>';
      component2.innerHTML = '<p>Component 2</p>';

      const boundary1 = componentErrorManager.createBoundary(component1, {
        componentName: 'Component1',
      });
      const boundary2 = componentErrorManager.createBoundary(component2, {
        componentName: 'Component2',
      });

      // Trigger error in component 1 only
      boundary1.handleError(new Error('Component 1 error'));

      // Verify only component 1 is in error state
      expect(boundary1.isInErrorState()).toBe(true);
      expect(boundary2.isInErrorState()).toBe(false);

      // Verify component 2 content is unchanged
      expect(component2.innerHTML).toBe('<p>Component 2</p>');
      expect(component1.innerHTML).toContain('Component1 Error');
    });
  });

  describe('Error Reporting and Analytics', () => {
    it('should generate comprehensive error reports', () => {
      const error = GameErrorFactory.createPhysicsError(
        'Physics engine crashed',
        'PHYSICS_CRASH',
        { 
          wheelCount: 2,
          lastUpdate: Date.now(),
          stackTrace: 'mock stack trace',
        },
      );

      const gameState = {
        wheels: [{ id: 'wheel1' }, { id: 'wheel2' }],
        players: [{ id: 'player1', name: 'Test Player' }],
        gamePhase: 'spinning',
      };

      const report = errorHandler.generateErrorReport(error, gameState);

      expect(report.error).toBe(error);
      expect(report.gameState).toBe(gameState);
      expect(report.userAgent).toBe(navigator.userAgent);
      expect(report.url).toBe(window.location.href);
      expect(report.timestamp).toBeCloseTo(Date.now(), -2);
    });

    it('should track error statistics across components', () => {
      // Create multiple components with errors
      const components = ['WheelRenderer', 'PowerMeter', 'GameController'];
      
      components.forEach(componentName => {
        const element = document.createElement('div');
        const boundary = componentErrorManager.createBoundary(element, {
          componentName,
        });
        
        // Trigger multiple errors
        boundary.handleError(new Error(`${componentName} error 1`));
        boundary.handleError(new Error(`${componentName} error 2`));
      });

      const stats = componentErrorManager.getErrorStatistics();

      expect(Object.keys(stats)).toEqual(components);
      components.forEach(componentName => {
        expect(stats[componentName].retryCount).toBe(2);
        expect(stats[componentName].isInError).toBe(true);
      });
    });
  });

  describe('Recovery Success Scenarios', () => {
    it('should show success notification after successful recovery', async () => {
      const error = GameErrorFactory.createPhysicsError(
        'Physics error',
        'PHYSICS_ERROR',
      );

      // Setup notification with recovery options
      const recoveryOptions = errorHandler.getRecoveryOptions(error);
      errorNotification.showError(error, recoveryOptions);

      // Find and click recovery button
      const recoveryButton = document.querySelector('.error-notification-recovery-button') as HTMLButtonElement;
      expect(recoveryButton).toBeTruthy();

      // Mock successful recovery
      const originalAction = recoveryOptions[0].action;
      recoveryOptions[0].action = jest.fn().mockResolvedValue(true);

      recoveryButton.click();

      // Wait for async recovery
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify success notification appears
      const successNotification = document.querySelector('.error-notification.success');
      expect(successNotification).toBeTruthy();
      expect(successNotification?.textContent).toContain('Recovery successful');
    });

    it('should handle cascading recovery across multiple systems', async () => {
      // Create multiple related errors
      const physicsError = GameErrorFactory.createPhysicsError(
        'Physics unstable',
        'PHYSICS_UNSTABLE',
      );
      
      const renderingError = GameErrorFactory.createRenderingError(
        'Canvas rendering failed',
        'CANVAS_FAILED',
      );

      // Handle both errors
      await errorHandler.handleError(physicsError);
      await errorHandler.handleError(renderingError);

      // Verify both systems are degraded
      expect(errorHandler.isFeatureDegraded('advanced-physics')).toBe(true);
      expect(errorHandler.isFeatureDegraded('canvas-rendering')).toBe(true);

      // Verify error history contains both
      const history = errorHandler.getErrorHistory();
      expect(history).toContain(physicsError);
      expect(history).toContain(renderingError);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should limit error history to prevent memory leaks', async () => {
      // Generate many errors
      for (let i = 0; i < 150; i++) {
        const error = GameErrorFactory.createValidationError(
          `Error ${i}`,
          `ERROR_${i}`,
        );
        await errorHandler.handleError(error);
      }

      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(100); // Should be limited to 100
    });

    it('should limit backup storage to prevent excessive memory usage', () => {
      const gameState = {
        wheels: [{ id: 'wheel1', wedges: [{ id: 'wedge1', weight: 1 }] }],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      // Create many backups
      for (let i = 0; i < 10; i++) {
        const state = { ...gameState, timestamp: i };
        gameStateRecovery.createBackup(state);
      }

      const backups = gameStateRecovery.getAvailableBackups();
      expect(backups.length).toBeLessThanOrEqual(5); // Should be limited to 5
    });

    it('should clean up dismissed notifications', () => {
      // Create multiple notifications
      const errors = [
        GameErrorFactory.createPhysicsError('Error 1', 'ERROR_1'),
        GameErrorFactory.createMediaError('Error 2', 'ERROR_2'),
        GameErrorFactory.createValidationError('Error 3', 'ERROR_3'),
      ];

      const notificationIds = errors.map(error => 
        errorNotification.showError(error),
      );

      expect(errorNotification.getActiveCount()).toBe(3);

      // Dismiss all notifications
      errorNotification.dismissAll();

      // Verify cleanup (notifications should be marked for dismissal)
      const notifications = document.querySelectorAll('.error-notification');
      notifications.forEach(notification => {
        expect(notification.classList.contains('dismissing')).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle errors during error handling gracefully', async () => {
      // Create an error that will cause issues during handling
      const problematicError = GameErrorFactory.createPhysicsError(
        'Problematic error',
        'PROBLEMATIC_ERROR',
      );

      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Mock a recovery option that throws an error
      const recoveryOptions = errorHandler.getRecoveryOptions(problematicError);
      if (recoveryOptions.length > 0) {
        recoveryOptions[0].action = jest.fn().mockRejectedValue(new Error('Recovery failed'));
      }

      // Should not throw, but handle gracefully
      const result = await errorHandler.handleError(problematicError);
      
      // Should still log the error even if recovery fails
      expect(errorHandler.getErrorHistory()).toContain(problematicError);

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('should handle corrupted localStorage gracefully', () => {
      // Mock localStorage to throw errors
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage corrupted');
      });

      // Should not throw when creating new instances
      expect(() => {
        new GameStateRecovery();
      }).not.toThrow();

      // Reset mock
      localStorageMock.getItem.mockReset();
    });

    it('should handle invalid game state data gracefully', () => {
      const invalidStates = [
        null,
        undefined,
        'invalid string',
        123,
        [],
        { invalid: 'object' },
      ];

      invalidStates.forEach(invalidState => {
        expect(gameStateRecovery.validateGameState(invalidState)).toBe(false);
        
        // Should be able to repair any invalid state
        const repaired = gameStateRecovery.repairGameState(invalidState);
        expect(gameStateRecovery.validateGameState(repaired)).toBe(true);
      });
    });
  });
});