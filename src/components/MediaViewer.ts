/**
 * MediaViewer - Component for displaying wedge media during results
 * Handles image and video display with fallback to text
 */

import { WedgeMedia } from '../models';
import { mediaManager } from '../managers/MediaManager';

export interface MediaViewerOptions {
  maxWidth?: number;
  maxHeight?: number;
  showControls?: boolean; // For videos
  autoplay?: boolean; // For videos
  fallbackText?: string;
  className?: string;
}

export class MediaViewer {
  private container: HTMLElement;
  private currentMedia: WedgeMedia | null = null;
  private currentElement: HTMLElement | null = null;
  private options: Required<MediaViewerOptions>;

  constructor(container: HTMLElement, options: MediaViewerOptions = {}) {
    this.container = container;
    this.options = {
      maxWidth: options.maxWidth ?? 400,
      maxHeight: options.maxHeight ?? 300,
      showControls: options.showControls ?? true,
      autoplay: options.autoplay ?? false,
      fallbackText: options.fallbackText ?? 'Media not available',
      className: options.className ?? 'media-viewer'
    };

    this.setupContainer();
  }

  /**
   * Display media content
   */
  async displayMedia(media: WedgeMedia | null, fallbackText?: string): Promise<void> {
    this.currentMedia = media;
    this.clearContent();

    if (!media) {
      this.showFallback(fallbackText || this.options.fallbackText);
      return;
    }

    // Show loading state
    this.showLoading();

    try {
      const result = await mediaManager.loadMedia(media);
      
      if (result.success && result.element) {
        this.showMediaElement(result.element, media);
      } else {
        this.showFallback(result.error || fallbackText || media.alt || this.options.fallbackText);
      }
    } catch (error) {
      console.error('Error loading media:', error);
      this.showFallback(fallbackText || media.alt || this.options.fallbackText);
    }
  }

  /**
   * Clear all content
   */
  clear(): void {
    this.currentMedia = null;
    this.clearContent();
  }

  /**
   * Update viewer options
   */
  updateOptions(options: Partial<MediaViewerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current media
   */
  getCurrentMedia(): WedgeMedia | null {
    return this.currentMedia;
  }

  /**
   * Check if media is currently displayed
   */
  hasMedia(): boolean {
    return this.currentMedia !== null && this.currentElement !== null;
  }

  private setupContainer(): void {
    this.container.className = `${this.options.className} media-viewer-container`;
    this.container.style.maxWidth = `${this.options.maxWidth}px`;
    this.container.style.maxHeight = `${this.options.maxHeight}px`;
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.overflow = 'hidden';
    this.container.style.position = 'relative';
  }

  private clearContent(): void {
    // Pause any videos before clearing
    if (this.currentElement instanceof HTMLVideoElement) {
      this.currentElement.pause();
    }

    this.container.innerHTML = '';
    this.currentElement = null;
  }

  private showLoading(): void {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'media-loading';
    loadingElement.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading media...</div>
    `;
    
    this.container.appendChild(loadingElement);
    this.currentElement = loadingElement;
  }

  private showMediaElement(element: HTMLImageElement | HTMLVideoElement, media: WedgeMedia): void {
    this.clearContent();

    if (element instanceof HTMLImageElement) {
      this.showImage(element, media);
    } else if (element instanceof HTMLVideoElement) {
      this.showVideo(element, media);
    }
  }

  private showImage(img: HTMLImageElement, media: WedgeMedia): void {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'media-image-container';
    
    const displayImg = img.cloneNode(true) as HTMLImageElement;
    
    // Apply size constraints
    this.applyImageSizeConstraints(displayImg);
    
    // Set alt text
    if (media.alt) {
      displayImg.alt = media.alt;
    }
    
    imageContainer.appendChild(displayImg);
    this.container.appendChild(imageContainer);
    this.currentElement = imageContainer;
  }

  private showVideo(video: HTMLVideoElement, _media: WedgeMedia): void {
    const videoContainer = document.createElement('div');
    videoContainer.className = 'media-video-container';
    
    const displayVideo = video.cloneNode(true) as HTMLVideoElement;
    
    // Apply size constraints
    this.applyVideoSizeConstraints(displayVideo);
    
    // Set video properties
    displayVideo.controls = this.options.showControls;
    displayVideo.muted = true; // Keep muted for autoplay compatibility
    displayVideo.loop = false;
    
    // Handle autoplay
    if (this.options.autoplay) {
      displayVideo.autoplay = true;
      // Try to play, but don't fail if it doesn't work
      displayVideo.play().catch(() => {
        // Autoplay failed, that's okay
      });
    }
    
    videoContainer.appendChild(displayVideo);
    this.container.appendChild(videoContainer);
    this.currentElement = videoContainer;
  }

  private showFallback(text: string): void {
    this.clearContent();
    
    const fallbackElement = document.createElement('div');
    fallbackElement.className = 'media-fallback';
    fallbackElement.textContent = text;
    
    this.container.appendChild(fallbackElement);
    this.currentElement = fallbackElement;
  }

  private applyImageSizeConstraints(img: HTMLImageElement): void {
    const { maxWidth, maxHeight } = this.options;
    
    img.style.maxWidth = `${maxWidth}px`;
    img.style.maxHeight = `${maxHeight}px`;
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
  }

  private applyVideoSizeConstraints(video: HTMLVideoElement): void {
    const { maxWidth, maxHeight } = this.options;
    
    video.style.maxWidth = `${maxWidth}px`;
    video.style.maxHeight = `${maxHeight}px`;
    video.style.width = 'auto';
    video.style.height = 'auto';
  }
}

/**
 * Utility function to create a MediaViewer instance
 */
export function createMediaViewer(
  container: HTMLElement, 
  options?: MediaViewerOptions
): MediaViewer {
  return new MediaViewer(container, options);
}

/**
 * Utility function to display media in a temporary viewer
 */
export async function displayMediaTemporary(
  media: WedgeMedia,
  parentElement: HTMLElement,
  options?: MediaViewerOptions & { duration?: number }
): Promise<void> {
  const container = document.createElement('div');
  parentElement.appendChild(container);
  
  const viewer = new MediaViewer(container, options);
  await viewer.displayMedia(media);
  
  // Auto-remove after duration if specified
  if (options?.duration) {
    setTimeout(() => {
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    }, options.duration);
  }
}