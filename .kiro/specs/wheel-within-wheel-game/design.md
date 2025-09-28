# Design Document

## Overview

The "Wheel within a Wheel" game will be built as a modular TypeScript application that extends the existing HTML wheel spinner. The design preserves the current working functionality while adding sophisticated physics simulation, comprehensive editing capabilities, and multiplayer features. The architecture follows a component-based approach with clear separation between game logic, physics simulation, UI components, and data management.

## Architecture

### High-Level Architecture

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

### Migration Strategy

The existing HTML wheel will be gradually enhanced rather than replaced:

1. **Phase 1**: Extract existing functionality into TypeScript modules
2. **Phase 2**: Enhance physics simulation while maintaining current behavior
3. **Phase 3**: Add editor and multiplayer features
4. **Phase 4**: Implement advanced features (media, theming, presets)

## Components and Interfaces

### Core Data Models

```typescript
interface Wheel {
  id: string;
  label: string;
  wedges: Wedge[];
  frictionCoefficient: number; // 0..1
  clutchRatio: number; // 0..1 for inner wheel
  radius: number;
  position: { x: number; y: number };
  currentAngle: number;
  angularVelocity: number;
}

interface Wedge {
  id: string;
  label: string;
  weight: number; // probability weight
  visualAngle?: number; // for rendering
  color: string;
  media?: WedgeMedia;
  winCondition?: string;
}

interface WedgeMedia {
  type: 'text' | 'image' | 'video';
  src: string;
  alt?: string;
}

interface GameState {
  wheels: Wheel[];
  players: Player[];
  currentPlayerIndex: number;
  gamePhase: 'setup' | 'playing' | 'spinning' | 'result' | 'finished';
  scores: Map<string, number>;
  rules: Rule[];
  settings: GameSettings;
}

interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
}

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

### Physics Engine Design

The physics engine will implement the clutch mechanics described in the vision:

```typescript
interface PhysicsState {
  angle: number;
  angularVelocity: number;
  angularAcceleration: number;
  momentOfInertia: number;
}

interface PhysicsEngine {
  stepSimulation(deltaTime: number): void;
  applyTorque(wheelId: string, torque: number): void;
  setClutchRatio(outerWheelId: string, innerWheelId: string, ratio: number): void;
  isStable(): boolean;
  getWheelState(wheelId: string): PhysicsState;
}
```

**Physics Implementation Strategy:**
- Use semi-implicit Euler integration for stability
- Fixed timestep (1/60s) for deterministic behavior
- Clutch torque transfer: `innerTorque = clutchRatio * outerTorque`
- Friction model: `frictionTorque = -sign(ω) * |ω| * frictionCoeff * K`

### Component Architecture

#### WheelRenderer Component
- Renders wheels using HTML5 Canvas for performance
- Handles smooth animations and visual effects
- Supports dynamic wedge sizing and media display
- Maintains backward compatibility with current CSS-based rendering

#### GameEditor Component
- Provides intuitive interface for wheel and wedge editing
- Real-time preview of changes
- Drag-and-drop media upload
- Weight visualization and probability calculator

#### PowerMeter Component
- Enhanced version of current power meter
- Configurable oscillation speed and range
- Visual feedback for timing accuracy
- Skill-based power curve mapping

#### PlayerManager Component
- Turn-based gameplay coordination
- Score tracking and display
- Player avatar and name management
- Game flow state management

## Data Models

### Wheel Configuration Model

The wheel model extends the current simple structure:

```typescript
interface WheelConfig {
  // Preserved from current implementation
  wedgeCount: number;
  wedgeTexts: string[];
  colors: string[];
  
  // Enhanced properties
  id: string;
  label: string;
  wedges: WedgeConfig[];
  physicsProperties: {
    frictionCoefficient: number;
    clutchRatio?: number; // only for inner wheel
    momentOfInertia: number;
  };
  renderProperties: {
    radius: number;
    strokeWidth: number;
    showLabels: boolean;
    labelFont: string;
  };
}

interface WedgeConfig {
  id: string;
  label: string;
  weight: number;
  visualAngle?: number; // calculated if not provided
  style: {
    fillColor: string;
    strokeColor: string;
    textColor: string;
  };
  media?: WedgeMedia;
  rules?: WedgeRule[];
}
```

### Preset System Model

```typescript
interface Preset {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  modifiedAt: string;
  author?: string;
  
  gameConfig: {
    wheels: WheelConfig[];
    rules: Rule[];
    settings: GameSettings;
    theme: ThemeConfig;
  };
  
  metadata: {
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    playerCount: { min: number; max: number };
    estimatedDuration: number; // minutes
  };
}
```

## Error Handling

### Error Categories and Strategies

1. **Physics Simulation Errors**
   - Detect infinite loops or unstable states
   - Fallback to simplified physics model
   - Log detailed state for debugging

2. **Media Loading Errors**
   - Graceful degradation to text-only display
   - Retry mechanism with exponential backoff
   - User notification with recovery options

3. **Data Validation Errors**
   - Comprehensive input validation
   - Clear error messages with correction suggestions
   - Automatic data sanitization where possible

4. **Storage Errors**
   - LocalStorage quota exceeded handling
   - Corrupted data recovery
   - Import/export validation

### Error Recovery Mechanisms

```typescript
interface ErrorHandler {
  handlePhysicsError(error: PhysicsError): void;
  handleMediaError(error: MediaError): void;
  handleValidationError(error: ValidationError): void;
  handleStorageError(error: StorageError): void;
}

interface ErrorRecovery {
  canRecover(error: GameError): boolean;
  recover(error: GameError): Promise<boolean>;
  getRecoveryOptions(error: GameError): RecoveryOption[];
}
```

## Testing Strategy

### Unit Testing Approach

1. **Physics Engine Testing**
   - Deterministic simulation tests with known inputs/outputs
   - Statistical validation of weighted selection over large samples
   - Performance benchmarks for 60fps requirement
   - Edge case testing (zero weights, extreme values)

2. **Component Testing**
   - Isolated component behavior testing
   - Mock dependencies for focused testing
   - User interaction simulation
   - Accessibility compliance testing

3. **Integration Testing**
   - End-to-end game flow testing
   - Cross-browser compatibility testing
   - Performance testing under various conditions
   - Data persistence and recovery testing

### Test Data and Scenarios

```typescript
interface TestScenario {
  name: string;
  description: string;
  setup: GameState;
  actions: UserAction[];
  expectedOutcome: ExpectedResult;
  deterministicSeed?: number;
}

// Example test scenarios
const testScenarios: TestScenario[] = [
  {
    name: "Basic Spin Test",
    description: "Verify basic wheel spinning functionality",
    setup: createBasicTwoWheelGame(),
    actions: [
      { type: 'startPowerMeter' },
      { type: 'stopPowerMeter', timing: 0.5 },
      { type: 'waitForSpinComplete' }
    ],
    expectedOutcome: {
      type: 'wedgeSelected',
      wheelResults: ['outer-wedge-id', 'inner-wedge-id']
    },
    deterministicSeed: 12345
  }
];
```

### Performance Testing

- **Frame Rate Monitoring**: Continuous FPS measurement during spinning
- **Memory Usage**: Track memory consumption with large media files
- **Load Testing**: Multiple simultaneous games in different tabs
- **Mobile Performance**: Touch interaction and performance on mobile devices

### Accessibility Testing

- **Keyboard Navigation**: Full game playable without mouse
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: WCAG 2.1 AA compliance
- **Motion Sensitivity**: Reduced motion options for accessibility

## Implementation Phases

### Phase 1: Foundation (Preserve Current Functionality)
- Extract existing JavaScript into TypeScript modules
- Create basic data models and interfaces
- Implement simple physics engine that matches current behavior
- Add comprehensive unit tests

### Phase 2: Enhanced Physics
- Implement clutch mechanics and advanced physics
- Add deterministic RNG system
- Enhance power meter with skill-based timing
- Performance optimization for 60fps

### Phase 3: Editor and Multiplayer
- Build comprehensive game editor
- Implement hot-seat multiplayer system
- Add preset save/load functionality
- Create rule engine for win conditions

### Phase 4: Rich Features
- Add media support (images, videos)
- Implement theming and audio system
- Advanced editor features (drag-and-drop, visual feedback)
- Import/export and sharing capabilities

Each phase will maintain backward compatibility and include thorough testing before proceeding to the next phase.