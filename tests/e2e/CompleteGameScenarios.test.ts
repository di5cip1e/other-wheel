import { GameController } from '../../src/components/GameController';
import { PhysicsEngine } from '../../src/engines/PhysicsEngine';
import { PlayerManager } from '../../src/managers/PlayerManager';
import { PresetManager } from '../../src/managers/PresetManager';
import { RandomUtils } from '../../src/utils/RandomUtils';
import { GameState, Player, Wheel, Wedge } from '../../src/models';

describe('Complete Game Scenarios E2E Tests', () => {
  let gameController: GameController;
  let physicsEngine: PhysicsEngine;
  let playerManager: PlayerManager;
  let presetManager: PresetManager;

  beforeEach(() => {
    // Set deterministic seed for reproducible tests
    RandomUtils.setSeed(12345);
    
    physicsEngine = new PhysicsEngine();
    playerManager = new PlayerManager();
    presetManager = new PresetManager();
    gameController = new GameController(physicsEngine, playerManager, presetManager);
  });

  afterEach(() => {
    RandomUtils.setSeed(Date.now());
  });

  describe('Single Player Complete Game', () => {
    it('should complete a full single-player game from setup to finish', async () => {
      // Setup game
      const player: Player = {
        id: 'player1',
        name: 'Test Player',
        isActive: true,
      };

      const outerWedges: Wedge[] = [
        { id: 'outer1', label: 'Prize A', weight: 1, color: '#ff0000' },
        { id: 'outer2', label: 'Prize B', weight: 2, color: '#00ff00' },
        { id: 'outer3', label: 'Prize C', weight: 1, color: '#0000ff' },
      ];

      const innerWedges: Wedge[] = [
        { id: 'inner1', label: 'Bonus 1', weight: 1, color: '#ffff00' },
        { id: 'inner2', label: 'Bonus 2', weight: 1, color: '#ff00ff' },
      ];

      const outerWheel: Wheel = {
        id: 'outer',
        label: 'Main Wheel',
        wedges: outerWedges,
        frictionCoefficient: 0.02,
        clutchRatio: 0,
        radius: 200,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      };

      const innerWheel: Wheel = {
        id: 'inner',
        label: 'Bonus Wheel',
        wedges: innerWedges,
        frictionCoefficient: 0.03,
        clutchRatio: 0.7,
        radius: 100,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      };

      // Initialize game
      await gameController.initializeGame([outerWheel, innerWheel], [player]);
      expect(gameController.getGameState().gamePhase).toBe('setup');

      // Start game
      await gameController.startGame();
      expect(gameController.getGameState().gamePhase).toBe('playing');
      expect(gameController.getGameState().currentPlayerIndex).toBe(0);

      // Simulate power meter interaction
      gameController.startPowerMeter();
      expect(gameController.getGameState().gamePhase).toBe('power-selection');

      // Stop power meter at 75% power
      const powerLevel = 0.75;
      await gameController.stopPowerMeter(powerLevel);
      expect(gameController.getGameState().gamePhase).toBe('spinning');

      // Wait for spin to complete
      await gameController.waitForSpinComplete();
      expect(gameController.getGameState().gamePhase).toBe('result');

      // Verify results
      const gameState = gameController.getGameState();
      expect(gameState.lastResult).toBeDefined();
      expect(gameState.lastResult!.outerWedge).toBeDefined();
      expect(gameState.lastResult!.innerWedge).toBeDefined();
      expect(gameState.scores.get(player.id)).toBeGreaterThanOrEqual(0);

      // Complete turn
      await gameController.completeTurn();
      expect(gameController.getGameState().gamePhase).toBe('playing');
    });

    it('should handle multiple rounds with score accumulation', async () => {
      const player: Player = {
        id: 'player1',
        name: 'Test Player',
        isActive: true,
      };

      // Setup simple game
      const wheels = createTestWheels();
      await gameController.initializeGame(wheels, [player]);
      await gameController.startGame();

      let totalScore = 0;
      const rounds = 3;

      for (let round = 0; round < rounds; round++) {
        // Play round
        gameController.startPowerMeter();
        await gameController.stopPowerMeter(0.5 + (round * 0.1));
        await gameController.waitForSpinComplete();

        const gameState = gameController.getGameState();
        const roundScore = gameState.scores.get(player.id) || 0;
        expect(roundScore).toBeGreaterThanOrEqual(totalScore);
        totalScore = roundScore;

        await gameController.completeTurn();
      }

      expect(totalScore).toBeGreaterThan(0);
    });
  });

  describe('Multiplayer Complete Game', () => {
    it('should complete a full multiplayer game with turn rotation', async () => {
      const players: Player[] = [
        { id: 'player1', name: 'Alice', isActive: true },
        { id: 'player2', name: 'Bob', isActive: false },
        { id: 'player3', name: 'Charlie', isActive: false },
      ];

      const wheels = createTestWheels();
      await gameController.initializeGame(wheels, players);
      await gameController.startGame();

      // Play one complete round (all players take a turn)
      for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
        const gameState = gameController.getGameState();
        expect(gameState.currentPlayerIndex).toBe(playerIndex);
        expect(gameState.players[playerIndex].isActive).toBe(true);

        // Simulate turn
        gameController.startPowerMeter();
        await gameController.stopPowerMeter(0.6);
        await gameController.waitForSpinComplete();
        await gameController.completeTurn();

        // Verify score recorded
        const score = gameState.scores.get(players[playerIndex].id);
        expect(score).toBeDefined();
        expect(score).toBeGreaterThanOrEqual(0);
      }

      // Verify we're back to first player
      expect(gameController.getGameState().currentPlayerIndex).toBe(0);
    });

    it('should handle player elimination and game completion', async () => {
      const players: Player[] = [
        { id: 'player1', name: 'Alice', isActive: true },
        { id: 'player2', name: 'Bob', isActive: false },
      ];

      const wheels = createTestWheelsWithEliminationRules();
      await gameController.initializeGame(wheels, players);
      await gameController.startGame();

      // Set score limit for game completion
      gameController.setScoreLimit(100);

      let gameComplete = false;
      let turns = 0;
      const maxTurns = 20; // Safety limit

      while (!gameComplete && turns < maxTurns) {
        gameController.startPowerMeter();
        await gameController.stopPowerMeter(0.8); // High power for faster scoring
        await gameController.waitForSpinComplete();
        
        const gameState = gameController.getGameState();
        if (gameState.gamePhase === 'finished') {
          gameComplete = true;
          expect(gameState.winner).toBeDefined();
        } else {
          await gameController.completeTurn();
        }
        
        turns++;
      }

      expect(gameComplete).toBe(true);
      expect(turns).toBeLessThan(maxTurns);
    });
  });

  describe('Physics Integration Scenarios', () => {
    it('should demonstrate clutch mechanics in complete game', async () => {
      const player: Player = { id: 'player1', name: 'Test Player', isActive: true };
      
      // Create wheels with strong clutch coupling
      const wheels = createTestWheels();
      wheels[1].clutchRatio = 0.9; // Strong coupling
      
      await gameController.initializeGame(wheels, [player]);
      await gameController.startGame();

      // Record initial state
      const initialOuterAngle = wheels[0].currentAngle;
      const initialInnerAngle = wheels[1].currentAngle;

      // Spin with high power
      gameController.startPowerMeter();
      await gameController.stopPowerMeter(1.0);
      
      // Monitor physics during spin
      const physicsStates: Array<{ outer: number; inner: number; time: number }> = [];
      const startTime = Date.now();
      
      while (gameController.getGameState().gamePhase === 'spinning') {
        const currentTime = Date.now() - startTime;
        physicsStates.push({
          outer: wheels[0].currentAngle,
          inner: wheels[1].currentAngle,
          time: currentTime,
        });
        
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }

      // Verify clutch behavior
      expect(physicsStates.length).toBeGreaterThan(10);
      
      // Check that inner wheel follows outer wheel motion
      for (let i = 1; i < physicsStates.length; i++) {
        const outerDelta = physicsStates[i].outer - physicsStates[i-1].outer;
        const innerDelta = physicsStates[i].inner - physicsStates[i-1].inner;
        
        if (Math.abs(outerDelta) > 0.01) { // Only check when outer wheel is moving significantly
          expect(Math.abs(innerDelta)).toBeGreaterThan(0);
          // Inner wheel should move in same direction as outer wheel
          expect(Math.sign(innerDelta)).toBe(Math.sign(outerDelta));
        }
      }
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from physics simulation errors', async () => {
      const player: Player = { id: 'player1', name: 'Test Player', isActive: true };
      const wheels = createTestWheels();
      
      await gameController.initializeGame(wheels, [player]);
      await gameController.startGame();

      // Inject physics error by setting invalid values
      wheels[0].angularVelocity = NaN;
      
      gameController.startPowerMeter();
      await gameController.stopPowerMeter(0.5);
      
      // Game should detect and recover from the error
      await gameController.waitForSpinComplete();
      
      const gameState = gameController.getGameState();
      expect(gameState.gamePhase).toBe('result');
      expect(gameState.lastResult).toBeDefined();
      expect(gameState.errors).toHaveLength(1);
      expect(gameState.errors[0].type).toBe('physics-error');
      expect(gameState.errors[0].recovered).toBe(true);
    });

    it('should handle corrupted game state recovery', async () => {
      const players: Player[] = [
        { id: 'player1', name: 'Alice', isActive: true },
        { id: 'player2', name: 'Bob', isActive: false },
      ];
      
      const wheels = createTestWheels();
      await gameController.initializeGame(wheels, players);
      await gameController.startGame();

      // Corrupt game state
      const gameState = gameController.getGameState();
      gameState.currentPlayerIndex = 999; // Invalid player index
      gameState.scores.clear(); // Clear scores

      // Attempt to continue game - should auto-recover
      gameController.startPowerMeter();
      await gameController.stopPowerMeter(0.5);
      await gameController.waitForSpinComplete();

      // Verify recovery
      const recoveredState = gameController.getGameState();
      expect(recoveredState.currentPlayerIndex).toBeLessThan(players.length);
      expect(recoveredState.scores.size).toBe(players.length);
      expect(recoveredState.errors).toContainEqual(
        expect.objectContaining({
          type: 'state-corruption',
          recovered: true,
        }),
      );
    });
  });

  // Helper functions
  function createTestWheels(): Wheel[] {
    const outerWedges: Wedge[] = [
      { id: 'outer1', label: 'Win 10', weight: 1, color: '#ff0000' },
      { id: 'outer2', label: 'Win 20', weight: 1, color: '#00ff00' },
      { id: 'outer3', label: 'Win 5', weight: 2, color: '#0000ff' },
    ];

    const innerWedges: Wedge[] = [
      { id: 'inner1', label: 'x2', weight: 1, color: '#ffff00' },
      { id: 'inner2', label: 'x1', weight: 3, color: '#ff00ff' },
    ];

    return [
      {
        id: 'outer',
        label: 'Main Wheel',
        wedges: outerWedges,
        frictionCoefficient: 0.02,
        clutchRatio: 0,
        radius: 200,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      },
      {
        id: 'inner',
        label: 'Multiplier Wheel',
        wedges: innerWedges,
        frictionCoefficient: 0.03,
        clutchRatio: 0.5,
        radius: 100,
        position: { x: 300, y: 300 },
        currentAngle: 0,
        angularVelocity: 0,
      },
    ];
  }

  function createTestWheelsWithEliminationRules(): Wheel[] {
    const wheels = createTestWheels();
    
    // Add elimination wedge to outer wheel
    wheels[0].wedges.push({
      id: 'eliminate',
      label: 'ELIMINATE',
      weight: 0.5,
      color: '#000000',
    });

    return wheels;
  }
});