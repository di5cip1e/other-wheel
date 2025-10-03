/**
 * Basic test to verify Jest setup is working correctly
 */

describe('Project Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have Canvas API mocked', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeDefined();
    expect(typeof ctx?.fillRect).toBe('function');
  });

  it('should have localStorage mocked', () => {
    expect(window.localStorage).toBeDefined();
    expect(typeof window.localStorage.getItem).toBe('function');
  });

  it('should have requestAnimationFrame mocked', () => {
    expect(global.requestAnimationFrame).toBeDefined();
    expect(typeof global.requestAnimationFrame).toBe('function');
  });
});