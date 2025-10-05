/**
 * Tests for PresetManager - Preset saving, loading, and management functionality
 */

import { PresetManager } from '../../src/managers/PresetManager';
import { Preset, GameState, Wheel, Wedge, GameSettings } from '../../src/models';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PresetManager', () => {
  let presetManager: PresetManager;
  let mockGameState: GameState;
  let mockPreset: Preset;

  beforeEach(() => {
    presetManager = new PresetManager();
    localStorageMock.clear();

    // Create mock game state
    const mockWedges: Wedge[] = [
      {
        id: 'wedge1',
        label: 'Option 1',
        weight: 1,
        color: '#ff0000',
      },
      {
        id: 'wedge2',
        label: 'Option 2',
        weight: 2,
        color: '#00ff00',
        media: {
          type: 'image',
          src: 'test.jpg',
          alt: 'Test image',
        },
      },
    ];

    const mockWheels: Wheel[] = [
      {
        id: 'wheel1',
        label: 'Outer Wheel',
        wedges: mockWedges,
        frictionCoefficient: 0.1,
        radius: 200,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      },
      {
        id: 'wheel2',
        label: 'Inner Wheel',
        wedges: mockWedges,
        frictionCoefficient: 0.15,
        clutchRatio: 0.8,
        radius: 100,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      },
    ];

    const mockSettings: GameSettings = {
      maxPlayers: 4,
      enableSound: true,
      theme: 'default',
      deterministic: false,
    };

    mockGameState = {
      wheels: mockWheels,
      players: [],
      currentPlayerIndex: 0,
      gamePhase: 'setup',
      scores: new Map(),
      settings: mockSettings,
    };

    // Create mock preset
    mockPreset = {
      id: 'test-preset-1',
      name: 'Test Preset',
      description: 'A test preset for unit testing',
      version: '1.0.0',
      createdAt: '2024-01-01T00:00:00.000Z',
      modifiedAt: '2024-01-01T00:00:00.000Z',
      gameConfig: {
        wheels: [
          {
            id: 'wheel1',
            label: 'Test Wheel',
            wedges: [
              {
                id: 'wedge1',
                label: 'Test Wedge',
                weight: 1,
                color: '#ff0000',
              },
            ],
            physicsProperties: {
              frictionCoefficient: 0.1,
            },
            renderProperties: {
              radius: 200,
              position: { x: 300, y: 300 },
            },
          },
        ],
        settings: mockSettings,
      },
      metadata: {
        tags: ['test'],
        difficulty: 'medium',
        playerCount: { min: 1, max: 4 },
        estimatedDuration: 15,
      },
    };
  });

  describe('savePreset', () => {
    it('should save a valid preset to localStorage', async () => {
      await presetManager.savePreset(mockPreset);

      const stored = localStorage.getItem('wheel-game-presets');
      expect(stored).toBeTruthy();

      const presets = JSON.parse(stored!);
      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe(mockPreset.id);
      expect(presets[0].name).toBe(mockPreset.name);
    });

    it('should update existing preset when saving with same ID', async () => {
      await presetManager.savePreset(mockPreset);

      const updatedPreset = { ...mockPreset, name: 'Updated Test Preset' };
      await presetManager.savePreset(updatedPreset);

      const presets = await presetManager.getAllPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0]?.name).toBe('Updated Test Preset');
      expect(presets[0]?.modifiedAt).not.toBe(mockPreset.modifiedAt);
    });

    it('should throw error for invalid preset', async () => {
      const invalidPreset = { ...mockPreset, name: '' };

      await expect(presetManager.savePreset(invalidPreset)).rejects.toThrow('Invalid preset');
    });

    it('should enforce maximum preset limit', async () => {
      // Save maximum number of presets
      const maxPresets = 50;
      for (let i = 0; i < maxPresets; i++) {
        const preset = { ...mockPreset, id: `preset-${i}`, name: `Preset ${i}` };
        await presetManager.savePreset(preset);
      }

      // Try to save one more
      const extraPreset = { ...mockPreset, id: 'extra-preset', name: 'Extra Preset' };
      await expect(presetManager.savePreset(extraPreset)).rejects.toThrow('Maximum number of presets');
    });
  });

  describe('loadPreset', () => {
    beforeEach(async () => {
      await presetManager.savePreset(mockPreset);
    });

    it('should load existing preset by ID', async () => {
      const loaded = await presetManager.loadPreset(mockPreset.id);

      expect(loaded).toBeTruthy();
      expect(loaded!.id).toBe(mockPreset.id);
      expect(loaded!.name).toBe(mockPreset.name);
    });

    it('should return null for non-existent preset', async () => {
      const loaded = await presetManager.loadPreset('non-existent-id');
      expect(loaded).toBeNull();
    });

    it('should return null for corrupted preset data', async () => {
      // Manually corrupt the data
      const presets = await presetManager.getAllPresets();
      if (presets[0]) {
        presets[0].gameConfig.wheels = []; // Invalid: empty wheels array
        localStorage.setItem('wheel-game-presets', JSON.stringify(presets));
      }

      // getAllPresets filters out corrupted presets, so loadPreset returns null
      const result = await presetManager.loadPreset(mockPreset.id);
      expect(result).toBeNull();
    });
  });

  describe('getAllPresets', () => {
    it('should return empty array when no presets exist', async () => {
      const presets = await presetManager.getAllPresets();
      expect(presets).toEqual([]);
    });

    it('should return all valid presets', async () => {
      const preset1 = { ...mockPreset, id: 'preset1', name: 'Preset 1' };
      const preset2 = { ...mockPreset, id: 'preset2', name: 'Preset 2' };

      await presetManager.savePreset(preset1);
      await presetManager.savePreset(preset2);

      const presets = await presetManager.getAllPresets();
      expect(presets).toHaveLength(2);
      expect(presets.map(p => p.name)).toContain('Preset 1');
      expect(presets.map(p => p.name)).toContain('Preset 2');
    });

    it('should filter out corrupted presets and update storage', async () => {
      const validPreset = mockPreset;
      const corruptedPreset = { ...mockPreset, id: 'corrupted', gameConfig: null };

      // Manually store both valid and corrupted presets
      localStorage.setItem('wheel-game-presets', JSON.stringify([validPreset, corruptedPreset]));

      const presets = await presetManager.getAllPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0]?.id).toBe(validPreset.id);

      // Verify storage was cleaned up
      const stored = JSON.parse(localStorage.getItem('wheel-game-presets')!);
      expect(stored).toHaveLength(1);
    });

    it('should handle corrupted localStorage gracefully', async () => {
      localStorage.setItem('wheel-game-presets', 'invalid json');

      const presets = await presetManager.getAllPresets();
      expect(presets).toEqual([]);

      // Verify corrupted storage was cleared
      expect(localStorage.getItem('wheel-game-presets')).toBeNull();
    });
  });

  describe('deletePreset', () => {
    beforeEach(async () => {
      await presetManager.savePreset(mockPreset);
    });

    it('should delete existing preset', async () => {
      const result = await presetManager.deletePreset(mockPreset.id);
      expect(result).toBe(true);

      const presets = await presetManager.getAllPresets();
      expect(presets).toHaveLength(0);
    });

    it('should return false for non-existent preset', async () => {
      const result = await presetManager.deletePreset('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('createPresetFromGameState', () => {
    it('should create valid preset from game state', () => {
      const preset = presetManager.createPresetFromGameState(mockGameState, 'Test Game', 'Test description');

      expect(preset.name).toBe('Test Game');
      expect(preset.description).toBe('Test description');
      expect(preset.gameConfig.wheels).toHaveLength(2);
      expect(preset.gameConfig.settings).toEqual(mockGameState.settings);
      expect(preset.metadata.playerCount.max).toBe(mockGameState.settings.maxPlayers);
    });

    it('should handle undefined description', () => {
      const preset = presetManager.createPresetFromGameState(mockGameState, 'Test Game');

      expect(preset.name).toBe('Test Game');
      expect(preset.description).toBeUndefined();
    });

    it('should preserve wheel physics properties', () => {
      const preset = presetManager.createPresetFromGameState(mockGameState, 'Test Game');

      const outerWheel = preset.gameConfig.wheels[0];
      const innerWheel = preset.gameConfig.wheels[1];

      expect(outerWheel?.physicsProperties.frictionCoefficient).toBe(0.1);
      expect(outerWheel?.physicsProperties.clutchRatio).toBeUndefined();

      expect(innerWheel?.physicsProperties.frictionCoefficient).toBe(0.15);
      expect(innerWheel?.physicsProperties.clutchRatio).toBe(0.8);
    });

    it('should preserve wedge media information', () => {
      const preset = presetManager.createPresetFromGameState(mockGameState, 'Test Game');

      const wedgeWithMedia = preset.gameConfig.wheels[0]?.wedges[1];
      expect(wedgeWithMedia?.media).toBeDefined();
      expect(wedgeWithMedia?.media?.type).toBe('image');
      expect(wedgeWithMedia?.media?.src).toBe('test.jpg');
    });
  });

  describe('applyPresetToGameState', () => {
    it('should create game state from preset', () => {
      const gameState = presetManager.applyPresetToGameState(mockPreset);

      expect(gameState.wheels).toHaveLength(1);
      expect(gameState.wheels[0]?.id).toBe('wheel1');
      expect(gameState.wheels[0]?.label).toBe('Test Wheel');
      expect(gameState.settings).toEqual(mockPreset.gameConfig.settings);
      expect(gameState.gamePhase).toBe('setup');
      expect(gameState.currentPlayerIndex).toBe(0);
    });

    it('should preserve existing players when provided', () => {
      const existingPlayers = [
        { id: 'player1', name: 'Player 1', isActive: true },
      ];

      const gameState = presetManager.applyPresetToGameState(mockPreset, existingPlayers);

      expect(gameState.players).toEqual(existingPlayers);
    });

    it('should initialize wheel runtime properties', () => {
      const gameState = presetManager.applyPresetToGameState(mockPreset);

      const wheel = gameState.wheels[0];
      expect(wheel?.currentAngle).toBe(0);
      expect(wheel?.angularVelocity).toBe(0);
    });
  });

  describe('exportPreset', () => {
    it('should export preset as JSON string', () => {
      const exported = presetManager.exportPreset(mockPreset);

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.preset).toEqual(mockPreset);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.exportVersion).toBe('1.0.0');
    });

    it('should create properly formatted JSON', () => {
      const exported = presetManager.exportPreset(mockPreset);

      // Should be pretty-printed (indented)
      expect(exported.includes('\n')).toBe(true);
      expect(exported.includes('  ')).toBe(true);
    });
  });

  describe('importPreset', () => {
    let exportedPreset: string;

    beforeEach(() => {
      exportedPreset = presetManager.exportPreset(mockPreset);
    });

    it('should import preset from export format', () => {
      const imported = presetManager.importPreset(exportedPreset);

      expect(imported.name).toBe(mockPreset.name);
      expect(imported.description).toBe(mockPreset.description);
      expect(imported.gameConfig).toEqual(mockPreset.gameConfig);
      expect(imported.metadata).toEqual(mockPreset.metadata);
      expect(imported.id).not.toBe(mockPreset.id); // Should generate new ID
    });

    it('should import preset from direct preset format', () => {
      const directFormat = JSON.stringify(mockPreset);
      const imported = presetManager.importPreset(directFormat);

      expect(imported.name).toBe(mockPreset.name);
      expect(imported.id).not.toBe(mockPreset.id); // Should generate new ID
    });

    it('should throw error for invalid JSON', () => {
      expect(() => presetManager.importPreset('invalid json')).toThrow('Invalid JSON format');
    });

    it('should throw error for invalid preset data', () => {
      const invalidPreset = { ...mockPreset, name: '' };
      const invalidJson = JSON.stringify(invalidPreset);

      expect(() => presetManager.importPreset(invalidJson)).toThrow('Invalid preset data');
    });

    it('should update modification date on import', () => {
      const imported = presetManager.importPreset(exportedPreset);

      expect(imported.modifiedAt).not.toBe(mockPreset.modifiedAt);
      expect(new Date(imported.modifiedAt).getTime()).toBeGreaterThan(new Date(mockPreset.modifiedAt).getTime());
    });
  });

  describe('validatePreset', () => {
    it('should validate correct preset', () => {
      const result = presetManager.validatePreset(mockPreset);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidPreset = { ...mockPreset, name: '', id: undefined };
      const result = presetManager.validatePreset(invalidPreset);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid preset ID');
      expect(result.errors).toContain('Missing or invalid preset name');
    });

    it('should validate wheel configuration', () => {
      const invalidPreset = {
        ...mockPreset,
        gameConfig: {
          ...mockPreset.gameConfig,
          wheels: [
            {
              ...mockPreset.gameConfig.wheels[0],
              wedges: [], // Invalid: empty wedges
            },
          ],
        },
      };

      const result = presetManager.validatePreset(invalidPreset);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('empty wedges array'))).toBe(true);
    });

    it('should validate wedge properties', () => {
      const invalidPreset = {
        ...mockPreset,
        gameConfig: {
          ...mockPreset.gameConfig,
          wheels: [
            {
              ...mockPreset.gameConfig.wheels[0],
              wedges: [
                {
                  id: 'wedge1',
                  label: 'Test',
                  weight: -1, // Invalid: negative weight
                  color: '#ff0000',
                },
              ],
            },
          ],
        },
      };

      const result = presetManager.validatePreset(invalidPreset);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid weight'))).toBe(true);
    });

    it('should validate game settings', () => {
      const invalidPreset = {
        ...mockPreset,
        gameConfig: {
          ...mockPreset.gameConfig,
          settings: {
            ...mockPreset.gameConfig.settings,
            maxPlayers: 0, // Invalid: zero players
            enableSound: 'yes', // Invalid: should be boolean
          },
        },
      };

      const result = presetManager.validatePreset(invalidPreset);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid maxPlayers'))).toBe(true);
      expect(result.errors.some(e => e.includes('Invalid enableSound'))).toBe(true);
    });

    it('should generate warnings for missing metadata', () => {
      const presetWithoutMetadata = { ...mockPreset, metadata: undefined };
      const result = presetManager.validatePreset(presetWithoutMetadata);

      expect(result.isValid).toBe(false); // Missing metadata makes it invalid
      expect(result.errors.some(e => e.includes('Missing metadata'))).toBe(true);
    });
  });

  describe('checkStorageAvailability', () => {
    it('should return available when localStorage works', () => {
      const result = presetManager.checkStorageAvailability();

      expect(result.available).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle storage quota exceeded', () => {
      // Mock localStorage to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = presetManager.checkStorageAvailability();

      expect(result.available).toBe(false);
      expect(result.error).toBe('Storage quota exceeded');

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage usage information', async () => {
      await presetManager.savePreset(mockPreset);

      const info = presetManager.getStorageInfo();

      expect(info.presetCount).toBe(1);
      expect(info.used).toBeGreaterThan(0);
      expect(info.total).toBe(5 * 1024 * 1024); // 5MB
    });

    it('should handle empty storage', () => {
      const info = presetManager.getStorageInfo();

      expect(info.presetCount).toBe(0);
      expect(info.used).toBeGreaterThan(0); // Empty array still has size
      expect(info.total).toBe(5 * 1024 * 1024);
    });

    it('should handle corrupted storage gracefully', () => {
      localStorage.setItem('wheel-game-presets', 'invalid json');

      const info = presetManager.getStorageInfo();

      expect(info.presetCount).toBe(0);
      expect(info.used).toBeGreaterThan(0);
    });
  });
});