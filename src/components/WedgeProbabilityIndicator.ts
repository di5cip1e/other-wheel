/**
 * Visual indicator component for showing probability vs visual size differences
 * Provides UI feedback for wedge weight distribution in the editor
 */

import { Wedge } from '../models';
import { WedgeSelector } from '../utils/WedgeSelector';

export interface ProbabilityIndicatorConfig {
  showPercentages: boolean;
  showRecommendations: boolean;
  highlightMismatches: boolean;
  severityThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface IndicatorElement {
  element: HTMLElement;
  wedgeId: string;
  update: (wedge: Wedge, allWedges: Wedge[]) => void;
  destroy: () => void;
}

/**
 * Component for creating visual probability indicators in the editor
 */
export class WedgeProbabilityIndicator {
  private wedgeSelector: WedgeSelector;
  private config: ProbabilityIndicatorConfig;
  private indicators: Map<string, IndicatorElement> = new Map();

  constructor(config: Partial<ProbabilityIndicatorConfig> = {}) {
    this.wedgeSelector = new WedgeSelector();
    this.config = {
      showPercentages: true,
      showRecommendations: true,
      highlightMismatches: true,
      severityThresholds: {
        low: 0.02,
        medium: 0.1,
        high: 0.2,
      },
      ...config,
    };
  }

  /**
   * Create indicator element for a wedge
   * @param wedge The wedge to create indicator for
   * @param allWedges All wedges in the wheel for context
   * @param container Parent container to append indicator to
   * @returns Created indicator element
   */
  createIndicator(wedge: Wedge, allWedges: Wedge[], container: HTMLElement): IndicatorElement {
    const indicatorElement = document.createElement('div');
    indicatorElement.className = 'wedge-probability-indicator';
    indicatorElement.setAttribute('data-wedge-id', wedge.id);

    const indicator: IndicatorElement = {
      element: indicatorElement,
      wedgeId: wedge.id,
      update: (updatedWedge: Wedge, updatedAllWedges: Wedge[]) => {
        this.updateIndicatorContent(indicatorElement, updatedWedge, updatedAllWedges);
      },
      destroy: () => {
        if (indicatorElement.parentNode) {
          indicatorElement.parentNode.removeChild(indicatorElement);
        }
        this.indicators.delete(wedge.id);
      },
    };

    // Initial content update
    this.updateIndicatorContent(indicatorElement, wedge, allWedges);

    // Add to container and track
    container.appendChild(indicatorElement);
    this.indicators.set(wedge.id, indicator);

    return indicator;
  }

  /**
   * Update all indicators for a set of wedges
   * @param wedges Current wedges array
   */
  updateAllIndicators(wedges: Wedge[]): void {
    wedges.forEach(wedge => {
      const indicator = this.indicators.get(wedge.id);
      if (indicator) {
        indicator.update(wedge, wedges);
      }
    });
  }

  /**
   * Remove indicator for a specific wedge
   * @param wedgeId ID of wedge to remove indicator for
   */
  removeIndicator(wedgeId: string): void {
    const indicator = this.indicators.get(wedgeId);
    if (indicator) {
      indicator.destroy();
    }
  }

  /**
   * Remove all indicators
   */
  clearAllIndicators(): void {
    this.indicators.forEach(indicator => indicator.destroy());
    this.indicators.clear();
  }

  /**
   * Get indicator element for a specific wedge
   * @param wedgeId ID of wedge
   * @returns Indicator element or undefined if not found
   */
  getIndicator(wedgeId: string): IndicatorElement | undefined {
    return this.indicators.get(wedgeId);
  }

  /**
   * Update configuration
   * @param newConfig Partial configuration to merge
   */
  updateConfig(newConfig: Partial<ProbabilityIndicatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Note: To refresh indicators with new config, call updateAllIndicators() 
    // with the current wedges array after calling this method
  }

  /**
   * Private method to update indicator content
   */
  private updateIndicatorContent(element: HTMLElement, wedge: Wedge, allWedges: Wedge[]): void {
    const visualIndicators = this.wedgeSelector.generateVisualIndicators(allWedges);
    const wedgeIndicator = visualIndicators.find(ind => ind.wedgeId === wedge.id);
    
    if (!wedgeIndicator) {
      element.innerHTML = '<span class="error">Error: Wedge not found</span>';
      return;
    }

    // Clear existing content
    element.innerHTML = '';

    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = `probability-indicator severity-${wedgeIndicator.severity}`;

    // Add severity indicator
    const severityBadge = document.createElement('span');
    severityBadge.className = `severity-badge severity-${wedgeIndicator.severity}`;
    severityBadge.textContent = wedgeIndicator.severity.toUpperCase();
    mainContainer.appendChild(severityBadge);

    // Add probability information if enabled
    if (this.config.showPercentages) {
      const probabilityInfo = document.createElement('div');
      probabilityInfo.className = 'probability-info';
      
      const probabilityText = document.createElement('span');
      probabilityText.className = 'probability-text';
      probabilityText.textContent = `Probability: ${(wedgeIndicator.probabilityWeight * 100).toFixed(1)}%`;
      probabilityInfo.appendChild(probabilityText);

      const visualText = document.createElement('span');
      visualText.className = 'visual-text';
      visualText.textContent = `Visual: ${(wedgeIndicator.visualWeight * 100).toFixed(1)}%`;
      probabilityInfo.appendChild(visualText);

      const differenceText = document.createElement('span');
      differenceText.className = 'difference-text';
      differenceText.textContent = `Diff: ${(wedgeIndicator.difference * 100).toFixed(1)}%`;
      probabilityInfo.appendChild(differenceText);

      mainContainer.appendChild(probabilityInfo);
    }

    // Add recommendation if enabled
    if (this.config.showRecommendations && wedgeIndicator.severity !== 'low') {
      const recommendationElement = document.createElement('div');
      recommendationElement.className = 'recommendation';
      recommendationElement.textContent = wedgeIndicator.recommendation;
      mainContainer.appendChild(recommendationElement);
    }

    // Add visual progress bar for difference
    if (this.config.highlightMismatches) {
      const progressBar = document.createElement('div');
      progressBar.className = 'difference-progress-bar';
      
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      const fillPercentage = Math.min(wedgeIndicator.difference / this.config.severityThresholds.high * 100, 100);
      progressFill.style.width = `${fillPercentage}%`;
      
      progressBar.appendChild(progressFill);
      mainContainer.appendChild(progressBar);
    }

    element.appendChild(mainContainer);

    // Apply highlighting based on severity
    if (this.config.highlightMismatches) {
      element.classList.remove('highlight-low', 'highlight-medium', 'highlight-high');
      element.classList.add(`highlight-${wedgeIndicator.severity}`);
    }
  }

  /**
   * Generate CSS styles for the indicators
   * @returns CSS string for styling the indicators
   */
  static generateCSS(): string {
    return `
      .wedge-probability-indicator {
        margin: 4px 0;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
      }

      .probability-indicator {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .severity-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 10px;
        text-transform: uppercase;
      }

      .severity-badge.severity-low {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .severity-badge.severity-medium {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }

      .severity-badge.severity-high {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .probability-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 11px;
      }

      .probability-text {
        color: #007bff;
        font-weight: 500;
      }

      .visual-text {
        color: #6c757d;
      }

      .difference-text {
        color: #dc3545;
        font-weight: 500;
      }

      .recommendation {
        font-size: 10px;
        color: #6c757d;
        font-style: italic;
        margin-top: 4px;
      }

      .difference-progress-bar {
        width: 100%;
        height: 4px;
        background-color: #e9ecef;
        border-radius: 2px;
        overflow: hidden;
        margin-top: 4px;
      }

      .progress-fill {
        height: 100%;
        background-color: #dc3545;
        transition: width 0.3s ease;
      }

      .severity-low .progress-fill {
        background-color: #28a745;
      }

      .severity-medium .progress-fill {
        background-color: #ffc107;
      }

      .severity-high .progress-fill {
        background-color: #dc3545;
      }

      .highlight-low {
        border-color: #28a745;
        background-color: #f8fff9;
      }

      .highlight-medium {
        border-color: #ffc107;
        background-color: #fffef7;
      }

      .highlight-high {
        border-color: #dc3545;
        background-color: #fff5f5;
      }

      .wedge-probability-indicator .error {
        color: #dc3545;
        font-weight: bold;
      }
    `;
  }
}

/**
 * Utility function to inject CSS styles for probability indicators
 */
export function injectProbabilityIndicatorStyles(): void {
  const styleId = 'wedge-probability-indicator-styles';
  
  // Check if styles already exist
  if (document.getElementById(styleId)) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = WedgeProbabilityIndicator.generateCSS();
  document.head.appendChild(styleElement);
}

/**
 * Factory function to create a probability indicator with default configuration
 * @param config Optional configuration overrides
 * @returns WedgeProbabilityIndicator instance
 */
export function createProbabilityIndicator(config?: Partial<ProbabilityIndicatorConfig>): WedgeProbabilityIndicator {
  // Inject styles if not already present
  injectProbabilityIndicatorStyles();
  
  return new WedgeProbabilityIndicator(config);
}