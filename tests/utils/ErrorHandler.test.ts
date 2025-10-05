/**
 * Tests for the comprehensive error handling system
 */

import {
  ErrorHandler,
  GameErrorFactory,
  ErrorType,
  ErrorSeverity,
} from '../../src/utils/ErrorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockCallback: jest.Mock;
  let mockRecoveryCallback: jest.Mock;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    mockCallback = jest.fn();
    mockRecoveryCallback = jest.fn();
    errorHandler.setErrorCallback(mockCallback);
    errorHandler.setRecoveryCallback(mockRecoveryCallback);
    errorHandler.clearErrorHistory();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GameErrorFactory', () => {
    it('should create physics errors with correct properties', () => {
      const error = GameErrorFactory.createPhysicsError(
        'Physics simulation failed',
        'PHYSICS_UNSTABLE',
        { wheelId: 'outer-wheel' },
      );

      expect(error.type).toBe(ErrorType.PHYSICS);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.code).toBe('PHYSICS_UNSTABLE');
      expect(error.recoverable).toBe(true);
      expect(error.context).toEqual({ wheelId: 'outer-wheel' });
      expect(error.userMessage).toContain('Physics simulation');
      expect(error.technicalMessage).toBe('Physics simulation failed');
    });

    it('should create media errors with correct properties', () => {
      const error = GameErrorFactory.createMediaError(
        'Failed to load image',
        'MEDIA_LOAD_FAILED',
        { url: 'test.jpg' },
      );

      expect(error.type).toBe(ErrorType.MEDIA);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe('MEDIA_LOAD_FAILED');
      expect(error.recoverable).toBe(true);
      expect(error.userMessage).toContain('Media content could not be loaded');
    });

    it('should create validation errors with correct properties', () => {
      const error = GameErrorFactory.createValidationError(
        'Invalid weight value',
        'INVALID_WEIGHT',
        { value: -1 },
      );

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe('INVALID_WEIGHT');
      expect(error.recoverable).toBe(true);
    });

    it('should create storage errors with correct properties', () => {
      const error = GameErrorFactory.createStorageError(
        'LocalStorage quota exceeded',
        'STORAGE_QUOTA_EXCEEDED',
      );

      expect(error.type).toBe(ErrorType.STORAGE);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.code).toBe('STORAGE_QUOTA_EXCEEDED');
      expect(error.recoverable).toBe(true);
    });

    it('should create game state errors with correct properties', () => {
      const error = GameErrorFactory.createGameStateError(
        'Corrupted game state',
        'STATE_CORRUPTED',
      );

      expect(error.type).toBe(ErrorType.GAME_STATE);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.code).toBe('STATE_CORRUPTED');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors and call callback', async () => {
      const error = GameErrorFactory.createPhysicsError(
        'Test error',
        'TEST_ERROR',
      );

      await errorHandler.handleError(error);

      expect(mockCallback).toHaveBeenCalledWith(error);
      expect(errorHandler.getErrorHistory()).toContain(error);
    });

    it('should attempt recovery for recoverable errors', async () => {
      const error = GameErrorFactory.createPhysicsError(
        'Test error',
        'TEST_ERROR',
      );

      const result = await errorHandler.handleError(error);

      expect(mockRecoveryCallback).toHaveBeenCalledWith(error, expect.any(Boolean));
    });

    it('should not attempt recovery for non-recoverable errors', async () => {
      // Create a non-recoverable error using the physics factory but modify it
      const error = GameErrorFactory.createPhysicsError(
        'Non-recoverable error',
        'NON_RECOVERABLE',
      );
      // Override the recoverable property
      (error as any).recoverable = false;

      const result = await errorHandler.handleError(error);

      expect(result).toBe(false);
      expect(mockRecoveryCallback).toHaveBeenCalledWith(error, false);
    });

    it('should maintain error history with limit', async () => {
      // Create more than 100 errors to test limit
      for (let i = 0; i < 105; i++) {
        const error = GameErrorFactory.createPhysicsError(
          `Test error ${i}`,
          `TEST_ERROR_${i}`,
        );
        await errorHandler.handleError(error);
      }

      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(100);
      expect(history[0]?.code).toBe('TEST_ERROR_5'); // Should start from error 5
    });

    it('should clear error history', async () => {
      const error = GameErrorFactory.createPhysicsError(
        'Test error',
        'TEST_ERROR',
      );
      await errorHandler.handleError(error);

      expect(errorHandler.getErrorHistory().length).toBe(1);

      errorHandler.clearErrorHistory();
      expect(errorHandler.getErrorHistory().length).toBe(0);
    });
  });

  describe('Recovery Options', () => {
    it('should provide recovery options for physics errors', () => {
      const error = GameErrorFactory.createPhysicsError(
        'Physics error',
        'PHYSICS_ERROR',
      );

      const options = errorHandler.getRecoveryOptions(error);
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(option => option.id === 'reset-physics')).toBe(true);
    });

    it('should provide recovery options for media errors', () => {
      const error = GameErrorFactory.createMediaError(
        'Media error',
        'MEDIA_ERROR',
      );

      const options = errorHandler.getRecoveryOptions(error);
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(option => option.id === 'fallback-text')).toBe(true);
    });

    it('should provide recovery options for storage errors', () => {
      const error = GameErrorFactory.createStorageError(
        'Storage error',
        'STORAGE_ERROR',
      );

      const options = errorHandler.getRecoveryOptions(error);
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(option => option.id === 'memory-only')).toBe(true);
    });
  });

  describe('Feature Degradation', () => {
    it('should enable feature degradation', () => {
      errorHandler.enableDegradation('test-feature');
      expect(errorHandler.isFeatureDegraded('test-feature')).toBe(true);
    });

    it('should check non-degraded features', () => {
      expect(errorHandler.isFeatureDegraded('non-existent-feature')).toBe(false);
    });
  });

  describe('Error Report Generation', () => {
    it('should generate comprehensive error reports', () => {
      const error = GameErrorFactory.createPhysicsError(
        'Test error',
        'TEST_ERROR',
        { testData: 'value' },
      );

      const gameState = { wheels: [], players: [] };
      const report = errorHandler.generateErrorReport(error, gameState);

      expect(report.error).toBe(error);
      expect(report.userAgent).toBe(navigator.userAgent);
      expect(report.url).toBe(window.location.href);
      expect(report.gameState).toBe(gameState);
      expect(report.timestamp).toBeCloseTo(Date.now(), -2);
    });

    it('should generate reports without game state', () => {
      const error = GameErrorFactory.createPhysicsError(
        'Test error',
        'TEST_ERROR',
      );

      const report = errorHandler.generateErrorReport(error);

      expect(report.error).toBe(error);
      expect(report.gameState).toBeUndefined();
    });
  });

  describe('Global Error Handling', () => {
    it('should handle unhandled promise rejections', (done) => {
      const originalHandler = errorHandler.handleError;
      errorHandler.handleError = jest.fn().mockImplementation((error) => {
        expect(error.code).toBe('UNHANDLED_PROMISE');
        expect(error.type).toBe(ErrorType.UNKNOWN);
        errorHandler.handleError = originalHandler;
        done();
        return Promise.resolve(false);
      });

      // Trigger unhandled promise rejection
      Promise.reject(new Error('Test rejection'));
    });

    it('should handle uncaught errors', (done) => {
      const originalHandler = errorHandler.handleError;
      errorHandler.handleError = jest.fn().mockImplementation((error) => {
        expect(error.code).toBe('UNCAUGHT_ERROR');
        expect(error.type).toBe(ErrorType.UNKNOWN);
        errorHandler.handleError = originalHandler;
        done();
        return Promise.resolve(false);
      });

      // Trigger uncaught error
      setTimeout(() => {
        throw new Error('Test uncaught error');
      }, 0);
    });
  });
});

describe('Error Recovery Integration', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorHistory();
  });

  it('should execute automatic recovery options', async () => {
    const error = GameErrorFactory.createPhysicsError(
      'Physics simulation unstable',
      'PHYSICS_UNSTABLE',
    );

    const result = await errorHandler.handleError(error);

    // Should attempt automatic recovery
    expect(result).toBe(true);
    expect(errorHandler.isFeatureDegraded('advanced-physics')).toBe(true);
  });

  it('should handle recovery failures gracefully', async () => {
    // Create a physics error that will have recovery options
    const error = GameErrorFactory.createPhysicsError(
      'Test error with failing recovery',
      'FAILING_RECOVERY',
    );

    // Mock a failing recovery option
    const recoveryOptions = errorHandler.getRecoveryOptions(error);
    if (recoveryOptions.length > 0) {
      recoveryOptions[0]!.action = jest.fn().mockRejectedValue(new Error('Recovery failed'));
    }

    const result = await errorHandler.handleError(error);

    // Should handle recovery failure gracefully
    expect(result).toBe(false);
  });
});