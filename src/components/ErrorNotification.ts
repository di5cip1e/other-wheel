/**
 * User-friendly error notification system
 * Displays errors and recovery options to users in a non-intrusive way
 */

import { GameError, RecoveryOption, ErrorSeverity } from '../utils/ErrorHandler';

export interface NotificationOptions {
  duration?: number; // Auto-dismiss after milliseconds (0 = no auto-dismiss)
  showRecoveryOptions?: boolean;
  position?: 'top' | 'bottom' | 'center';
  type?: 'error' | 'warning' | 'info' | 'success';
}

/**
 * Error notification component for displaying user-friendly error messages
 */
export class ErrorNotification {
  private container: HTMLElement;
  private notifications: Map<string, HTMLElement> = new Map();
  private static instance: ErrorNotification;

  private constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  static getInstance(): ErrorNotification {
    if (!ErrorNotification.instance) {
      ErrorNotification.instance = new ErrorNotification();
    }
    return ErrorNotification.instance;
  }

  /**
   * Show an error notification
   */
  showError(
    error: GameError, 
    recoveryOptions: RecoveryOption[] = [],
    options: NotificationOptions = {},
  ): string {
    const notificationId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = this.createNotification(
      error.userMessage,
      this.getNotificationTypeFromSeverity(error.severity),
      recoveryOptions,
      {
        duration: this.getDefaultDuration(error.severity),
        showRecoveryOptions: recoveryOptions.length > 0,
        ...options,
      },
    );

    notification.setAttribute('data-error-code', error.code);
    notification.setAttribute('data-error-type', error.type);
    
    this.notifications.set(notificationId, notification);
    this.container.appendChild(notification);

    // Auto-dismiss if duration is set
    if (options.duration && options.duration > 0) {
      setTimeout(() => {
        this.dismissNotification(notificationId);
      }, options.duration);
    }

    return notificationId;
  }

  /**
   * Show a success notification (for recovery success)
   */
  showSuccess(message: string, options: NotificationOptions = {}): string {
    const notificationId = `success-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = this.createNotification(
      message,
      'success',
      [],
      {
        duration: 3000,
        ...options,
      },
    );

    this.notifications.set(notificationId, notification);
    this.container.appendChild(notification);

    if (options.duration && options.duration > 0) {
      setTimeout(() => {
        this.dismissNotification(notificationId);
      }, options.duration);
    }

    return notificationId;
  }

  /**
   * Show a warning notification
   */
  showWarning(message: string, options: NotificationOptions = {}): string {
    const notificationId = `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = this.createNotification(
      message,
      'warning',
      [],
      {
        duration: 5000,
        ...options,
      },
    );

    this.notifications.set(notificationId, notification);
    this.container.appendChild(notification);

    if (options.duration && options.duration > 0) {
      setTimeout(() => {
        this.dismissNotification(notificationId);
      }, options.duration);
    }

    return notificationId;
  }

  /**
   * Dismiss a specific notification
   */
  dismissNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.classList.add('dismissing');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.notifications.delete(notificationId);
      }, 300); // Animation duration
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    Array.from(this.notifications.keys()).forEach(id => {
      this.dismissNotification(id);
    });
  }

  /**
   * Get count of active notifications
   */
  getActiveCount(): number {
    return this.notifications.size;
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'error-notification-container';
    container.innerHTML = `
      <style>
        .error-notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 400px;
          pointer-events: none;
        }

        .error-notification {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin-bottom: 12px;
          padding: 16px;
          pointer-events: auto;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
          border-left: 4px solid #ccc;
          max-width: 100%;
          word-wrap: break-word;
        }

        .error-notification.show {
          transform: translateX(0);
        }

        .error-notification.dismissing {
          opacity: 0;
          transform: translateX(100%);
        }

        .error-notification.error {
          border-left-color: #e74c3c;
          background: #fdf2f2;
        }

        .error-notification.warning {
          border-left-color: #f39c12;
          background: #fef9e7;
        }

        .error-notification.info {
          border-left-color: #3498db;
          background: #f0f8ff;
        }

        .error-notification.success {
          border-left-color: #27ae60;
          background: #f0fff4;
        }

        .error-notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .error-notification-icon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .error-notification-message {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
          color: #333;
        }

        .error-notification-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
          padding: 0;
          margin-left: 8px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-notification-close:hover {
          color: #333;
        }

        .error-notification-recovery {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .error-notification-recovery-title {
          font-size: 12px;
          font-weight: bold;
          color: #666;
          margin-bottom: 8px;
        }

        .error-notification-recovery-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .error-notification-recovery-button {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .error-notification-recovery-button:hover {
          background: #e9ecef;
        }

        .error-notification-recovery-button:active {
          background: #dee2e6;
        }

        .error-notification-recovery-button.primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .error-notification-recovery-button.primary:hover {
          background: #0056b3;
        }

        @media (max-width: 480px) {
          .error-notification-container {
            left: 20px;
            right: 20px;
            max-width: none;
          }
        }
      </style>
    `;
    return container;
  }

  private createNotification(
    message: string,
    type: 'error' | 'warning' | 'info' | 'success',
    recoveryOptions: RecoveryOption[],
    options: NotificationOptions,
  ): HTMLElement {
    const notification = document.createElement('div');
    notification.className = `error-notification ${type}`;

    const icon = this.getIconForType(type);
    
    notification.innerHTML = `
      <div class="error-notification-header">
        <div style="display: flex; align-items: flex-start;">
          <div class="error-notification-icon">${icon}</div>
          <div class="error-notification-message">${this.escapeHtml(message)}</div>
        </div>
        <button class="error-notification-close" aria-label="Close notification">&times;</button>
      </div>
      ${options.showRecoveryOptions && recoveryOptions.length > 0 ? this.createRecoverySection(recoveryOptions) : ''}
    `;

    // Add close button functionality
    const closeButton = notification.querySelector('.error-notification-close') as HTMLButtonElement;
    closeButton.addEventListener('click', () => {
      const notificationId = Array.from(this.notifications.entries())
        .find(([, element]) => element === notification)?.[0];
      if (notificationId) {
        this.dismissNotification(notificationId);
      }
    });

    // Add recovery button functionality
    const recoveryButtons = notification.querySelectorAll('.error-notification-recovery-button');
    recoveryButtons.forEach((button, index) => {
      button.addEventListener('click', async () => {
        const option = recoveryOptions[index];
        if (option) {
          try {
            button.textContent = 'Attempting...';
            (button as HTMLButtonElement).disabled = true;
            
            const success = await option.action();
            
            if (success) {
              this.showSuccess(`Recovery successful: ${option.label}`);
              const notificationId = Array.from(this.notifications.entries())
                .find(([, element]) => element === notification)?.[0];
              if (notificationId) {
                this.dismissNotification(notificationId);
              }
            } else {
              button.textContent = 'Failed';
              setTimeout(() => {
                button.textContent = option.label;
                (button as HTMLButtonElement).disabled = false;
              }, 2000);
            }
          } catch (error) {
            console.error('Recovery action failed:', error);
            button.textContent = 'Error';
            setTimeout(() => {
              button.textContent = option.label;
              (button as HTMLButtonElement).disabled = false;
            }, 2000);
          }
        }
      });
    });

    // Trigger show animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    return notification;
  }

  private createRecoverySection(recoveryOptions: RecoveryOption[]): string {
    const buttons = recoveryOptions
      .filter(option => !option.automatic) // Only show manual recovery options
      .map((option, index) => `
        <button class="error-notification-recovery-button ${index === 0 ? 'primary' : ''}" 
                title="${this.escapeHtml(option.description)}">
          ${this.escapeHtml(option.label)}
        </button>
      `)
      .join('');

    if (buttons) {
      return `
        <div class="error-notification-recovery">
          <div class="error-notification-recovery-title">Recovery Options:</div>
          <div class="error-notification-recovery-options">
            ${buttons}
          </div>
        </div>
      `;
    }

    return '';
  }

  private getIconForType(type: string): string {
    switch (type) {
    case 'error':
      return '⚠️';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    case 'success':
      return '✅';
    default:
      return 'ℹ️';
    }
  }

  private getNotificationTypeFromSeverity(severity: ErrorSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warning';
    case ErrorSeverity.LOW:
    default:
      return 'info';
    }
  }

  private getDefaultDuration(severity: ErrorSeverity): number {
    switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 0; // No auto-dismiss for critical errors
    case ErrorSeverity.HIGH:
      return 10000; // 10 seconds
    case ErrorSeverity.MEDIUM:
      return 7000; // 7 seconds
    case ErrorSeverity.LOW:
    default:
      return 5000; // 5 seconds
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance
export const errorNotification = ErrorNotification.getInstance();