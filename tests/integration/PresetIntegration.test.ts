/**
 * Integration tests for the preset management system
 * Tests the interaction between PresetManager and PresetBrowser
 */

import { PresetManager } from '../../src/managers/PresetManager';
import { PresetBrowser } from '../../src/components/PresetBrowser';
import { GameState, Preset, Wheel, Wedge, GameSettings } from '../../src/models';

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
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock URL methods for file download
Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-url')
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: jest.fn()
});

describe('Preset System Integration', () => {
  let presetManager: PresetManager;
  let container: HTMLElement;
  let mockGameState: GameState;

  beforeEach(() => {
    presetManager = new PresetManager();
    localStorageMock.clear();

    // Create container for PresetBrowser
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create comprehensive mock game state
    const mockWedges: Wedge[] = [
      {
        id: 'wedge1',
        label: 'Red Option',
        weight: 1,
        color: '#ff0000'
      },
      {
        id: 'wedge2',
        label: 'Blue Option',
        weight: 2,
        color: '#0000ff',
        media: {
          type: 'image',
          src: 'blue-option.jpg',
          alt: 'Blue option image'
        }
      },
      {
        id: 'wedge3',
        label: 'Green Option',
        weight: 1.5,
        color: '#00ff00',
        media: {
          type: 'video',
          src: 'green-option.mp4'
        }
      }
    ];

    const mockWheels: Wheel[] = [
      {
        id: 'outer-wheel',
        label: 'Main Wheel',
        wedges: mockWedges,
        frictionCoefficient: 0.1,
        radius: 250,
        position: { x: 400, y: 400 },
        currentAngle: 0,
        angularVelocity: 0
      },
      {
        id: 'inner-wheel',
        label: 'Bonus Wheel',
        wedges: mockWedges.slice(0, 2), // Fewer wedges for inner wheel
        frictionCoefficient: 0.15,
        clutchRatio: 0.7,
        radius: 120,
        position: { x: 400, y: 400 },
        currentAngle: 0,
        angularVelocity: 0
      }
    ];

    const mockSettings: GameSettings = {
      maxPlayers: 6,
      roundLimit: 10,
      scoreLimit: 100,
      enableSound: true,
      theme: 'neon',
      deterministic: true,
      rngSeed: 12345
    };

    mockGameState = {
      wheels: mockWheels,
      players: [
        { id: 'player1', name: 'Alice', isActive: true },
        { id: 'player2', name: 'Bob', isActive: false }
      ],
      currentPlayerIndex: 0,
      gamePhase: 'playing',
      scores: new Map([
        ['player1', 25],
        ['player2', 15]
      ]),
      settings: mockSettings
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('End-to-End Preset Workflow', () => {
    it('should create, save, export, import, and load a preset', async () => {
      // Step 1: Create preset from game state
      const originalPreset = presetManager.createPresetFromGameState(
        mockGameState,
        'Integration Test Preset',
        'A comprehensive test preset with multiple wheels and media'
      );

      // Enhance the preset with custom metadata
      originalPreset.metadata.tags = ['integration', 'test', 'comprehensive'];
      originalPreset.metadata.difficulty = 'hard';
      originalPreset.metadata.estimatedDuration = 25;

      // Step 2: Save preset
      await presetManager.savePreset(originalPreset);

      // Verify preset was saved
      const savedPresets = await presetManager.getAllPresets();
      expect(savedPresets).toHaveLength(1);
      expect(savedPresets[0].name).toBe('Integration Test Preset');

      // Step 3: Export preset
      const exportedData = presetManager.exportPreset(originalPreset);
      expect(exportedData).toContain('"Integration Test Preset"');
      expect(exportedData).toContain('"exportVersion"');

      // Step 4: Import preset (simulating sharing)
      const importedPreset = presetManager.importPreset(exportedData);
      expect(importedPreset.name).toBe(originalPreset.name);
      expect(importedPreset.description).toBe(originalPreset.description);
      expect(importedPreset.id).not.toBe(originalPreset.id); // Should have new ID

      // Step 5: Save imported preset
      await presetManager.savePreset(importedPreset);

      // Verify we now have two presets
      const allPresets = await presetManager.getAllPresets();
      expect(allPresets).toHaveLength(2);

      // Step 6: Load preset and apply to game state
      const loadedPreset = await presetManager.loadPreset(importedPreset.id);
      expect(loadedPreset).toBeTruthy();

      const newGameState = presetManager.applyPresetToGameState(loadedPreset!, mockGameState.players);

      // Verify game state was properly reconstructed
      expect(newGameState.wheels).toHaveLength(2);
      expect(newGameState.wheels[0].label).toBe('Main Wheel');
      expect(newGameState.wheels[1].label).toBe('Bonus Wheel');
      expect(newGameState.wheels[0].wedges).toHaveLength(3);
      expect(newGameState.wheels[1].wedges).toHaveLength(2);
      expect(newGameState.settings.maxPlayers).toBe(6);
      expect(newGameState.settings.deterministic).toBe(true);
      expect(newGameState.players).toEqual(mockGameState.players); // Should preserve existing players
    });

    it('should handle complex wheel configurations with media', async () => {
      const preset = presetManager.createPresetFromGameState(mockGameState, 'Media Test Preset');
      await presetManager.savePreset(preset);

      const loadedPreset = await presetManager.loadPreset(preset.id);
      const reconstructedState = presetManager.applyPresetToGameState(loadedPreset!);

      // Verify media was preserved
      const wedgeWithImage = reconstructedState.wheels[0].wedges.find(w => w.label === 'Blue Option');
      expect(wedgeWithImage?.media).toBeDefined();
      expect(wedgeWithImage?.media?.type).toBe('image');
      expect(wedgeWithImage?.media?.src).toBe('blue-option.jpg');

      const wedgeWithVideo = reconstructedState.wheels[0].wedges.find(w => w.label === 'Green Option');
      expect(wedgeWithVideo?.media).toBeDefined();
      expect(wedgeWithVideo?.media?.type).toBe('video');
      expect(wedgeWithVideo?.media?.src).toBe('green-option.mp4');
    });

    it('should preserve physics properties correctly', async () => {
      const preset = presetManager.createPresetFromGameState(mockGameState, 'Physics Test Preset');
      await presetManager.savePreset(preset);

      const loadedPreset = await presetManager.loadPreset(preset.id);
      const reconstructedState = presetManager.applyPresetToGameState(loadedPreset!);

      const outerWheel = reconstructedState.wheels.find(w => w.id === 'outer-wheel');
      const innerWheel = reconstructedState.wheels.find(w => w.id === 'inner-wheel');

      expect(outerWheel?.frictionCoefficient).toBe(0.1);
      expect(outerWheel?.clutchRatio).toBeUndefined();

      expect(innerWheel?.frictionCoefficient).toBe(0.15);
      expect(innerWheel?.clutchRatio).toBe(0.7);
    });
  });

  describe('PresetBrowser Integration', () => {
    let presetBrowser: PresetBrowser;
    let loadedPreset: Preset | null = null;
    let savedPresetData: any = null;
    let deletedPresetId: string | null = null;
    let errorMessage: string | null = null;

    beforeEach(async () => {
      // Create some test presets
      const preset1 = presetManager.createPresetFromGameState(mockGameState, 'Test Preset 1', 'First test preset');
      preset1.metadata.tags = ['test', 'simple'];
      preset1.metadata.difficulty = 'easy';

      const preset2 = presetManager.createPresetFromGameState(mockGameState, 'Advanced Preset', 'Complex preset');
      preset2.metadata.tags = ['advanced', 'complex'];
      preset2.metadata.difficulty = 'hard';

      await presetManager.savePreset(preset1);
      await presetManager.savePreset(preset2);

      // Create PresetBrowser with callback handlers
      presetBrowser = new PresetBrowser({
        container,
        onPresetLoad: (preset) => { loadedPreset = preset; },
        onPresetSave: (data) => { savedPresetData = data; },
        onPresetDelete: (id) => { deletedPresetId = id; },
        onError: (error) => { errorMessage = error; }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should display all saved presets in the browser', () => {
      const presetItems = container.querySelectorAll('.preset-item');
      expect(presetItems).toHaveLength(2);

      const presetNames = Array.from(presetItems).map(item => 
        item.querySelector('.preset-name')?.textContent
      );
      expect(presetNames).toContain('Test Preset 1');
      expect(presetNames).toContain('Advanced Preset');
    });

    it('should filter presets by search query', () => {
      const searchInput = container.querySelector('#preset-search') as HTMLInputElement;
      
      searchInput.value = 'Advanced';
      searchInput.dispatchEvent(new Event('input'));

      const visiblePresets = container.querySelectorAll('.preset-item');
      expect(visiblePresets).toHaveLength(1);
      expect(visiblePresets[0].textContent).toContain('Advanced Preset');
    });

    it('should filter presets by tags', () => {
      const searchInput = container.querySelector('#preset-search') as HTMLInputElement;
      
      searchInput.value = 'complex';
      searchInput.dispatchEvent(new Event('input'));

      const visiblePresets = container.querySelectorAll('.preset-item');
      expect(visiblePresets).toHaveLength(1);
      expect(visiblePresets[0].textContent).toContain('Advanced Preset');
    });

    it('should load preset when selected and load button clicked', async () => {
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      const loadButton = container.querySelector('#load-preset') as HTMLButtonElement;
      loadButton.click();

      expect(loadedPreset).toBeTruthy();
      expect(loadedPreset?.name).toContain('Preset');
    });

    it('should handle preset deletion through UI', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn().mockReturnValue(true);

      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      const deleteButton = container.querySelector('#delete-preset') as HTMLButtonElement;
      deleteButton.click();

      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(deletedPresetId).toBeTruthy();

      // Verify preset was removed from storage
      const remainingPresets = await presetManager.getAllPresets();
      expect(remainingPresets).toHaveLength(1);
    });

    it('should handle save preset workflow', () => {
      const saveButton = container.querySelector('#save-current-preset') as HTMLButtonElement;
      saveButton.click();

      const nameInput = container.querySelector('#preset-name') as HTMLInputElement;
      const descriptionInput = container.querySelector('#preset-description') as HTMLTextAreaElement;
      const tagsInput = container.querySelector('#preset-tags') as HTMLInputElement;
      const difficultySelect = container.querySelector('#preset-difficulty') as HTMLSelectElement;
      const confirmButton = container.querySelector('#confirm-save') as HTMLButtonElement;

      nameInput.value = 'New Integration Preset';
      descriptionInput.value = 'Created through integration test';
      tagsInput.value = 'integration, new, test';
      difficultySelect.value = 'medium';

      confirmButton.click();

      expect(savedPresetData).toEqual({
        name: 'New Integration Preset',
        description: 'Created through integration test',
        tags: ['integration', 'new', 'test'],
        difficulty: 'medium'
      });
    });

    it('should handle import/export workflow', async () => {
      // First, export a preset
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      // Mock document methods for export
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const exportButton = container.querySelector('#export-preset') as HTMLButtonElement;
      exportButton.click();

      expect(mockLink.click).toHaveBeenCalled();

      // Now test import
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const importTextArea = container.querySelector('#import-text') as HTMLTextAreaElement;
      
      // Create valid preset JSON
      const testPreset = presetManager.createPresetFromGameState(mockGameState, 'Imported Preset');
      const exportData = presetManager.exportPreset(testPreset);
      
      importTextArea.value = exportData;
      importTextArea.dispatchEvent(new Event('input'));

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 50));

      const confirmButton = container.querySelector('#confirm-import') as HTMLButtonElement;
      expect(confirmButton.disabled).toBe(false);

      confirmButton.click();

      // Wait for import to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify preset was imported
      const allPresets = await presetManager.getAllPresets();
      expect(allPresets.length).toBeGreaterThan(2);
      expect(allPresets.some(p => p.name === 'Imported Preset')).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle storage quota exceeded gracefully', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const preset = presetManager.createPresetFromGameState(mockGameState, 'Test Preset');

      await expect(presetManager.savePreset(preset)).rejects.toThrow('Failed to save preset');

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted preset data during load', async () => {
      // Save a valid preset first
      const preset = presetManager.createPresetFromGameState(mockGameState, 'Test Preset');
      await presetManager.savePreset(preset);

      // Corrupt the data
      const corruptedData = '{"invalid": "json", "missing": "required_fields"}';
      localStorage.setItem('wheel-game-presets', corruptedData);

      // Should return empty array and clear corrupted data
      const presets = await presetManager.getAllPresets();
      expect(presets).toEqual([]);
      expect(localStorage.getItem('wheel-game-presets')).toBeNull();
    });

    it('should validate imported preset data thoroughly', () => {
      const invalidPresetData = {
        id: 'test',
        name: 'Invalid Preset',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        modifiedAt: '2024-01-01T00:00:00.000Z',
        gameConfig: {
          wheels: [], // Invalid: empty wheels array
          settings: {
            maxPlayers: -1, // Invalid: negative players
            enableSound: 'yes', // Invalid: should be boolean
            theme: 'default',
            deterministic: false
          }
        },
        metadata: {
          tags: 'not-an-array', // Invalid: should be array
          difficulty: 'impossible', // Invalid: not in allowed values
          playerCount: { min: 1, max: 4 },
          estimatedDuration: 15
        }
      };

      expect(() => presetManager.importPreset(JSON.stringify(invalidPresetData)))
        .toThrow('Invalid preset data');
    });

    it('should handle network-like errors during preset operations', async () => {
      // Simulate a scenario where localStorage becomes unavailable mid-operation
      const preset = presetManager.createPresetFromGameState(mockGameState, 'Test Preset');
      await presetManager.savePreset(preset);

      // Mock localStorage.getItem to throw an error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('Storage unavailable');
      });

      await expect(presetManager.loadPreset(preset.id)).rejects.toThrow('Failed to load preset');

      // Restore original method
      localStorage.getItem = originalGetItem;
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of presets efficiently', async () => {
      const startTime = Date.now();

      // Create and save 100 presets
      const savePromises = [];
      for (let i = 0; i < 100; i++) {
        const preset = presetManager.createPresetFromGameState(
          mockGameState,
          `Performance Test Preset ${i}`,
          `Preset number ${i} for performance testing`
        );
        preset.metadata.tags = [`tag${i % 10}`, 'performance', 'test'];
        savePromises.push(presetManager.savePreset(preset));
      }

      await Promise.all(savePromises);

      const saveTime = Date.now() - startTime;
      expect(saveTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test loading all presets
      const loadStartTime = Date.now();
      const allPresets = await presetManager.getAllPresets();
      const loadTime = Date.now() - loadStartTime;

      expect(allPresets).toHaveLength(100);
      expect(loadTime).toBeLessThan(1000); // Should load within 1 second
    });

    it('should handle presets with large amounts of data', async () => {
      // Create a game state with many wheels and wedges
      const largeWedges: Wedge[] = [];
      for (let i = 0; i < 50; i++) {
        largeWedges.push({
          id: `wedge${i}`,
          label: `Option ${i} with a very long description that contains lots of text to test how the system handles large amounts of data`,
          weight: Math.random() * 10,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          media: {
            type: 'image',
            src: `https://example.com/very-long-url-that-represents-a-large-image-file-${i}.jpg`,
            alt: `Alternative text for image ${i} that is also quite long and descriptive`
          }
        });
      }

      const largeWheels: Wheel[] = [];
      for (let i = 0; i < 10; i++) {
        largeWheels.push({
          id: `wheel${i}`,
          label: `Large Wheel ${i}`,
          wedges: largeWedges,
          frictionCoefficient: 0.1 + (i * 0.01),
          clutchRatio: i > 0 ? 0.5 + (i * 0.05) : undefined,
          radius: 100 + (i * 20),
          position: { x: 300 + (i * 10), y: 300 + (i * 10) },
          currentAngle: 0,
          angularVelocity: 0
        });
      }

      const largeGameState: GameState = {
        ...mockGameState,
        wheels: largeWheels
      };

      const startTime = Date.now();
      const preset = presetManager.createPresetFromGameState(
        largeGameState,
        'Large Data Preset',
        'A preset with lots of wheels and wedges to test performance'
      );

      await presetManager.savePreset(preset);
      const saveTime = Date.now() - startTime;

      expect(saveTime).toBeLessThan(2000); // Should save within 2 seconds

      // Test export/import with large data
      const exportStartTime = Date.now();
      const exportedData = presetManager.exportPreset(preset);
      const exportTime = Date.now() - exportStartTime;

      expect(exportTime).toBeLessThan(1000); // Should export within 1 second
      expect(exportedData.length).toBeGreaterThan(10000); // Should be substantial amount of data

      const importStartTime = Date.now();
      const importedPreset = presetManager.importPreset(exportedData);
      const importTime = Date.now() - importStartTime;

      expect(importTime).toBeLessThan(1000); // Should import within 1 second
      expect(importedPreset.gameConfig.wheels).toHaveLength(10);
      expect(importedPreset.gameConfig.wheels[0].wedges).toHaveLength(50);
    });
  });
});