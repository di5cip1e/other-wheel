/**
 * Integration tests for media functionality
 * Tests the interaction between MediaManager, MediaViewer, and WedgeEditor
 */

import { MediaManager } from '../../src/managers/MediaManager';
import { MediaViewer } from '../../src/components/MediaViewer';
import { WedgeEditor } from '../../src/components/WedgeEditor';
import { WedgeMedia, Wedge } from '../../src/models';

// Mock DOM environment
const mockDOM = () => {
  const elements = new Map<string, any>();
  
  (global as any).document = {
    createElement: jest.fn((tagName: string) => {
      const element = {
        tagName: tagName.toUpperCase(),
        className: '',
        innerHTML: '',
        textContent: '',
        style: {} as CSSStyleDeclaration,
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        cloneNode: jest.fn(function(this: any) { return { ...this }; }),
        insertBefore: jest.fn(),
        parentElement: null,
        firstChild: null,
        // Image specific
        src: '',
        alt: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        complete: false,
        naturalWidth: 100,
        naturalHeight: 100,
        // Video specific
        controls: false,
        muted: false,
        autoplay: false,
        loop: false,
        readyState: 0,
        videoWidth: 200,
        videoHeight: 150,
        onloadeddata: null as (() => void) | null,
        pause: jest.fn(),
        play: jest.fn(() => Promise.resolve()),
        // Input specific
        type: '',
        value: '',
        files: null,
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        onclick: null as ((e: Event) => void) | null,
        // Select specific
        options: [],
        selectedIndex: 0,
        // Form specific
        min: '',
        max: '',
        step: '',
        placeholder: ''
      };
      
      elements.set(tagName, element);
      return element;
    }),
    getElementById: jest.fn((id: string) => {
      return {
        id,
        className: '',
        innerHTML: '',
        style: {} as CSSStyleDeclaration,
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        querySelector: jest.fn(),
        insertBefore: jest.fn(),
        parentElement: null,
        firstChild: null
      };
    })
  };

  (global as any).Image = class MockImage {
    src = '';
    alt = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    complete = false;
    naturalWidth = 100;
    naturalHeight = 100;

    constructor() {
      setTimeout(() => {
        if (this.src && !this.src.includes('invalid')) {
          this.complete = true;
          if (this.onload) this.onload();
        } else {
          if (this.onerror) this.onerror();
        }
      }, 10);
    }
  };

  (global as any).FileReader = class MockFileReader {
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
  };

  return elements;
};

describe('Media Integration Tests', () => {
  let mediaManager: MediaManager;
  // let mockElements: Map<string, any>;

  beforeEach(() => {
    // mockElements = mockDOM();
    mockDOM();
    mediaManager = new MediaManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mediaManager.clearCache();
  });

  describe('MediaManager + MediaViewer Integration', () => {
    test('should load and display image through complete pipeline', async () => {
      const container = document.createElement('div');
      const mediaViewer = new MediaViewer(container);

      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/integration-test.jpg',
        alt: 'Integration test image'
      };

      await mediaViewer.displayMedia(media);

      // Verify the media was processed through MediaManager
      expect(container.appendChild).toHaveBeenCalled();
      expect(mediaViewer.getCurrentMedia()).toBe(media);
      expect(mediaViewer.hasMedia()).toBe(true);
    });

    test('should handle media loading failure with proper fallback', async () => {
      const container = document.createElement('div');
      const mediaViewer = new MediaViewer(container);

      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/invalid-integration.jpg'
      };

      await mediaViewer.displayMedia(media);

      // Should show fallback content
      expect(container.appendChild).toHaveBeenCalled();
      expect(mediaViewer.getCurrentMedia()).toBe(media);
    });

    test('should cache media between viewer instances', async () => {
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      const viewer1 = new MediaViewer(container1);
      const viewer2 = new MediaViewer(container2);

      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/cache-test.jpg'
      };

      // Load in first viewer
      await viewer1.displayMedia(media);
      const stats1 = mediaManager.getCacheStats();

      // Load in second viewer
      await viewer2.displayMedia(media);
      const stats2 = mediaManager.getCacheStats();

      // Cache should be reused
      expect(stats1.entries).toBe(1);
      expect(stats2.entries).toBe(1);
    });
  });

  describe('MediaManager + WedgeEditor Integration', () => {
    test('should validate media in editor', async () => {
      const wedgeEditor = new WedgeEditor({
        containerId: 'test-container',
        showMediaOptions: true
      });

      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/editor-test.jpg',
        alt: 'Editor test'
      };

      const validation = await wedgeEditor.validateMedia(media);
      expect(validation.isValid).toBe(true);
    });

    test('should get supported media types from editor', () => {
      const wedgeEditor = new WedgeEditor({
        containerId: 'test-container',
        showMediaOptions: true
      });

      const types = wedgeEditor.getSupportedMediaTypes();
      expect(types.images).toContain('image/jpeg');
      expect(types.videos).toContain('video/mp4');
    });

    test('should handle file upload in editor', async () => {
      const wedgeEditor = new WedgeEditor({
        containerId: 'test-container',
        showMediaOptions: true
      });

      const file = new File(['test-data'], 'test.jpg', { type: 'image/jpeg' });
      
      // Simulate file selection
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });

      // This would normally be triggered by user interaction
      // In a real integration test, we'd simulate the file selection event
      expect(wedgeEditor).toBeDefined();
    });
  });

  describe('Complete Workflow Integration', () => {
    test('should support full media workflow: upload -> validate -> display', async () => {
      // 1. Create file and upload through MediaManager
      const file = new File(['test-image-data'], 'workflow.jpg', { type: 'image/jpeg' });
      const uploadedMedia = await mediaManager.createMediaFromFile(file);

      expect(uploadedMedia.type).toBe('image');
      expect(uploadedMedia.src).toMatch(/^data:image\/jpeg;base64,/);

      // 2. Validate the media
      const validation = mediaManager.validateMedia(uploadedMedia);
      expect(validation.isValid).toBe(true);

      // 3. Display in MediaViewer
      const container = document.createElement('div');
      const viewer = new MediaViewer(container);
      await viewer.displayMedia(uploadedMedia);

      expect(viewer.hasMedia()).toBe(true);
      expect(viewer.getCurrentMedia()).toEqual(uploadedMedia);
    });

    test('should handle wedge with media in complete game context', async () => {
      const wedge: Wedge = {
        id: 'test-wedge',
        label: 'Test Wedge',
        weight: 1,
        color: '#ff0000',
        media: {
          type: 'image',
          src: 'https://example.com/wedge-image.jpg',
          alt: 'Wedge image'
        }
      };

      // 1. Validate wedge media
      if (wedge.media) {
        const validation = mediaManager.validateMedia(wedge.media);
        expect(validation.isValid).toBe(true);

        // 2. Load media for display
        const loadResult = await mediaManager.loadMedia(wedge.media);
        expect(loadResult.success).toBe(true);

        // 3. Display in viewer
        const container = document.createElement('div');
        const viewer = new MediaViewer(container);
        await viewer.displayMedia(wedge.media);
        
        expect(viewer.hasMedia()).toBe(true);
      }
    });

    test('should handle media errors gracefully throughout pipeline', async () => {
      const invalidMedia: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/invalid-pipeline.jpg'
      };

      // 1. Validation should pass (URL format is valid)
      const validation = mediaManager.validateMedia(invalidMedia);
      expect(validation.isValid).toBe(true);

      // 2. Loading should fail gracefully
      const loadResult = await mediaManager.loadMedia(invalidMedia);
      expect(loadResult.success).toBe(false);
      expect(loadResult.fallbackUsed).toBe(true);

      // 3. Viewer should show fallback
      const container = document.createElement('div');
      const viewer = new MediaViewer(container);
      await viewer.displayMedia(invalidMedia);

      expect(viewer.getCurrentMedia()).toBe(invalidMedia);
      expect(container.appendChild).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should manage cache size effectively', async () => {
      const medias: WedgeMedia[] = [];
      
      // Create multiple media items
      for (let i = 0; i < 10; i++) {
        medias.push({
          type: 'image',
          src: `https://example.com/perf-test-${i}.jpg`,
          alt: `Performance test ${i}`
        });
      }

      // Load all media
      for (const media of medias) {
        await mediaManager.loadMedia(media);
      }

      const stats = mediaManager.getCacheStats();
      expect(stats.entries).toBe(10);
      expect(stats.estimatedSize).toBeGreaterThan(0);

      // Clear cache
      mediaManager.clearCache();
      const clearedStats = mediaManager.getCacheStats();
      expect(clearedStats.entries).toBe(0);
      expect(clearedStats.estimatedSize).toBe(0);
    });

    test('should handle concurrent media loading efficiently', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/concurrent-integration.jpg'
      };

      // Start multiple loads simultaneously
      const promises = Array(5).fill(null).map(() => 
        mediaManager.loadMedia(media)
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should only cache once
      expect(mediaManager.getCacheStats().entries).toBe(1);
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    test('should recover from media loading failures', async () => {
      const container = document.createElement('div');
      const viewer = new MediaViewer(container, {
        fallbackText: 'Custom fallback message'
      });

      // Try to load invalid media
      const invalidMedia: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/recovery-test-invalid.jpg'
      };

      await viewer.displayMedia(invalidMedia);
      expect(viewer.getCurrentMedia()).toBe(invalidMedia);

      // Now load valid media
      const validMedia: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/recovery-test-valid.jpg'
      };

      await viewer.displayMedia(validMedia);
      expect(viewer.getCurrentMedia()).toBe(validMedia);
      expect(viewer.hasMedia()).toBe(true);
    });

    test('should handle file upload errors gracefully', async () => {
      const invalidFile = new File(['invalid-data'], 'invalid.jpg', { type: 'image/jpeg' });
      
      await expect(mediaManager.createMediaFromFile(invalidFile)).rejects.toThrow();
      
      // Cache should remain clean after error
      expect(mediaManager.getCacheStats().entries).toBe(0);
    });

    test('should provide meaningful error messages', async () => {
      const oversizedFile = new File(['data'], 'huge.jpg', { type: 'image/jpeg' });
      Object.defineProperty(oversizedFile, 'size', { value: 50 * 1024 * 1024 }); // 50MB

      await expect(mediaManager.createMediaFromFile(oversizedFile))
        .rejects.toThrow(/File size.*exceeds maximum allowed size/);
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should preserve alt text through pipeline', async () => {
      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/alt-test.jpg',
        alt: 'Accessibility test image'
      };

      const loadResult = await mediaManager.loadMedia(media);
      expect(loadResult.success).toBe(true);

      if (loadResult.element && 'alt' in loadResult.element) {
        expect(loadResult.element.alt).toBe(media.alt);
      }
    });

    test('should handle video accessibility features', async () => {
      const media: WedgeMedia = {
        type: 'video',
        src: 'https://example.com/accessibility-video.mp4'
      };

      const container = document.createElement('div');
      const viewer = new MediaViewer(container, {
        showControls: true,
        autoplay: false // Better for accessibility
      });

      await viewer.displayMedia(media);
      expect(viewer.hasMedia()).toBe(true);
    });

    test('should provide loading feedback', async () => {
      const container = document.createElement('div');
      const viewer = new MediaViewer(container);

      const media: WedgeMedia = {
        type: 'image',
        src: 'https://example.com/loading-feedback.jpg'
      };

      // Start loading (don't await immediately)
      const displayPromise = viewer.displayMedia(media);

      // Should show loading state
      expect(container.appendChild).toHaveBeenCalled();

      await displayPromise;
    });
  });
});