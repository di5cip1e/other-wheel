/**
 * AudioEngine - Manages sound effects and background music for the game
 * Handles audio loading, playback, volume control, and audio enable/disable functionality
 */

export interface AudioConfig {
  masterVolume: number; // 0.0 to 1.0
  soundEffectsVolume: number; // 0.0 to 1.0
  musicVolume: number; // 0.0 to 1.0
  enabled: boolean;
  soundEffectsEnabled: boolean;
  musicEnabled: boolean;
}

export interface SoundEffect {
  id: string;
  name: string;
  url: string;
  volume?: number; // Override default volume
  loop?: boolean;
}

export interface AudioTheme {
  id: string;
  name: string;
  soundEffects: {
    wheelSpin: SoundEffect;
    wheelStop: SoundEffect;
    powerMeterTick: SoundEffect;
    resultReveal: SoundEffect;
    buttonClick: SoundEffect;
    gameStart: SoundEffect;
    gameEnd: SoundEffect;
  };
  backgroundMusic?: SoundEffect;
}

export class AudioEngine {
  private config: AudioConfig;
  private audioContext: AudioContext | null = null;
  private loadedSounds: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private masterGainNode: GainNode | null = null;
  private currentTheme: AudioTheme | null = null;
  private backgroundMusicSource: AudioBufferSourceNode | null = null;

  constructor(config: AudioConfig = this.getDefaultConfig()) {
    this.config = { ...config };
    this.initializeAudioContext();
  }

  private getDefaultConfig(): AudioConfig {
    return {
      masterVolume: 0.7,
      soundEffectsVolume: 0.8,
      musicVolume: 0.5,
      enabled: true,
      soundEffectsEnabled: true,
      musicEnabled: true
    };
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.updateMasterVolume();
    } catch (error) {
      console.warn('AudioEngine: Web Audio API not supported', error);
      this.audioContext = null;
    }
  }

  /**
   * Load an audio theme with all its sound effects
   */
  async loadTheme(theme: AudioTheme): Promise<void> {
    if (!this.audioContext) {
      console.warn('AudioEngine: Cannot load theme - Audio context not available');
      return;
    }

    this.currentTheme = theme;
    const soundsToLoad: SoundEffect[] = [
      ...Object.values(theme.soundEffects),
      ...(theme.backgroundMusic ? [theme.backgroundMusic] : [])
    ];

    const loadPromises = soundsToLoad.map(sound => this.loadSound(sound));
    await Promise.all(loadPromises);
  }

  /**
   * Load a single sound effect
   */
  private async loadSound(sound: SoundEffect): Promise<void> {
    if (!this.audioContext || this.loadedSounds.has(sound.id)) {
      return;
    }

    try {
      const response = await fetch(sound.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.loadedSounds.set(sound.id, audioBuffer);
    } catch (error) {
      console.warn(`AudioEngine: Failed to load sound ${sound.id}:`, error);
    }
  }

  /**
   * Play a sound effect by ID
   */
  playSoundEffect(soundId: string, options: { volume?: number; loop?: boolean } = {}): void {
    if (!this.config.enabled || !this.config.soundEffectsEnabled || !this.audioContext || !this.masterGainNode) {
      return;
    }

    const audioBuffer = this.loadedSounds.get(soundId);
    if (!audioBuffer) {
      console.warn(`AudioEngine: Sound ${soundId} not loaded`);
      return;
    }

    // Stop any existing instance of this sound
    this.stopSound(soundId);

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      source.loop = options.loop || false;

      // Calculate final volume
      const soundVolume = options.volume || 1.0;
      const finalVolume = soundVolume * this.config.soundEffectsVolume;
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);

      // Connect audio graph
      source.connect(gainNode);
      gainNode.connect(this.masterGainNode);

      // Store references
      this.activeSources.set(soundId, source);
      this.gainNodes.set(soundId, gainNode);

      // Clean up when sound ends
      source.onended = () => {
        this.activeSources.delete(soundId);
        this.gainNodes.delete(soundId);
      };

      source.start();
    } catch (error) {
      console.warn(`AudioEngine: Failed to play sound ${soundId}:`, error);
    }
  }

  /**
   * Stop a specific sound
   */
  stopSound(soundId: string): void {
    const source = this.activeSources.get(soundId);
    if (source) {
      try {
        source.stop();
      } catch (error) {
        // Sound may have already ended
      }
      this.activeSources.delete(soundId);
      this.gainNodes.delete(soundId);
    }
  }

  /**
   * Play background music
   */
  playBackgroundMusic(): void {
    if (!this.config.enabled || !this.config.musicEnabled || !this.currentTheme?.backgroundMusic) {
      return;
    }

    this.stopBackgroundMusic();
    this.playSoundEffect(this.currentTheme.backgroundMusic.id, {
      volume: this.currentTheme.backgroundMusic.volume || 1.0,
      loop: true
    });

    this.backgroundMusicSource = this.activeSources.get(this.currentTheme.backgroundMusic.id) || null;
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(): void {
    if (this.backgroundMusicSource) {
      try {
        this.backgroundMusicSource.stop();
      } catch (error) {
        // Music may have already ended
      }
      this.backgroundMusicSource = null;
    }

    if (this.currentTheme?.backgroundMusic) {
      this.stopSound(this.currentTheme.backgroundMusic.id);
    }
  }

  /**
   * Stop all sounds
   */
  stopAllSounds(): void {
    this.activeSources.forEach((_, soundId) => {
      this.stopSound(soundId);
    });
    this.stopBackgroundMusic();
  }

  /**
   * Update master volume
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateMasterVolume();
  }

  /**
   * Update sound effects volume
   */
  setSoundEffectsVolume(volume: number): void {
    this.config.soundEffectsVolume = Math.max(0, Math.min(1, volume));
    this.updateSoundEffectsVolume();
  }

  /**
   * Update music volume
   */
  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  private updateMasterVolume(): void {
    if (this.masterGainNode && this.audioContext) {
      this.masterGainNode.gain.setValueAtTime(
        this.config.masterVolume,
        this.audioContext.currentTime
      );
    }
  }

  private updateSoundEffectsVolume(): void {
    this.gainNodes.forEach((gainNode, soundId) => {
      if (this.audioContext && soundId !== this.currentTheme?.backgroundMusic?.id) {
        gainNode.gain.setValueAtTime(
          this.config.soundEffectsVolume,
          this.audioContext.currentTime
        );
      }
    });
  }

  private updateMusicVolume(): void {
    if (this.currentTheme?.backgroundMusic && this.audioContext) {
      const musicGainNode = this.gainNodes.get(this.currentTheme.backgroundMusic.id);
      if (musicGainNode) {
        const soundVolume = this.currentTheme.backgroundMusic.volume || 1.0;
        const finalVolume = soundVolume * this.config.musicVolume;
        musicGainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
      }
    }
  }

  /**
   * Enable/disable audio
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
  }

  /**
   * Enable/disable sound effects
   */
  setSoundEffectsEnabled(enabled: boolean): void {
    this.config.soundEffectsEnabled = enabled;
    if (!enabled) {
      // Stop all sound effects but keep music
      this.activeSources.forEach((_, soundId) => {
        if (soundId !== this.currentTheme?.backgroundMusic?.id) {
          this.stopSound(soundId);
        }
      });
    }
  }

  /**
   * Enable/disable music
   */
  setMusicEnabled(enabled: boolean): void {
    this.config.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    } else if (this.currentTheme?.backgroundMusic) {
      this.playBackgroundMusic();
    }
  }

  /**
   * Get current audio configuration
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): AudioTheme | null {
    return this.currentTheme;
  }

  /**
   * Check if audio is supported
   */
  isSupported(): boolean {
    return this.audioContext !== null;
  }

  /**
   * Resume audio context (required for some browsers after user interaction)
   */
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('AudioEngine: Failed to resume audio context:', error);
      }
    }
  }

  /**
   * Dispose of the audio engine and clean up resources
   */
  dispose(): void {
    this.stopAllSounds();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.loadedSounds.clear();
    this.activeSources.clear();
    this.gainNodes.clear();
    this.masterGainNode = null;
    this.currentTheme = null;
  }
}