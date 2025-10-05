/**
 * Error boundary system for component-level error handling
 * Provides isolation and recovery for individual game components
 */

import { GameError, GameErrorFactory } from './ErrorHandler';
import { errorHandler } from './ErrorHandler';


export interface ErrorBoundaryOptions {
  componentName: string;
  fallbackContent?: string | HTMLElement;
  onError?: (error: GameError) => void;
  onRecover?: () => void;
  autoRecover?: boolean;
  maxRetries?: number;
}

/**
 * Error boundary for wrapping components with error handling
 */
export class ErrorBoundary {
  private element: HTMLElement;
  private options: ErrorBoundaryOptions;
  private retryCount: number = 0;
  private isErrorState: boolean = false;
  private originalContent: string = '';

  constructor(element: HTMLElement, options: ErrorBoundaryOptions) {
    this.element = element;
    this.options = {
      maxRetries: 3,
      autoRecover: true,
      ...options,
    };
    
    this.originalContent = element.innerHTML;
    this.setupErrorHandling();
  }

  /**
   * Wrap a function with error boundary protection
   */
  wrapFunction<T extends any[], R>(
    fn: (...args: T) => R,
    context?: any,
  ): (...args: T) => R | null {
    return (...args: T): R | null => {
      try {
        return fn.apply(context, args);
      } catch (error) {
        this.handleError(error);
        return null;
      }
    };
  }

  /**
   * Wrap an async function with error boundary protection
   */
  wrapAsyncFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: any,
  ): (...args: T) => Promise<R | null> {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn.apply(context, args);
      } catch (error) {
        this.handleError(error);
        return null;
      }
    };
  }

  /**
   * Manually trigger error handling
   */
  handleError(error: any): void {
    const gameError = this.convertToGameError(error);
    
    // Log the error
    console.error(`Error in ${this.options.componentName}:`, gameError);
    
    // Update error state
    this.isErrorState = true;
    this.retryCount++;

    // Call custom error handler
    if (this.options.onError) {
      this.options.onError(gameError);
    }

    // Handle the error through the global error handler
    errorHandler.handleError(gameError);

    // Show fallback content
    this.showFallbackContent(gameError);

    // Attempt auto-recovery if enabled
    if (this.options.autoRecover && this.retryCount <= (this.options.maxRetries || 3)) {
      this.attemptRecovery();
    }
  }

  /**
   * Attempt to recover from error state
   */
  async attemptRecovery(): Promise<boolean> {
    try {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));

      // Restore original content
      this.element.innerHTML = this.originalContent;
      
      // Reset error state
      this.isErrorState = false;

      // Call recovery callback
      if (this.options.onRecover) {
        this.options.onRecover();
      }

      console.log(`Recovery successful for ${this.options.componentName}`);
      return true;
    } catch (error) {
      console.error(`Recovery failed for ${this.options.componentName}:`, error);
      return false;
    }
  }

  /**
   * Reset the error boundary state
   */
  reset(): void {
    this.retryCount = 0;
    this.isErrorState = false;
    this.element.innerHTML = this.originalContent;
  }

  /**
   * Check if the boundary is in error state
   */
  isInErrorState(): boolean {
    return this.isErrorState;
  }

  /**
   * Get retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  private setupErrorHandling(): void {
    // Catch unhandled errors in the element
    this.element.addEventListener('error', (event) => {
      this.handleError(event.error || new Error('Unknown error'));
    }, true);

    // Catch unhandled promise rejections in the element
    this.element.addEventListener('unhandledrejection', (event) => {
      const rejectionEvent = event as any;
      this.handleError(rejectionEvent.reason || new Error('Unhandled promise rejection'));
    }, true);
  }

  private convertToGameError(error: any): GameError {
    if (error instanceof Error && 'type' in error) {
      return error as GameError;
    }

    const message = error?.message || error?.toString() || 'Unknown error';
    return GameErrorFactory.createValidationError(
      `Error in ${this.options.componentName}: ${message}`,
      'COMPONENT_ERROR',
      { componentName: this.options.componentName, originalError: error },
    );
  }

  private showFallbackContent(error: GameError): void {
    let fallbackContent: string;

    if (typeof this.options.fallbackContent === 'string') {
      fallbackContent = this.options.fallbackContent;
    } else if (this.options.fallbackContent instanceof HTMLElement) {
      fallbackContent = this.options.fallbackContent.outerHTML;
    } else {
      fallbackContent = this.createDefaultFallbackContent(error);
    }

    this.element.innerHTML = fallbackContent;
  }

  private createDefaultFallbackContent(error: GameError): string {
    return `
      <div class="error-boundary-fallback" style="
        padding: 20px;
        border: 2px dashed #e74c3c;
        border-radius: 8px;
        background: #fdf2f2;
        text-align: center;
        color: #721c24;
      ">
        <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
        <div style="font-weight: bold; margin-bottom: 8px;">
          ${this.options.componentName} Error
        </div>
        <div style="font-size: 14px; margin-bottom: 12px;">
          ${error.userMessage}
        </div>
        <button onclick="this.parentElement.dispatchEvent(new CustomEvent('retry'))" 
                style="
                  background: #e74c3c;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                ">
          Retry
        </button>
      </div>
    `;
  }
}

/**
 * Component error manager for handling multiple error boundaries
 */
export class ComponentErrorManager {
  private boundaries: Map<string, ErrorBoundary> = new Map();
  private static instance: ComponentErrorManager;

  private constructor() {
    this.setupGlobalErrorHandling();
  }

  static getInstance(): ComponentErrorManager {
    if (!ComponentErrorManager.instance) {
      ComponentErrorManager.instance = new ComponentErrorManager();
    }
    return ComponentErrorManager.instance;
  }

  /**
   * Create and register an error boundary for a component
   */
  createBoundary(
    element: HTMLElement,
    options: ErrorBoundaryOptions,
  ): ErrorBoundary {
    const boundary = new ErrorBoundary(element, options);
    this.boundaries.set(options.componentName, boundary);
    
    // Add retry event listener
    element.addEventListener('retry', () => {
      boundary.attemptRecovery();
    });

    return boundary;
  }

  /**
   * Get an error boundary by component name
   */
  getBoundary(componentName: string): ErrorBoundary | undefined {
    return this.boundaries.get(componentName);
  }

  /**
   * Remove an error boundary
   */
  removeBoundary(componentName: string): void {
    this.boundaries.delete(componentName);
  }

  /**
   * Reset all error boundaries
   */
  resetAllBoundaries(): void {
    this.boundaries.forEach(boundary => boundary.reset());
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): { [componentName: string]: { retryCount: number; isInError: boolean } } {
    const stats: { [componentName: string]: { retryCount: number; isInError: boolean } } = {};
    
    this.boundaries.forEach((boundary, componentName) => {
      stats[componentName] = {
        retryCount: boundary.getRetryCount(),
        isInError: boundary.isInErrorState(),
      };
    });

    return stats;
  }

  private setupGlobalErrorHandling(): void {
    // Handle component-level errors that bubble up
    window.addEventListener('error', (event) => {
      // Try to find the component that caused the error
      let target = event.target as HTMLElement;
      while (target && target !== document.body) {
        const componentName = target.getAttribute('data-component');
        if (componentName) {
          const boundary = this.boundaries.get(componentName);
          if (boundary) {
            boundary.handleError(event.error);
            event.preventDefault();
            return;
          }
        }
        target = target.parentElement as HTMLElement;
      }
    }, true);
  }
}

/**
 * Decorator for wrapping component methods with error boundaries
 */
export function withErrorBoundary(componentName: string) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {


      constructor(...args: any[]) {
        super(...args);
        
        // If this is a component with an element property, wrap it
        if ('element' in this && this.element instanceof HTMLElement) {
          const manager = ComponentErrorManager.getInstance();
          manager.createBoundary(this.element, {
            componentName,
            onError: (error) => {
              console.error(`Error in ${componentName}:`, error);
            },
            onRecover: () => {
              console.log(`${componentName} recovered from error`);
            },
          });
        }
      }
    };
  };
}

// Export singleton instance
export const componentErrorManager = ComponentErrorManager.getInstance();