/**
 * PresetManager - Handles saving, loading, and managing game presets
 * Provides LocalStorage integration and import/export functionality
 */

import {
    Preset,
    PresetValidationResult,
    PresetExportData,
    GameState,
    WheelConfig,
    Wheel
} from '../models';

export class PresetManager {
    private static readonly STORAGE_KEY = 'wheel-game-presets';
    private static readonly EXPORT_VERSION = '1.0.0';
    private static readonly MAX_PRESETS = 50; // Prevent localStorage overflow

    /**
     * Save a preset to localStorage
     */
    async savePreset(preset: Preset): Promise<void> {
        try {
            const validation = this.validatePreset(preset);
            if (!validation.isValid) {
                throw new Error(`Invalid preset: ${validation.errors.join(', ')}`);
            }

            const presets = await this.getAllPresets();

            // Check if we're at the limit
            if (presets.length >= PresetManager.MAX_PRESETS && !presets.find(p => p.id === preset.id)) {
                throw new Error(`Maximum number of presets (${PresetManager.MAX_PRESETS}) reached`);
            }

            // Update existing or add new
            const existingIndex = presets.findIndex(p => p.id === preset.id);
            if (existingIndex >= 0) {
                presets[existingIndex] = { ...preset, modifiedAt: new Date().toISOString() };
            } else {
                presets.push(preset);
            }

            localStorage.setItem(PresetManager.STORAGE_KEY, JSON.stringify(presets));
        } catch (error) {
            throw new Error(`Failed to save preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Load a preset by ID
     */
    async loadPreset(id: string): Promise<Preset | null> {
        try {
            const presets = await this.getAllPresets();
            const preset = presets.find(p => p.id === id);

            if (preset) {
                const validation = this.validatePreset(preset);
                if (!validation.isValid) {
                    throw new Error(`Corrupted preset data: ${validation.errors.join(', ')}`);
                }
            }

            return preset || null;
        } catch (error) {
            throw new Error(`Failed to load preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get all saved presets
     */
    async getAllPresets(): Promise<Preset[]> {
        try {
            const stored = localStorage.getItem(PresetManager.STORAGE_KEY);
            if (!stored) {
                return [];
            }

            const presets = JSON.parse(stored) as Preset[];

            // Validate all presets and filter out corrupted ones
            const validPresets = presets.filter(preset => {
                const validation = this.validatePreset(preset);
                return validation.isValid;
            });

            // If we filtered out corrupted presets, update storage
            if (validPresets.length !== presets.length) {
                localStorage.setItem(PresetManager.STORAGE_KEY, JSON.stringify(validPresets));
            }

            return validPresets;
        } catch (error) {
            console.error('Failed to load presets from storage:', error);
            // Clear corrupted storage
            localStorage.removeItem(PresetManager.STORAGE_KEY);
            return [];
        }
    }

    /**
     * Delete a preset by ID
     */
    async deletePreset(id: string): Promise<boolean> {
        try {
            const presets = await this.getAllPresets();
            const filteredPresets = presets.filter(p => p.id !== id);

            if (filteredPresets.length === presets.length) {
                return false; // Preset not found
            }

            localStorage.setItem(PresetManager.STORAGE_KEY, JSON.stringify(filteredPresets));
            return true;
        } catch (error) {
            throw new Error(`Failed to delete preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create a preset from current game state
     */
    createPresetFromGameState(gameState: GameState, name: string, description?: string): Preset {
        const now = new Date().toISOString();

        return {
            id: this.generateId(),
            name,
            description: description || undefined,
            version: PresetManager.EXPORT_VERSION,
            createdAt: now,
            modifiedAt: now,
            gameConfig: {
                wheels: gameState.wheels.map(this.wheelToConfig),
                settings: { ...gameState.settings }
            },
            metadata: {
                tags: [],
                difficulty: 'medium',
                playerCount: { min: 1, max: gameState.settings.maxPlayers },
                estimatedDuration: 15
            }
        };
    }

    /**
     * Apply a preset to create a new game state
     */
    applyPresetToGameState(preset: Preset, currentPlayers: any[] = []): GameState {
        const wheels = preset.gameConfig.wheels.map(this.configToWheel);

        return {
            wheels,
            players: currentPlayers,
            currentPlayerIndex: 0,
            gamePhase: 'setup',
            scores: new Map(),
            settings: { ...preset.gameConfig.settings }
        };
    }

    /**
     * Export preset to JSON string
     */
    exportPreset(preset: Preset): string {
        const exportData: PresetExportData = {
            preset,
            exportedAt: new Date().toISOString(),
            exportVersion: PresetManager.EXPORT_VERSION
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import preset from JSON string
     */
    importPreset(jsonString: string): Preset {
        try {
            const data = JSON.parse(jsonString);

            // Handle both direct preset format and export format
            const preset: Preset = data.preset || data;

            // Validate the imported preset
            const validation = this.validatePreset(preset);
            if (!validation.isValid) {
                throw new Error(`Invalid preset data: ${validation.errors.join(', ')}`);
            }

            // Generate new ID to avoid conflicts
            preset.id = this.generateId();
            preset.modifiedAt = new Date().toISOString();

            return preset;
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error('Invalid JSON format');
            }
            throw new Error(`Failed to import preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validate preset data structure and content
     */
    validatePreset(preset: any): PresetValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (!preset.id || typeof preset.id !== 'string') {
            errors.push('Missing or invalid preset ID');
        }
        if (!preset.name || typeof preset.name !== 'string') {
            errors.push('Missing or invalid preset name');
        }
        if (!preset.version || typeof preset.version !== 'string') {
            errors.push('Missing or invalid version');
        }
        if (!preset.createdAt || typeof preset.createdAt !== 'string') {
            errors.push('Missing or invalid creation date');
        }
        if (!preset.modifiedAt || typeof preset.modifiedAt !== 'string') {
            errors.push('Missing or invalid modification date');
        }

        // Validate game config
        if (!preset.gameConfig) {
            errors.push('Missing game configuration');
        } else {
            if (!Array.isArray(preset.gameConfig.wheels)) {
                errors.push('Invalid wheels configuration');
            } else if (preset.gameConfig.wheels.length === 0) {
                errors.push('Game must have at least one wheel');
            } else {
                // Validate wheels
                preset.gameConfig.wheels.forEach((wheel: any, index: number) => {
                    if (!wheel.id || typeof wheel.id !== 'string') {
                        errors.push(`Wheel ${index}: Missing or invalid ID`);
                    }
                    if (!wheel.label || typeof wheel.label !== 'string') {
                        errors.push(`Wheel ${index}: Missing or invalid label`);
                    }
                    if (!Array.isArray(wheel.wedges) || wheel.wedges.length === 0) {
                        errors.push(`Wheel ${index}: Missing or empty wedges array`);
                    } else {
                        // Validate wedges
                        wheel.wedges.forEach((wedge: any, wedgeIndex: number) => {
                            if (!wedge.id || typeof wedge.id !== 'string') {
                                errors.push(`Wheel ${index}, Wedge ${wedgeIndex}: Missing or invalid ID`);
                            }
                            if (!wedge.label || typeof wedge.label !== 'string') {
                                errors.push(`Wheel ${index}, Wedge ${wedgeIndex}: Missing or invalid label`);
                            }
                            if (typeof wedge.weight !== 'number' || wedge.weight <= 0) {
                                errors.push(`Wheel ${index}, Wedge ${wedgeIndex}: Invalid weight`);
                            }
                            if (!wedge.color || typeof wedge.color !== 'string') {
                                errors.push(`Wheel ${index}, Wedge ${wedgeIndex}: Missing or invalid color`);
                            }
                        });
                    }
                });
            }

            if (!preset.gameConfig.settings) {
                errors.push('Missing game settings');
            } else {
                const settings = preset.gameConfig.settings;
                if (typeof settings.maxPlayers !== 'number' || settings.maxPlayers < 1) {
                    errors.push('Invalid maxPlayers setting');
                }
                if (typeof settings.enableSound !== 'boolean') {
                    errors.push('Invalid enableSound setting');
                }
                if (typeof settings.deterministic !== 'boolean') {
                    errors.push('Invalid deterministic setting');
                }
            }
        }

        // Validate metadata
        if (!preset.metadata) {
            errors.push('Missing metadata');
        } else {
            if (!Array.isArray(preset.metadata.tags)) {
                warnings.push('Invalid tags in metadata');
            }
            if (!['easy', 'medium', 'hard'].includes(preset.metadata.difficulty)) {
                warnings.push('Invalid difficulty in metadata');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Check if localStorage is available and has space
     */
    checkStorageAvailability(): { available: boolean; error?: string } {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return { available: true };
        } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                return { available: false, error: 'Storage quota exceeded' };
            }
            return { available: false, error: 'LocalStorage not available' };
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo(): { used: number; total: number; presetCount: number } {
        const presets = localStorage.getItem(PresetManager.STORAGE_KEY) || '[]';
        const used = new Blob([presets]).size;

        // Estimate total available (most browsers allow ~5-10MB)
        const total = 5 * 1024 * 1024; // 5MB estimate

        let presetCount = 0;
        try {
            presetCount = JSON.parse(presets).length;
        } catch {
            // Ignore parsing errors
        }

        return { used, total, presetCount };
    }

    private wheelToConfig(wheel: Wheel): WheelConfig {
        return {
            id: wheel.id,
            label: wheel.label,
            wedges: wheel.wedges.map(wedge => ({
                id: wedge.id,
                label: wedge.label,
                weight: wedge.weight,
                color: wedge.color,
                ...(wedge.media && { media: wedge.media })
            })),
            physicsProperties: {
                frictionCoefficient: wheel.frictionCoefficient,
                ...(wheel.clutchRatio !== undefined && { clutchRatio: wheel.clutchRatio })
            },
            renderProperties: {
                radius: wheel.radius,
                position: wheel.position
            }
        };
    }

    private configToWheel(config: WheelConfig): Wheel {
        return {
            id: config.id,
            label: config.label,
            wedges: config.wedges.map(wedgeConfig => ({
                id: wedgeConfig.id,
                label: wedgeConfig.label,
                weight: wedgeConfig.weight,
                color: wedgeConfig.color,
                ...(wedgeConfig.media && { media: wedgeConfig.media })
            })),
            frictionCoefficient: config.physicsProperties.frictionCoefficient,
            clutchRatio: config.physicsProperties.clutchRatio,
            radius: config.renderProperties.radius,
            position: config.renderProperties.position,
            currentAngle: 0,
            angularVelocity: 0
        };
    }

    private generateId(): string {
        return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
}