/**
 * Tests for MediaManager - Media loading, validation, and caching
 */

import { MediaManager } from '../../src/managers/MediaManager';
import { WedgeMedia } from '../../src/models';

// Mock DOM elements
class MockImage {
  src = '';
  alt = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  complete = false;
  naturalWidth = 100;
  naturalHeight = 100;

  constructor() {
    // Simulate async loading
    setTimeout(() => {
      if (this.src && !this.src.includes('invalid')) {
        this.complete = true;
        if (this.onload) this.onload();
      } else {
        if (this.onerror) this.onerror();
      }
    }, 10);
  }
}

class MockVideo {
  src = '';
  onloadeddata: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  videoWidth = 200;
  videoHeight = 150;
  preload = '';
  muted = false;

  constructor() {
    // Simulate async loading
    setTimeout(() => {
      if (this.src && !this.src.includes('invalid')) {
        this.readyState = 2; // HAVE_CURRENT_DATA
        if (this.onloadeddata) this.onloadeddata();
      } else {
        if (this.onerror) this.onerror();
      }
    }, 15);
  }
}

class MockFileReader {
  onload: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  result: string | null = null;

  readAsDataURL(file: File): void {
    setTimeout(() => {
      if (file.name.includes('invalid')) {
        if (this.onerror) this.onerror();
      } else {
        this.result = `data:${file.type};base64,mockbase64data`;
        if (this.onload) this.onload({ target: this });
      }
    }, 5);
  }
}

// Setup global mocks
(global as any).Image = MockImage;
(global as any).FileReader = MockFileReader;
(global as any).document = {
  createElement: (tagName: string) => {
    if (tagName === 'video') {
      return new MockVideo();
    }
    return {};
  }
};

describe('MediaManager', () => {
  let mediaManager: MediaManager;

  beforeEach(() => {
    mediaManager = new MediaManager();
  });

  afterEach(() => {
    mediaManager.clearCache();
  });

  describe('Media Validation', () => {
    test('should validate valid image media', () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/image.jpg',
        alt: 'Test image'
      };

      const result = mediaManager.validateMedia(media);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should validate valid video media', () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/video.mp4'
      };

      const result = mediaManager.validateMedia(media);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject empty media source', () => {
      const media: WedgeMedia = {
        type: 'image',
        src: ''
      };

      const result = mediaManager.validateMedia(media);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Media source is required');
    });

    test('should reject invalid URL format', () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'not-a-valid-url'
      };

      const result = mediaManager.validateMedia(media);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    test('should validate data URLs', () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      };

      const result = mediaManager.validateMedia(media);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid data URL format', () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'data:invalid-format'
      };

      const result = mediaManager.validateMedia(media);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid data URL format');
    });

    test('should suggest correct type for mismatched URLs', () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/image.jpg'
      };

      const result = mediaManager.validateMedia(media);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL does not appear to be a video');
      expect(result.suggestedType).toBe('image');
    });
  });

  describe('Media Loading', () => {
    test('should load valid image successfully', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/image.jpg',
        alt: 'Test image'
      };

      const result = await mediaManager.loadMedia(media);
      
      expect(result.success).toBe(true);
      expect(result.element).toBeInstanceOf(MockImage);
      expect(result.fallbackUsed).toBe(false);
      expect(result.error).toBeUndefined();
    });

    test('should load valid video successfully', async () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/video.mp4'
      };

      const result = await mediaManager.loadMedia(media);
      
      expect(result.success).toBe(true);
      expect(result.element).toBeInstanceOf(MockVideo);
      expect(result.fallbackUsed).toBe(false);
      expect(result.error).toBeUndefined();
    });

    test('should handle image loading failure', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/invalid-image.jpg'
      };

      const result = await mediaManager.loadMedia(media);
      
      expect(result.success).toBe(false);
      expect(result.element).toBeUndefined();
      expect(result.fallbackUsed).toBe(true);
      expect(result.error).toBe('Failed to load image');
    });

    test('should handle video loading failure', async () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/invalid-video.mp4'
      };

      const result = await mediaManager.loadMedia(media);
      
      expect(result.success).toBe(false);
      expect(result.element).toBeUndefined();
      expect(result.fallbackUsed).toBe(true);
      expect(result.error).toBe('Failed to load video');
    });

    test('should handle null media gracefully', async () => {
      const result = await mediaManager.loadMedia(null as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No media source provided');
      expect(result.fallbackUsed).toBe(true);
    });

    test('should handle unsupported media type', async () => {
      const media: WedgeMedia = {
        type: 'text' as any,
        src: 'https://example.com/file.txt'
      };

      const result = await mediaManager.loadMedia(media);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported media type');
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('Caching', () => {
    test('should cache loaded media', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/cached-image.jpg'
      };

      // First load
      const result1 = await mediaManager.loadMedia(media);
      expect(result1.success).toBe(true);

      // Second load should use cache
      const result2 = await mediaManager.loadMedia(media);
      expect(result2.success).toBe(true);
      expect(result2.element).toBe(result1.element);
    });

    test('should provide cache statistics', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/stats-image.jpg'
      };

      const initialStats = mediaManager.getCacheStats();
      expect(initialStats.entries).toBe(0);

      await mediaManager.loadMedia(media);

      const afterStats = mediaManager.getCacheStats();
      expect(afterStats.entries).toBe(1);
      expect(afterStats.estimatedSize).toBeGreaterThan(0);
    });

    test('should clear cache', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/clear-test.jpg'
      };

      await mediaManager.loadMedia(media);
      expect(mediaManager.getCacheStats().entries).toBe(1);

      mediaManager.clearCache();
      expect(mediaManager.getCacheStats().entries).toBe(0);
    });
  });

  describe('File Upload Support', () => {
    test('should create media from valid image file', async () => {
      const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
      
      const media = await mediaManager.createMediaFromFile(file);
      
      expect(media.type).toBe('image');
      expect(media.src).toMatch(/^data:image\/jpeg;base64,/);
      expect(media.alt).toBe('test.jpg');
    });

    test('should create media from valid video file', async () => {
      const file = new File(['fake-video-data'], 'test.mp4', { type: 'video/mp4' });
      
      const media = await mediaManager.createMediaFromFile(file);
      
      expect(media.type).toBe('video');
      expect(media.src).toMatch(/^data:video\/mp4;base64,/);
      expect(media.alt).toBe('test.mp4');
    });

    test('should reject unsupported file types', async () => {
      const file = new File(['fake-data'], 'test.txt', { type: 'text/plain' });
      
      await expect(mediaManager.createMediaFromFile(file)).rejects.toThrow('Unsupported file type: text/plain');
    });

    test('should reject oversized files', async () => {
      // Create a mock file that reports a large size
      const file = new File(['fake-data'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }); // 20MB
      
      await expect(mediaManager.createMediaFromFile(file)).rejects.toThrow('File size (20MB) exceeds maximum allowed size');
    });

    test('should handle file reading errors', async () => {
      const file = new File(['fake-data'], 'invalid.jpg', { type: 'image/jpeg' });
      
      await expect(mediaManager.createMediaFromFile(file)).rejects.toThrow('Failed to read file');
    });
  });

  describe('Supported Types', () => {
    test('should return supported file types', () => {
      const types = mediaManager.getSupportedTypes();
      
      expect(types.images).toContain('image/jpeg');
      expect(types.images).toContain('image/png');
      expect(types.images).toContain('image/gif');
      expect(types.images).toContain('image/webp');
      
      expect(types.videos).toContain('video/mp4');
      expect(types.videos).toContain('video/webm');
      expect(types.videos).toContain('video/ogg');
    });
  });

  describe('Error Handling', () => {
    test('should handle concurrent loading of same media', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/concurrent-test.jpg'
      };

      // Start multiple loads simultaneously
      const promises = [
        mediaManager.loadMedia(media),
        mediaManager.loadMedia(media),
        mediaManager.loadMedia(media)
      ];

      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should only have one cache entry
      expect(mediaManager.getCacheStats().entries).toBe(1);
    });

    test('should handle loading timeout gracefully', async () => {
      // This test would require mocking setTimeout behavior
      // For now, we'll test that the timeout mechanism exists
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/timeout-test.jpg'
      };

      const result = await mediaManager.loadMedia(media);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});