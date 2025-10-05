/**
 * Touch Gesture Handler for mobile spinning interactions
 * Provides touch-based wheel spinning with gesture recognition
 */

export interface TouchGestureOptions {
  element: HTMLElement;
  onSwipe?: (direction: SwipeDirection, velocity: number) => void;
  onTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  preventDefault?: boolean;
}

export enum SwipeDirection {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  Clockwise = 'clockwise',
  CounterClockwise = 'counterclockwise'
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export class TouchGestureHandler {
  private element: HTMLElement;
  private options: Required<TouchGestureOptions>;
  private touchStart: TouchPoint | null = null;
  private touchHistory: TouchPoint[] = [];
  private longPressTimer: number | null = null;
  private isLongPress = false;
  private initialPinchDistance = 0;

  constructor(options: TouchGestureOptions) {
    this.element = options.element;
    this.options = {
      onSwipe: options.onSwipe || (() => {}),
      onTap: options.onTap || (() => {}),
      onLongPress: options.onLongPress || (() => {}),
      onPinch: options.onPinch || (() => {}),
      swipeThreshold: options.swipeThreshold || 50,
      longPressDelay: options.longPressDelay || 500,
      preventDefault: options.preventDefault !== false,
      element: options.element,
    };

    this.bindEvents();
  }

  private bindEvents(): void {
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: !this.options.preventDefault });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: !this.options.preventDefault });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: !this.options.preventDefault });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: !this.options.preventDefault });

    // Mouse events for desktop compatibility
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', (e) => {
      if (this.isLongPress) {
        e.preventDefault();
      }
    });
  }

  private handleTouchStart(event: TouchEvent): void {
    if (this.options.preventDefault) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    if (!touch) {return;}

    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    this.touchHistory = [this.touchStart];
    this.isLongPress = false;

    // Handle multi-touch for pinch gestures
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      if (touch1 && touch2) {
        this.initialPinchDistance = this.getDistance(touch1, touch2);
      }
      this.clearLongPressTimer();
    } else {
      // Start long press timer for single touch
      this.startLongPressTimer(touch.clientX, touch.clientY);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.options.preventDefault) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    if (!touch || !this.touchStart) {return;}

    // Clear long press timer on movement
    this.clearLongPressTimer();

    // Track touch history for velocity calculation
    const currentTouch: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    this.touchHistory.push(currentTouch);

    // Keep only recent history (last 100ms)
    const cutoff = currentTouch.timestamp - 100;
    this.touchHistory = this.touchHistory.filter(t => t.timestamp >= cutoff);

    // Handle pinch gestures
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      if (touch1 && touch2) {
        const currentDistance = this.getDistance(touch1, touch2);
        
        if (this.initialPinchDistance > 0) {
          const scale = currentDistance / this.initialPinchDistance;
          const center = this.getCenter(touch1, touch2);
          this.options.onPinch(scale, center);
        }
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.options.preventDefault) {
      event.preventDefault();
    }

    this.clearLongPressTimer();

    if (!this.touchStart || this.touchHistory.length === 0) {return;}

    const lastTouch = this.touchHistory[this.touchHistory.length - 1];
    if (!lastTouch) {return;}

    const deltaX = lastTouch.x - this.touchStart.x;
    const deltaY = lastTouch.y - this.touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = lastTouch.timestamp - this.touchStart.timestamp;

    // Determine if this was a tap or swipe
    if (distance < this.options.swipeThreshold && duration < 300) {
      // Tap gesture
      this.options.onTap(lastTouch.x, lastTouch.y);
    } else if (distance >= this.options.swipeThreshold) {
      // Swipe gesture
      const velocity = this.calculateVelocity();
      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.options.onSwipe(direction, velocity);
    }

    this.reset();
  }

  private handleTouchCancel(_event: TouchEvent): void {
    if (this.options.preventDefault) {
      _event.preventDefault();
    }
    this.clearLongPressTimer();
    this.reset();
  }

  // Mouse event handlers for desktop compatibility
  private handleMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {return;} // Only handle left mouse button

    this.touchStart = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
    };

    this.touchHistory = [this.touchStart];
    this.isLongPress = false;
    this.startLongPressTimer(event.clientX, event.clientY);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.touchStart) {return;}

    this.clearLongPressTimer();

    const currentTouch: TouchPoint = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
    };

    this.touchHistory.push(currentTouch);

    // Keep only recent history
    const cutoff = currentTouch.timestamp - 100;
    this.touchHistory = this.touchHistory.filter(t => t.timestamp >= cutoff);
  }

  private handleMouseUp(_event: MouseEvent): void {
    if (!this.touchStart || this.touchHistory.length === 0) {return;}

    this.clearLongPressTimer();

    const lastTouch = this.touchHistory[this.touchHistory.length - 1];
    if (!lastTouch) {return;}

    const deltaX = lastTouch.x - this.touchStart.x;
    const deltaY = lastTouch.y - this.touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = lastTouch.timestamp - this.touchStart.timestamp;

    if (distance < this.options.swipeThreshold && duration < 300) {
      this.options.onTap(lastTouch.x, lastTouch.y);
    } else if (distance >= this.options.swipeThreshold) {
      const velocity = this.calculateVelocity();
      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.options.onSwipe(direction, velocity);
    }

    this.reset();
  }

  private handleMouseLeave(): void {
    this.clearLongPressTimer();
    this.reset();
  }

  private startLongPressTimer(x: number, y: number): void {
    this.longPressTimer = window.setTimeout(() => {
      this.isLongPress = true;
      this.options.onLongPress(x, y);
    }, this.options.longPressDelay);
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private calculateVelocity(): number {
    if (this.touchHistory.length < 2) {return 0;}

    const recent = this.touchHistory.slice(-3); // Use last 3 points
    const first = recent[0];
    const last = recent[recent.length - 1];

    if (!first || !last) {return 0;}

    const deltaX = last.x - first.x;
    const deltaY = last.y - first.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = (last.timestamp - first.timestamp) / 1000; // Convert to seconds

    return time > 0 ? distance / time : 0;
  }

  private getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check for circular motion (for wheel spinning)
    if (this.isCircularMotion()) {
      return deltaX > 0 ? SwipeDirection.Clockwise : SwipeDirection.CounterClockwise;
    }

    // Linear swipe detection
    if (absX > absY) {
      return deltaX > 0 ? SwipeDirection.Right : SwipeDirection.Left;
    } else {
      return deltaY > 0 ? SwipeDirection.Down : SwipeDirection.Up;
    }
  }

  private isCircularMotion(): boolean {
    if (this.touchHistory.length < 3) {return false;}

    // Simple heuristic: check if the touch path curves
    const points = this.touchHistory.slice(-5); // Use last 5 points
    if (points.length < 3) {return false;}

    // Calculate the center of the element
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Check if points are roughly equidistant from center and follow a curved path
    const distances: number[] = [];

    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2),
      );
      distances.push(distance);
    }

    // Check if distances are relatively consistent (within 20% variance)
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    return (stdDev / avgDistance) < 0.2; // Less than 20% variance suggests circular motion
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const deltaX = touch1.clientX - touch2.clientX;
    const deltaY = touch1.clientY - touch2.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  private getCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }

  private reset(): void {
    this.touchStart = null;
    this.touchHistory = [];
    this.initialPinchDistance = 0;
    this.isLongPress = false;
  }

  public dispose(): void {
    this.clearLongPressTimer();
    
    // Remove all event listeners
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));

    this.reset();
  }
}