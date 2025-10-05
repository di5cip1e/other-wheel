/**
 * Tests for error notification system
 */

import { ErrorNotification } from '../../src/components/ErrorNotification';
import { GameErrorFactory, ErrorSeverity } from '../../src/utils/ErrorHandler';

// Mock DOM environment
Object.defineProperty(document, 'body', {
    value: document.createElement('body'),
    writable: true,
});

describe('ErrorNotification', () => {
    let errorNotification: ErrorNotification;

    beforeEach(() => {
        // Clear document body
        document.body.innerHTML = '';
        errorNotification = ErrorNotification.getInstance();
    });

    afterEach(() => {
        errorNotification.dismissAll();
        jest.clearAllTimers();
    });

    describe('Error Display', () => {
        it('should show error notifications', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Physics simulation failed',
                'PHYSICS_FAILED',
            );

            const notificationId = errorNotification.showError(error);

            expect(notificationId).toBeDefined();
            expect(errorNotification.getActiveCount()).toBe(1);

            const container = document.querySelector('.error-notification-container');
            expect(container).toBeTruthy();

            const notification = document.querySelector('.error-notification');
            expect(notification).toBeTruthy();
            expect(notification?.textContent).toContain(error.userMessage);
        });

        it('should show different notification types based on severity', () => {
            const criticalError = GameErrorFactory.createGameStateError(
                'Critical error',
                'CRITICAL_ERROR',
            );

            const warningError = GameErrorFactory.createValidationError(
                'Warning error',
                'WARNING_ERROR',
            );

            errorNotification.showError(criticalError);
            errorNotification.showError(warningError);

            const notifications = document.querySelectorAll('.error-notification');
            expect(notifications.length).toBe(2);

            // Critical errors should show as error type
            expect(notifications[0].classList.contains('error')).toBe(true);
            // Medium severity should show as warning type
            expect(notifications[1].classList.contains('warning')).toBe(true);
        });

        it('should show recovery options when provided', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Physics error',
                'PHYSICS_ERROR',
            );

            const recoveryOptions = [
                {
                    id: 'reset',
                    label: 'Reset Physics',
                    description: 'Reset the physics engine',
                    action: async () => true,
                },
                {
                    id: 'fallback',
                    label: 'Use Fallback',
                    description: 'Use simplified physics',
                    action: async () => true,
                },
            ];

            errorNotification.showError(error, recoveryOptions);

            const recoverySection = document.querySelector('.error-notification-recovery');
            expect(recoverySection).toBeTruthy();

            const recoveryButtons = document.querySelectorAll('.error-notification-recovery-button');
            expect(recoveryButtons.length).toBe(2);
            expect(recoveryButtons[0].textContent?.trim()).toBe('Reset Physics');
            expect(recoveryButtons[1].textContent?.trim()).toBe('Use Fallback');
        });

        it('should not show automatic recovery options', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Physics error',
                'PHYSICS_ERROR',
            );

            const recoveryOptions = [
                {
                    id: 'manual',
                    label: 'Manual Recovery',
                    description: 'Manual recovery option',
                    action: async () => true,
                    automatic: false,
                },
                {
                    id: 'automatic',
                    label: 'Automatic Recovery',
                    description: 'Automatic recovery option',
                    action: async () => true,
                    automatic: true,
                },
            ];

            errorNotification.showError(error, recoveryOptions);

            const recoveryButtons = document.querySelectorAll('.error-notification-recovery-button');
            expect(recoveryButtons.length).toBe(1);
            expect(recoveryButtons[0].textContent?.trim()).toBe('Manual Recovery');
        });
    });

    describe('Success and Warning Notifications', () => {
        it('should show success notifications', () => {
            const notificationId = errorNotification.showSuccess('Recovery successful!');

            expect(notificationId).toBeDefined();
            expect(errorNotification.getActiveCount()).toBe(1);

            const notification = document.querySelector('.error-notification.success');
            expect(notification).toBeTruthy();
            expect(notification?.textContent).toContain('Recovery successful!');
        });

        it('should show warning notifications', () => {
            const notificationId = errorNotification.showWarning('Feature degraded');

            expect(notificationId).toBeDefined();
            expect(errorNotification.getActiveCount()).toBe(1);

            const notification = document.querySelector('.error-notification.warning');
            expect(notification).toBeTruthy();
            expect(notification?.textContent).toContain('Feature degraded');
        });
    });

    describe('Notification Management', () => {
        it('should dismiss specific notifications', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Test error',
                'TEST_ERROR',
            );

            const notificationId = errorNotification.showError(error);
            expect(errorNotification.getActiveCount()).toBe(1);

            errorNotification.dismissNotification(notificationId);

            // Should be marked for dismissal immediately
            const notification = document.querySelector('.error-notification');
            expect(notification?.classList.contains('dismissing')).toBe(true);
        });

        it('should dismiss all notifications', () => {
            const error1 = GameErrorFactory.createPhysicsError('Error 1', 'ERROR_1');
            const error2 = GameErrorFactory.createMediaError('Error 2', 'ERROR_2');

            errorNotification.showError(error1);
            errorNotification.showError(error2);
            expect(errorNotification.getActiveCount()).toBe(2);

            errorNotification.dismissAll();

            const notifications = document.querySelectorAll('.error-notification');
            notifications.forEach(notification => {
                expect(notification.classList.contains('dismissing')).toBe(true);
            });
        });

        it('should handle close button clicks', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Test error',
                'TEST_ERROR',
            );

            errorNotification.showError(error);

            const closeButton = document.querySelector('.error-notification-close') as HTMLButtonElement;
            expect(closeButton).toBeTruthy();

            closeButton.click();

            const notification = document.querySelector('.error-notification');
            expect(notification?.classList.contains('dismissing')).toBe(true);
        });
    });

    describe('Auto-Dismiss', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should auto-dismiss notifications with duration', () => {
            const error = GameErrorFactory.createValidationError(
                'Test error',
                'TEST_ERROR',
            );

            errorNotification.showError(error, [], { duration: 5000 });
            expect(errorNotification.getActiveCount()).toBe(1);

            // Fast-forward time
            jest.advanceTimersByTime(5000);

            const notification = document.querySelector('.error-notification');
            expect(notification?.classList.contains('dismissing')).toBe(true);
        });

        it('should not auto-dismiss critical errors by default', () => {
            const error = GameErrorFactory.createGameStateError(
                'Critical error',
                'CRITICAL_ERROR',
            );

            errorNotification.showError(error);

            // Fast-forward a long time
            jest.advanceTimersByTime(30000);

            const notification = document.querySelector('.error-notification');
            expect(notification?.classList.contains('dismissing')).toBe(false);
        });

        it('should respect custom duration settings', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Test error',
                'TEST_ERROR',
            );

            errorNotification.showError(error, [], { duration: 2000 });

            // Should not dismiss before duration
            jest.advanceTimersByTime(1000);
            let notification = document.querySelector('.error-notification');
            expect(notification?.classList.contains('dismissing')).toBe(false);

            // Should dismiss after duration
            jest.advanceTimersByTime(1000);
            notification = document.querySelector('.error-notification');
            expect(notification?.classList.contains('dismissing')).toBe(true);
        });
    });

    describe('Recovery Actions', () => {
        it('should execute recovery actions when buttons are clicked', async () => {
            const mockAction = jest.fn().mockResolvedValue(true);
            const error = GameErrorFactory.createPhysicsError(
                'Physics error',
                'PHYSICS_ERROR',
            );

            const recoveryOptions = [
                {
                    id: 'test-recovery',
                    label: 'Test Recovery',
                    description: 'Test recovery action',
                    action: mockAction,
                },
            ];

            errorNotification.showError(error, recoveryOptions);

            const recoveryButton = document.querySelector('.error-notification-recovery-button') as HTMLButtonElement;
            expect(recoveryButton).toBeTruthy();

            recoveryButton.click();

            // Wait for async action
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockAction).toHaveBeenCalled();
        });

        it('should show success message on successful recovery', async () => {
            const mockAction = jest.fn().mockResolvedValue(true);
            const error = GameErrorFactory.createPhysicsError(
                'Physics error',
                'PHYSICS_ERROR',
            );

            const recoveryOptions = [
                {
                    id: 'test-recovery',
                    label: 'Test Recovery',
                    description: 'Test recovery action',
                    action: mockAction,
                },
            ];

            errorNotification.showError(error, recoveryOptions);

            const recoveryButton = document.querySelector('.error-notification-recovery-button') as HTMLButtonElement;
            recoveryButton.click();

            // Wait for async action
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should show success notification
            const successNotification = document.querySelector('.error-notification.success');
            expect(successNotification).toBeTruthy();
            expect(successNotification?.textContent).toContain('Recovery successful');
        });

        it('should handle recovery action failures', async () => {
            const mockAction = jest.fn().mockResolvedValue(false);
            const error = GameErrorFactory.createPhysicsError(
                'Physics error',
                'PHYSICS_ERROR',
            );

            const recoveryOptions = [
                {
                    id: 'failing-recovery',
                    label: 'Failing Recovery',
                    description: 'This recovery will fail',
                    action: mockAction,
                },
            ];

            errorNotification.showError(error, recoveryOptions);

            const recoveryButton = document.querySelector('.error-notification-recovery-button') as HTMLButtonElement;
            const originalText = recoveryButton.textContent;

            recoveryButton.click();

            // Wait for async action
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(recoveryButton.textContent).toBe('Failed');

            // Should restore original text after delay
            jest.useFakeTimers();
            jest.advanceTimersByTime(2000);
            expect(recoveryButton.textContent).toBe(originalText);
            expect(recoveryButton.disabled).toBe(false);
            jest.useRealTimers();
        });

        it('should handle recovery action exceptions', async () => {
            const mockAction = jest.fn().mockRejectedValue(new Error('Recovery failed'));
            const error = GameErrorFactory.createPhysicsError(
                'Physics error',
                'PHYSICS_ERROR',
            );

            const recoveryOptions = [
                {
                    id: 'error-recovery',
                    label: 'Error Recovery',
                    description: 'This recovery will throw an error',
                    action: mockAction,
                },
            ];

            errorNotification.showError(error, recoveryOptions);

            const recoveryButton = document.querySelector('.error-notification-recovery-button') as HTMLButtonElement;

            recoveryButton.click();

            // Wait for async action
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(recoveryButton.textContent).toBe('Error');
        });
    });

    describe('Responsive Design', () => {
        it('should create responsive container', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Test error',
                'TEST_ERROR',
            );

            errorNotification.showError(error);

            const container = document.querySelector('.error-notification-container');
            expect(container).toBeTruthy();

            // Check that styles are applied (basic check)
            const styles = window.getComputedStyle(container as Element);
            expect(styles.position).toBe('fixed');
        });
    });

    describe('HTML Escaping', () => {
        it('should escape HTML in error messages', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Error with <script>alert("xss")</script> HTML',
                'XSS_TEST',
            );

            errorNotification.showError(error);

            const notification = document.querySelector('.error-notification');
            expect(notification?.innerHTML).not.toContain('<script>');
            expect(notification?.innerHTML).toContain('&lt;script&gt;');
        });

        it('should escape HTML in recovery option labels', () => {
            const error = GameErrorFactory.createPhysicsError(
                'Test error',
                'TEST_ERROR',
            );

            const recoveryOptions = [
                {
                    id: 'xss-test',
                    label: '<img src=x onerror=alert(1)>',
                    description: 'XSS test',
                    action: async () => true,
                },
            ];

            errorNotification.showError(error, recoveryOptions);

            const recoveryButton = document.querySelector('.error-notification-recovery-button');
            expect(recoveryButton?.innerHTML).not.toContain('<img');
            expect(recoveryButton?.innerHTML).toContain('&lt;img');
        });
    });
});