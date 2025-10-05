/**
 * ThemeEngine - Manages visual themes and consistent styling across components
 * Handles theme loading, application, and dynamic theme switching
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface Typography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Animations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface VisualTheme {
  id: string;
  name: string;
  description?: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: Animations;
  customProperties?: Record<string, string>;
}

export interface ThemeConfig {
  currentThemeId: string;
  customThemes: VisualTheme[];
  enableAnimations: boolean;
  reducedMotion: boolean;
}

export class ThemeEngine {
  private config: ThemeConfig;
  private currentTheme: VisualTheme | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private observers: Set<(theme: VisualTheme) => void> = new Set();
  private builtInThemes: Map<string, VisualTheme> = new Map();

  constructor(config: ThemeConfig = this.getDefaultConfig()) {
    this.config = { ...config };
    this.initializeBuiltInThemes();
    this.createStyleElement();
    this.loadTheme(this.config.currentThemeId);
  }

  private getDefaultConfig(): ThemeConfig {
    return {
      currentThemeId: 'default',
      customThemes: [],
      enableAnimations: true,
      reducedMotion: false
    };
  }

  private initializeBuiltInThemes(): void {
    // Default theme
    this.builtInThemes.set('default', {
      id: 'default',
      name: 'Default',
      description: 'Clean and modern default theme',
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#f59e0b',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#111827',
        textSecondary: '#6b7280',
        border: '#d1d5db',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          linear: 'linear',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }
    });

    // Dark theme
    this.builtInThemes.set('dark', {
      id: 'dark',
      name: 'Dark',
      description: 'Dark theme for low-light environments',
      colors: {
        primary: '#60a5fa',
        secondary: '#9ca3af',
        accent: '#fbbf24',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        border: '#374151',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          linear: 'linear',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }
    });

    // Retro theme
    this.builtInThemes.set('retro', {
      id: 'retro',
      name: 'Retro',
      description: 'Nostalgic retro gaming theme',
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        accent: '#ffe66d',
        background: '#2d3436',
        surface: '#636e72',
        text: '#ddd',
        textSecondary: '#b2bec3',
        border: '#74b9ff',
        success: '#00b894',
        warning: '#fdcb6e',
        error: '#e17055',
        info: '#74b9ff'
      },
      typography: {
        fontFamily: '"Courier New", monospace',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        full: '9999px'
      },
      shadows: {
        sm: '2px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '4px 4px 0 rgba(0, 0, 0, 0.3)',
        lg: '6px 6px 0 rgba(0, 0, 0, 0.3)',
        xl: '8px 8px 0 rgba(0, 0, 0, 0.3)'
      },
      animations: {
        duration: {
          fast: '100ms',
          normal: '200ms',
          slow: '400ms'
        },
        easing: {
          linear: 'linear',
          easeIn: 'steps(4, end)',
          easeOut: 'steps(4, start)',
          easeInOut: 'steps(8, end)'
        }
      }
    });
  }

  private createStyleElement(): void {
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'theme-engine-styles';
    document.head.appendChild(this.styleElement);
  }

  /**
   * Load and apply a theme
   */
  loadTheme(themeId: string): boolean {
    const theme = this.getTheme(themeId);
    if (!theme) {
      console.warn(`ThemeEngine: Theme ${themeId} not found`);
      return false;
    }

    this.currentTheme = theme;
    this.config.currentThemeId = themeId;
    this.applyTheme(theme);
    this.notifyObservers(theme);
    return true;
  }

  /**
   * Get a theme by ID (checks both built-in and custom themes)
   */
  getTheme(themeId: string): VisualTheme | null {
    return this.builtInThemes.get(themeId) || 
           this.config.customThemes.find(theme => theme.id === themeId) || 
           null;
  }

  /**
   * Apply theme styles to the document
   */
  private applyTheme(theme: VisualTheme): void {
    if (!this.styleElement) return;

    const cssVariables = this.generateCSSVariables(theme);
    const componentStyles = this.generateComponentStyles(theme);
    
    this.styleElement.textContent = `
      :root {
        ${cssVariables}
      }
      
      ${componentStyles}
    `;

    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme.id}`);

    // Handle reduced motion
    if (this.config.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  /**
   * Generate CSS custom properties from theme
   */
  private generateCSSVariables(theme: VisualTheme): string {
    const variables: string[] = [];

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      variables.push(`--color-${key}: ${value};`);
    });

    // Typography
    variables.push(`--font-family: ${theme.typography.fontFamily};`);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      variables.push(`--font-size-${key}: ${value};`);
    });
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      variables.push(`--font-weight-${key}: ${value};`);
    });
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      variables.push(`--line-height-${key}: ${value};`);
    });

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      variables.push(`--spacing-${key}: ${value};`);
    });

    // Border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      variables.push(`--border-radius-${key}: ${value};`);
    });

    // Shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      variables.push(`--shadow-${key}: ${value};`);
    });

    // Animations
    Object.entries(theme.animations.duration).forEach(([key, value]) => {
      variables.push(`--duration-${key}: ${value};`);
    });
    Object.entries(theme.animations.easing).forEach(([key, value]) => {
      variables.push(`--easing-${key}: ${value};`);
    });

    // Custom properties
    if (theme.customProperties) {
      Object.entries(theme.customProperties).forEach(([key, value]) => {
        variables.push(`--${key}: ${value};`);
      });
    }

    return variables.join('\n        ');
  }

  /**
   * Generate component-specific styles
   */
  private generateComponentStyles(_theme: VisualTheme): string {
    return `
      /* Base styles */
      body {
        font-family: var(--font-family);
        font-size: var(--font-size-base);
        line-height: var(--line-height-normal);
        color: var(--color-text);
        background-color: var(--color-background);
        transition: ${this.config.enableAnimations ? 'background-color var(--duration-normal) var(--easing-easeInOut), color var(--duration-normal) var(--easing-easeInOut)' : 'none'};
      }

      /* Reduced motion support */
      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      /* Button styles */
      .btn {
        font-family: var(--font-family);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-medium);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--color-border);
        background-color: var(--color-surface);
        color: var(--color-text);
        cursor: pointer;
        transition: ${this.config.enableAnimations ? 'all var(--duration-fast) var(--easing-easeInOut)' : 'none'};
      }

      .btn:hover {
        background-color: var(--color-primary);
        color: var(--color-background);
        border-color: var(--color-primary);
      }

      .btn-primary {
        background-color: var(--color-primary);
        color: var(--color-background);
        border-color: var(--color-primary);
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      /* Input styles */
      .input {
        font-family: var(--font-family);
        font-size: var(--font-size-base);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--color-border);
        background-color: var(--color-background);
        color: var(--color-text);
        transition: ${this.config.enableAnimations ? 'border-color var(--duration-fast) var(--easing-easeInOut)' : 'none'};
      }

      .input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      /* Card styles */
      .card {
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-sm);
        padding: var(--spacing-lg);
        transition: ${this.config.enableAnimations ? 'box-shadow var(--duration-normal) var(--easing-easeInOut)' : 'none'};
      }

      .card:hover {
        box-shadow: var(--shadow-md);
      }

      /* Utility classes */
      .text-primary { color: var(--color-primary); }
      .text-secondary { color: var(--color-textSecondary); }
      .text-success { color: var(--color-success); }
      .text-warning { color: var(--color-warning); }
      .text-error { color: var(--color-error); }
      .text-info { color: var(--color-info); }

      .bg-primary { background-color: var(--color-primary); }
      .bg-secondary { background-color: var(--color-secondary); }
      .bg-surface { background-color: var(--color-surface); }

      .border-primary { border-color: var(--color-primary); }
      .border-secondary { border-color: var(--color-border); }

      .rounded-sm { border-radius: var(--border-radius-sm); }
      .rounded-md { border-radius: var(--border-radius-md); }
      .rounded-lg { border-radius: var(--border-radius-lg); }
      .rounded-xl { border-radius: var(--border-radius-xl); }
      .rounded-full { border-radius: var(--border-radius-full); }

      .shadow-sm { box-shadow: var(--shadow-sm); }
      .shadow-md { box-shadow: var(--shadow-md); }
      .shadow-lg { box-shadow: var(--shadow-lg); }
      .shadow-xl { box-shadow: var(--shadow-xl); }

      .p-xs { padding: var(--spacing-xs); }
      .p-sm { padding: var(--spacing-sm); }
      .p-md { padding: var(--spacing-md); }
      .p-lg { padding: var(--spacing-lg); }
      .p-xl { padding: var(--spacing-xl); }

      .m-xs { margin: var(--spacing-xs); }
      .m-sm { margin: var(--spacing-sm); }
      .m-md { margin: var(--spacing-md); }
      .m-lg { margin: var(--spacing-lg); }
      .m-xl { margin: var(--spacing-xl); }
    `;
  }

  /**
   * Add a custom theme
   */
  addCustomTheme(theme: VisualTheme): void {
    const existingIndex = this.config.customThemes.findIndex(t => t.id === theme.id);
    if (existingIndex >= 0) {
      this.config.customThemes[existingIndex] = theme;
    } else {
      this.config.customThemes.push(theme);
    }
  }

  /**
   * Remove a custom theme
   */
  removeCustomTheme(themeId: string): boolean {
    const index = this.config.customThemes.findIndex(t => t.id === themeId);
    if (index >= 0) {
      this.config.customThemes.splice(index, 1);
      
      // Switch to default theme if current theme was removed
      if (this.config.currentThemeId === themeId) {
        this.loadTheme('default');
      }
      
      return true;
    }
    return false;
  }

  /**
   * Get all available themes
   */
  getAllThemes(): VisualTheme[] {
    return [
      ...Array.from(this.builtInThemes.values()),
      ...this.config.customThemes
    ];
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): VisualTheme | null {
    return this.currentTheme;
  }

  /**
   * Set animation preferences
   */
  setAnimationsEnabled(enabled: boolean): void {
    this.config.enableAnimations = enabled;
    if (this.currentTheme) {
      this.applyTheme(this.currentTheme);
    }
  }

  /**
   * Set reduced motion preference
   */
  setReducedMotion(reduced: boolean): void {
    this.config.reducedMotion = reduced;
    if (this.currentTheme) {
      this.applyTheme(this.currentTheme);
    }
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback: (theme: VisualTheme) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify observers of theme changes
   */
  private notifyObservers(theme: VisualTheme): void {
    this.observers.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.warn('ThemeEngine: Observer callback failed:', error);
      }
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  /**
   * Export theme as JSON
   */
  exportTheme(themeId: string): string | null {
    const theme = this.getTheme(themeId);
    if (!theme) return null;
    
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON
   */
  importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson) as VisualTheme;
      
      // Validate theme structure
      if (!this.validateTheme(theme)) {
        console.warn('ThemeEngine: Invalid theme structure');
        return false;
      }
      
      this.addCustomTheme(theme);
      return true;
    } catch (error) {
      console.warn('ThemeEngine: Failed to import theme:', error);
      return false;
    }
  }

  /**
   * Validate theme structure
   */
  private validateTheme(theme: any): theme is VisualTheme {
    return (
      typeof theme === 'object' &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.colors === 'object' &&
      typeof theme.typography === 'object' &&
      typeof theme.spacing === 'object' &&
      typeof theme.borderRadius === 'object' &&
      typeof theme.shadows === 'object' &&
      typeof theme.animations === 'object'
    );
  }

  /**
   * Dispose of the theme engine
   */
  dispose(): void {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    
    this.observers.clear();
    this.currentTheme = null;
  }
}