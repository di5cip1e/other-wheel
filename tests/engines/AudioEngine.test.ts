/**
 * AudioEngine Tests
 * Tests audio functionality, volume controls, and theme management
 */

import { AudioEngine, AudioConfig, AudioTheme } from '../../src/engines/AudioEngine';

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  destination = {};
  currentTime = 0;

  createGain() {
    return {
      gain: {
        setValueAtTime: jest.fn()
      },
      connect: jest.fn()
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null
    };
  }

  decodeAudioData(_arrayBuffer: ArrayBuffer) {
    return Promise.resolve({
      length: 1000,
      sampleRate: 44100
    });
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

// Mock fetch for audio loading
global.fetch = jest.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000))
  })
) as jest.Mock;

// Mock AudioContext
(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;
  let mockAudioTheme: AudioTheme;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAudioTheme = {
      id: 'test-theme',
      name: 'Test Theme',
      soundEffects: {
        wheelSpin: {
          id: 'wheel-spin',
          name: 'Wheel Spin',
          url: '/test/wheel-spin.mp3',
          volume: 0.8
        },
        wheelStop: {
          id: 'wheel-stop',
          name: 'Wheel Stop',
          url: '/test/wheel-stop.mp3',
          volume: 0.9
        },
        powerMeterTick: {
          id: 'power-meter-tick',
          name: 'Power Meter Tick',
          url: '/test/power-meter-tick.mp3',
          volume: 0.6
        },
        resultReveal: {
          id: 'result-reveal',
          name: 'Result Reveal',
          url: '/test/result-reveal.mp3',
          volume: 1.0
        },
        buttonClick: {
          id: 'button-click',
          name: 'Button Click',
          url: '/test/button-click.mp3',
          volume: 0.7
        },
        gameStart: {
          id: 'game-start',
          name: 'Game Start',
          url: '/test/game-start.mp3',
          volume: 0.9
        },
        gameEnd: {
          id: 'game-end',
          name: 'Game End',
          url: '/test/game-end.mp3',
          volume: 0.9
        }
      },
      backgroundMusic: {
        id: 'background-music',
        name: 'Background Music',
        url: '/test/background-music.mp3',
        volume: 0.4,
        loop: true
      }
    };

    audioEngine = new AudioEngine();
  });

  afterEach(() => {
    audioEngine.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = audioEngine.getConfig();
      
      expect(config.masterVolume).toBe(0.7);
      expect(config.soundEffectsVolume).toBe(0.8);
      expect(config.musicVolume).toBe(0.5);
      expect(config.enabled).toBe(true);
      expect(config.soundEffectsEnabled).toBe(true);
      expect(config.musicEnabled).toBe(true);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: AudioConfig = {
        masterVolume: 0.5,
        soundEffectsVolume: 0.6,
        musicVolume: 0.3,
        enabled: false,
        soundEffectsEnabled: false,
        musicEnabled: false
      };

      const customAudioEngine = new AudioEngine(customConfig);
      const config = customAudioEngine.getConfig();
      
      expect(config).toEqual(customConfig);
      customAudioEngine.dispose();
    });

    it('should detect audio support', () => {
      expect(audioEngine.isSupported()).toBe(true);
    });
  });

  describe('Theme Management', () => {
    it('should load audio theme successfully', async () => {
      await audioEngine.loadTheme(mockAudioTheme);
      
      expect(audioEngine.getCurrentTheme()).toEqual(mockAudioTheme);
      expect(fetch).toHaveBeenCalledTimes(8); // 7 sound effects + 1 background music
    });

    it('should handle theme loading errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await audioEngine.loadTheme(mockAudioTheme);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return null when no theme is loaded', () => {
      expect(audioEngine.getCurrentTheme()).toBeNull();
    });
  });

  describe('Sound Effect Playback', () => {
    beforeEach(async () => {
      await audioEngine.loadTheme(mockAudioTheme);
    });

    it('should play sound effects when enabled', () => {
      const mockSource = {
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
      };

      // Mock createBufferSource to return our mock
      const mockContext = audioEngine['audioContext'] as any;
      mockContext.createBufferSource = jest.fn(() => mockSource);

      audioEngine.playSoundEffect('wheel-spin');
      
      expect(mockSource.start).toHaveBeenCalled();
    });

    it('should not play sound effects when disabled', () => {
      audioEngine.setSoundEffectsEnabled(false);
      
      const mockSource = {
        start: jest.fn()
      };
      
      const mockContext = audioEngine['audioContext'] as any;
      mockContext.createBufferSource = jest.fn(() => mockSource);

      audioEngine.playSoundEffect('wheel-spin');
      
      expect(mockSource.start).not.toHaveBeenCalled();
    });

    it('should not play sound effects when audio is disabled', () => {
      audioEngine.setEnabled(false);
      
      const mockSource = {
        start: jest.fn()
      };
      
      const mockContext = audioEngine['audioContext'] as any;
      mockContext.createBufferSource = jest.fn(() => mockSource);

      audioEngine.playSoundEffect('wheel-spin');
      
      expect(mockSource.start).not.toHaveBeenCalled();
    });

    it('should handle missing sound effects gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      audioEngine.playSoundEffect('non-existent-sound');
      
      expect(consoleSpy).toHaveBeenCalledWith('AudioEngine: Sound non-existent-sound not loaded');
      consoleSpy.mockRestore();
    });

    it('should stop existing sound when playing same sound again', () => {
      const mockSource1 = {
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
      };

      const mockSource2 = {
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
      };

      const mockContext = audioEngine['audioContext'] as any;
      mockContext.createBufferSource = jest.fn()
        .mockReturnValueOnce(mockSource1)
        .mockReturnValueOnce(mockSource2);

      audioEngine.playSoundEffect('wheel-spin');
      audioEngine.playSoundEffect('wheel-spin');
      
      expect(mockSource1.stop).toHaveBeenCalled();
      expect(mockSource2.start).toHaveBeenCalled();
    });
  });

  describe('Background Music', () => {
    beforeEach(async () => {
      await audioEngine.loadTheme(mockAudioTheme);
    });

    it('should play background music when enabled', () => {
      const mockSource = {
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
      };

      const mockContext = audioEngine['audioContext'] as any;
      mockContext.createBufferSource = jest.fn(() => mockSource);

      audioEngine.playBackgroundMusic();
      
      expect(mockSource.start).toHaveBeenCalled();
    });

    it('should not play background music when music is disabled', () => {
      audioEngine.setMusicEnabled(false);
      
      const mockSource = {
        start: jest.fn()
      };
      
      const mockContext = audioEngine['audioContext'] as any;
      mockContext.createBufferSource = jest.fn(() => mockSource);

      audioEngine.playBackgroundMusic();
      
      expect(mockSource.start).not.toHaveBeenCalled();
    });

    it('should stop background music', () => {
      const mockSource = {
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onended: null
      };

      const mockContext = audioEngine['audioContext'] as any;
      mockContext.createBufferSource = jest.fn(() => mockSource);

      audioEngine.playBackgroundMusic();
      audioEngine.stopBackgroundMusic();
      
      expect(mockSource.stop).toHaveBeenCalled();
    });
  });

  describe('Volume Controls', () => {
    it('should update master volume', () => {
      audioEngine.setMasterVolume(0.5);
      
      expect(audioEngine.getConfig().masterVolume).toBe(0.5);
    });

    it('should clamp master volume to valid range', () => {
      audioEngine.setMasterVolume(-0.5);
      expect(audioEngine.getConfig().masterVolume).toBe(0);
      
      audioEngine.setMasterVolume(1.5);
      expect(audioEngine.getConfig().masterVolume).toBe(1);
    });

    it('should update sound effects volume', () => {
      audioEngine.setSoundEffectsVolume(0.3);
      
      expect(audioEngine.getConfig().soundEffectsVolume).toBe(0.3);
    });

    it('should update music volume', () => {
      audioEngine.setMusicVolume(0.2);
      
      expect(audioEngine.getConfig().musicVolume).toBe(0.2);
    });
  });

  describe('Audio Context Management', () => {
    it('should resume audio context', async () => {
      const mockContext = audioEngine['audioContext'] as any;
      mockContext.state = 'suspended';
      mockContext.resume = jest.fn(() => Promise.resolve());

      await audioEngine.resumeAudioContext();
      
      expect(mockContext.resume).toHaveBeenCalled();
    });

    it('should handle resume errors gracefully', async () => {
      const mockContext = audioEngine['audioContext'] as any;
      mockContext.state = 'suspended';
      mockContext.resume = jest.fn(() => Promise.reject(new Error('Resume failed')));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await audioEngine.resumeAudioContext();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should stop all sounds when disposing', () => {
      const mockSource = {
        stop: jest.fn()
      };

      audioEngine['activeSources'].set('test-sound', mockSource as any);
      
      audioEngine.dispose();
      
      expect(mockSource.stop).toHaveBeenCalled();
    });

    it('should close audio context when disposing', () => {
      const mockContext = audioEngine['audioContext'] as any;
      mockContext.close = jest.fn(() => Promise.resolve());

      audioEngine.dispose();
      
      expect(mockContext.close).toHaveBeenCalled();
    });

    it('should clear all internal state when disposing', () => {
      audioEngine.dispose();
      
      expect(audioEngine['audioContext']).toBeNull();
      expect(audioEngine['loadedSounds'].size).toBe(0);
      expect(audioEngine['activeSources'].size).toBe(0);
      expect(audioEngine['currentTheme']).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle Web Audio API not supported', () => {
      // Temporarily remove AudioContext
      const originalAudioContext = (global as any).AudioContext;
      const originalWebkitAudioContext = (global as any).webkitAudioContext;
      
      delete (global as any).AudioContext;
      delete (global as any).webkitAudioContext;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const unsupportedEngine = new AudioEngine();
      
      expect(unsupportedEngine.isSupported()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('AudioEngine: Web Audio API not supported', expect.any(Error));
      
      // Restore
      (global as any).AudioContext = originalAudioContext;
      (global as any).webkitAudioContext = originalWebkitAudioContext;
      consoleSpy.mockRestore();
      unsupportedEngine.dispose();
    });

    it('should handle playback errors gracefully', async () => {
      await audioEngine.loadTheme(mockAudioTheme);
      
      const mockContext = audioEngine['audioContext'] as any;
      mockContext.createBufferSource = jest.fn(() => {
        throw new Error('Playback error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      audioEngine.playSoundEffect('wheel-spin');
      
      expect(consoleSpy).toHaveBeenCalledWith('AudioEngine: Failed to play sound wheel-spin:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});