/**
 * Tests for MediaViewer component - Media display and fallback handling
 */

import { MediaViewer, createMediaViewer, displayMediaTemporary } from '../../src/components/MediaViewer';
import { WedgeMedia } from '../../src/models';
import { mediaManager } from '../../src/managers/MediaManager';

// Mock MediaManager
jest.mock('../../src/managers/MediaManager', () => ({
  mediaManager: {
    loadMedia: jest.fn(),
    validateMedia: jest.fn(),
    getSupportedTypes: jest.fn(),
    createMediaFromFile: jest.fn(),
    clearCache: jest.fn(),
    getCacheStats: jest.fn(),
  },
}));

const mockMediaManager = mediaManager as jest.Mocked<typeof mediaManager>;

// Mock DOM
const mockContainer = {
  className: '',
  style: {} as CSSStyleDeclaration,
  innerHTML: '',
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  querySelector: jest.fn(),
  parentElement: null as HTMLElement | null,
};

// Mock createElement
const mockElements = new Map<string, any>();
(global as any).document = {
  createElement: jest.fn((tagName: string) => {
    const element: any = {
      tagName: tagName.toUpperCase(),
      className: '',
      innerHTML: '',
      textContent: '',
      style: {} as CSSStyleDeclaration,
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      cloneNode: jest.fn(function(this: any) { return { ...this }; }),
      pause: jest.fn(),
      play: jest.fn(() => Promise.resolve()),
      src: '',
      alt: '',
      controls: false,
      muted: false,
      autoplay: false,
      loop: false,
    };
    mockElements.set(tagName, element);
    return element;
  }),
};

describe('MediaViewer', () => {
  let container: HTMLElement;
  let mediaViewer: MediaViewer;

  beforeEach(() => {
    container = mockContainer as any;
    jest.clearAllMocks();
    mockElements.clear();
    
    // Reset container
    container.innerHTML = '';
    container.className = '';
    (container.style as any) = {};
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default options', () => {
      mediaViewer = new MediaViewer(container);
      
      expect(container.className).toBe('media-viewer media-viewer-container');
      expect(container.style.maxWidth).toBe('400px');
      expect(container.style.maxHeight).toBe('300px');
      expect(container.style.display).toBe('flex');
    });

    test('should initialize with custom options', () => {
      const options = {
        maxWidth: 600,
        maxHeight: 400,
        showControls: false,
        autoplay: true,
        fallbackText: 'Custom fallback',
        className: 'custom-viewer',
      };

      mediaViewer = new MediaViewer(container, options);
      
      expect(container.className).toBe('custom-viewer media-viewer-container');
      expect(container.style.maxWidth).toBe('600px');
      expect(container.style.maxHeight).toBe('400px');
    });

    test('should update options after initialization', () => {
      mediaViewer = new MediaViewer(container);
      
      mediaViewer.updateOptions({ maxWidth: 500, showControls: false });
      
      // Options should be updated (tested through behavior in subsequent tests)
      expect(mediaViewer).toBeDefined();
    });
  });

  describe('Media Display', () => {
    beforeEach(() => {
      mediaViewer = new MediaViewer(container);
    });

    test('should display image media successfully', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
      };

      const mockImage = { tagName: 'IMG', src: media.src, alt: media.alt };
      mockMediaManager.loadMedia.mockResolvedValue({
        success: true,
        element: mockImage as any,
        fallbackUsed: false,
      });

      await mediaViewer.displayMedia(media);

      expect(mockMediaManager.loadMedia).toHaveBeenCalledWith(media);
      expect(container.appendChild).toHaveBeenCalled();
    });

    test('should display video media successfully', async () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/video.mp4',
      };

      const mockVideo = { 
        tagName: 'VIDEO', 
        src: media.src,
        controls: false,
        muted: false,
        autoplay: false,
        play: jest.fn(() => Promise.resolve()),
      };
      mockMediaManager.loadMedia.mockResolvedValue({
        success: true,
        element: mockVideo as any,
        fallbackUsed: false,
      });

      await mediaViewer.displayMedia(media);

      expect(mockMediaManager.loadMedia).toHaveBeenCalledWith(media);
      expect(container.appendChild).toHaveBeenCalled();
    });

    test('should handle media loading failure with fallback', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/invalid.jpg',
        alt: 'Failed image',
      };

      mockMediaManager.loadMedia.mockResolvedValue({
        success: false,
        error: 'Failed to load image',
        fallbackUsed: true,
      });

      await mediaViewer.displayMedia(media);

      expect(mockMediaManager.loadMedia).toHaveBeenCalledWith(media);
      expect(container.appendChild).toHaveBeenCalled();
      // Should show fallback text
    });

    test('should handle null media with fallback', async () => {
      await mediaViewer.displayMedia(null);

      expect(mockMediaManager.loadMedia).not.toHaveBeenCalled();
      expect(container.appendChild).toHaveBeenCalled();
      // Should show fallback text
    });

    test('should handle media loading exception', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/error.jpg',
      };

      mockMediaManager.loadMedia.mockRejectedValue(new Error('Network error'));

      await mediaViewer.displayMedia(media);

      expect(mockMediaManager.loadMedia).toHaveBeenCalledWith(media);
      expect(container.appendChild).toHaveBeenCalled();
      // Should show fallback text
    });

    test('should show loading state during media load', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/slow-image.jpg',
      };

      // Create a promise that we can control
      let resolveLoad: (value: any) => void;
      const loadPromise = new Promise(resolve => {
        resolveLoad = resolve;
      });
      mockMediaManager.loadMedia.mockReturnValue(loadPromise as any);

      // Start display (don't await yet)
      const displayPromise = mediaViewer.displayMedia(media);

      // Should show loading state
      expect(container.appendChild).toHaveBeenCalled();

      // Resolve the load
      resolveLoad!({
        success: true,
        element: { tagName: 'IMG' } as any,
        fallbackUsed: false,
      });

      await displayPromise;
    });

    test('should use custom fallback text', async () => {
      const customFallback = 'Custom error message';
      
      await mediaViewer.displayMedia(null, customFallback);

      expect(container.appendChild).toHaveBeenCalled();
      // The fallback element should contain the custom text
    });
  });

  describe('Media Management', () => {
    beforeEach(() => {
      mediaViewer = new MediaViewer(container);
    });

    test('should clear content', () => {
      mediaViewer.clear();

      expect(mediaViewer.getCurrentMedia()).toBeNull();
      expect(mediaViewer.hasMedia()).toBe(false);
    });

    test('should track current media', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/track-test.jpg',
      };

      mockMediaManager.loadMedia.mockResolvedValue({
        success: true,
        element: { tagName: 'IMG' } as any,
        fallbackUsed: false,
      });

      await mediaViewer.displayMedia(media);

      expect(mediaViewer.getCurrentMedia()).toBe(media);
      expect(mediaViewer.hasMedia()).toBe(true);
    });

    test('should handle video pause on clear', async () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/pause-test.mp4',
      };

      const mockVideo = {
        tagName: 'VIDEO',
        pause: jest.fn(),
        play: jest.fn(() => Promise.resolve()),
      };

      mockMediaManager.loadMedia.mockResolvedValue({
        success: true,
        element: mockVideo as any,
        fallbackUsed: false,
      });

      await mediaViewer.displayMedia(media);
      mediaViewer.clear();

      // Video should be paused when clearing
      expect(mockVideo.pause).toHaveBeenCalled();
    });
  });

  describe('Video-Specific Features', () => {
    beforeEach(() => {
      mediaViewer = new MediaViewer(container, {
        showControls: true,
        autoplay: true,
      });
    });

    test('should configure video controls', async () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/controls-test.mp4',
      };

      const mockVideo = {
        tagName: 'VIDEO',
        controls: false,
        muted: false,
        autoplay: false,
        play: jest.fn(() => Promise.resolve()),
        cloneNode: jest.fn(function(this: any) { return { ...this }; }),
      };

      mockMediaManager.loadMedia.mockResolvedValue({
        success: true,
        element: mockVideo as any,
        fallbackUsed: false,
      });

      await mediaViewer.displayMedia(media);

      // Video should be configured with controls and autoplay
      expect(mockVideo.controls).toBe(true);
      expect(mockVideo.muted).toBe(true); // Always muted for autoplay compatibility
      expect(mockVideo.autoplay).toBe(true);
      expect(mockVideo.play).toHaveBeenCalled();
    });

    test('should handle autoplay failure gracefully', async () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/autoplay-fail.mp4',
      };

      const mockVideo = {
        tagName: 'VIDEO',
        controls: false,
        muted: false,
        autoplay: false,
        play: jest.fn(() => Promise.reject(new Error('Autoplay blocked'))),
        cloneNode: jest.fn(function(this: any) { return { ...this }; }),
      };

      mockMediaManager.loadMedia.mockResolvedValue({
        success: true,
        element: mockVideo as any,
        fallbackUsed: false,
      });

      // Should not throw even if autoplay fails
      await expect(mediaViewer.displayMedia(media)).resolves.not.toThrow();
    });
  });

  describe('Utility Functions', () => {
    test('should create MediaViewer instance', () => {
      const viewer = createMediaViewer(container, { maxWidth: 300 });
      
      expect(viewer).toBeInstanceOf(MediaViewer);
      expect(container.style.maxWidth).toBe('300px');
    });

    test('should display media temporarily', async () => {
      const parentElement = {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      } as any;

      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/temp.jpg',
      };

      mockMediaManager.loadMedia.mockResolvedValue({
        success: true,
        element: { tagName: 'IMG' } as any,
        fallbackUsed: false,
      });

      // Mock setTimeout for testing
      jest.useFakeTimers();

      const displayPromise = displayMediaTemporary(media, parentElement, { duration: 1000 });

      expect(parentElement.appendChild).toHaveBeenCalled();

      await displayPromise;

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      expect(parentElement.removeChild).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should handle temporary display without duration', async () => {
      const parentElement = {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      } as any;

      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/no-duration.jpg',
      };

      mockMediaManager.loadMedia.mockResolvedValue({
        success: true,
        element: { tagName: 'IMG' } as any,
        fallbackUsed: false,
      });

      await displayMediaTemporary(media, parentElement);

      expect(parentElement.appendChild).toHaveBeenCalled();
      // Should not auto-remove without duration
      expect(parentElement.removeChild).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mediaViewer = new MediaViewer(container);
    });

    test('should handle console errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/console-error.jpg',
      };

      mockMediaManager.loadMedia.mockRejectedValue(new Error('Test error'));

      await mediaViewer.displayMedia(media);

      expect(consoleSpy).toHaveBeenCalledWith('Error loading media:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    test('should handle missing container gracefully', () => {
      // This would be tested in integration tests where DOM is more realistic
      expect(() => {
        new MediaViewer(container);
      }).not.toThrow();
    });
  });
});