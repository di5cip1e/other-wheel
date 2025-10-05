/**
 * MediaManager - Handles image and video content for wedges
 * Provides loading, validation, caching, and error handling for media content
 */

import { WedgeMedia } from '../models';

export interface MediaLoadResult {
  success: boolean;
  element?: HTMLImageElement | HTMLVideoElement;
  error?: string;
  fallbackUsed: boolean;
}

export interface MediaValidationResult {
  isValid: boolean;
  error?: string;
  suggestedType?: 'image' | 'video' | 'text';
}

export interface MediaCacheEntry {
  element: HTMLImageElement | HTMLVideoElement;
  loadedAt: number;
  size: number;
}

export class MediaManager {
  private cache = new Map<string, MediaCacheEntry>();
  private loadingPromises = new Map<string, Promise<MediaLoadResult>>();
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private readonly supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  private readonly supportedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB per file

  /**
   * Load media content with caching and error handling
   */
  async loadMedia(media: WedgeMedia): Promise<MediaLoadResult> {
    if (!media || !media.src) {
      return {
        success: false,
        error: 'No media source provided',
        fallbackUsed: true,
      };
    }

    // Check cache first
    const cached = this.cache.get(media.src);
    if (cached) {
      return {
        success: true,
        element: cached.element,
        fallbackUsed: false,
      };
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(media.src);
    if (existingPromise) {
      return existingPromise;
    }

    // Start new load
    const loadPromise = this.performLoad(media);
    this.loadingPromises.set(media.src, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(media.src);
      return result;
    } catch (error) {
      this.loadingPromises.delete(media.src);
      throw error;
    }
  }

  /**
   * Validate media URL and type
   */
  validateMedia(media: WedgeMedia): MediaValidationResult {
    if (!media || !media.src) {
      return {
        isValid: false,
        error: 'Media source is required',
      };
    }

    // Check if it's a data URL
    if (media.src.startsWith('data:')) {
      return this.validateDataUrl(media);
    }

    // Check if it's a valid URL
    try {
      new URL(media.src);
    } catch {
      return {
        isValid: false,
        error: 'Invalid URL format',
      };
    }

    // Validate type consistency
    if (media.type === 'image' && !this.isLikelyImageUrl(media.src)) {
      return {
        isValid: false,
        error: 'URL does not appear to be an image',
        suggestedType: this.guessTypeFromUrl(media.src),
      };
    }

    if (media.type === 'video' && !this.isLikelyVideoUrl(media.src)) {
      return {
        isValid: false,
        error: 'URL does not appear to be a video',
        suggestedType: this.guessTypeFromUrl(media.src),
      };
    }

    return { isValid: true };
  }

  /**
   * Get supported file types for upload
   */
  getSupportedTypes(): { images: string[]; videos: string[] } {
    return {
      images: [...this.supportedImageTypes],
      videos: [...this.supportedVideoTypes],
    };
  }

  /**
   * Create media from file upload
   */
  async createMediaFromFile(file: File): Promise<WedgeMedia> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${this.maxFileSize / 1024 / 1024}MB)`);
    }

    // Determine type
    let type: 'image' | 'video';
    if (this.supportedImageTypes.includes(file.type)) {
      type = 'image';
    } else if (this.supportedVideoTypes.includes(file.type)) {
      type = 'video';
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Convert to data URL
    const dataUrl = await this.fileToDataUrl(file);

    return {
      type,
      src: dataUrl,
      alt: file.name,
    };
  }

  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; estimatedSize: number } {
    let estimatedSize = 0;
    for (const entry of this.cache.values()) {
      estimatedSize += entry.size;
    }

    return {
      entries: this.cache.size,
      estimatedSize,
    };
  }

  private async performLoad(media: WedgeMedia): Promise<MediaLoadResult> {
    try {
      let element: HTMLImageElement | HTMLVideoElement;

      if (media.type === 'image') {
        element = await this.loadImage(media.src, media.alt);
      } else if (media.type === 'video') {
        element = await this.loadVideo(media.src);
      } else {
        return {
          success: false,
          error: 'Unsupported media type',
          fallbackUsed: true,
        };
      }

      // Add to cache
      this.addToCache(media.src, element);

      return {
        success: true,
        element,
        fallbackUsed: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error loading media',
        fallbackUsed: true,
      };
    }
  }

  private loadImage(src: string, alt?: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      
      if (alt) {
        img.alt = alt;
      }
      
      // Set a timeout for loading
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error('Image load timeout'));
        }
      }, 10000); // 10 second timeout
      
      img.src = src;
    });
  }

  private loadVideo(src: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadeddata = () => resolve(video);
      video.onerror = () => reject(new Error('Failed to load video'));
      
      // Set video properties
      video.preload = 'metadata';
      video.muted = true; // Required for autoplay in most browsers
      
      // Set a timeout for loading
      setTimeout(() => {
        if (video.readyState < 2) { // HAVE_CURRENT_DATA
          reject(new Error('Video load timeout'));
        }
      }, 15000); // 15 second timeout for videos
      
      video.src = src;
    });
  }

  private addToCache(src: string, element: HTMLImageElement | HTMLVideoElement): void {
    // Estimate size (rough approximation)
    let estimatedSize = 0;
    if (element instanceof HTMLImageElement) {
      estimatedSize = element.naturalWidth * element.naturalHeight * 4; // Assume 4 bytes per pixel
    } else if (element instanceof HTMLVideoElement) {
      estimatedSize = element.videoWidth * element.videoHeight * 4 * 30; // Rough estimate for video
    }

    // Check if we need to clear cache
    this.ensureCacheSpace(estimatedSize);

    this.cache.set(src, {
      element,
      loadedAt: Date.now(),
      size: estimatedSize,
    });
  }

  private ensureCacheSpace(requiredSize: number): void {
    let currentSize = 0;
    for (const entry of this.cache.values()) {
      currentSize += entry.size;
    }

    if (currentSize + requiredSize <= this.maxCacheSize) {
      return;
    }

    // Remove oldest entries until we have space
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.loadedAt - b.loadedAt);

    for (const [key, entry] of entries) {
      this.cache.delete(key);
      currentSize -= entry.size;
      
      if (currentSize + requiredSize <= this.maxCacheSize) {
        break;
      }
    }
  }

  private validateDataUrl(media: WedgeMedia): MediaValidationResult {
    const match = media.src.match(/^data:([^;]+);base64,/);
    if (!match || !match[1]) {
      return {
        isValid: false,
        error: 'Invalid data URL format',
      };
    }

    const mimeType = match[1];
    
    if (media.type === 'image' && !this.supportedImageTypes.includes(mimeType)) {
      return {
        isValid: false,
        error: `Unsupported image type: ${mimeType}`,
      };
    }

    if (media.type === 'video' && !this.supportedVideoTypes.includes(mimeType)) {
      return {
        isValid: false,
        error: `Unsupported video type: ${mimeType}`,
      };
    }

    return { isValid: true };
  }

  private isLikelyImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  }

  private isLikelyVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  }

  private guessTypeFromUrl(url: string): 'image' | 'video' | 'text' {
    if (this.isLikelyImageUrl(url)) {return 'image';}
    if (this.isLikelyVideoUrl(url)) {return 'video';}
    return 'text';
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}

// Singleton instance
export const mediaManager = new MediaManager();