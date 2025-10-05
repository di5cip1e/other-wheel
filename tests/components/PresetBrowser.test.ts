/**
 * Tests for PresetBrowser - UI component for managing presets
 */

import { PresetBrowser, PresetBrowserOptions } from '../../src/components/PresetBrowser';
import { PresetManager } from '../../src/managers/PresetManager';
import { Preset } from '../../src/models';

// Mock PresetManager
jest.mock('../../src/managers/PresetManager');

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

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-url')
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: jest.fn()
});

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null;
  result: string | null = null;

  readAsText(_file: File) {
    setTimeout(() => {
      this.result = 'mock file content';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

Object.defineProperty(window, 'FileReader', {
  value: MockFileReader
});

describe('PresetBrowser', () => {
  let container: HTMLElement;
  let presetBrowser: PresetBrowser | undefined;
  let mockPresetManager: jest.Mocked<PresetManager>;
  let mockOptions: PresetBrowserOptions;
  let mockPresets: Preset[];

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock presets
    mockPresets = [
      {
        id: 'preset1',
        name: 'Test Preset 1',
        description: 'First test preset',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        modifiedAt: '2024-01-01T12:00:00.000Z',
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
                  color: '#ff0000'
                }
              ],
              physicsProperties: {
                frictionCoefficient: 0.1
              },
              renderProperties: {
                radius: 200,
                position: { x: 300, y: 300 }
              }
            }
          ],
          settings: {
            maxPlayers: 4,
            enableSound: true,
            theme: 'default',
            deterministic: false
          }
        },
        metadata: {
          tags: ['test', 'fun'],
          difficulty: 'medium',
          playerCount: { min: 1, max: 4 },
          estimatedDuration: 15
        }
      },
      {
        id: 'preset2',
        name: 'Test Preset 2',
        description: 'Second test preset',
        version: '1.0.0',
        createdAt: '2024-01-02T00:00:00.000Z',
        modifiedAt: '2024-01-02T12:00:00.000Z',
        gameConfig: {
          wheels: [
            {
              id: 'wheel2',
              label: 'Another Wheel',
              wedges: [
                {
                  id: 'wedge2',
                  label: 'Another Wedge',
                  weight: 2,
                  color: '#00ff00'
                }
              ],
              physicsProperties: {
                frictionCoefficient: 0.15
              },
              renderProperties: {
                radius: 150,
                position: { x: 250, y: 250 }
              }
            }
          ],
          settings: {
            maxPlayers: 6,
            enableSound: false,
            theme: 'dark',
            deterministic: true
          }
        },
        metadata: {
          tags: ['advanced'],
          difficulty: 'hard',
          playerCount: { min: 2, max: 6 },
          estimatedDuration: 30
        }
      }
    ];

    // Setup mock options
    mockOptions = {
      container,
      onPresetLoad: jest.fn(),
      onPresetSave: jest.fn(),
      onPresetDelete: jest.fn(),
      onError: jest.fn()
    };

    // Setup mock PresetManager
    mockPresetManager = new PresetManager() as jest.Mocked<PresetManager>;
    mockPresetManager.getAllPresets = jest.fn().mockResolvedValue(mockPresets);
    mockPresetManager.loadPreset = jest.fn().mockImplementation((id: string) => {
      const preset = mockPresets.find(p => p.id === id);
      return Promise.resolve(preset || null);
    });
    mockPresetManager.savePreset = jest.fn().mockResolvedValue(undefined);
    mockPresetManager.deletePreset = jest.fn().mockResolvedValue(true);
    mockPresetManager.exportPreset = jest.fn().mockReturnValue('{"preset": "data"}');
    mockPresetManager.importPreset = jest.fn().mockReturnValue(mockPresets[0]);
    mockPresetManager.validatePreset = jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });

    // Replace the PresetManager constructor to return our mock
    (PresetManager as jest.MockedClass<typeof PresetManager>).mockImplementation(() => mockPresetManager);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create UI structure on initialization', async () => {
      presetBrowser = new PresetBrowser(mockOptions);

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.querySelector('.preset-browser')).toBeTruthy();
      expect(container.querySelector('#preset-list')).toBeTruthy();
      expect(container.querySelector('#preset-search')).toBeTruthy();
      expect(container.querySelector('#save-current-preset')).toBeTruthy();
      expect(container.querySelector('#import-preset')).toBeTruthy();
      expect(container.querySelector('#export-preset')).toBeTruthy();
    });

    it('should load presets on initialization', async () => {
      presetBrowser = new PresetBrowser(mockOptions);

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPresetManager.getAllPresets).toHaveBeenCalled();
    });

    it('should render preset list after loading', async () => {
      presetBrowser = new PresetBrowser(mockOptions);

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      const presetItems = container.querySelectorAll('.preset-item');
      expect(presetItems).toHaveLength(2);

      const firstPreset = presetItems[0];
      expect(firstPreset?.textContent).toContain('Test Preset 1');
      expect(firstPreset?.textContent).toContain('First test preset');
    });
  });

  describe('Preset List Management', () => {
    beforeEach(async () => {
      presetBrowser = new PresetBrowser(mockOptions);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should display empty state when no presets exist', async () => {
      mockPresetManager.getAllPresets.mockResolvedValueOnce([]);
      presetBrowser = new PresetBrowser(mockOptions);

      await new Promise(resolve => setTimeout(resolve, 0));

      const emptyState = container.querySelector('#empty-state');
      expect((emptyState as HTMLElement)?.style.display).not.toBe('none');
      expect(emptyState?.textContent).toContain('No presets found');
    });

    it('should filter presets based on search query', async () => {
      const searchInput = container.querySelector('#preset-search') as HTMLInputElement;
      
      // Simulate typing in search
      searchInput.value = 'Test Preset 1';
      searchInput.dispatchEvent(new Event('input'));

      const visiblePresets = container.querySelectorAll('.preset-item');
      expect(visiblePresets).toHaveLength(1);
      expect(visiblePresets[0]?.textContent).toContain('Test Preset 1');
    });

    it('should sort presets by different criteria', async () => {
      const sortSelect = container.querySelector('#sort-by') as HTMLSelectElement;
      
      // Sort by name
      sortSelect.value = 'name';
      sortSelect.dispatchEvent(new Event('change'));

      const presetItems = container.querySelectorAll('.preset-item');
      const firstPresetName = presetItems[0]?.querySelector('.preset-name')?.textContent;
      const secondPresetName = presetItems[1]?.querySelector('.preset-name')?.textContent;

      expect(firstPresetName).toBe('Test Preset 1');
      expect(secondPresetName).toBe('Test Preset 2');
    });

    it('should toggle sort order', async () => {
      const sortOrderButton = container.querySelector('#sort-order') as HTMLButtonElement;
      
      sortOrderButton.click();

      const icon = sortOrderButton.querySelector('.icon');
      expect(icon?.textContent).toBe('⬆️');
    });

    it('should select preset when clicked', async () => {
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      
      firstPresetItem.click();

      expect(firstPresetItem.classList.contains('selected')).toBe(true);
      
      const detailsContainer = container.querySelector('#preset-details');
      expect((detailsContainer as HTMLElement)?.style.display).not.toBe('none');
    });
  });

  describe('Preset Details', () => {
    beforeEach(async () => {
      presetBrowser = new PresetBrowser(mockOptions);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Select first preset
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();
    });

    it('should display preset details when selected', () => {
      const nameElement = container.querySelector('#preset-details-name');
      const descriptionElement = container.querySelector('#preset-details-description');
      
      expect(nameElement?.textContent).toBe('Test Preset 1');
      expect(descriptionElement?.textContent).toBe('First test preset');
    });

    it('should display preset metadata', () => {
      const difficultyElement = container.querySelector('#preset-difficulty');
      const playerCountElement = container.querySelector('#preset-player-count');
      const durationElement = container.querySelector('#preset-duration');
      
      expect(difficultyElement?.textContent).toBe('medium');
      expect(playerCountElement?.textContent).toBe('1-4');
      expect(durationElement?.textContent).toBe('15 minutes');
    });

    it('should display wheels summary', () => {
      const wheelsListElement = container.querySelector('#preset-wheels-list');
      
      expect(wheelsListElement?.textContent).toContain('Test Wheel');
      expect(wheelsListElement?.textContent).toContain('1 wedges');
    });

    it('should enable export button when preset is selected', () => {
      const exportButton = container.querySelector('#export-preset') as HTMLButtonElement;
      
      expect(exportButton.disabled).toBe(false);
    });
  });

  describe('Preset Actions', () => {
    beforeEach(async () => {
      presetBrowser = new PresetBrowser(mockOptions);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should load preset when load button is clicked', async () => {
      // Select first preset
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      const loadButton = container.querySelector('#load-preset') as HTMLButtonElement;
      loadButton.click();

      expect(mockOptions.onPresetLoad).toHaveBeenCalledWith(mockPresets[0]);
    });

    it('should delete preset when delete button is clicked', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn().mockReturnValue(true);

      // Select first preset
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      const deleteButton = container.querySelector('#delete-preset') as HTMLButtonElement;
      deleteButton.click();

      expect(mockPresetManager.deletePreset).toHaveBeenCalledWith('preset1');
      expect(mockOptions.onPresetDelete).toHaveBeenCalledWith('preset1');
    });

    it('should not delete preset when user cancels confirmation', async () => {
      // Mock confirm dialog to return false
      window.confirm = jest.fn().mockReturnValue(false);

      // Select first preset
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      const deleteButton = container.querySelector('#delete-preset') as HTMLButtonElement;
      deleteButton.click();

      expect(mockPresetManager.deletePreset).not.toHaveBeenCalled();
    });

    it('should export preset when export button is clicked', async () => {
      // Mock document.createElement and appendChild for download link
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      // Select first preset
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      const exportButton = container.querySelector('#export-preset') as HTMLButtonElement;
      exportButton.click();

      expect(mockPresetManager.exportPreset).toHaveBeenCalledWith(mockPresets[0]);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Save Dialog', () => {
    beforeEach(async () => {
      presetBrowser = new PresetBrowser(mockOptions);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should show save dialog when save button is clicked', () => {
      const saveButton = container.querySelector('#save-current-preset') as HTMLButtonElement;
      saveButton.click();

      const saveDialog = container.querySelector('#save-dialog') as HTMLElement;
      expect(saveDialog.style.display).toBe('block');
    });

    it('should hide save dialog when cancel is clicked', () => {
      const saveButton = container.querySelector('#save-current-preset') as HTMLButtonElement;
      saveButton.click();

      const cancelButton = container.querySelector('#cancel-save') as HTMLButtonElement;
      cancelButton.click();

      const saveDialog = container.querySelector('#save-dialog') as HTMLElement;
      expect(saveDialog.style.display).toBe('none');
    });

    it('should enable confirm button when name is entered', () => {
      const saveButton = container.querySelector('#save-current-preset') as HTMLButtonElement;
      saveButton.click();

      const nameInput = container.querySelector('#preset-name') as HTMLInputElement;
      const confirmButton = container.querySelector('#confirm-save') as HTMLButtonElement;

      expect(confirmButton.disabled).toBe(true);

      nameInput.value = 'New Preset';
      nameInput.dispatchEvent(new Event('input'));

      expect(confirmButton.disabled).toBe(false);
    });

    it('should call onPresetSave when save is confirmed', () => {
      const saveButton = container.querySelector('#save-current-preset') as HTMLButtonElement;
      saveButton.click();

      const nameInput = container.querySelector('#preset-name') as HTMLInputElement;
      const descriptionInput = container.querySelector('#preset-description') as HTMLTextAreaElement;
      const tagsInput = container.querySelector('#preset-tags') as HTMLInputElement;
      const difficultySelect = container.querySelector('#preset-difficulty') as HTMLSelectElement;
      const confirmButton = container.querySelector('#confirm-save') as HTMLButtonElement;

      nameInput.value = 'New Preset';
      descriptionInput.value = 'Test description';
      tagsInput.value = 'tag1, tag2';
      difficultySelect.value = 'hard';

      confirmButton.click();

      expect(mockOptions.onPresetSave).toHaveBeenCalledWith({
        name: 'New Preset',
        description: 'Test description',
        tags: ['tag1', 'tag2'],
        difficulty: 'hard'
      });
    });
  });

  describe('Import Dialog', () => {
    beforeEach(async () => {
      presetBrowser = new PresetBrowser(mockOptions);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should show import dialog when import button is clicked', () => {
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const importDialog = container.querySelector('#import-dialog') as HTMLElement;
      expect(importDialog.style.display).toBe('block');
    });

    it('should hide import dialog when cancel is clicked', () => {
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const cancelButton = container.querySelector('#cancel-import') as HTMLButtonElement;
      cancelButton.click();

      const importDialog = container.querySelector('#import-dialog') as HTMLElement;
      expect(importDialog.style.display).toBe('none');
    });

    it('should validate import data when text is entered', async () => {
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const importTextArea = container.querySelector('#import-text') as HTMLTextAreaElement;
      importTextArea.value = '{"valid": "json"}';
      importTextArea.dispatchEvent(new Event('input'));

      expect(mockPresetManager.importPreset).toHaveBeenCalledWith('{"valid": "json"}');
      expect(mockPresetManager.validatePreset).toHaveBeenCalled();
    });

    it('should handle file import', async () => {
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const fileInput = container.querySelector('#import-file') as HTMLInputElement;
      const mockFile = new File(['{"test": "data"}'], 'preset.json', { type: 'application/json' });

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      });

      fileInput.dispatchEvent(new Event('change'));

      // Wait for FileReader to process
      await new Promise(resolve => setTimeout(resolve, 0));

      const importTextArea = container.querySelector('#import-text') as HTMLTextAreaElement;
      expect(importTextArea.value).toBe('mock file content');
    });

    it('should import preset when confirm is clicked', async () => {
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const importTextArea = container.querySelector('#import-text') as HTMLTextAreaElement;
      const confirmButton = container.querySelector('#confirm-import') as HTMLButtonElement;

      importTextArea.value = '{"valid": "preset"}';
      importTextArea.dispatchEvent(new Event('input'));

      // Enable the confirm button (normally done by validation)
      confirmButton.disabled = false;
      confirmButton.click();

      expect(mockPresetManager.importPreset).toHaveBeenCalledWith('{"valid": "preset"}');
      expect(mockPresetManager.savePreset).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      presetBrowser = new PresetBrowser(mockOptions);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should handle preset loading errors', async () => {
      mockPresetManager.getAllPresets.mockRejectedValueOnce(new Error('Load failed'));
      
      presetBrowser = new PresetBrowser(mockOptions);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockOptions.onError).toHaveBeenCalledWith('Failed to load presets: Load failed');
    });

    it('should handle preset deletion errors', async () => {
      mockPresetManager.deletePreset.mockRejectedValueOnce(new Error('Delete failed'));
      window.confirm = jest.fn().mockReturnValue(true);

      // Select first preset
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      const deleteButton = container.querySelector('#delete-preset') as HTMLButtonElement;
      deleteButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockOptions.onError).toHaveBeenCalledWith('Failed to delete preset: Delete failed');
    });

    it('should handle import validation errors', () => {
      mockPresetManager.validatePreset.mockReturnValueOnce({
        isValid: false,
        errors: ['Invalid preset data'],
        warnings: []
      });

      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const importTextArea = container.querySelector('#import-text') as HTMLTextAreaElement;
      importTextArea.value = '{"invalid": "data"}';
      importTextArea.dispatchEvent(new Event('input'));

      const validationResult = container.querySelector('#import-validation');
      expect(validationResult?.textContent).toContain('Invalid preset data');
      expect(validationResult?.classList.contains('error')).toBe(true);
    });

    it('should handle export errors gracefully', () => {
      mockPresetManager.exportPreset.mockImplementation(() => {
        throw new Error('Export failed');
      });

      // Select first preset
      const firstPresetItem = container.querySelector('.preset-item') as HTMLElement;
      firstPresetItem.click();

      const exportButton = container.querySelector('#export-preset') as HTMLButtonElement;
      exportButton.click();

      expect(mockOptions.onError).toHaveBeenCalledWith('Failed to export preset: Export failed');
    });
  });

  describe('Modal Interactions', () => {
    beforeEach(async () => {
      presetBrowser = new PresetBrowser(mockOptions);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should close modal when clicking outside', () => {
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const importDialog = container.querySelector('#import-dialog') as HTMLElement;
      expect(importDialog.style.display).toBe('block');

      // Simulate clicking on the modal backdrop
      importDialog.click();

      expect(importDialog.style.display).toBe('none');
    });

    it('should close modal when clicking close button', () => {
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const closeButton = container.querySelector('#close-import-dialog') as HTMLButtonElement;
      closeButton.click();

      const importDialog = container.querySelector('#import-dialog') as HTMLElement;
      expect(importDialog.style.display).toBe('none');
    });

    it('should clear form when closing modal', () => {
      const importButton = container.querySelector('#import-preset') as HTMLButtonElement;
      importButton.click();

      const importTextArea = container.querySelector('#import-text') as HTMLTextAreaElement;
      importTextArea.value = 'test data';

      const closeButton = container.querySelector('#close-import-dialog') as HTMLButtonElement;
      closeButton.click();

      expect(importTextArea.value).toBe('');
    });
  });
});