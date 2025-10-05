/**
 * Basic ThemeControls Tests
 * Tests the theme and audio configuration UI component
 */

import { ThemeControls, ThemeControlsConfig } from '../../src/components/ThemeControls';
import { AudioEngine } from '../../src/engines/AudioEngine';
import { ThemeEngine } from '../../src/engines/ThemeEngine';

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  destination = {};
  currentTime = 0;

  createGain() {
    return {
      gain: { setValueAtTime: jest.fn() },
      connect: jest.fn(),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
    };
  }

  decodeAudioData() {
    return Promise.resolve({ length: 1000, sampleRate: 44100 });
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

// Mock DOM
global.fetch = jest.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000)),
  }),
) as jest.Mock;

(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;

// Mock document methods
const mockElement = {
  id: '',
  innerHTML: '',
  textContent: '',
  remove: jest.fn(),
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  click: jest.fn(),
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockElement),
});

Object.defineProperty(document, 'head', {
  value: { appendChild: jest.fn() },
});

Object.defineProperty(document, 'body', {
  value: {
    className: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  },
});

describe('ThemeControls Basic', () => {
  let container: HTMLElement;
  let audioEngine: AudioEngine;
  let themeEngine: ThemeEngine;
  let themeControls: ThemeControls;

  beforeEach(() => {
    jest.clearAllMocks();
    
    container = document.createElement('div');
    audioEngine = new AudioEngine();
    themeEngine = new ThemeEngine();
    
    themeControls = new ThemeControls(container, audioEngine, themeEngine);
  });

  afterEach(() => {
    themeControls.dispose();
    audioEngine.dispose();
    themeEngine.dispose();
  });

  describe('Initialization', () => {
    it('should create ThemeControls instance', () => {
      expect(themeControls).toBeInstanceOf(ThemeControls);
    });

    it('should have default configuration', () => {
      const config = themeControls.getConfig();
      
      expect(config.showVolumeControls).toBe(true);
      expect(config.showThemeSelector).toBe(true);
      expect(config.showAudioToggle).toBe(true);
      expect(config.showAnimationToggle).toBe(true);
      expect(config.compact).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customConfig: ThemeControlsConfig = {
        showVolumeControls: false,
        showThemeSelector: false,
        showAudioToggle: false,
        showAnimationToggle: false,
        compact: true,
      };

      const customControls = new ThemeControls(container, audioEngine, themeEngine, customConfig);
      const config = customControls.getConfig();
      
      expect(config.compact).toBe(true);
      expect(config.showVolumeControls).toBe(false);
      
      customControls.dispose();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        showVolumeControls: false,
        compact: true,
      };

      themeControls.updateConfig(newConfig);
      
      const config = themeControls.getConfig();
      expect(config.showVolumeControls).toBe(false);
      expect(config.compact).toBe(true);
      expect(config.showThemeSelector).toBe(true); // Should preserve other settings
    });

    it('should refresh controls', () => {
      expect(() => themeControls.refresh()).not.toThrow();
    });
  });

  describe('Audio Theme Management', () => {
    it('should add custom audio theme', () => {
      const customTheme = {
        id: 'custom',
        name: 'Custom Theme',
        soundEffects: {
          wheelSpin: { id: 'custom-spin', name: 'Custom Spin', url: '/custom/spin.mp3' },
          wheelStop: { id: 'custom-stop', name: 'Custom Stop', url: '/custom/stop.mp3' },
          powerMeterTick: { id: 'custom-tick', name: 'Custom Tick', url: '/custom/tick.mp3' },
          resultReveal: { id: 'custom-reveal', name: 'Custom Reveal', url: '/custom/reveal.mp3' },
          buttonClick: { id: 'custom-click', name: 'Custom Click', url: '/custom/click.mp3' },
          gameStart: { id: 'custom-start', name: 'Custom Start', url: '/custom/start.mp3' },
          gameEnd: { id: 'custom-end', name: 'Custom End', url: '/custom/end.mp3' },
        },
      };

      expect(() => themeControls.addAudioTheme(customTheme)).not.toThrow();
    });

    it('should remove custom audio theme', () => {
      expect(() => themeControls.removeAudioTheme('custom')).not.toThrow();
    });

    it('should not remove default audio theme', () => {
      expect(() => themeControls.removeAudioTheme('default')).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should dispose properly', () => {
      expect(() => themeControls.dispose()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing audio theme gracefully', () => {
      const newAudioEngine = new AudioEngine();
      const newControls = new ThemeControls(container, newAudioEngine, themeEngine);
      
      expect(() => newControls.dispose()).not.toThrow();
      expect(() => newAudioEngine.dispose()).not.toThrow();
    });

    it('should handle DOM element not found gracefully', () => {
      expect(() => themeControls.refresh()).not.toThrow();
    });
  });
});