/**
 * Tests for error recovery mechanisms
 */

import {
  GameStateRecovery,
  FeatureDegradation,
  AutoRecoveryCoordinator,
} from '../../src/utils/ErrorRecovery';
import { GameErrorFactory, ErrorType } from '../../src/utils/ErrorHandler';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('GameStateRecovery', () => {
  let recovery: GameStateRecovery;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    recovery = new GameStateRecovery();
  });

  describe('Game State Validation', () => {
    it('should validate correct game state', () => {
      const validState = {
        wheels: [
          {
            id: 'wheel1',
            wedges: [
              { id: 'wedge1', weight: 1 },
              { id: 'wedge2', weight: 2 },
            ],
          },
        ],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      expect(recovery.validateGameState(validState)).toBe(true);
    });

    it('should reject invalid game state - missing wheels', () => {
      const invalidState = {
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      expect(recovery.validateGameState(invalidState)).toBe(false);
    });

    it('should reject invalid game state - empty wheels array', () => {
      const invalidState = {
        wheels: [],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      expect(recovery.validateGameState(invalidState)).toBe(false);
    });

    it('should reject invalid game state - invalid wheel structure', () => {
      const invalidState = {
        wheels: [
          {
            id: 'wheel1',
            wedges: [
              { id: 'wedge1', weight: -1 }, // Invalid weight
              { id: 'wedge2', weight: 2 },
            ],
          },
        ],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      expect(recovery.validateGameState(invalidState)).toBe(false);
    });

    it('should reject null or undefined state', () => {
      expect(recovery.validateGameState(null)).toBe(false);
      expect(recovery.validateGameState(undefined)).toBe(false);
      expect(recovery.validateGameState('invalid')).toBe(false);
    });
  });

  describe('Game State Repair', () => {
    it('should repair missing wheels', () => {
      const brokenState = {
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      const repaired = recovery.repairGameState(brokenState);

      expect(repaired.wheels).toBeDefined();
      expect(Array.isArray(repaired.wheels)).toBe(true);
      expect(repaired.wheels.length).toBeGreaterThan(0);
      expect(recovery.validateGameState(repaired)).toBe(true);
    });

    it('should repair invalid wheels', () => {
      const brokenState = {
        wheels: [
          {
            // Missing id and wedges
            label: 'Broken Wheel',
          },
        ],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      const repaired = recovery.repairGameState(brokenState);

      expect(repaired.wheels[0].id).toBeDefined();
      expect(repaired.wheels[0].wedges).toBeDefined();
      expect(Array.isArray(repaired.wheels[0].wedges)).toBe(true);
      expect(repaired.wheels[0].wedges.length).toBeGreaterThan(0);
      expect(recovery.validateGameState(repaired)).toBe(true);
    });

    it('should repair missing players array', () => {
      const brokenState = {
        wheels: [
          {
            id: 'wheel1',
            wedges: [{ id: 'wedge1', weight: 1 }],
          },
        ],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      const repaired = recovery.repairGameState(brokenState);

      expect(repaired.players).toBeDefined();
      expect(Array.isArray(repaired.players)).toBe(true);
      expect(repaired.players.length).toBeGreaterThan(0);
      expect(recovery.validateGameState(repaired)).toBe(true);
    });

    it('should repair invalid game phase', () => {
      const brokenState = {
        wheels: [
          {
            id: 'wheel1',
            wedges: [{ id: 'wedge1', weight: 1 }],
          },
        ],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: null,
        settings: { maxPlayers: 4 },
      };

      const repaired = recovery.repairGameState(brokenState);

      expect(repaired.gamePhase).toBe('setup');
      expect(recovery.validateGameState(repaired)).toBe(true);
    });

    it('should create minimal state for completely broken data', () => {
      const repaired = recovery.repairGameState({});

      expect(recovery.validateGameState(repaired)).toBe(true);
      expect(repaired.wheels.length).toBeGreaterThan(0);
      expect(repaired.players.length).toBeGreaterThan(0);
      expect(repaired.gamePhase).toBe('setup');
      expect(repaired.settings).toBeDefined();
    });
  });

  describe('Backup Management', () => {
    it('should create and store backups', () => {
      const gameState = {
        wheels: [
          {
            id: 'wheel1',
            wedges: [{ id: 'wedge1', weight: 1 }],
          },
        ],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      recovery.createBackup(gameState);

      const backups = recovery.getAvailableBackups();
      expect(backups.length).toBe(1);
      expect(backups[0].gameState).toEqual(gameState);
    });

    it('should limit number of backups', () => {
      const gameState = {
        wheels: [
          {
            id: 'wheel1',
            wedges: [{ id: 'wedge1', weight: 1 }],
          },
        ],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      // Create more than max backups
      for (let i = 0; i < 7; i++) {
        const state = { ...gameState, timestamp: i };
        recovery.createBackup(state);
      }

      const backups = recovery.getAvailableBackups();
      expect(backups.length).toBeLessThanOrEqual(5);
    });

    it('should restore from backup', () => {
      const gameState = {
        wheels: [
          {
            id: 'wheel1',
            wedges: [{ id: 'wedge1', weight: 1 }],
          },
        ],
        players: [{ id: 'player1', name: 'Player 1' }],
        gamePhase: 'setup',
        settings: { maxPlayers: 4 },
      };

      recovery.createBackup(gameState);
      const restored = recovery.restoreFromBackup();

      expect(restored).toEqual(gameState);
    });

    it('should return null when no valid backups exist', () => {
      const restored = recovery.restoreFromBackup();
      expect(restored).toBeNull();
    });
  });
});

describe('FeatureDegradation', () => {
  let degradation: FeatureDegradation;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    degradation = new FeatureDegradation();
  });

  it('should enable feature degradation', () => {
    degradation.enableDegradation('test-feature');
    expect(degradation.isFeatureDegraded('test-feature')).toBe(true);
  });

  it('should disable feature degradation', () => {
    degradation.enableDegradation('test-feature');
    expect(degradation.isFeatureDegraded('test-feature')).toBe(true);

    degradation.disableDegradation('test-feature');
    expect(degradation.isFeatureDegraded('test-feature')).toBe(false);
  });

  it('should get list of degraded features', () => {
    degradation.enableDegradation('feature1');
    degradation.enableDegradation('feature2');

    const degradedFeatures = degradation.getDegradedFeatures();
    expect(degradedFeatures).toContain('feature1');
    expect(degradedFeatures).toContain('feature2');
    expect(degradedFeatures.length).toBe(2);
  });

  it('should clear all degradations', () => {
    degradation.enableDegradation('feature1');
    degradation.enableDegradation('feature2');

    expect(degradation.getDegradedFeatures().length).toBe(2);

    degradation.clearAllDegradations();
    expect(degradation.getDegradedFeatures().length).toBe(0);
  });

  it('should emit events when features are degraded', (done) => {
    let eventCount = 0;
    
    window.addEventListener('feature-degraded', (event: any) => {
      expect(event.detail.feature).toBe('test-feature');
      eventCount++;
      if (eventCount === 1) {done();}
    });

    degradation.enableDegradation('test-feature', 'Test reason');
  });

  it('should emit events when features are restored', (done) => {
    degradation.enableDegradation('test-feature');

    window.addEventListener('feature-restored', (event: any) => {
      expect(event.detail.feature).toBe('test-feature');
      done();
    });

    degradation.disableDegradation('test-feature');
  });

  it('should persist degradation state', () => {
    degradation.enableDegradation('persistent-feature');
    
    // Create new instance to test persistence
    const newDegradation = new FeatureDegradation();
    expect(newDegradation.isFeatureDegraded('persistent-feature')).toBe(true);
  });
});

describe('AutoRecoveryCoordinator', () => {
  let coordinator: AutoRecoveryCoordinator;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    coordinator = new AutoRecoveryCoordinator();
  });

  it('should attempt full recovery for game state errors', async () => {
    const error = GameErrorFactory.createGameStateError(
      'Game state corrupted',
      'STATE_CORRUPTED',
    );

    const gameState = {
      wheels: [],
      players: [],
      gamePhase: 'setup',
      settings: {},
    };

    const result = await coordinator.attemptFullRecovery(error, gameState);
    expect(result).toBe(true);
  });

  it('should attempt recovery for physics errors', async () => {
    const error = GameErrorFactory.createPhysicsError(
      'Physics simulation failed',
      'PHYSICS_FAILED',
    );

    const result = await coordinator.attemptFullRecovery(error);
    expect(result).toBe(true);
    expect(coordinator.getFeatureDegradation().isFeatureDegraded('advanced-physics')).toBe(true);
  });

  it('should attempt recovery for rendering errors', async () => {
    const error = GameErrorFactory.createRenderingError(
      'Canvas rendering failed',
      'CANVAS_FAILED',
    );

    const result = await coordinator.attemptFullRecovery(error);
    expect(result).toBe(true);
    expect(coordinator.getFeatureDegradation().isFeatureDegraded('canvas-rendering')).toBe(true);
  });

  it('should attempt recovery for storage errors', async () => {
    const error = GameErrorFactory.createStorageError(
      'Storage quota exceeded',
      'STORAGE_QUOTA',
    );

    const result = await coordinator.attemptFullRecovery(error);
    expect(result).toBe(true);
    expect(coordinator.getFeatureDegradation().isFeatureDegraded('persistent-storage')).toBe(true);
  });

  it('should attempt recovery for media errors', async () => {
    const error = GameErrorFactory.createMediaError(
      'Media loading failed',
      'MEDIA_FAILED',
    );

    const result = await coordinator.attemptFullRecovery(error);
    expect(result).toBe(true);
    expect(coordinator.getFeatureDegradation().isFeatureDegraded('media-content')).toBe(true);
  });

  it('should emit recovery events', (done) => {
    window.addEventListener('game-state-recovered', (event: any) => {
      expect(event.detail.method).toBeDefined();
      done();
    });

    const error = GameErrorFactory.createGameStateError(
      'Game state corrupted',
      'STATE_CORRUPTED',
    );

    coordinator.attemptFullRecovery(error, {});
  });

  it('should backup valid game state before recovery', async () => {
    const validGameState = {
      wheels: [
        {
          id: 'wheel1',
          wedges: [{ id: 'wedge1', weight: 1 }],
        },
      ],
      players: [{ id: 'player1', name: 'Player 1' }],
      gamePhase: 'setup',
      settings: { maxPlayers: 4 },
    };

    const error = GameErrorFactory.createGameStateError(
      'Minor corruption',
      'MINOR_CORRUPTION',
    );

    await coordinator.attemptFullRecovery(error, validGameState);

    const backups = coordinator.getGameStateRecovery().getAvailableBackups();
    expect(backups.length).toBeGreaterThan(0);
  });
});