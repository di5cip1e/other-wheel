/**
 * ThemeControls - UI component for managing audio and visual themes
 * Provides controls for theme selection, volume adjustment, and audio settings
 */

import { AudioEngine, AudioTheme } from '../engines/AudioEngine';
import { ThemeEngine } from '../engines/ThemeEngine';
import { defaultAudioTheme, retroAudioTheme, silentAudioTheme } from '../themes/DefaultAudioTheme';

export interface ThemeControlsConfig {
  showVolumeControls: boolean;
  showThemeSelector: boolean;
  showAudioToggle: boolean;
  showAnimationToggle: boolean;
  compact: boolean;
}

export class ThemeControls {
  private container: HTMLElement;
  private audioEngine: AudioEngine;
  private themeEngine: ThemeEngine;
  private config: ThemeControlsConfig;
  private audioThemes: Map<string, AudioTheme> = new Map();

  constructor(
    container: HTMLElement,
    audioEngine: AudioEngine,
    themeEngine: ThemeEngine,
    config: ThemeControlsConfig = this.getDefaultConfig(),
  ) {
    this.container = container;
    this.audioEngine = audioEngine;
    this.themeEngine = themeEngine;
    this.config = { ...config };

    this.initializeAudioThemes();
    this.render();
    this.attachEventListeners();
  }

  private getDefaultConfig(): ThemeControlsConfig {
    return {
      showVolumeControls: true,
      showThemeSelector: true,
      showAudioToggle: true,
      showAnimationToggle: true,
      compact: false,
    };
  }

  private initializeAudioThemes(): void {
    this.audioThemes.set('default', defaultAudioTheme);
    this.audioThemes.set('retro', retroAudioTheme);
    this.audioThemes.set('silent', silentAudioTheme);
  }

  private render(): void {
    const audioConfig = this.audioEngine.getConfig();
    const themeConfig = this.themeEngine.getConfig();
    const currentTheme = this.themeEngine.getCurrentTheme();
    const availableThemes = this.themeEngine.getAllThemes();

    this.container.innerHTML = `
      <div class="theme-controls ${this.config.compact ? 'theme-controls--compact' : ''}">
        <div class="theme-controls__header">
          <h3 class="theme-controls__title">Theme & Audio Settings</h3>
        </div>

        ${this.config.showThemeSelector ? `
          <div class="theme-controls__section">
            <label class="theme-controls__label">Visual Theme</label>
            <select class="theme-controls__select" id="visual-theme-select">
              ${availableThemes.map(theme => `
                <option value="${theme.id}" ${theme.id === currentTheme?.id ? 'selected' : ''}>
                  ${theme.name}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="theme-controls__section">
            <label class="theme-controls__label">Audio Theme</label>
            <select class="theme-controls__select" id="audio-theme-select">
              ${Array.from(this.audioThemes.values()).map(theme => `
                <option value="${theme.id}" ${theme.id === this.audioEngine.getCurrentTheme()?.id ? 'selected' : ''}>
                  ${theme.name}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}

        ${this.config.showAudioToggle ? `
          <div class="theme-controls__section">
            <div class="theme-controls__toggle-group">
              <label class="theme-controls__toggle">
                <input type="checkbox" id="audio-enabled" ${audioConfig.enabled ? 'checked' : ''}>
                <span class="theme-controls__toggle-slider"></span>
                <span class="theme-controls__toggle-label">Audio Enabled</span>
              </label>

              <label class="theme-controls__toggle">
                <input type="checkbox" id="sound-effects-enabled" ${audioConfig.soundEffectsEnabled ? 'checked' : ''}>
                <span class="theme-controls__toggle-slider"></span>
                <span class="theme-controls__toggle-label">Sound Effects</span>
              </label>

              <label class="theme-controls__toggle">
                <input type="checkbox" id="music-enabled" ${audioConfig.musicEnabled ? 'checked' : ''}>
                <span class="theme-controls__toggle-slider"></span>
                <span class="theme-controls__toggle-label">Background Music</span>
              </label>
            </div>
          </div>
        ` : ''}

        ${this.config.showVolumeControls ? `
          <div class="theme-controls__section">
            <div class="theme-controls__volume-group">
              <div class="theme-controls__volume-control">
                <label class="theme-controls__label" for="master-volume">Master Volume</label>
                <input type="range" id="master-volume" class="theme-controls__slider" 
                       min="0" max="100" value="${Math.round(audioConfig.masterVolume * 100)}">
                <span class="theme-controls__volume-value">${Math.round(audioConfig.masterVolume * 100)}%</span>
              </div>

              <div class="theme-controls__volume-control">
                <label class="theme-controls__label" for="sound-effects-volume">Sound Effects</label>
                <input type="range" id="sound-effects-volume" class="theme-controls__slider" 
                       min="0" max="100" value="${Math.round(audioConfig.soundEffectsVolume * 100)}">
                <span class="theme-controls__volume-value">${Math.round(audioConfig.soundEffectsVolume * 100)}%</span>
              </div>

              <div class="theme-controls__volume-control">
                <label class="theme-controls__label" for="music-volume">Music</label>
                <input type="range" id="music-volume" class="theme-controls__slider" 
                       min="0" max="100" value="${Math.round(audioConfig.musicVolume * 100)}">
                <span class="theme-controls__volume-value">${Math.round(audioConfig.musicVolume * 100)}%</span>
              </div>
            </div>
          </div>
        ` : ''}

        ${this.config.showAnimationToggle ? `
          <div class="theme-controls__section">
            <div class="theme-controls__toggle-group">
              <label class="theme-controls__toggle">
                <input type="checkbox" id="animations-enabled" ${themeConfig.enableAnimations ? 'checked' : ''}>
                <span class="theme-controls__toggle-slider"></span>
                <span class="theme-controls__toggle-label">Animations</span>
              </label>

              <label class="theme-controls__toggle">
                <input type="checkbox" id="reduced-motion" ${themeConfig.reducedMotion ? 'checked' : ''}>
                <span class="theme-controls__toggle-slider"></span>
                <span class="theme-controls__toggle-label">Reduced Motion</span>
              </label>
            </div>
          </div>
        ` : ''}

        <div class="theme-controls__section">
          <div class="theme-controls__actions">
            <button class="btn btn-primary" id="test-audio">Test Audio</button>
            <button class="btn" id="reset-settings">Reset to Defaults</button>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Visual theme selection
    const visualThemeSelect = this.container.querySelector('#visual-theme-select') as HTMLSelectElement;
    if (visualThemeSelect) {
      visualThemeSelect.addEventListener('change', (e) => {
        const themeId = (e.target as HTMLSelectElement).value;
        this.themeEngine.loadTheme(themeId);
        this.playButtonClickSound();
      });
    }

    // Audio theme selection
    const audioThemeSelect = this.container.querySelector('#audio-theme-select') as HTMLSelectElement;
    if (audioThemeSelect) {
      audioThemeSelect.addEventListener('change', async (e) => {
        const themeId = (e.target as HTMLSelectElement).value;
        const audioTheme = this.audioThemes.get(themeId);
        if (audioTheme) {
          await this.audioEngine.loadTheme(audioTheme);
          this.playButtonClickSound();
        }
      });
    }

    // Audio toggles
    const audioEnabled = this.container.querySelector('#audio-enabled') as HTMLInputElement;
    if (audioEnabled) {
      audioEnabled.addEventListener('change', (e) => {
        this.audioEngine.setEnabled((e.target as HTMLInputElement).checked);
        this.playButtonClickSound();
      });
    }

    const soundEffectsEnabled = this.container.querySelector('#sound-effects-enabled') as HTMLInputElement;
    if (soundEffectsEnabled) {
      soundEffectsEnabled.addEventListener('change', (e) => {
        this.audioEngine.setSoundEffectsEnabled((e.target as HTMLInputElement).checked);
        this.playButtonClickSound();
      });
    }

    const musicEnabled = this.container.querySelector('#music-enabled') as HTMLInputElement;
    if (musicEnabled) {
      musicEnabled.addEventListener('change', (e) => {
        this.audioEngine.setMusicEnabled((e.target as HTMLInputElement).checked);
        this.playButtonClickSound();
      });
    }

    // Volume controls
    const masterVolume = this.container.querySelector('#master-volume') as HTMLInputElement;
    if (masterVolume) {
      masterVolume.addEventListener('input', (e) => {
        const volume = parseInt((e.target as HTMLInputElement).value) / 100;
        this.audioEngine.setMasterVolume(volume);
        this.updateVolumeDisplay('master-volume', volume);
      });
    }

    const soundEffectsVolume = this.container.querySelector('#sound-effects-volume') as HTMLInputElement;
    if (soundEffectsVolume) {
      soundEffectsVolume.addEventListener('input', (e) => {
        const volume = parseInt((e.target as HTMLInputElement).value) / 100;
        this.audioEngine.setSoundEffectsVolume(volume);
        this.updateVolumeDisplay('sound-effects-volume', volume);
      });
    }

    const musicVolume = this.container.querySelector('#music-volume') as HTMLInputElement;
    if (musicVolume) {
      musicVolume.addEventListener('input', (e) => {
        const volume = parseInt((e.target as HTMLInputElement).value) / 100;
        this.audioEngine.setMusicVolume(volume);
        this.updateVolumeDisplay('music-volume', volume);
      });
    }

    // Animation toggles
    const animationsEnabled = this.container.querySelector('#animations-enabled') as HTMLInputElement;
    if (animationsEnabled) {
      animationsEnabled.addEventListener('change', (e) => {
        this.themeEngine.setAnimationsEnabled((e.target as HTMLInputElement).checked);
        this.playButtonClickSound();
      });
    }

    const reducedMotion = this.container.querySelector('#reduced-motion') as HTMLInputElement;
    if (reducedMotion) {
      reducedMotion.addEventListener('change', (e) => {
        this.themeEngine.setReducedMotion((e.target as HTMLInputElement).checked);
        this.playButtonClickSound();
      });
    }

    // Action buttons
    const testAudio = this.container.querySelector('#test-audio') as HTMLButtonElement;
    if (testAudio) {
      testAudio.addEventListener('click', () => {
        this.testAudio();
      });
    }

    const resetSettings = this.container.querySelector('#reset-settings') as HTMLButtonElement;
    if (resetSettings) {
      resetSettings.addEventListener('click', () => {
        this.resetToDefaults();
      });
    }
  }

  private updateVolumeDisplay(sliderId: string, volume: number): void {
    const slider = this.container.querySelector(`#${sliderId}`) as HTMLInputElement;
    const valueDisplay = slider?.parentElement?.querySelector('.theme-controls__volume-value');
    if (valueDisplay) {
      valueDisplay.textContent = `${Math.round(volume * 100)}%`;
    }
  }

  private playButtonClickSound(): void {
    const currentTheme = this.audioEngine.getCurrentTheme();
    if (currentTheme) {
      this.audioEngine.playSoundEffect(currentTheme.soundEffects.buttonClick.id);
    }
  }

  private async testAudio(): Promise<void> {
    const currentTheme = this.audioEngine.getCurrentTheme();
    if (!currentTheme) {return;}

    // Resume audio context if needed
    await this.audioEngine.resumeAudioContext();

    // Play a sequence of test sounds
    const sounds = [
      currentTheme.soundEffects.buttonClick,
      currentTheme.soundEffects.powerMeterTick,
      currentTheme.soundEffects.wheelSpin,
      currentTheme.soundEffects.wheelStop,
      currentTheme.soundEffects.resultReveal,
    ];

    for (let i = 0; i < sounds.length; i++) {
      const sound = sounds[i];
      if (sound) {
        setTimeout(() => {
          this.audioEngine.playSoundEffect(sound.id);
        }, i * 500);
      }
    }
  }

  private resetToDefaults(): void {
    // Reset audio settings
    this.audioEngine.setMasterVolume(0.7);
    this.audioEngine.setSoundEffectsVolume(0.8);
    this.audioEngine.setMusicVolume(0.5);
    this.audioEngine.setEnabled(true);
    this.audioEngine.setSoundEffectsEnabled(true);
    this.audioEngine.setMusicEnabled(true);

    // Reset theme settings
    this.themeEngine.loadTheme('default');
    this.themeEngine.setAnimationsEnabled(true);
    this.themeEngine.setReducedMotion(false);

    // Load default audio theme
    this.audioEngine.loadTheme(defaultAudioTheme);

    // Re-render to update UI
    this.render();
    this.attachEventListeners();

    this.playButtonClickSound();
  }

  /**
   * Update the controls when external changes occur
   */
  refresh(): void {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Get the current configuration
   */
  getConfig(): ThemeControlsConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<ThemeControlsConfig>): void {
    this.config = { ...this.config, ...config };
    this.render();
    this.attachEventListeners();
  }

  /**
   * Add a custom audio theme
   */
  addAudioTheme(theme: AudioTheme): void {
    this.audioThemes.set(theme.id, theme);
    this.refresh();
  }

  /**
   * Remove a custom audio theme
   */
  removeAudioTheme(themeId: string): void {
    if (this.audioThemes.has(themeId) && themeId !== 'default') {
      this.audioThemes.delete(themeId);
      this.refresh();
    }
  }

  /**
   * Dispose of the component
   */
  dispose(): void {
    this.container.innerHTML = '';
  }
}