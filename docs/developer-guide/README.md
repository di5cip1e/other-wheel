# Wheel within a Wheel - Developer Documentation

This guide provides comprehensive documentation for developers working with or extending the Wheel within a Wheel game.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core APIs](#core-apis)
3. [Component System](#component-system)
4. [Physics Engine](#physics-engine)
5. [Extension Points](#extension-points)
6. [Testing Framework](#testing-framework)
7. [Build and Deployment](#build-and-deployment)

## Architecture Overview

### System Architecture

The game follows a modular, component-based architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Game Application                          │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (Components)                                      │
│  ├── WheelRenderer     ├── GameEditor      ├── PlayerUI     │
│  ├── PowerMeter        ├── MediaViewer     ├── ResultsUI    │
├─────────────────────────────────────────────────────────────┤
│  Game Engine Layer                                          │
│  ├── GameController    ├── PhysicsEngine   ├── AudioEngine  │
│  ├── PlayerManager     ├── RuleEngine      ├── ThemeEngine  │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── GameState         ├── PresetManager   ├── MediaManager │
│  ├── WheelModels       ├── PlayerModels    ├── RuleModels   │
├─────────────────────────────────────────────────────────────┤
│  Utilities & Services                                       │
│  ├── PhysicsUtils      ├── ValidationUtils ├── StorageUtils │
│  ├── MathUtils         ├── RandomUtils     ├── FileUtils    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Language**: TypeScript 5.0+
- **Build System**: Webpack 5
- **Testing**: Jest + Testing Library
- **Rendering**: HTML5 Canvas + CSS
- **Storage**: LocalStorage + IndexedDB
- **Audio**: Web Audio API

### Design Patterns

- **Component Pattern**: UI components with clear interfaces
- **Observer Pattern**: Event-driven communication
- **Strategy Pattern**: Pluggable algorithms (physics, rendering)
- **Factory Pattern**: Object creation and initialization
- **Singleton Pattern**: Global managers (audio, theme)

## Core APIs

### GameController API

The main game controller orchestrates all game operations:

```typescript
interface GameController {
  // Game Lifecycle
  initializeGame(wheels: Wheel[], players: Player[]): Promise<void>;
  startGame(): Promise<void>;
  pauseGame(): void;
  resumeGame(): void;
  endGame(): void;
  
  // Turn Management
  startPowerMeter(): void;
  stopPowerMeter(powerLevel: number): Promise<void>;
  waitForSpinComplete(): Promise<SpinResult>;
  completeTurn(): Promise<void>;
  
  // State Access
  getGameState(): GameState;
  getWheels(): Wheel[];
  getCurrentPlayer(): Player;
  
  // Event Handling
  addEventListener(event: GameEvent, handler: EventHandler): void;
  removeEventListener(event: GameEvent, handler: EventHandler): void;
}
```

#### Usage Example

```typescript
import { GameController } from './components/GameController';
import { PhysicsEngine } from './engines/PhysicsEngine';
import { PlayerManager } from './managers/PlayerManager';

// Initialize
const physicsEngine = new PhysicsEngine();
const playerManager = new PlayerManager();
const gameController = new GameController(physicsEngine, playerManager);

// Setup game
const wheels = createWheels();
const players = createPlayers();
await gameController.initializeGame(wheels, players);

// Start gameplay
await gameController.startGame();

// Handle events
gameController.addEventListener('spinComplete', (result) => {
  console.log('Spin result:', result);
});
```

### PhysicsEngine API

Handles all physics simulation:

```typescript
interface PhysicsEngine {
  // Simulation Control
  stepSimulation(deltaTime: number): void;
  reset(): void;
  isStable(): boolean;
  
  // Wheel Management
  addWheel(wheel: Wheel): void;
  removeWheel(wheelId: string): void;
  getWheelState(wheelId: string): PhysicsState;
  
  // Force Application
  applyTorque(wheelId: string, torque: number): void;
  setClutchRatio(outerWheelId: string, innerWheelId: string, ratio: number): void;
  setFriction(wheelId: string, coefficient: number): void;
  
  // Configuration
  setGravity(gravity: number): void;
  setTimeScale(scale: number): void;
  enableDeterministic(seed?: number): void;
}
```

#### Physics Configuration

```typescript
// Configure physics parameters
physicsEngine.setGravity(9.81);
physicsEngine.setTimeScale(1.0);
physicsEngine.enableDeterministic(12345);

// Apply forces
physicsEngine.applyTorque('outer-wheel', 50.0);
physicsEngine.setClutchRatio('outer-wheel', 'inner-wheel', 0.7);
```

### WheelRenderer API

Handles wheel visualization:

```typescript
interface WheelRenderer {
  // Rendering
  render(wheels: Wheel[], context: CanvasRenderingContext2D): void;
  renderWheel(wheel: Wheel, context: CanvasRenderingContext2D): void;
  
  // Animation
  startAnimation(): void;
  stopAnimation(): void;
  setAnimationSpeed(speed: number): void;
  
  // Configuration
  setRenderQuality(quality: RenderQuality): void;
  enableEffects(enabled: boolean): void;
  setTheme(theme: Theme): void;
}
```

### PresetManager API

Manages game presets and configurations:

```typescript
interface PresetManager {
  // Preset Operations
  savePreset(preset: Preset): Promise<string>;
  loadPreset(presetId: string): Promise<Preset>;
  deletePreset(presetId: string): Promise<void>;
  listPresets(): Promise<PresetInfo[]>;
  
  // Import/Export
  exportPreset(presetId: string): Promise<string>;
  importPreset(jsonData: string): Promise<string>;
  
  // Validation
  validatePreset(preset: Preset): ValidationResult;
  
  // Categories
  getPresetsByCategory(category: string): Promise<PresetInfo[]>;
  addToCategory(presetId: string, category: string): Promise<void>;
}
```

## Component System

### Base Component

All UI components extend the base component:

```typescript
abstract class BaseComponent {
  protected element: HTMLElement;
  protected eventListeners: Map<string, EventListener[]>;
  
  constructor(container: HTMLElement) {
    this.element = this.createElement();
    this.eventListeners = new Map();
    container.appendChild(this.element);
  }
  
  abstract createElement(): HTMLElement;
  abstract render(): void;
  
  // Event handling
  addEventListener(event: string, listener: EventListener): void;
  removeEventListener(event: string, listener: EventListener): void;
  
  // Lifecycle
  destroy(): void;
  show(): void;
  hide(): void;
}
```

### Creating Custom Components

```typescript
class CustomWheelComponent extends BaseComponent {
  private wheel: Wheel;
  
  constructor(container: HTMLElement, wheel: Wheel) {
    super(container);
    this.wheel = wheel;
    this.render();
  }
  
  createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'custom-wheel';
    return element;
  }
  
  render(): void {
    this.element.innerHTML = `
      <h3>${this.wheel.label}</h3>
      <div class="wedge-count">${this.wheel.wedges.length} wedges</div>
    `;
  }
  
  updateWheel(wheel: Wheel): void {
    this.wheel = wheel;
    this.render();
  }
}
```

### Component Communication

Components communicate through events:

```typescript
// Publisher component
class PowerMeter extends BaseComponent {
  private emitPowerChange(power: number): void {
    const event = new CustomEvent('powerChange', { detail: { power } });
    this.element.dispatchEvent(event);
  }
}

// Subscriber component
class GameDisplay extends BaseComponent {
  constructor(container: HTMLElement, powerMeter: PowerMeter) {
    super(container);
    
    powerMeter.addEventListener('powerChange', (event) => {
      const power = event.detail.power;
      this.updatePowerDisplay(power);
    });
  }
}
```

## Physics Engine

### Physics Simulation

The physics engine uses semi-implicit Euler integration:

```typescript
class PhysicsEngine {
  private wheels: Map<string, WheelPhysics> = new Map();
  private timeStep: number = 1/60; // 60 FPS
  
  stepSimulation(deltaTime: number): void {
    const steps = Math.ceil(deltaTime / this.timeStep);
    
    for (let i = 0; i < steps; i++) {
      this.updateVelocities(this.timeStep);
      this.updatePositions(this.timeStep);
      this.applyConstraints();
    }
  }
  
  private updateVelocities(dt: number): void {
    for (const [id, wheel] of this.wheels) {
      // Apply friction
      const frictionTorque = -Math.sign(wheel.angularVelocity) * 
                            wheel.frictionCoefficient * 
                            Math.abs(wheel.angularVelocity);
      
      // Apply clutch torque
      const clutchTorque = this.calculateClutchTorque(wheel);
      
      // Update angular velocity
      const totalTorque = frictionTorque + clutchTorque;
      wheel.angularAcceleration = totalTorque / wheel.momentOfInertia;
      wheel.angularVelocity += wheel.angularAcceleration * dt;
    }
  }
  
  private updatePositions(dt: number): void {
    for (const [id, wheel] of this.wheels) {
      wheel.angle += wheel.angularVelocity * dt;
      wheel.angle = this.normalizeAngle(wheel.angle);
    }
  }
}
```

### Custom Physics Behaviors

Extend the physics engine for custom behaviors:

```typescript
class CustomPhysicsEngine extends PhysicsEngine {
  private magneticFields: MagneticField[] = [];
  
  addMagneticField(field: MagneticField): void {
    this.magneticFields.push(field);
  }
  
  protected updateVelocities(dt: number): void {
    super.updateVelocities(dt);
    
    // Apply magnetic forces
    for (const field of this.magneticFields) {
      this.applyMagneticForce(field, dt);
    }
  }
  
  private applyMagneticForce(field: MagneticField, dt: number): void {
    // Custom magnetic force implementation
  }
}
```

### Deterministic Simulation

For reproducible results:

```typescript
import { RandomUtils } from './utils/RandomUtils';

// Enable deterministic mode
RandomUtils.setSeed(12345);
physicsEngine.enableDeterministic(12345);

// All subsequent simulations will be identical
const result1 = runSimulation();
RandomUtils.setSeed(12345);
const result2 = runSimulation();
// result1 === result2
```

## Extension Points

### Plugin System

Create plugins to extend functionality:

```typescript
interface Plugin {
  name: string;
  version: string;
  initialize(game: GameController): void;
  destroy(): void;
}

class ExamplePlugin implements Plugin {
  name = 'Example Plugin';
  version = '1.0.0';
  
  initialize(game: GameController): void {
    // Add custom functionality
    game.addEventListener('spinComplete', this.onSpinComplete);
  }
  
  destroy(): void {
    // Cleanup
  }
  
  private onSpinComplete = (result: SpinResult): void => {
    console.log('Plugin: Spin completed', result);
  };
}

// Register plugin
const pluginManager = new PluginManager();
pluginManager.register(new ExamplePlugin());
```

### Custom Themes

Create custom visual themes:

```typescript
interface Theme {
  name: string;
  colors: ColorScheme;
  fonts: FontScheme;
  effects: EffectScheme;
}

const customTheme: Theme = {
  name: 'Cyberpunk',
  colors: {
    primary: '#00ffff',
    secondary: '#ff00ff',
    background: '#000011',
    text: '#ffffff'
  },
  fonts: {
    primary: 'Orbitron, monospace',
    secondary: 'Roboto Mono, monospace'
  },
  effects: {
    glow: true,
    particles: true,
    neonBorders: true
  }
};

// Apply theme
themeEngine.loadTheme(customTheme);
```

### Custom Rules

Implement custom game rules:

```typescript
interface Rule {
  id: string;
  name: string;
  evaluate(gameState: GameState, result: SpinResult): RuleResult;
}

class CustomWinRule implements Rule {
  id = 'custom-win';
  name = 'Custom Win Condition';
  
  evaluate(gameState: GameState, result: SpinResult): RuleResult {
    // Custom logic
    if (result.outerWedge.label === 'JACKPOT' && 
        result.innerWedge.label === 'x10') {
      return {
        type: 'win',
        message: 'MEGA JACKPOT!',
        score: 1000
      };
    }
    
    return { type: 'continue' };
  }
}

// Register rule
ruleEngine.addRule(new CustomWinRule());
```

## Testing Framework

### Unit Testing

Test individual components:

```typescript
import { WheelRenderer } from '../src/components/WheelRenderer';
import { createMockWheel } from './helpers/mockData';

describe('WheelRenderer', () => {
  let renderer: WheelRenderer;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  beforeEach(() => {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d')!;
    renderer = new WheelRenderer(canvas);
  });
  
  it('should render wheel correctly', () => {
    const wheel = createMockWheel();
    
    renderer.renderWheel(wheel, ctx);
    
    // Verify rendering
    expect(ctx.fillStyle).toBeDefined();
    expect(ctx.strokeStyle).toBeDefined();
  });
});
```

### Integration Testing

Test component interactions:

```typescript
import { GameController } from '../src/components/GameController';
import { createTestGame } from './helpers/gameHelpers';

describe('Game Integration', () => {
  let gameController: GameController;
  
  beforeEach(async () => {
    gameController = await createTestGame();
  });
  
  it('should complete full game cycle', async () => {
    await gameController.startGame();
    
    gameController.startPowerMeter();
    await gameController.stopPowerMeter(0.75);
    const result = await gameController.waitForSpinComplete();
    
    expect(result.outerWedge).toBeDefined();
    expect(result.innerWedge).toBeDefined();
  });
});
```

### Performance Testing

Measure performance characteristics:

```typescript
describe('Performance Tests', () => {
  it('should maintain 60fps during spinning', async () => {
    const frameTimings: number[] = [];
    const startTime = performance.now();
    
    while (performance.now() - startTime < 1000) { // 1 second test
      const frameStart = performance.now();
      
      // Simulate frame
      physicsEngine.stepSimulation(1/60);
      renderer.render(wheels, ctx);
      
      const frameTime = performance.now() - frameStart;
      frameTimings.push(frameTime);
      
      await new Promise(resolve => setTimeout(resolve, 16));
    }
    
    const averageFrameTime = frameTimings.reduce((a, b) => a + b) / frameTimings.length;
    const averageFPS = 1000 / averageFrameTime;
    
    expect(averageFPS).toBeGreaterThan(58); // Allow some variance
  });
});
```

### Mock Helpers

Create reusable test helpers:

```typescript
// tests/helpers/mockData.ts
export function createMockWheel(options: Partial<Wheel> = {}): Wheel {
  return {
    id: 'test-wheel',
    label: 'Test Wheel',
    wedges: [
      { id: 'w1', label: 'Test 1', weight: 1, color: '#ff0000' },
      { id: 'w2', label: 'Test 2', weight: 1, color: '#00ff00' }
    ],
    frictionCoefficient: 0.02,
    clutchRatio: 0.5,
    radius: 200,
    position: { x: 300, y: 300 },
    currentAngle: 0,
    angularVelocity: 0,
    ...options
  };
}

export function createMockGameState(): GameState {
  return {
    wheels: [createMockWheel()],
    players: [{ id: 'p1', name: 'Test Player', isActive: true }],
    currentPlayerIndex: 0,
    gamePhase: 'setup',
    scores: new Map([['p1', 0]]),
    rules: [],
    settings: {
      maxPlayers: 4,
      enableSound: true,
      theme: 'default',
      deterministic: true
    }
  };
}
```

## Build and Deployment

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run type-check
```

### Build Configuration

```typescript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'wheel-game.js',
    library: 'WheelGame',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};
```

### Production Build

```bash
# Build for production
npm run build

# Analyze bundle size
npm run analyze

# Generate documentation
npm run docs

# Run all checks
npm run ci
```

### Deployment Options

#### Static Hosting
```bash
# Build and deploy to static host
npm run build
# Upload dist/ folder to your hosting provider
```

#### CDN Integration
```html
<!-- Include from CDN -->
<script src="https://cdn.example.com/wheel-game/1.0.0/wheel-game.min.js"></script>
<link rel="stylesheet" href="https://cdn.example.com/wheel-game/1.0.0/wheel-game.min.css">
```

#### NPM Package
```bash
# Publish to NPM
npm publish

# Install in other projects
npm install wheel-within-wheel-game
```

### Environment Configuration

```typescript
// config/environment.ts
export const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true,
    enableDevTools: true
  },
  production: {
    apiUrl: 'https://api.example.com',
    debug: false,
    enableDevTools: false
  }
};
```

## API Reference

### Type Definitions

```typescript
// Core Types
interface Wheel {
  id: string;
  label: string;
  wedges: Wedge[];
  frictionCoefficient: number;
  clutchRatio: number;
  radius: number;
  position: Point;
  currentAngle: number;
  angularVelocity: number;
}

interface Wedge {
  id: string;
  label: string;
  weight: number;
  color: string;
  media?: WedgeMedia;
}

interface GameState {
  wheels: Wheel[];
  players: Player[];
  currentPlayerIndex: number;
  gamePhase: GamePhase;
  scores: Map<string, number>;
  rules: Rule[];
  settings: GameSettings;
}

// Event Types
type GameEvent = 
  | 'gameStart'
  | 'gameEnd'
  | 'turnStart'
  | 'turnEnd'
  | 'spinStart'
  | 'spinComplete'
  | 'powerMeterStart'
  | 'powerMeterStop';

// Configuration Types
interface GameSettings {
  maxPlayers: number;
  roundLimit?: number;
  scoreLimit?: number;
  enableSound: boolean;
  theme: string;
  deterministic: boolean;
  rngSeed?: number;
}
```

### Error Handling

```typescript
// Error Types
class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'GameError';
  }
}

class PhysicsError extends GameError {
  constructor(message: string) {
    super(message, 'PHYSICS_ERROR');
  }
}

// Error Handling
try {
  await gameController.startGame();
} catch (error) {
  if (error instanceof GameError) {
    console.error(`Game Error [${error.code}]: ${error.message}`);
    
    if (error.recoverable) {
      // Attempt recovery
      gameController.reset();
    }
  }
}
```

### Performance Monitoring

```typescript
// Performance API
interface PerformanceMonitor {
  startMeasurement(name: string): void;
  endMeasurement(name: string): number;
  getMetrics(): PerformanceMetrics;
  reset(): void;
}

// Usage
const monitor = new PerformanceMonitor();

monitor.startMeasurement('render');
renderer.render(wheels, ctx);
const renderTime = monitor.endMeasurement('render');

console.log(`Render time: ${renderTime}ms`);
```

---

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Write comprehensive JSDoc comments
- Include unit tests for all new features

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

### Development Workflow

```bash
# Setup development environment
git clone https://github.com/example/wheel-game.git
cd wheel-game
npm install

# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
npm test
npm run lint

# Commit and push
git commit -m "Add new feature"
git push origin feature/new-feature
```

For more information, see the [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).