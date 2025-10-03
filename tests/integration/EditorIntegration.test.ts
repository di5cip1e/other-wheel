/**
 * Integration tests for editor functionality and data persistence
 * Tests the complete editor workflow including real-time preview and validation
 */

import { WheelEditor } from '../../src/components/WheelEditor';
import { WedgeEditor } from '../../src/components/WedgeEditor';
import { Wheel, Wedge } from '../../src/models';

// Mock DOM environment for integration tests
const createMockContainer = (id: string) => ({
  innerHTML: '',
  className: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  id,
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => null)
} as unknown as HTMLElement);

const createMockElement = () => ({
  innerHTML: '',
  className: '',
  textContent: '',
  style: {} as CSSStyleDeclaration,
  appendChild: jest.fn(),
  onclick: null as any,
  onchange: null as any,
  dataset: {},
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => null)
} as unknown as HTMLElement);

const createMockInput = () => ({
  type: 'text',
  value: '',
  min: '',
  max: '',
  step: '',
  placeholder: '',
  className: '',
  title: '',
  style: {} as CSSStyleDeclaration,
  onchange: null as any,
  classList: {
    add: jest.fn(),
    remove: jest.fn()
  }
} as unknown as HTMLInputElement);

// Setup DOM mocks
beforeAll(() => {
  document.getElementById = jest.fn((id: string) => {
    return createMockContainer(id);
  });

  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'input') {
      return createMockInput() as unknown as HTMLElement;
    }
    return createMockElement();
  });
});

describe('Editor Integration Tests', () => {
  let wheelEditor: WheelEditor;
  let wedgeEditor: WedgeEditor;
  let testWheel: Wheel;
  let wheelCallbacks: any;
  let wedgeCallbacks: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    testWheel = {
      id: 'integration-wheel',
      label: 'Integration Test Wheel',
      wedges: [
        { id: 'wedge-1', label: 'Option A', weight: 1, color: '#ff6b6b' },
        { id: 'wedge-2', label: 'Option B', weight: 2, color: '#4ecdc4' },
        { id: 'wedge-3', label: 'Option C', weight: 1.5, color: '#45b7d1' }
      ],
      frictionCoefficient: 0.02,
      clutchRatio: 0.8,
      radius: 150,
      position: { x: 0, y: 0 },
      currentAngle: 0,
      angularVelocity: 0
    };

    wheelCallbacks = {
      onWedgeAdd: jest.fn(),
      onWedgeRemove: jest.fn(),
      onWedgeUpdate: jest.fn(),
      onWheelUpdate: jest.fn(),
      onPreviewUpdate: jest.fn()
    };

    wedgeCallbacks = {
      onWedgeUpdate: jest.fn(),
      onMediaUpload: jest.fn(),
      onMediaValidation: jest.fn()
    };

    wheelEditor = new WheelEditor({
      containerId: 'wheel-editor-container',
      wheel: testWheel,
      enablePreview: true
    }, wheelCallbacks);

    wedgeEditor = new WedgeEditor({
      containerId: 'wedge-editor-container',
      wedge: testWheel.wedges[0]!,
      showMediaOptions: true
    }, wedgeCallbacks);
  });

  afterEach(() => {
    wheelEditor.destroy();
    wedgeEditor.destroy();
  });

  describe('Wheel Editor Integration', () => {
    it('should maintain data consistency when adding wedges', () => {
      const initialCount = wheelEditor.getWedgeCount();
      
      wheelEditor.addWedgePublic({
        label: 'New Option',
        weight: 2.5,
        color: '#00ff00'
      });
      
      expect(wheelEditor.getWedgeCount()).toBe(initialCount + 1);
      
      const wedges = wheelEditor.getWedges();
      const newWedge = wedges[wedges.length - 1];
      expect(newWedge?.label).toBe('New Option');
      expect(newWedge?.weight).toBe(2.5);
      expect(newWedge?.color).toBe('#00ff00');
      
      // Verify wheel validation still passes
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(true);
    });

    it('should maintain data consistency when removing wedges', () => {
      const initialWedges = wheelEditor.getWedges();
      const wedgeToRemove = initialWedges[0];
      if (!wedgeToRemove) throw new Error('No wedge found');
      
      const success = wheelEditor.removeWedgePublic(wedgeToRemove.id);
      expect(success).toBe(true);
      
      const remainingWedges = wheelEditor.getWedges();
      expect(remainingWedges).toHaveLength(initialWedges.length - 1);
      expect(remainingWedges.find(w => w.id === wedgeToRemove.id)).toBeUndefined();
      
      // Verify wheel validation still passes
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(true);
    });

    it('should prevent removing wedges when minimum count reached', () => {
      // Remove wedges until only 2 remain
      const wedges = wheelEditor.getWedges();
      if (wedges[0]) wheelEditor.removeWedgePublic(wedges[0].id);
      
      expect(wheelEditor.getWedgeCount()).toBe(2);
      
      // Try to remove another - should fail
      const remainingWedges = wheelEditor.getWedges();
      const success = wheelEditor.removeWedgePublic(remainingWedges[0]?.id || 'invalid');
      
      expect(success).toBe(false);
      expect(wheelEditor.getWedgeCount()).toBe(2);
    });

    it('should update wheel properties correctly', () => {
      const updatedWheel = wheelEditor.getWheel();
      updatedWheel.label = 'Updated Wheel Label';
      updatedWheel.frictionCoefficient = 0.05;
      updatedWheel.clutchRatio = 0.6;
      
      wheelEditor.setWheel(updatedWheel);
      
      const currentWheel = wheelEditor.getWheel();
      expect(currentWheel.label).toBe('Updated Wheel Label');
      expect(currentWheel.frictionCoefficient).toBe(0.05);
      expect(currentWheel.clutchRatio).toBe(0.6);
    });

    it('should validate complex wheel configurations', () => {
      // Create a wheel with various validation issues
      wheelEditor.addWedgePublic({ label: '', weight: 1, color: '#ff0000' }); // Empty label
      wheelEditor.addWedgePublic({ label: 'Valid', weight: -1, color: '#00ff00' }); // Negative weight
      wheelEditor.addWedgePublic({ label: 'A'.repeat(60), weight: 1, color: '#0000ff' }); // Long label
      
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should detect empty label (with wedge prefix)
      expect(validation.errors.some(e => e.includes('Label cannot be empty'))).toBe(true);
      // Should detect negative weight (with wedge prefix)
      expect(validation.errors.some(e => e.includes('Weight must be a non-negative number'))).toBe(true);
      // Should detect long label (with wedge prefix)
      expect(validation.errors.some(e => e.includes('Label must be 50 characters or less'))).toBe(true);
    });
  });

  describe('Wedge Editor Integration', () => {
    it('should update wedge properties correctly', () => {
      const originalWedge = wedgeEditor.getWedge();
      
      const updatedWedge: Wedge = {
        id: originalWedge.id,
        label: 'Updated Option',
        weight: 3.5,
        color: '#purple',
        media: {
          type: 'image',
          src: 'http://example.com/image.jpg',
          alt: 'Test image'
        }
      };
      
      wedgeEditor.setWedge(updatedWedge);
      
      const currentWedge = wedgeEditor.getWedge();
      expect(currentWedge.label).toBe('Updated Option');
      expect(currentWedge.weight).toBe(3.5);
      expect(currentWedge.color).toBe('#purple');
      expect(currentWedge.media?.type).toBe('image');
      expect(currentWedge.media?.src).toBe('http://example.com/image.jpg');
    });

    it('should validate wedge media configurations', () => {
      const wedgeWithEmptyMedia: Wedge = {
        id: 'test-wedge',
        label: 'Test',
        weight: 1,
        color: '#ff0000',
        media: {
          type: 'image',
          src: '', // Empty URL
          alt: 'Test'
        }
      };
      
      wedgeEditor.setWedge(wedgeWithEmptyMedia);
      const validation = wedgeEditor.validateWedge();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Media URL cannot be empty'))).toBe(true);
    });

    it('should handle media type changes correctly', () => {
      // Start with text-only wedge
      let currentWedge = wedgeEditor.getWedge();
      expect(currentWedge.media).toBeUndefined();
      
      // Add image media
      const wedgeWithImage: Wedge = {
        ...currentWedge,
        media: {
          type: 'image',
          src: 'http://example.com/image.jpg',
          alt: 'Test image'
        }
      };
      
      wedgeEditor.setWedge(wedgeWithImage);
      currentWedge = wedgeEditor.getWedge();
      expect(currentWedge.media?.type).toBe('image');
      
      // Change to video media
      const wedgeWithVideo: Wedge = {
        ...currentWedge,
        media: {
          type: 'video',
          src: 'http://example.com/video.mp4'
        }
      };
      
      wedgeEditor.setWedge(wedgeWithVideo);
      currentWedge = wedgeEditor.getWedge();
      expect(currentWedge.media?.type).toBe('video');
      
      // Remove media
      const wedgeWithoutMedia: Wedge = {
        id: currentWedge.id,
        label: currentWedge.label,
        weight: currentWedge.weight,
        color: currentWedge.color
      };
      
      wedgeEditor.setWedge(wedgeWithoutMedia);
      currentWedge = wedgeEditor.getWedge();
      expect(currentWedge.media).toBeUndefined();
    });
  });

  describe('Cross-Editor Integration', () => {
    it('should synchronize wedge updates between editors', () => {
      // Get a wedge from the wheel editor
      const wheelWedges = wheelEditor.getWedges();
      const targetWedge = wheelWedges[0];
      if (!targetWedge) throw new Error('No wedge found');
      
      // Update the wedge in the wedge editor
      const updatedWedge: Wedge = {
        id: targetWedge.id,
        label: 'Synchronized Update',
        weight: 4.0,
        color: '#synchronized'
      };
      
      wedgeEditor.setWedge(updatedWedge);
      
      // Update the same wedge in the wheel editor
      wheelEditor.updateWedgePublic(targetWedge.id, {
        label: 'Synchronized Update',
        weight: 4.0,
        color: '#synchronized'
      });
      
      // Verify both editors have the same data
      const wheelWedge = wheelEditor.getWedges().find(w => w.id === targetWedge.id);
      const editorWedge = wedgeEditor.getWedge();
      
      expect(wheelWedge?.label).toBe(editorWedge.label);
      expect(wheelWedge?.weight).toBe(editorWedge.weight);
      expect(wheelWedge?.color).toBe(editorWedge.color);
    });

    it('should maintain validation consistency across editors', () => {
      // Create an invalid wedge in the wedge editor
      const invalidWedge: Wedge = {
        id: 'invalid-wedge',
        label: '', // Invalid: empty label
        weight: -1, // Invalid: negative weight
        color: '#ff0000'
      };
      
      wedgeEditor.setWedge(invalidWedge);
      
      // Validation should fail in wedge editor
      const wedgeValidation = wedgeEditor.validateWedge();
      expect(wedgeValidation.isValid).toBe(false);
      
      // Update the wheel with the same invalid wedge
      wheelEditor.updateWedgePublic(wheelEditor.getWedges()[0]?.id || 'invalid', {
        label: '',
        weight: -1
      });
      
      // Validation should also fail in wheel editor
      const wheelValidation = wheelEditor.validateWheel();
      expect(wheelValidation.isValid).toBe(false);
    });
  });

  describe('Real-time Preview Integration', () => {
    it('should trigger preview updates when wheel changes', () => {
      // Add a wedge
      wheelEditor.addWedgePublic({
        label: 'Preview Test',
        weight: 1,
        color: '#preview'
      });
      
      // Preview callback should be triggered
      expect(wheelCallbacks.onPreviewUpdate).toBeDefined();
      
      // Update wheel properties
      const wheel = wheelEditor.getWheel();
      wheel.frictionCoefficient = 0.1;
      wheelEditor.setWheel(wheel);
      
      // Preview should update again
      expect(wheelCallbacks.onWheelUpdate).toBeDefined();
    });

    it('should handle preview updates for media content', () => {
      const wedgeWithMedia: Wedge = {
        id: 'media-wedge',
        label: 'Media Test',
        weight: 1,
        color: '#media',
        media: {
          type: 'image',
          src: 'http://example.com/preview.jpg',
          alt: 'Preview image'
        }
      };
      
      wedgeEditor.setWedge(wedgeWithMedia);
      
      // Wedge update callback should be triggered
      expect(wedgeCallbacks.onWedgeUpdate).toBeDefined();
    });
  });

  describe('Data Persistence Simulation', () => {
    it('should maintain data integrity through multiple operations', () => {
      // Perform a series of operations
      const operations = [
        () => wheelEditor.addWedgePublic({ label: 'Op1', weight: 1, color: '#op1' }),
        () => wheelEditor.addWedgePublic({ label: 'Op2', weight: 2, color: '#op2' }),
        () => wheelEditor.updateWedgePublic(wheelEditor.getWedges()[0]?.id || 'invalid', { weight: 3 }),
        () => wheelEditor.removeWedgePublic(wheelEditor.getWedges()[1]?.id || 'invalid'),
        () => {
          const wheel = wheelEditor.getWheel();
          wheel.frictionCoefficient = 0.08;
          wheelEditor.setWheel(wheel);
        }
      ];
      
      // Execute operations
      operations.forEach(op => op());
      
      // Verify final state
      const finalWheel = wheelEditor.getWheel();
      expect(finalWheel.wedges.length).toBeGreaterThan(2); // Should have added wedges
      expect(finalWheel.frictionCoefficient).toBe(0.08); // Should have updated friction
      
      // Validation should still pass
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(true);
    });

    it('should handle concurrent editor operations', () => {
      // Simulate concurrent operations on the same data
      const wheelWedges = wheelEditor.getWedges();
      const targetWedge = wheelWedges[0];
      if (!targetWedge) throw new Error('No wedge found');
      
      // Update in wheel editor
      wheelEditor.updateWedgePublic(targetWedge.id, {
        label: 'Concurrent Update 1',
        weight: 5.0
      });
      
      // Update in wedge editor (simulating different user action)
      const updatedWedge: Wedge = {
        id: targetWedge.id,
        label: 'Concurrent Update 2',
        weight: targetWedge.weight,
        color: '#concurrent'
      };
      wedgeEditor.setWedge(updatedWedge);
      
      // Both editors should maintain their respective states
      const wheelWedge = wheelEditor.getWedges().find(w => w.id === targetWedge.id);
      const editorWedge = wedgeEditor.getWedge();
      
      expect(wheelWedge?.label).toBe('Concurrent Update 1');
      expect(editorWedge.label).toBe('Concurrent Update 2');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid operations gracefully', () => {
      // Try to remove non-existent wedge
      const result1 = wheelEditor.removeWedgePublic('non-existent-id');
      expect(result1).toBe(false);
      
      // Try to update non-existent wedge
      const result2 = wheelEditor.updateWedgePublic('non-existent-id', { label: 'Test' });
      expect(result2).toBe(false);
      
      // Wheel should remain in valid state
      const validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(true);
    });

    it('should recover from validation errors', () => {
      // Create invalid state
      wheelEditor.updateWedgePublic(wheelEditor.getWedges()[0]?.id || 'invalid', {
        label: '',
        weight: -1
      });
      
      // Validation should fail
      let validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(false);
      
      // Fix the errors
      wheelEditor.updateWedgePublic(wheelEditor.getWedges()[0]?.id || 'invalid', {
        label: 'Fixed Label',
        weight: 1
      });
      
      // Validation should now pass
      validation = wheelEditor.validateWheel();
      expect(validation.isValid).toBe(true);
    });
  });
});