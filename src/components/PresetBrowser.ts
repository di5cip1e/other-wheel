/**
 * PresetBrowser - UI component for managing saved game presets
 * Provides interface for browsing, loading, saving, and managing presets
 */

import { Preset } from '../models';
import { PresetManager } from '../managers/PresetManager';

export interface PresetBrowserOptions {
  container: HTMLElement;
  onPresetLoad?: (preset: Preset) => void;
  onPresetSave?: (preset: Preset) => void;
  onPresetDelete?: (presetId: string) => void;
  onError?: (error: string) => void;
}

export interface PresetBrowserState {
  presets: Preset[];
  selectedPreset: Preset | null;
  isLoading: boolean;
  searchQuery: string;
  sortBy: 'name' | 'created' | 'modified';
  sortOrder: 'asc' | 'desc';
  showImportDialog: boolean;
  showExportDialog: boolean;
}

export class PresetBrowser {
  private container: HTMLElement;
  private presetManager: PresetManager;
  private state: PresetBrowserState;
  private options: PresetBrowserOptions;

  constructor(options: PresetBrowserOptions) {
    this.options = options;
    this.container = options.container;
    this.presetManager = new PresetManager();
    
    this.state = {
      presets: [],
      selectedPreset: null,
      isLoading: false,
      searchQuery: '',
      sortBy: 'modified',
      sortOrder: 'desc',
      showImportDialog: false,
      showExportDialog: false
    };

    this.initialize();
  }

  /**
   * Initialize the preset browser UI
   */
  private async initialize(): Promise<void> {
    this.createUI();
    await this.loadPresets();
    this.attachEventListeners();
  }

  /**
   * Create the main UI structure
   */
  private createUI(): void {
    this.container.innerHTML = `
      <div class="preset-browser">
        <div class="preset-browser-header">
          <h3>Preset Manager</h3>
          <div class="preset-browser-actions">
            <button class="btn btn-primary" id="save-current-preset">
              <span class="icon">💾</span> Save Current
            </button>
            <button class="btn btn-secondary" id="import-preset">
              <span class="icon">📁</span> Import
            </button>
            <button class="btn btn-secondary" id="export-preset" disabled>
              <span class="icon">📤</span> Export
            </button>
          </div>
        </div>

        <div class="preset-browser-controls">
          <div class="search-container">
            <input 
              type="text" 
              id="preset-search" 
              placeholder="Search presets..." 
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
          
          <div class="sort-container">
            <select id="sort-by" class="sort-select">
              <option value="modified">Last Modified</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
            </select>
            <button id="sort-order" class="btn btn-icon" title="Toggle sort order">
              <span class="icon">⬇️</span>
            </button>
          </div>
        </div>

        <div class="preset-list-container">
          <div id="preset-list" class="preset-list">
            <!-- Preset items will be populated here -->
          </div>
          <div id="loading-indicator" class="loading-indicator" style="display: none;">
            <span class="spinner"></span> Loading presets...
          </div>
          <div id="empty-state" class="empty-state" style="display: none;">
            <span class="icon">📋</span>
            <p>No presets found</p>
            <p class="subtitle">Create your first preset by saving the current game configuration</p>
          </div>
        </div>

        <div class="preset-details" id="preset-details" style="display: none;">
          <div class="preset-details-header">
            <h4 id="preset-details-name"></h4>
            <div class="preset-details-actions">
              <button class="btn btn-primary" id="load-preset">Load</button>
              <button class="btn btn-danger" id="delete-preset">Delete</button>
            </div>
          </div>
          <div class="preset-details-content">
            <p id="preset-details-description"></p>
            <div class="preset-metadata">
              <div class="metadata-item">
                <label>Created:</label>
                <span id="preset-created-date"></span>
              </div>
              <div class="metadata-item">
                <label>Modified:</label>
                <span id="preset-modified-date"></span>
              </div>
              <div class="metadata-item">
                <label>Players:</label>
                <span id="preset-player-count"></span>
              </div>
              <div class="metadata-item">
                <label>Difficulty:</label>
                <span id="preset-difficulty"></span>
              </div>
              <div class="metadata-item">
                <label>Duration:</label>
                <span id="preset-duration"></span>
              </div>
            </div>
            <div class="preset-wheels-summary">
              <h5>Wheels Configuration</h5>
              <div id="preset-wheels-list"></div>
            </div>
          </div>
        </div>

        <!-- Import Dialog -->
        <div id="import-dialog" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h4>Import Preset</h4>
              <button class="modal-close" id="close-import-dialog">&times;</button>
            </div>
            <div class="modal-body">
              <div class="import-options">
                <div class="import-option">
                  <label for="import-file">Import from file:</label>
                  <input type="file" id="import-file" accept=".json" />
                </div>
                <div class="import-option">
                  <label for="import-text">Or paste JSON data:</label>
                  <textarea 
                    id="import-text" 
                    placeholder="Paste preset JSON data here..."
                    rows="10"
                  ></textarea>
                </div>
              </div>
              <div id="import-validation" class="validation-result" style="display: none;"></div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="cancel-import">Cancel</button>
              <button class="btn btn-primary" id="confirm-import" disabled>Import</button>
            </div>
          </div>
        </div>

        <!-- Save Dialog -->
        <div id="save-dialog" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h4>Save Preset</h4>
              <button class="modal-close" id="close-save-dialog">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="preset-name">Preset Name:</label>
                <input type="text" id="preset-name" placeholder="Enter preset name..." required />
              </div>
              <div class="form-group">
                <label for="preset-description">Description (optional):</label>
                <textarea 
                  id="preset-description" 
                  placeholder="Describe this preset..."
                  rows="3"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="preset-tags">Tags (comma-separated):</label>
                <input type="text" id="preset-tags" placeholder="fun, party, custom..." />
              </div>
              <div class="form-group">
                <label for="preset-difficulty">Difficulty:</label>
                <select id="preset-difficulty">
                  <option value="easy">Easy</option>
                  <option value="medium" selected>Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="cancel-save">Cancel</button>
              <button class="btn btn-primary" id="confirm-save">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Load all presets from storage
   */
  private async loadPresets(): Promise<void> {
    this.setLoading(true);
    
    try {
      const presets = await this.presetManager.getAllPresets();
      this.state.presets = presets;
      this.renderPresetList();
    } catch (error) {
      this.handleError(`Failed to load presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Render the list of presets
   */
  private renderPresetList(): void {
    const listContainer = this.container.querySelector('#preset-list') as HTMLElement;
    const emptyState = this.container.querySelector('#empty-state') as HTMLElement;
    
    // Filter and sort presets
    const filteredPresets = this.getFilteredAndSortedPresets();
    
    if (filteredPresets.length === 0) {
      listContainer.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    listContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    listContainer.innerHTML = filteredPresets.map(preset => `
      <div class="preset-item ${this.state.selectedPreset?.id === preset.id ? 'selected' : ''}" 
           data-preset-id="${preset.id}">
        <div class="preset-item-header">
          <h5 class="preset-name">${this.escapeHtml(preset.name)}</h5>
          <div class="preset-meta">
            <span class="preset-date">${this.formatDate(preset.modifiedAt)}</span>
            <span class="preset-difficulty ${preset.metadata.difficulty}">${preset.metadata.difficulty}</span>
          </div>
        </div>
        <div class="preset-item-content">
          <p class="preset-description">${this.escapeHtml(preset.description || 'No description')}</p>
          <div class="preset-summary">
            <span class="wheel-count">${preset.gameConfig.wheels.length} wheels</span>
            <span class="player-range">${preset.metadata.playerCount.min}-${preset.metadata.playerCount.max} players</span>
            <span class="duration">${preset.metadata.estimatedDuration}min</span>
          </div>
          ${preset.metadata.tags.length > 0 ? `
            <div class="preset-tags">
              ${preset.metadata.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Get filtered and sorted presets based on current state
   */
  private getFilteredAndSortedPresets(): Preset[] {
    let filtered = this.state.presets;
    
    // Apply search filter
    if (this.state.searchQuery.trim()) {
      const query = this.state.searchQuery.toLowerCase();
      filtered = filtered.filter(preset => 
        preset.name.toLowerCase().includes(query) ||
        (preset.description && preset.description.toLowerCase().includes(query)) ||
        preset.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.state.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'modified':
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
          break;
      }
      
      return this.state.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }

  /**
   * Show preset details
   */
  private showPresetDetails(preset: Preset): void {
    this.state.selectedPreset = preset;
    
    const detailsContainer = this.container.querySelector('#preset-details') as HTMLElement;
    const nameElement = this.container.querySelector('#preset-details-name') as HTMLElement;
    const descriptionElement = this.container.querySelector('#preset-details-description') as HTMLElement;
    const createdElement = this.container.querySelector('#preset-created-date') as HTMLElement;
    const modifiedElement = this.container.querySelector('#preset-modified-date') as HTMLElement;
    const playerCountElement = this.container.querySelector('#preset-player-count') as HTMLElement;
    const difficultyElement = this.container.querySelector('#preset-difficulty') as HTMLElement;
    const durationElement = this.container.querySelector('#preset-duration') as HTMLElement;
    const wheelsListElement = this.container.querySelector('#preset-wheels-list') as HTMLElement;
    const exportButton = this.container.querySelector('#export-preset') as HTMLButtonElement;
    
    nameElement.textContent = preset.name;
    descriptionElement.textContent = preset.description || 'No description provided';
    createdElement.textContent = this.formatDate(preset.createdAt);
    modifiedElement.textContent = this.formatDate(preset.modifiedAt);
    playerCountElement.textContent = `${preset.metadata.playerCount.min}-${preset.metadata.playerCount.max}`;
    difficultyElement.textContent = preset.metadata.difficulty;
    difficultyElement.className = `difficulty ${preset.metadata.difficulty}`;
    durationElement.textContent = `${preset.metadata.estimatedDuration} minutes`;
    
    // Show wheels summary
    wheelsListElement.innerHTML = preset.gameConfig.wheels.map(wheel => `
      <div class="wheel-summary">
        <strong>${this.escapeHtml(wheel.label)}</strong>
        <span class="wedge-count">${wheel.wedges.length} wedges</span>
      </div>
    `).join('');
    
    detailsContainer.style.display = 'block';
    exportButton.disabled = false;
    
    // Update selected state in list
    this.renderPresetList();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Search functionality
    const searchInput = this.container.querySelector('#preset-search') as HTMLInputElement;
    searchInput.addEventListener('input', (e) => {
      this.state.searchQuery = (e.target as HTMLInputElement).value;
      this.renderPresetList();
    });
    
    // Sort functionality
    const sortBySelect = this.container.querySelector('#sort-by') as HTMLSelectElement;
    sortBySelect.addEventListener('change', (e) => {
      this.state.sortBy = (e.target as HTMLSelectElement).value as any;
      this.renderPresetList();
    });
    
    const sortOrderButton = this.container.querySelector('#sort-order') as HTMLButtonElement;
    sortOrderButton.addEventListener('click', () => {
      this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
      const icon = sortOrderButton.querySelector('.icon') as HTMLElement;
      icon.textContent = this.state.sortOrder === 'asc' ? '⬆️' : '⬇️';
      this.renderPresetList();
    });
    
    // Preset list item selection
    this.container.addEventListener('click', (e) => {
      const presetItem = (e.target as HTMLElement).closest('.preset-item');
      if (presetItem) {
        const presetId = presetItem.getAttribute('data-preset-id');
        const preset = this.state.presets.find(p => p.id === presetId);
        if (preset) {
          this.showPresetDetails(preset);
        }
      }
    });
    
    // Action buttons
    this.container.querySelector('#save-current-preset')?.addEventListener('click', () => {
      this.showSaveDialog();
    });
    
    this.container.querySelector('#import-preset')?.addEventListener('click', () => {
      this.showImportDialog();
    });
    
    this.container.querySelector('#export-preset')?.addEventListener('click', () => {
      if (this.state.selectedPreset) {
        this.exportPreset(this.state.selectedPreset);
      }
    });
    
    this.container.querySelector('#load-preset')?.addEventListener('click', () => {
      if (this.state.selectedPreset) {
        this.loadPreset(this.state.selectedPreset);
      }
    });
    
    this.container.querySelector('#delete-preset')?.addEventListener('click', () => {
      if (this.state.selectedPreset) {
        this.deletePreset(this.state.selectedPreset);
      }
    });
    
    // Modal event listeners
    this.attachModalEventListeners();
  }

  /**
   * Attach modal-specific event listeners
   */
  private attachModalEventListeners(): void {
    // Import dialog
    const importDialog = this.container.querySelector('#import-dialog') as HTMLElement;
    const importFileInput = this.container.querySelector('#import-file') as HTMLInputElement;
    const importTextArea = this.container.querySelector('#import-text') as HTMLTextAreaElement;
    const confirmImportButton = this.container.querySelector('#confirm-import') as HTMLButtonElement;
    
    this.container.querySelector('#close-import-dialog')?.addEventListener('click', () => {
      this.hideImportDialog();
    });
    
    this.container.querySelector('#cancel-import')?.addEventListener('click', () => {
      this.hideImportDialog();
    });
    
    importFileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importTextArea.value = content;
          this.validateImportData(content);
        };
        reader.readAsText(file);
      }
    });
    
    importTextArea.addEventListener('input', (e) => {
      const content = (e.target as HTMLTextAreaElement).value;
      this.validateImportData(content);
    });
    
    confirmImportButton.addEventListener('click', () => {
      this.performImport();
    });
    
    // Save dialog
    const saveDialog = this.container.querySelector('#save-dialog') as HTMLElement;
    const presetNameInput = this.container.querySelector('#preset-name') as HTMLInputElement;
    
    this.container.querySelector('#close-save-dialog')?.addEventListener('click', () => {
      this.hideSaveDialog();
    });
    
    this.container.querySelector('#cancel-save')?.addEventListener('click', () => {
      this.hideSaveDialog();
    });
    
    this.container.querySelector('#confirm-save')?.addEventListener('click', () => {
      this.performSave();
    });
    
    presetNameInput.addEventListener('input', () => {
      const confirmButton = this.container.querySelector('#confirm-save') as HTMLButtonElement;
      confirmButton.disabled = !presetNameInput.value.trim();
    });
    
    // Close modals when clicking outside
    [importDialog, saveDialog].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideImportDialog();
          this.hideSaveDialog();
        }
      });
    });
  }

  /**
   * Show import dialog
   */
  private showImportDialog(): void {
    const dialog = this.container.querySelector('#import-dialog') as HTMLElement;
    dialog.style.display = 'block';
    this.state.showImportDialog = true;
  }

  /**
   * Hide import dialog
   */
  private hideImportDialog(): void {
    const dialog = this.container.querySelector('#import-dialog') as HTMLElement;
    dialog.style.display = 'none';
    this.state.showImportDialog = false;
    
    // Clear form
    (this.container.querySelector('#import-file') as HTMLInputElement).value = '';
    (this.container.querySelector('#import-text') as HTMLTextAreaElement).value = '';
    (this.container.querySelector('#confirm-import') as HTMLButtonElement).disabled = true;
    
    const validationResult = this.container.querySelector('#import-validation') as HTMLElement;
    validationResult.style.display = 'none';
  }

  /**
   * Show save dialog
   */
  private showSaveDialog(): void {
    const dialog = this.container.querySelector('#save-dialog') as HTMLElement;
    dialog.style.display = 'block';
    
    // Focus on name input
    const nameInput = this.container.querySelector('#preset-name') as HTMLInputElement;
    nameInput.focus();
  }

  /**
   * Hide save dialog
   */
  private hideSaveDialog(): void {
    const dialog = this.container.querySelector('#save-dialog') as HTMLElement;
    dialog.style.display = 'none';
    
    // Clear form
    (this.container.querySelector('#preset-name') as HTMLInputElement).value = '';
    (this.container.querySelector('#preset-description') as HTMLTextAreaElement).value = '';
    (this.container.querySelector('#preset-tags') as HTMLInputElement).value = '';
    (this.container.querySelector('#preset-difficulty') as HTMLSelectElement).value = 'medium';
  }

  /**
   * Validate import data
   */
  private validateImportData(jsonString: string): void {
    const validationResult = this.container.querySelector('#import-validation') as HTMLElement;
    const confirmButton = this.container.querySelector('#confirm-import') as HTMLButtonElement;
    
    if (!jsonString.trim()) {
      validationResult.style.display = 'none';
      confirmButton.disabled = true;
      return;
    }
    
    try {
      const preset = this.presetManager.importPreset(jsonString);
      const validation = this.presetManager.validatePreset(preset);
      
      validationResult.style.display = 'block';
      
      if (validation.isValid) {
        validationResult.className = 'validation-result success';
        validationResult.innerHTML = `
          <div class="validation-header">✅ Valid preset data</div>
          <div class="validation-details">
            <strong>${this.escapeHtml(preset.name)}</strong><br>
            ${preset.gameConfig.wheels.length} wheels, ${preset.metadata.playerCount.min}-${preset.metadata.playerCount.max} players
          </div>
          ${validation.warnings.length > 0 ? `
            <div class="validation-warnings">
              <strong>Warnings:</strong>
              <ul>${validation.warnings.map(w => `<li>${this.escapeHtml(w)}</li>`).join('')}</ul>
            </div>
          ` : ''}
        `;
        confirmButton.disabled = false;
      } else {
        validationResult.className = 'validation-result error';
        validationResult.innerHTML = `
          <div class="validation-header">❌ Invalid preset data</div>
          <div class="validation-errors">
            <ul>${validation.errors.map(e => `<li>${this.escapeHtml(e)}</li>`).join('')}</ul>
          </div>
        `;
        confirmButton.disabled = true;
      }
    } catch (error) {
      validationResult.style.display = 'block';
      validationResult.className = 'validation-result error';
      validationResult.innerHTML = `
        <div class="validation-header">❌ Import failed</div>
        <div class="validation-error">${this.escapeHtml(error instanceof Error ? error.message : 'Unknown error')}</div>
      `;
      confirmButton.disabled = true;
    }
  }

  /**
   * Perform import operation
   */
  private async performImport(): Promise<void> {
    const importText = (this.container.querySelector('#import-text') as HTMLTextAreaElement).value;
    
    try {
      const preset = this.presetManager.importPreset(importText);
      await this.presetManager.savePreset(preset);
      
      this.hideImportDialog();
      await this.loadPresets();
      
      // Select the imported preset
      this.showPresetDetails(preset);
      
      this.showSuccessMessage(`Preset "${preset.name}" imported successfully!`);
    } catch (error) {
      this.handleError(`Failed to import preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform save operation
   */
  private async performSave(): Promise<void> {
    const name = (this.container.querySelector('#preset-name') as HTMLInputElement).value.trim();
    const description = (this.container.querySelector('#preset-description') as HTMLTextAreaElement).value.trim();
    const tagsString = (this.container.querySelector('#preset-tags') as HTMLInputElement).value.trim();
    const difficulty = (this.container.querySelector('#preset-difficulty') as HTMLSelectElement).value as 'easy' | 'medium' | 'hard';
    
    if (!name) {
      this.handleError('Preset name is required');
      return;
    }
    
    try {
      // This would typically get the current game state from a parent component
      // For now, we'll emit an event that the parent can handle
      if (this.options.onPresetSave) {
        const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
        
        // Create a basic preset structure - the parent will fill in the actual game config
        const presetData = {
          name,
          description: description || undefined,
          tags,
          difficulty
        };
        
        this.options.onPresetSave(presetData as any);
        this.hideSaveDialog();
      }
    } catch (error) {
      this.handleError(`Failed to save preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a preset
   */
  private loadPreset(preset: Preset): void {
    if (this.options.onPresetLoad) {
      this.options.onPresetLoad(preset);
    }
  }

  /**
   * Export a preset
   */
  private exportPreset(preset: Preset): void {
    try {
      const exportData = this.presetManager.exportPreset(preset);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${preset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      this.showSuccessMessage(`Preset "${preset.name}" exported successfully!`);
    } catch (error) {
      this.handleError(`Failed to export preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a preset
   */
  private async deletePreset(preset: Preset): Promise<void> {
    if (!confirm(`Are you sure you want to delete the preset "${preset.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const success = await this.presetManager.deletePreset(preset.id);
      
      if (success) {
        await this.loadPresets();
        
        // Hide details if the deleted preset was selected
        if (this.state.selectedPreset?.id === preset.id) {
          const detailsContainer = this.container.querySelector('#preset-details') as HTMLElement;
          detailsContainer.style.display = 'none';
          this.state.selectedPreset = null;
          
          const exportButton = this.container.querySelector('#export-preset') as HTMLButtonElement;
          exportButton.disabled = true;
        }
        
        this.showSuccessMessage(`Preset "${preset.name}" deleted successfully!`);
        
        if (this.options.onPresetDelete) {
          this.options.onPresetDelete(preset.id);
        }
      } else {
        this.handleError('Preset not found or already deleted');
      }
    } catch (error) {
      this.handleError(`Failed to delete preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.state.isLoading = loading;
    const loadingIndicator = this.container.querySelector('#loading-indicator') as HTMLElement;
    const presetList = this.container.querySelector('#preset-list') as HTMLElement;
    
    if (loading) {
      loadingIndicator.style.display = 'block';
      presetList.style.display = 'none';
    } else {
      loadingIndicator.style.display = 'none';
      presetList.style.display = 'block';
    }
  }

  /**
   * Handle errors
   */
  private handleError(message: string): void {
    console.error('PresetBrowser error:', message);
    
    if (this.options.onError) {
      this.options.onError(message);
    } else {
      // Default error display
      alert(`Error: ${message}`);
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Public API methods
   */

  /**
   * Refresh the preset list
   */
  public async refresh(): Promise<void> {
    await this.loadPresets();
  }

  /**
   * Get the currently selected preset
   */
  public getSelectedPreset(): Preset | null {
    return this.state.selectedPreset;
  }

  /**
   * Select a preset by ID
   */
  public selectPreset(presetId: string): void {
    const preset = this.state.presets.find(p => p.id === presetId);
    if (preset) {
      this.showPresetDetails(preset);
    }
  }

  /**
   * Clear the current selection
   */
  public clearSelection(): void {
    this.state.selectedPreset = null;
    const detailsContainer = this.container.querySelector('#preset-details') as HTMLElement;
    detailsContainer.style.display = 'none';
    
    const exportButton = this.container.querySelector('#export-preset') as HTMLButtonElement;
    exportButton.disabled = true;
    
    this.renderPresetList();
  }

  /**
   * Get storage information
   */
  public getStorageInfo(): { used: number; total: number; presetCount: number } {
    return this.presetManager.getStorageInfo();
  }

  /**
   * Destroy the component and clean up
   */
  public destroy(): void {
    this.container.innerHTML = '';
  }
}