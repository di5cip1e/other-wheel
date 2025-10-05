/**
 * Tests for error boundary system
 */

import {
  ErrorBoundary,
  ComponentErrorManager,
  withErrorBoundary,
} from '../../src/utils/ErrorBoundary';
import { GameErrorFactory, ErrorType } from '../../src/utils/ErrorHandler';

// Mock DOM environment
const createMockElement = (): HTMLElement => {
  const element = document.createElement('div');
  element.innerHTML = '<p>Original content</p>';
  return element;
};

describe('ErrorBoundary', () => {
  let mockElement: HTMLElement;
  let errorBoundary: ErrorBoundary;
  let mockOnError: jest.Mock;
  let mockOnRecover: jest.Mock;

  beforeEach(() => {
    mockElement = createMockElement();
    mockOnError = jest.fn();
    mockOnRecover = jest.fn();
    
    errorBoundary = new ErrorBoundary(mockElement, {
      componentName: 'TestComponent',
      onError: mockOnError,
      onRecover: mockOnRecover,
      autoRecover: true,
      maxRetries: 2,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Function Wrapping', () => {
    it('should wrap functions and catch errors', () => {
      const throwingFunction = () => {
        throw new Error('Test error');
      };

      const wrappedFunction = errorBoundary.wrapFunction(throwingFunction);
      const result = wrappedFunction();

      expect(result).toBeNull();
      expect(mockOnError).toHaveBeenCalled();
      expect(errorBoundary.isInErrorState()).toBe(true);
    });

    it('should wrap functions and return results on success', () => {
      const successFunction = (a: number, b: number) => a + b;

      const wrappedFunction = errorBoundary.wrapFunction(successFunction);
      const result = wrappedFunction(2, 3);

      expect(result).toBe(5);
      expect(mockOnError).not.toHaveBeenCalled();
      expect(errorBoundary.isInErrorState()).toBe(false);
    });

    it('should wrap async functions and catch errors', async () => {
      const throwingAsyncFunction = async () => {
        throw new Error('Async test error');
      };

      const wrappedFunction = errorBoundary.wrapAsyncFunction(throwingAsyncFunction);
      const result = await wrappedFunction();

      expect(result).toBeNull();
      expect(mockOnError).toHaveBeenCalled();
      expect(errorBoundary.isInErrorState()).toBe(true);
    });

    it('should wrap async functions and return results on success', async () => {
      const successAsyncFunction = async (a: number, b: number) => {
        return Promise.resolve(a * b);
      };

      const wrappedFunction = errorBoundary.wrapAsyncFunction(successAsyncFunction);
      const result = await wrappedFunction(3, 4);

      expect(result).toBe(12);
      expect(mockOnError).not.toHaveBeenCalled();
      expect(errorBoundary.isInErrorState()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors and show fallback content', () => {
      const originalContent = mockElement.innerHTML;
      const error = new Error('Test error');

      errorBoundary.handleError(error);

      expect(mockOnError).toHaveBeenCalled();
      expect(errorBoundary.isInErrorState()).toBe(true);
      expect(errorBoundary.getRetryCount()).toBe(1);
      expect(mockElement.innerHTML).not.toBe(originalContent);
      expect(mockElement.innerHTML).toContain('TestComponent Error');
    });

    it('should use custom fallback content', () => {
      const customFallback = '<div>Custom fallback content</div>';
      const customBoundary = new ErrorBoundary(mockElement, {
        componentName: 'CustomComponent',
        fallbackContent: customFallback,
      });

      customBoundary.handleError(new Error('Test error'));

      expect(mockElement.innerHTML).toBe(customFallback);
    });

    it('should use HTMLElement fallback content', () => {
      const fallbackElement = document.createElement('div');
      fallbackElement.textContent = 'Element fallback';
      
      const customBoundary = new ErrorBoundary(mockElement, {
        componentName: 'CustomComponent',
        fallbackContent: fallbackElement,
      });

      customBoundary.handleError(new Error('Test error'));

      expect(mockElement.innerHTML).toBe(fallbackElement.outerHTML);
    });

    it('should increment retry count on multiple errors', () => {
      errorBoundary.handleError(new Error('Error 1'));
      expect(errorBoundary.getRetryCount()).toBe(1);

      errorBoundary.handleError(new Error('Error 2'));
      expect(errorBoundary.getRetryCount()).toBe(2);
    });

    it('should convert regular errors to GameErrors', () => {
      const regularError = new Error('Regular error');
      
      errorBoundary.handleError(regularError);

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.UNKNOWN,
          code: 'COMPONENT_ERROR',
          technicalMessage: expect.stringContaining('TestComponent'),
          context: expect.objectContaining({
            componentName: 'TestComponent',
            originalError: regularError,
          }),
        }),
      );
    });
  });

  describe('Recovery', () => {
    it('should attempt recovery and restore content', async () => {
      const originalContent = mockElement.innerHTML;
      
      errorBoundary.handleError(new Error('Test error'));
      expect(errorBoundary.isInErrorState()).toBe(true);

      const recovered = await errorBoundary.attemptRecovery();

      expect(recovered).toBe(true);
      expect(errorBoundary.isInErrorState()).toBe(false);
      expect(mockElement.innerHTML).toBe(originalContent);
      expect(mockOnRecover).toHaveBeenCalled();
    });

    it('should handle recovery failures', async () => {
      // Mock a recovery that will fail
      const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      let setterCallCount = 0;
      
      Object.defineProperty(mockElement, 'innerHTML', {
        get: originalInnerHTML?.get,
        set: function(value) {
          setterCallCount++;
          if (setterCallCount > 1) { // Fail on recovery attempt
            throw new Error('Recovery failed');
          }
          originalInnerHTML?.set?.call(this, value);
        },
      });

      errorBoundary.handleError(new Error('Test error'));
      const recovered = await errorBoundary.attemptRecovery();

      expect(recovered).toBe(false);
      
      // Restore original descriptor
      if (originalInnerHTML) {
        Object.defineProperty(Element.prototype, 'innerHTML', originalInnerHTML);
      }
    });

    it('should reset error boundary state', () => {
      const originalContent = mockElement.innerHTML;
      
      errorBoundary.handleError(new Error('Test error'));
      expect(errorBoundary.isInErrorState()).toBe(true);
      expect(errorBoundary.getRetryCount()).toBe(1);

      errorBoundary.reset();

      expect(errorBoundary.isInErrorState()).toBe(false);
      expect(errorBoundary.getRetryCount()).toBe(0);
      expect(mockElement.innerHTML).toBe(originalContent);
    });
  });

  describe('Auto Recovery', () => {
    it('should attempt auto recovery when enabled', (done) => {
      const autoRecoveryBoundary = new ErrorBoundary(mockElement, {
        componentName: 'AutoRecoveryComponent',
        autoRecover: true,
        maxRetries: 1,
        onRecover: () => {
          expect(autoRecoveryBoundary.isInErrorState()).toBe(false);
          done();
        },
      });

      autoRecoveryBoundary.handleError(new Error('Auto recovery test'));
    });

    it('should not exceed max retries', async () => {
      const maxRetries = 2;
      const limitedBoundary = new ErrorBoundary(mockElement, {
        componentName: 'LimitedComponent',
        autoRecover: true,
        maxRetries,
      });

      // Trigger errors beyond max retries
      for (let i = 0; i <= maxRetries + 1; i++) {
        limitedBoundary.handleError(new Error(`Error ${i}`));
      }

      expect(limitedBoundary.getRetryCount()).toBe(maxRetries + 2);
      // Auto recovery should stop after max retries
    });
  });
});

describe('ComponentErrorManager', () => {
  let manager: ComponentErrorManager;
  let mockElement: HTMLElement;

  beforeEach(() => {
    manager = ComponentErrorManager.getInstance();
    mockElement = createMockElement();
  });

  afterEach(() => {
    // Clean up boundaries
    manager.resetAllBoundaries();
  });

  it('should create and register error boundaries', () => {
    const boundary = manager.createBoundary(mockElement, {
      componentName: 'TestComponent',
    });

    expect(boundary).toBeInstanceOf(ErrorBoundary);
    expect(manager.getBoundary('TestComponent')).toBe(boundary);
  });

  it('should remove error boundaries', () => {
    manager.createBoundary(mockElement, {
      componentName: 'TestComponent',
    });

    expect(manager.getBoundary('TestComponent')).toBeDefined();

    manager.removeBoundary('TestComponent');
    expect(manager.getBoundary('TestComponent')).toBeUndefined();
  });

  it('should reset all boundaries', () => {
    const boundary1 = manager.createBoundary(createMockElement(), {
      componentName: 'Component1',
    });
    const boundary2 = manager.createBoundary(createMockElement(), {
      componentName: 'Component2',
    });

    // Trigger errors
    boundary1.handleError(new Error('Error 1'));
    boundary2.handleError(new Error('Error 2'));

    expect(boundary1.isInErrorState()).toBe(true);
    expect(boundary2.isInErrorState()).toBe(true);

    manager.resetAllBoundaries();

    expect(boundary1.isInErrorState()).toBe(false);
    expect(boundary2.isInErrorState()).toBe(false);
  });

  it('should provide error statistics', () => {
    const boundary1 = manager.createBoundary(createMockElement(), {
      componentName: 'Component1',
    });
    const boundary2 = manager.createBoundary(createMockElement(), {
      componentName: 'Component2',
    });

    boundary1.handleError(new Error('Error 1'));
    boundary2.handleError(new Error('Error 2'));
    boundary2.handleError(new Error('Error 2 again'));

    const stats = manager.getErrorStatistics();

    expect(stats.Component1.retryCount).toBe(1);
    expect(stats.Component1.isInError).toBe(true);
    expect(stats.Component2.retryCount).toBe(2);
    expect(stats.Component2.isInError).toBe(true);
  });

  it('should handle retry events', (done) => {
    const boundary = manager.createBoundary(mockElement, {
      componentName: 'RetryComponent',
      onRecover: () => {
        done();
      },
    });

    boundary.handleError(new Error('Test error'));

    // Simulate retry button click
    const retryEvent = new CustomEvent('retry');
    mockElement.dispatchEvent(retryEvent);
  });
});

describe('withErrorBoundary Decorator', () => {
  it('should wrap class with error boundary', () => {
    @withErrorBoundary('DecoratedComponent')
    class TestComponent {
      element: HTMLElement;

      constructor() {
        this.element = createMockElement();
      }
    }

    const instance = new TestComponent();
    expect(instance).toBeInstanceOf(TestComponent);
    expect(instance.element).toBeDefined();
  });

  it('should handle components without element property', () => {
    @withErrorBoundary('NoElementComponent')
    class TestComponent {
      value: number = 42;
    }

    const instance = new TestComponent();
    expect(instance.value).toBe(42);
  });
});