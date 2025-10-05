/**
 * ThemeEngine Tests
 * Tests visual theme management, CSS generation, and theme switching
 */

import { ThemeEngine, VisualTheme, ThemeConfig } from '../../src/engines/ThemeEngine';

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    id: '',
    textContent: '',
    remove: jest.fn(),
  })),
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: jest.fn(),
  },
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

describe('ThemeEngine', () => {
  let themeEngine: ThemeEngine;
  let mockCustomTheme: VisualTheme;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCustomTheme = {
      id: 'custom-test',
      name: 'Custom Test Theme',
      description: 'A test theme for unit testing',
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        background: '#ffffff',
        surface: '#f0f0f0',
        text: '#000000',
        textSecondary: '#666666',
        border: '#cccccc',
        success: '#00aa00',
        warning: '#ffaa00',
        error: '#aa0000',
        info: '#0000aa',
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75,
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms',
        },
        easing: {
          linear: 'linear',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    };

    themeEngine = new ThemeEngine();
  });

  afterEach(() => {
    themeEngine.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = themeEngine.getConfig();
      
      expect(config.currentThemeId).toBe('default');
      expect(config.customThemes).toEqual([]);
      expect(config.enableAnimations).toBe(true);
      expect(config.reducedMotion).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: ThemeConfig = {
        currentThemeId: 'dark',
        customThemes: [mockCustomTheme],
        enableAnimations: false,
        reducedMotion: true,
      };

      const customThemeEngine = new ThemeEngine(customConfig);
      const config = customThemeEngine.getConfig();
      
      expect(config.currentThemeId).toBe('dark');
      expect(config.customThemes).toEqual([mockCustomTheme]);
      expect(config.enableAnimations).toBe(false);
      expect(config.reducedMotion).toBe(true);
      
      customThemeEngine.dispose();
    });

    it('should load default theme on initialization', () => {
      const currentTheme = themeEngine.getCurrentTheme();
      
      expect(currentTheme).not.toBeNull();
      expect(currentTheme?.id).toBe('default');
      expect(currentTheme?.name).toBe('Default');
    });

    it('should create style element on initialization', () => {
      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(document.head.appendChild).toHaveBeenCalled();
    });
  });

  describe('Built-in Themes', () => {
    it('should have default theme available', () => {
      const defaultTheme = themeEngine.getTheme('default');
      
      expect(defaultTheme).not.toBeNull();
      expect(defaultTheme?.name).toBe('Default');
      expect(defaultTheme?.colors.primary).toBe('#3b82f6');
    });

    it('should have dark theme available', () => {
      const darkTheme = themeEngine.getTheme('dark');
      
      expect(darkTheme).not.toBeNull();
      expect(darkTheme?.name).toBe('Dark');
      expect(darkTheme?.colors.background).toBe('#111827');
    });

    it('should have retro theme available', () => {
      const retroTheme = themeEngine.getTheme('retro');
      
      expect(retroTheme).not.toBeNull();
      expect(retroTheme?.name).toBe('Retro');
      expect(retroTheme?.typography.fontFamily).toBe('"Courier New", monospace');
    });

    it('should get all built-in themes', () => {
      const allThemes = themeEngine.getAllThemes();
      
      expect(allThemes.length).toBeGreaterThanOrEqual(3);
      expect(allThemes.some(t => t.id === 'default')).toBe(true);
      expect(allThemes.some(t => t.id === 'dark')).toBe(true);
      expect(allThemes.some(t => t.id === 'retro')).toBe(true);
    });
  });

  describe('Theme Loading', () => {
    it('should load theme successfully', () => {
      const result = themeEngine.loadTheme('dark');
      
      expect(result).toBe(true);
      expect(themeEngine.getCurrentTheme()?.id).toBe('dark');
    });

    it('should return false for non-existent theme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = themeEngine.loadTheme('non-existent');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('ThemeEngine: Theme non-existent not found');
      
      consoleSpy.mockRestore();
    });

    it('should apply theme class to body', () => {
      themeEngine.loadTheme('dark');
      
      expect(document.body.classList.add).toHaveBeenCalledWith('theme-dark');
    });

    it('should remove previous theme class when switching', () => {
      themeEngine.loadTheme('dark');
      themeEngine.loadTheme('retro');
      
      expect(document.body.className).toBe('');
      expect(document.body.classList.add).toHaveBeenCalledWith('theme-retro');
    });
  });

  describe('Custom Themes', () => {
    it('should add custom theme', () => {
      themeEngine.addCustomTheme(mockCustomTheme);
      
      const theme = themeEngine.getTheme('custom-test');
      expect(theme).toEqual(mockCustomTheme);
    });

    it('should update existing custom theme', () => {
      themeEngine.addCustomTheme(mockCustomTheme);
      
      const updatedTheme = { ...mockCustomTheme, name: 'Updated Test Theme' };
      themeEngine.addCustomTheme(updatedTheme);
      
      const theme = themeEngine.getTheme('custom-test');
      expect(theme?.name).toBe('Updated Test Theme');
    });

    it('should remove custom theme', () => {
      themeEngine.addCustomTheme(mockCustomTheme);
      
      const result = themeEngine.removeCustomTheme('custom-test');
      
      expect(result).toBe(true);
      expect(themeEngine.getTheme('custom-test')).toBeNull();
    });

    it('should not remove non-existent custom theme', () => {
      const result = themeEngine.removeCustomTheme('non-existent');
      
      expect(result).toBe(false);
    });

    it('should switch to default theme when removing current theme', () => {
      themeEngine.addCustomTheme(mockCustomTheme);
      themeEngine.loadTheme('custom-test');
      
      themeEngine.removeCustomTheme('custom-test');
      
      expect(themeEngine.getCurrentTheme()?.id).toBe('default');
    });

    it('should include custom themes in getAllThemes', () => {
      themeEngine.addCustomTheme(mockCustomTheme);
      
      const allThemes = themeEngine.getAllThemes();
      
      expect(allThemes.some(t => t.id === 'custom-test')).toBe(true);
    });
  });

  describe('CSS Generation', () => {
    it('should generate CSS variables for theme', () => {
      const mockStyleElement = {
        textContent: '',
        remove: jest.fn(),
      };
      themeEngine['styleElement'] = mockStyleElement as any;
      
      themeEngine.loadTheme('default');
      
      expect(mockStyleElement.textContent).toContain('--color-primary:');
      expect(mockStyleElement.textContent).toContain('--font-family:');
      expect(mockStyleElement.textContent).toContain('--spacing-md:');
    });

    it('should generate component styles', () => {
      const mockStyleElement = {
        textContent: '',
        remove: jest.fn(),
      };
      themeEngine['styleElement'] = mockStyleElement as any;
      
      themeEngine.loadTheme('default');
      
      expect(mockStyleElement.textContent).toContain('.btn');
      expect(mockStyleElement.textContent).toContain('.input');
      expect(mockStyleElement.textContent).toContain('.card');
    });

    it('should include utility classes', () => {
      const mockStyleElement = {
        textContent: '',
        remove: jest.fn(),
      };
      themeEngine['styleElement'] = mockStyleElement as any;
      
      themeEngine.loadTheme('default');
      
      expect(mockStyleElement.textContent).toContain('.text-primary');
      expect(mockStyleElement.textContent).toContain('.bg-surface');
      expect(mockStyleElement.textContent).toContain('.rounded-md');
    });
  });

  describe('Animation Settings', () => {
    it('should enable animations', () => {
      themeEngine.setAnimationsEnabled(true);
      
      expect(themeEngine.getConfig().enableAnimations).toBe(true);
    });

    it('should disable animations', () => {
      themeEngine.setAnimationsEnabled(false);
      
      expect(themeEngine.getConfig().enableAnimations).toBe(false);
    });

    it('should set reduced motion', () => {
      themeEngine.setReducedMotion(true);
      
      expect(themeEngine.getConfig().reducedMotion).toBe(true);
      expect(document.body.classList.add).toHaveBeenCalledWith('reduced-motion');
    });

    it('should unset reduced motion', () => {
      themeEngine.setReducedMotion(false);
      
      expect(themeEngine.getConfig().reducedMotion).toBe(false);
      expect(document.body.classList.remove).toHaveBeenCalledWith('reduced-motion');
    });
  });

  describe('Theme Observers', () => {
    it('should notify observers when theme changes', () => {
      const observer = jest.fn();
      
      themeEngine.subscribe(observer);
      themeEngine.loadTheme('dark');
      
      expect(observer).toHaveBeenCalledWith(expect.objectContaining({ id: 'dark' }));
    });

    it('should return unsubscribe function', () => {
      const observer = jest.fn();
      
      const unsubscribe = themeEngine.subscribe(observer);
      unsubscribe();
      
      themeEngine.loadTheme('dark');
      
      expect(observer).not.toHaveBeenCalled();
    });

    it('should handle observer errors gracefully', () => {
      const faultyObserver = jest.fn(() => {
        throw new Error('Observer error');
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      themeEngine.subscribe(faultyObserver);
      themeEngine.loadTheme('dark');
      
      expect(consoleSpy).toHaveBeenCalledWith('ThemeEngine: Observer callback failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Import/Export', () => {
    it('should export theme as JSON', () => {
      themeEngine.addCustomTheme(mockCustomTheme);
      
      const exported = themeEngine.exportTheme('custom-test');
      
      expect(exported).not.toBeNull();
      expect(JSON.parse(exported!)).toEqual(mockCustomTheme);
    });

    it('should return null for non-existent theme export', () => {
      const exported = themeEngine.exportTheme('non-existent');
      
      expect(exported).toBeNull();
    });

    it('should import theme from JSON', () => {
      const themeJson = JSON.stringify(mockCustomTheme);
      
      const result = themeEngine.importTheme(themeJson);
      
      expect(result).toBe(true);
      expect(themeEngine.getTheme('custom-test')).toEqual(mockCustomTheme);
    });

    it('should handle invalid JSON import', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = themeEngine.importTheme('invalid json');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('ThemeEngine: Failed to import theme:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should validate theme structure on import', () => {
      const invalidTheme = { id: 'test', name: 'Test' }; // Missing required properties
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = themeEngine.importTheme(JSON.stringify(invalidTheme));
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('ThemeEngine: Invalid theme structure');
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should remove style element when disposing', () => {
      const mockStyleElement = {
        remove: jest.fn(),
      };
      themeEngine['styleElement'] = mockStyleElement as any;
      
      themeEngine.dispose();
      
      expect(mockStyleElement.remove).toHaveBeenCalled();
    });

    it('should clear observers when disposing', () => {
      const observer = jest.fn();
      themeEngine.subscribe(observer);
      
      themeEngine.dispose();
      themeEngine.loadTheme('dark');
      
      expect(observer).not.toHaveBeenCalled();
    });

    it('should clear current theme when disposing', () => {
      themeEngine.dispose();
      
      expect(themeEngine.getCurrentTheme()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing style element gracefully', () => {
      themeEngine['styleElement'] = null;
      
      // Should not throw
      expect(() => themeEngine.loadTheme('dark')).not.toThrow();
    });

    it('should handle theme validation errors', () => {
      const invalidTheme = {
        id: 'invalid',
        name: 'Invalid',
        colors: 'not an object', // Invalid structure
      };
      
      const result = themeEngine['validateTheme'](invalidTheme);
      
      expect(result).toBe(false);
    });
  });
});