/**
 * Tests for TouchGestureHandler
 */

import { TouchGestureHandler, SwipeDirection } from '../../src/utils/TouchGestureHandler';

describe('TouchGestureHandler', () => {
  let touchHandler: TouchGestureHandler;
  let element: HTMLElement;
  let mockCallbacks: {
    onSwipe: jest.Mock;
    onTap: jest.Mock;
    onLongPress: jest.Mock;
    onPinch: jest.Mock;
  };

  beforeEach(() => {
    element = document.createElement('div');
    element.style.width = '300px';
    element.style.height = '300px';
    element.style.position = 'absolute';
    element.style.top = '100px';
    element.style.left = '100px';
    document.body.appendChild(element);

    mockCallbacks = {
      onSwipe: jest.fn(),
      onTap: jest.fn(),
      onLongPress: jest.fn(),
      onPinch: jest.fn(),
    };

    touchHandler = new TouchGestureHandler({
      element,
      ...mockCallbacks,
      swipeThreshold: 50,
      longPressDelay: 500,
    });
  });

  afterEach(() => {
    touchHandler.dispose();
    document.body.removeChild(element);
  });

  describe('Touch Events', () => {
    test('should detect tap gesture', () => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(155, 155)],
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onTap).toHaveBeenCalledWith(155, 155);
      expect(mockCallbacks.onSwipe).not.toHaveBeenCalled();
    });

    test('should detect horizontal swipe right', () => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [createTouch(220, 150)],
      });
      element.dispatchEvent(moveEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(220, 150)],
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).toHaveBeenCalledWith(
        SwipeDirection.Right,
        expect.any(Number),
      );
      expect(mockCallbacks.onTap).not.toHaveBeenCalled();
    });

    test('should detect horizontal swipe left', () => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(220, 150)],
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(moveEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(150, 150)],
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).toHaveBeenCalledWith(
        SwipeDirection.Left,
        expect.any(Number),
      );
    });

    test('should detect vertical swipe up', () => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 220)],
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(moveEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(150, 150)],
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).toHaveBeenCalledWith(
        SwipeDirection.Up,
        expect.any(Number),
      );
    });

    test('should detect vertical swipe down', () => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [createTouch(150, 220)],
      });
      element.dispatchEvent(moveEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(150, 220)],
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).toHaveBeenCalledWith(
        SwipeDirection.Down,
        expect.any(Number),
      );
    });

    test('should detect long press', (done) => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      setTimeout(() => {
        expect(mockCallbacks.onLongPress).toHaveBeenCalledWith(150, 150);
        done();
      }, 600);
    });

    test('should cancel long press on movement', (done) => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      setTimeout(() => {
        const moveEvent = new TouchEvent('touchmove', {
          touches: [createTouch(180, 150)],
        });
        element.dispatchEvent(moveEvent);
      }, 200);

      setTimeout(() => {
        expect(mockCallbacks.onLongPress).not.toHaveBeenCalled();
        done();
      }, 600);
    });

    test('should detect pinch gesture', () => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(140, 150), createTouch(160, 150)],
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [createTouch(130, 150), createTouch(170, 150)],
      });
      element.dispatchEvent(moveEvent);

      expect(mockCallbacks.onPinch).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
      );
    });

    test('should handle touch cancel', () => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      const cancelEvent = new TouchEvent('touchcancel');
      element.dispatchEvent(cancelEvent);

      // Should not trigger any callbacks after cancel
      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(220, 150)],
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).not.toHaveBeenCalled();
      expect(mockCallbacks.onTap).not.toHaveBeenCalled();
    });
  });

  describe('Mouse Events (Desktop Compatibility)', () => {
    test('should detect mouse tap', () => {
      const startEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 150,
        button: 0,
      });
      element.dispatchEvent(startEvent);

      const endEvent = new MouseEvent('mouseup', {
        clientX: 155,
        clientY: 155,
        button: 0,
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onTap).toHaveBeenCalledWith(155, 155);
    });

    test('should detect mouse swipe', () => {
      const startEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 150,
        button: 0,
      });
      element.dispatchEvent(startEvent);

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 220,
        clientY: 150,
      });
      element.dispatchEvent(moveEvent);

      const endEvent = new MouseEvent('mouseup', {
        clientX: 220,
        clientY: 150,
        button: 0,
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).toHaveBeenCalledWith(
        SwipeDirection.Right,
        expect.any(Number),
      );
    });

    test('should ignore non-left mouse buttons', () => {
      const startEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 150,
        button: 1, // Middle button
      });
      element.dispatchEvent(startEvent);

      const endEvent = new MouseEvent('mouseup', {
        clientX: 155,
        clientY: 155,
        button: 1,
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onTap).not.toHaveBeenCalled();
    });

    test('should handle mouse leave', () => {
      const startEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 150,
        button: 0,
      });
      element.dispatchEvent(startEvent);

      const leaveEvent = new MouseEvent('mouseleave');
      element.dispatchEvent(leaveEvent);

      // Should not trigger callbacks after mouse leave
      const endEvent = new MouseEvent('mouseup', {
        clientX: 220,
        clientY: 150,
        button: 0,
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).not.toHaveBeenCalled();
    });
  });

  describe('Circular Motion Detection', () => {
    test('should detect clockwise circular motion', () => {
      // Simulate circular motion around the center of the element
      const centerX = 250; // element left (100) + width/2 (150)
      const centerY = 250; // element top (100) + height/2 (150)
      const radius = 80;

      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(centerX + radius, centerY)],
      });
      element.dispatchEvent(startEvent);

      // Simulate circular path
      const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI];
      angles.forEach(angle => {
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        const moveEvent = new TouchEvent('touchmove', {
          touches: [createTouch(x, y)],
        });
        element.dispatchEvent(moveEvent);
      });

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(centerX - radius, centerY)],
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).toHaveBeenCalledWith(
        SwipeDirection.Clockwise,
        expect.any(Number),
      );
    });
  });

  describe('Velocity Calculation', () => {
    test('should calculate velocity correctly', () => {
      const startTime = Date.now();
      
      // Mock Date.now to control timing
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      // Move 100 pixels in 100ms
      mockNow.mockReturnValue(startTime + 50);
      const moveEvent1 = new TouchEvent('touchmove', {
        touches: [createTouch(175, 150)],
      });
      element.dispatchEvent(moveEvent1);

      mockNow.mockReturnValue(startTime + 100);
      const moveEvent2 = new TouchEvent('touchmove', {
        touches: [createTouch(200, 150)],
      });
      element.dispatchEvent(moveEvent2);

      mockNow.mockReturnValue(startTime + 150);
      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(250, 150)],
      });
      element.dispatchEvent(endEvent);

      expect(mockCallbacks.onSwipe).toHaveBeenCalledWith(
        SwipeDirection.Right,
        expect.any(Number),
      );

      const velocity = mockCallbacks.onSwipe.mock.calls[0][1];
      expect(velocity).toBeGreaterThan(0);

      mockNow.mockRestore();
    });
  });

  describe('Configuration Options', () => {
    test('should respect custom swipe threshold', () => {
      touchHandler.dispose();
      
      touchHandler = new TouchGestureHandler({
        element,
        ...mockCallbacks,
        swipeThreshold: 100, // Higher threshold
      });

      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      const endEvent = new TouchEvent('touchend', {
        changedTouches: [createTouch(190, 150)], // Only 40px movement
      });
      element.dispatchEvent(endEvent);

      // Should be treated as tap, not swipe
      expect(mockCallbacks.onTap).toHaveBeenCalled();
      expect(mockCallbacks.onSwipe).not.toHaveBeenCalled();
    });

    test('should respect custom long press delay', (done) => {
      touchHandler.dispose();
      
      touchHandler = new TouchGestureHandler({
        element,
        ...mockCallbacks,
        longPressDelay: 200, // Shorter delay
      });

      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      setTimeout(() => {
        expect(mockCallbacks.onLongPress).toHaveBeenCalled();
        done();
      }, 250);
    });

    test('should prevent default when configured', () => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      
      const preventDefaultSpy = jest.spyOn(startEvent, 'preventDefault');
      element.dispatchEvent(startEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should not prevent default when configured to false', () => {
      touchHandler.dispose();
      
      touchHandler = new TouchGestureHandler({
        element,
        ...mockCallbacks,
        preventDefault: false,
      });

      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      
      const preventDefaultSpy = jest.spyOn(startEvent, 'preventDefault');
      element.dispatchEvent(startEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Context Menu Prevention', () => {
    test('should prevent context menu on long press', (done) => {
      const startEvent = new TouchEvent('touchstart', {
        touches: [createTouch(150, 150)],
      });
      element.dispatchEvent(startEvent);

      setTimeout(() => {
        const contextMenuEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
        });
        
        const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');
        element.dispatchEvent(contextMenuEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
        done();
      }, 600);
    });
  });

  // Helper function to create touch objects
  function createTouch(clientX: number, clientY: number): Touch {
    return {
      identifier: 0,
      target: element,
      clientX,
      clientY,
      pageX: clientX,
      pageY: clientY,
      screenX: clientX,
      screenY: clientY,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    } as Touch;
  }
});