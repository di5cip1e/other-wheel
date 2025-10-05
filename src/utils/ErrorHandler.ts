/**
 * Comprehensive error handling system for the Wheel within a Wheel game
 * Provides centralized error management, recovery mechanisms, and user-friendly messaging
 */

export enum ErrorType {
  PHYSICS = 'physics',
  MEDIA = 'media',
  VALIDATION = 'validation',
  STORAGE = 'storage',
  NETWORK = 'network',
  RENDERING = 'rendering',
  AUDIO = 'audio',
  GAME_STATE = 'game_state',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface GameError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  context?: Record<string, any>;
  timestamp: number;
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
}

export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: () => Promise<boolean>;
  automatic?: boolean;
}

export interface ErrorReport {
  error: GameError;
  userAgent: string;
  url: string;
  gameState?: any;
  stackTrace: string;
  timestamp: number;
}

/**
 * Factory for creating standardized game errors
 */
export class GameErrorFactory {
  static createPhysicsError(
    message: string,
    code: string,
    context?: Record<string, any>,
  ): GameError {
    return this.createError(
      ErrorType.PHYSICS,
      ErrorSeverity.HIGH,
      code,
      message,
      'Physics simulation encountered an error. The game will attempt to recover.',
      context,
      true,
    );
  }

  static createMediaError(
    message: string,
    code: string,
    context?: Record<string, any>,
  ): GameError {
    return this.createError(
      ErrorType.MEDIA,
      ErrorSeverity.MEDIUM,
      code,
      message,
      'Media content could not be loaded. The game will continue with text-only display.',
      context,
      true,
    );
  }

  static createValidationError(
    message: string,
    code: string,
    context?: Record<string, any>,
  ): GameError {
    return this.createError(
      ErrorType.VALIDATION,
      ErrorSeverity.MEDIUM,
      code,
      message,
      'Invalid input detected. Please check your settings and try again.',
      context,
      true,
    );
  }

  static createStorageError(
    message: string,
    code: string,
    context?: Record<string, any>,
  ): GameError {
    return this.createError(
      ErrorType.STORAGE,
      ErrorSeverity.HIGH,
      code,
      message,
      'Storage operation failed. Your data may not be saved properly.',
      context,
      true,
    );
  }

  static createRenderingError(
    message: string,
    code: string,
    context?: Record<string, any>,
  ): GameError {
    return this.createError(
      ErrorType.RENDERING,
      ErrorSeverity.HIGH,
      code,
      message,
      'Rendering error occurred. The game will attempt to use fallback rendering.',
      context,
      true,
    );
  }

  static createGameStateError(
    message: string,
    code: string,
    context?: Record<string, any>,
  ): GameError {
    return this.createError(
      ErrorType.GAME_STATE,
      ErrorSeverity.CRITICAL,
      code,
      message,
      'Game state corruption detected. The game will attempt to recover.',
      context,
      true,
    );
  }

  private static createError(
    type: ErrorType,
    severity: ErrorSeverity,
    code: string,
    technicalMessage: string,
    userMessage: string,
    context?: Record<string, any>,
    recoverable: boolean = false,
  ): GameError {
    const error = new Error(technicalMessage) as GameError;
    error.type = type;
    error.severity = severity;
    error.code = code;
    error.context = context || {};
    error.timestamp = Date.now();
    error.recoverable = recoverable;
    error.userMessage = userMessage;
    error.technicalMessage = technicalMessage;
    return error;
  }
}

/**
 * Central error handler with recovery mechanisms and graceful degradation
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: GameError[] = [];
  private recoveryStrategies: Map<string, RecoveryOption[]> = new Map();
  private degradationFlags: Set<string> = new Set();
  private onErrorCallback?: (error: GameError) => void;
  private onRecoveryCallback?: (error: GameError, success: boolean) => void;

  private constructor() {
    this.initializeRecoveryStrategies();
    this.setupGlobalErrorHandling();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Set callback for error notifications
   */
  setErrorCallback(callback: (error: GameError) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Set callback for recovery notifications
   */
  setRecoveryCallback(callback: (error: GameError, success: boolean) => void): void {
    this.onRecoveryCallback = callback;
  }

  /**
   * Handle an error with automatic recovery attempts
   */
  async handleError(error: GameError): Promise<boolean> {
    // Log the error
    this.logError(error);

    // Notify callback
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }

    // Attempt automatic recovery if available
    if (error.recoverable) {
      const recovered = await this.attemptRecovery(error);
      if (this.onRecoveryCallback) {
        this.onRecoveryCallback(error, recovered);
      }
      return recovered;
    }

    return false;
  }

  /**
   * Get recovery options for a specific error
   */
  getRecoveryOptions(error: GameError): RecoveryOption[] {
    const typeOptions = this.recoveryStrategies.get(error.type) || [];
    const codeOptions = this.recoveryStrategies.get(error.code) || [];
    return [...typeOptions, ...codeOptions];
  }

  /**
   * Attempt automatic recovery for an error
   */
  private async attemptRecovery(error: GameError): Promise<boolean> {
    const options = this.getRecoveryOptions(error);
    const automaticOptions = options.filter(option => option.automatic);

    for (const option of automaticOptions) {
      try {
        const success = await option.action();
        if (success) {
          console.log(`Automatic recovery successful: ${option.label}`);
          return true;
        }
      } catch (recoveryError) {
        console.warn(`Recovery option failed: ${option.label}`, recoveryError);
      }
    }

    return false;
  }

  /**
   * Enable graceful degradation for a feature
   */
  enableDegradation(feature: string): void {
    this.degradationFlags.add(feature);
    console.warn(`Feature degraded: ${feature}`);
  }

  /**
   * Check if a feature is degraded
   */
  isFeatureDegraded(feature: string): boolean {
    return this.degradationFlags.has(feature);
  }

  /**
   * Get error history
   */
  getErrorHistory(): GameError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorLog = [];
  }

  /**
   * Generate error report for debugging
   */
  generateErrorReport(error: GameError, gameState?: any): ErrorReport {
    return {
      error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      gameState,
      stackTrace: error.stack || 'No stack trace available',
      timestamp: Date.now(),
    };
  }

  private logError(error: GameError): void {
    this.errorLog.push(error);
    
    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console based on severity
    switch (error.severity) {
    case ErrorSeverity.LOW:
      console.info(`[${error.type}] ${error.technicalMessage}`, error.context);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn(`[${error.type}] ${error.technicalMessage}`, error.context);
      break;
    case ErrorSeverity.HIGH:
    case ErrorSeverity.CRITICAL:
      console.error(`[${error.type}] ${error.technicalMessage}`, error.context);
      break;
    }
  }

  private initializeRecoveryStrategies(): void {
    // Physics error recovery
    this.recoveryStrategies.set(ErrorType.PHYSICS, [
      {
        id: 'reset-physics',
        label: 'Reset Physics Engine',
        description: 'Reset the physics simulation to a stable state',
        action: async () => {
          // This will be implemented by the physics engine
          return true;
        },
        automatic: true,
      },
      {
        id: 'fallback-physics',
        label: 'Use Simple Physics',
        description: 'Switch to simplified physics model',
        action: async () => {
          this.enableDegradation('advanced-physics');
          return true;
        },
        automatic: true,
      },
    ]);

    // Media error recovery
    this.recoveryStrategies.set(ErrorType.MEDIA, [
      {
        id: 'retry-media',
        label: 'Retry Loading',
        description: 'Attempt to reload the media content',
        action: async () => {
          // Retry logic will be implemented by MediaManager
          return false; // Placeholder
        },
        automatic: true,
      },
      {
        id: 'fallback-text',
        label: 'Use Text Only',
        description: 'Display text content instead of media',
        action: async () => {
          this.enableDegradation('media-content');
          return true;
        },
        automatic: true,
      },
    ]);

    // Storage error recovery
    this.recoveryStrategies.set(ErrorType.STORAGE, [
      {
        id: 'clear-storage',
        label: 'Clear Storage',
        description: 'Clear corrupted storage data',
        action: async () => {
          try {
            localStorage.clear();
            return true;
          } catch {
            return false;
          }
        },
        automatic: false,
      },
      {
        id: 'memory-only',
        label: 'Use Memory Only',
        description: 'Continue without persistent storage',
        action: async () => {
          this.enableDegradation('persistent-storage');
          return true;
        },
        automatic: true,
      },
    ]);

    // Rendering error recovery
    this.recoveryStrategies.set(ErrorType.RENDERING, [
      {
        id: 'fallback-renderer',
        label: 'Use CSS Renderer',
        description: 'Switch from Canvas to CSS rendering',
        action: async () => {
          this.enableDegradation('canvas-rendering');
          return true;
        },
        automatic: true,
      },
    ]);

    // Game state error recovery
    this.recoveryStrategies.set(ErrorType.GAME_STATE, [
      {
        id: 'reset-game',
        label: 'Reset Game',
        description: 'Reset to initial game state',
        action: async () => {
          // Game reset logic will be implemented by GameController
          return true;
        },
        automatic: false,
      },
      {
        id: 'load-backup',
        label: 'Load Backup',
        description: 'Restore from last known good state',
        action: async () => {
          // Backup restoration logic
          return false; // Placeholder
        },
        automatic: true,
      },
    ]);
  }

  private setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = GameErrorFactory.createValidationError(
        `Unhandled promise rejection: ${event.reason}`,
        'UNHANDLED_PROMISE',
        { reason: event.reason },
      );
      (error as any).recoverable = false;
      this.handleError(error);
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      const error = GameErrorFactory.createValidationError(
        `Uncaught error: ${event.message}`,
        'UNCAUGHT_ERROR',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      );
      (error as any).recoverable = false;
      this.handleError(error);
    });
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();