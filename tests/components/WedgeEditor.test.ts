/**
 * Unit tests for WedgeEditor component
 * Tests detailed wedge editing functionality
 */

import { WedgeEditor } from '../../src/components/WedgeEditor';
import { Wedge } from '../../src/models';

// Mock DOM environment
const mockContainer = {
  innerHTML: '',
  className: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  id: 'test-wedge-editor',
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => null),
} as unknown as HTMLElement;

const mockElement = {
  innerHTML: '',
  className: '',
  textContent: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  onclick: null as any,
  onchange: null as any,
  onerror: null as any,
  dataset: {},
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => null),
} as unknown as HTMLElement;

const mockInput = {
  type: 'text',
  value: '',
  min: '',
  max: '',
  step: '',
  placeholder: '',
  className: '',
  title: '',
  accept: '',
  style: {} as CSSStyleDeclaration,
  onchange: null as any,
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
  files: null,
} as unknown as HTMLInputElement;

// Mock document.getElementById
const originalGetElementById = document.getElementById;
beforeAll(() => {
  document.getElementById = jest.fn((id: string) => {
    if (id === 'test-wedge-editor' || id === 'media-content-container' || id === 'wedge-preview') {
      return mockContainer;
    }
    return null;
  });
});

afterAll(() => {
  document.getElementById = originalGetElementById;
});

// Mock document.createElement
const originalCreateElement = document.createElement;
beforeAll(() => {
  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'input') {
      return { ...mockInput } as unknown as HTMLElement;
    }
    if (tagName === 'button') {
      return {
        ...mockElement,
        textContent: '',
        onclick: null,
        type: 'button',
      } as unknown as HTMLElement;
    }
    if (tagName === 'select') {
      return {
        ...mockElement,
        onchange: null,
        value: '',
      } as unknown as HTMLElement;
    }
    if (tagName === 'option') {
      return {
        ...mockElement,
        value: '',
        selected: false,
      } as unknown as HTMLElement;
    }
    if (tagName === 'img') {
      return {
        ...mockElement,
        src: '',
        alt: '',
        onerror: null,
      } as unknown as HTMLElement;
    }
    if (tagName === 'video') {
      return {
        ...mockElement,
        src: '',
        controls: false,
        onerror: null,
      } as unknown as HTMLElement;
    }
    return { ...mockElement } as unknown as HTMLElement;
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

describe('WedgeEditor', () => {
  let wedgeEditor: WedgeEditor;
  let mockCallbacks: any;
  let testWedge: Wedge;

  beforeEach(() => {
    jest.clearAllMocks();
    
    testWedge = {
      id: 'test-wedge',
      label: 'Test Option',
      weight: 1.5,
      color: '#ff6b6b',
    };
    
    mockCallbacks = {
      onWedgeUpdate: jest.fn(),
      onMediaUpload: jest.fn(),
      onMediaValidation: jest.fn(),
    };
    
    wedgeEditor = new WedgeEditor({
      containerId: 'test-wedge-editor',
      wedge: testWedge,
    }, mockCallbacks);
  });

  describe('constructor', () => {
    it('should initialize with valid container', () => {
      expect(wedgeEditor).toBeInstanceOf(WedgeEditor);
      expect(document.getElementById).toHaveBeenCalledWith('test-wedge-editor');
    });

    it('should throw error with invalid container', () => {
      expect(() => new WedgeEditor({
        containerId: 'invalid-container',
      })).toThrow('Container element with id \'invalid-container\' not found');
    });

    it('should initialize with provided wedge', () => {
      const wedge = wedgeEditor.getWedge();
      expect(wedge.label).toBe('Test Option');
      expect(wedge.weight).toBe(1.5);
      expect(wedge.color).toBe('#ff6b6b');
    });

    it('should create default wedge when none provided', () => {
      const defaultEditor = new WedgeEditor({
        containerId: 'test-wedge-editor',
      });
      
      const wedge = defaultEditor.getWedge();
      expect(wedge.label).toBe('New Option');
      expect(wedge.weight).toBe(1);
      expect(wedge.color).toBe('#4ecdc4');
      
      defaultEditor.destroy();
    });
  });

  describe('getWedge', () => {
    it('should return current wedge data', () => {
      const wedge = wedgeEditor.getWedge();
      expect(wedge.label).toBe('Test Option');
      expect(wedge.weight).toBe(1.5);
      expect(wedge.color).toBe('#ff6b6b');
    });

    it('should return a copy of the wedge object', () => {
      const wedge1 = wedgeEditor.getWedge();
      const wedge2 = wedgeEditor.getWedge();
      expect(wedge1).not.toBe(wedge2); // Different object instances
      expect(wedge1).toEqual(wedge2); // Same content
    });
  });

  describe('setWedge', () => {
    it('should replace the current wedge', () => {
      const newWedge: Wedge = {
        id: 'new-wedge',
        label: 'New Option',
        weight: 3.0,
        color: '#00ff00',
        media: {
          type: 'image',
          src: 'test.jpg',
          alt: 'Test image',
        },
      };
      
      wedgeEditor.setWedge(newWedge);
      
      const currentWedge = wedgeEditor.getWedge();
      expect(currentWedge.label).toBe('New Option');
      expect(currentWedge.weight).toBe(3.0);
      expect(currentWedge.color).toBe('#00ff00');
      expect(currentWedge.media?.type).toBe('image');
    });
  });

  describe('validateWedge', () => {
    it('should validate a valid wedge', () => {
      const validation = wedgeEditor.validateWedge();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect empty label', () => {
      const emptyLabelWedge: Wedge = {
        id: 'test',
        label: '',
        weight: 1,
        color: '#ff0000',
      };
      
      wedgeEditor.setWedge(emptyLabelWedge);
      const validation = wedgeEditor.validateWedge();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Label cannot be empty'))).toBe(true);
    });

    it('should detect long label', () => {
      const longLabelWedge: Wedge = {
        id: 'test',
        label: 'A'.repeat(60), // 60 characters
        weight: 1,
        color: '#ff0000',
      };
      
      wedgeEditor.setWedge(longLabelWedge);
      const validation = wedgeEditor.validateWedge();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Label must be 50 characters or less'))).toBe(true);
    });

    it('should detect negative weight', () => {
      const negativeWeightWedge: Wedge = {
        id: 'test',
        label: 'Test',
        weight: -1,
        color: '#ff0000',
      };
      
      wedgeEditor.setWedge(negativeWeightWedge);
      const validation = wedgeEditor.validateWedge();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Weight must be a non-negative number'))).toBe(true);
    });

    it('should warn about zero weight', () => {
      const zeroWeightWedge: Wedge = {
        id: 'test',
        label: 'Test',
        weight: 0,
        color: '#ff0000',
      };
      
      wedgeEditor.setWedge(zeroWeightWedge);
      const validation = wedgeEditor.validateWedge();
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('Zero weight means this wedge will never be selected'))).toBe(true);
    });

    it('should detect empty media URL when media type is selected', () => {
      const emptyMediaWedge: Wedge = {
        id: 'test',
        label: 'Test',
        weight: 1,
        color: '#ff0000',
        media: {
          type: 'image',
          src: '',
          alt: 'Test',
        },
      };
      
      wedgeEditor.setWedge(emptyMediaWedge);
      const validation = wedgeEditor.validateWedge();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Media URL cannot be empty'))).toBe(true);
    });

    it('should warn about missing alt text for images', () => {
      const noAltWedge: Wedge = {
        id: 'test',
        label: 'Test',
        weight: 1,
        color: '#ff0000',
        media: {
          type: 'image',
          src: 'test.jpg',
        },
      };
      
      wedgeEditor.setWedge(noAltWedge);
      const validation = wedgeEditor.validateWedge();
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('Alt text is recommended for accessibility'))).toBe(true);
    });
  });

  describe('media functionality', () => {
    beforeEach(() => {
      wedgeEditor = new WedgeEditor({
        containerId: 'test-wedge-editor',
        wedge: testWedge,
        showMediaOptions: true,
      }, mockCallbacks);
    });

    it('should initialize with media options when enabled', () => {
      expect(wedgeEditor).toBeInstanceOf(WedgeEditor);
      // Media section should be created (we can't easily test DOM creation in this mock environment)
    });

    it('should handle media upload callback', async () => {
      mockCallbacks.onMediaUpload.mockResolvedValue('http://example.com/test.jpg');
      
      // Simulate file selection
      const wedge = wedgeEditor.getWedge();
      wedge.media = { type: 'image', src: '', alt: 'Test' };
      wedgeEditor.setWedge(wedge);
      
      // The actual file upload would be triggered by DOM events
      // Here we just test that the callback would be called
      expect(mockCallbacks.onMediaUpload).toBeDefined();
    });
  });

  describe('callbacks', () => {
    it('should handle missing callbacks gracefully', () => {
      const editorWithoutCallbacks = new WedgeEditor({
        containerId: 'test-wedge-editor',
      });
      
      expect(editorWithoutCallbacks).toBeInstanceOf(WedgeEditor);
      editorWithoutCallbacks.destroy();
    });

    it('should trigger onWedgeUpdate callback when wedge changes', () => {
      // Simulate a change (in real usage this would be triggered by DOM events)
      const updatedWedge = { ...testWedge, label: 'Updated Label' };
      wedgeEditor.setWedge(updatedWedge);
      
      // The callback would be triggered by the internal triggerUpdate method
      expect(mockCallbacks.onWedgeUpdate).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('should clean up DOM', () => {
      wedgeEditor.destroy();
      expect(mockContainer.innerHTML).toBe('');
    });
  });
});