# Test Suite Documentation

This document describes the comprehensive test suite for the Wheel within a Wheel game, including all test types, execution instructions, and quality standards.

## Test Structure

The test suite is organized into several categories, each serving a specific purpose:

```
tests/
├── components/          # Unit tests for UI components
├── engines/            # Unit tests for game engines
├── managers/           # Unit tests for manager classes
├── utils/              # Unit tests for utility functions
├── integration/        # Integration tests for component interactions
├── e2e/               # End-to-end complete game scenario tests
├── performance/       # Performance benchmarks and load tests
├── statistical/       # Statistical validation of physics and probability
├── setup.ts           # Test environment setup
└── README.md          # This documentation
```

## Test Categories

### Unit Tests

**Purpose**: Test individual components, functions, and classes in isolation.

**Location**: `tests/components/`, `tests/engines/`, `tests/managers/`, `tests/utils/`

**Coverage**: Each unit test should achieve:
- 100% line coverage for the tested unit
- All public methods tested
- Edge cases and error conditions covered
- Mock dependencies to ensure isolation

**Example**:
```typescript
describe('WheelRenderer', () => {
  it('should render wheel with correct number of wedges', () => {
    const wheel = createMockWheel({ wedgeCount: 8 });
    const renderer = new WheelRenderer(canvas);
    
    renderer.renderWheel(wheel, ctx);
    
    expect(mockDrawArc).toHaveBeenCalledTimes(8);
  });
});
```

### Integration Tests

**Purpose**: Test interactions between multiple components working together.

**Location**: `tests/integration/`

**Scope**: 
- Component communication
- Data flow between layers
- Event handling chains
- State management across components

**Example**:
```typescript
describe('Game Flow Integration', () => {
  it('should update UI when game state changes', async () => {
    const gameController = new GameController();
    const playerUI = new PlayerUI();
    
    await gameController.startGame();
    
    expect(playerUI.getCurrentPlayer()).toBe('Player 1');
  });
});
```

### End-to-End Tests

**Purpose**: Test complete user workflows from start to finish.

**Location**: `tests/e2e/`

**Scenarios**:
- Complete single-player game
- Multiplayer game with turn rotation
- Game creation and editing
- Preset saving and loading
- Error recovery scenarios

**Example**:
```typescript
describe('Complete Game Scenarios', () => {
  it('should complete full multiplayer game', async () => {
    // Setup 3 players
    // Each player takes turns
    // Game ends with winner
    // Scores are tracked correctly
  });
});
```

### Performance Tests

**Purpose**: Ensure the game meets performance requirements.

**Location**: `tests/performance/`

**Metrics**:
- Frame rate (target: 60 FPS, minimum: 45 FPS)
- Memory usage (maximum: 100MB)
- Render time (maximum: 16ms per frame)
- Physics calculation time (maximum: 2ms per frame)
- Bundle size (maximum: 2MB)

**Example**:
```typescript
describe('Performance Benchmarks', () => {
  it('should maintain 60fps during spinning', async () => {
    const metrics = await measureSpinningPerformance(3000);
    
    expect(metrics.averageFPS).toBeGreaterThanOrEqual(58);
    expect(metrics.minFPS).toBeGreaterThanOrEqual(45);
  });
});
```

### Statistical Validation Tests

**Purpose**: Validate mathematical correctness of physics and probability systems.

**Location**: `tests/statistical/`

**Validations**:
- Weighted probability distribution accuracy
- Physics simulation determinism
- Energy conservation in physics
- Clutch mechanism behavior
- Friction model accuracy

**Example**:
```typescript
describe('Probability Distribution', () => {
  it('should follow weighted distribution over large samples', () => {
    const samples = collectSamples(10000);
    const chiSquareResult = performChiSquareTest(samples);
    
    expect(chiSquareResult.pValue).toBeGreaterThan(0.05);
  });
});
```

## Running Tests

### All Tests
```bash
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:watch          # Run in watch mode
```

### Specific Test Categories
```bash
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # End-to-end tests only
npm run test:performance   # Performance benchmarks
npm run test:statistical   # Statistical validation
```

### Individual Test Files
```bash
npm test -- WheelRenderer.test.ts                    # Specific file
npm test -- --testNamePattern="should render wheel"  # Specific test
npm test -- --verbose                                # Detailed output
```

### Coverage Reports
```bash
npm run test:coverage       # Generate coverage report
open coverage/lcov-report/index.html  # View HTML report
```

## Quality Standards

### Coverage Requirements

- **Overall Coverage**: Minimum 80%
- **Line Coverage**: Minimum 80%
- **Function Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%

### Performance Requirements

- **Frame Rate**: Average ≥58 FPS, Minimum ≥45 FPS
- **Memory Usage**: ≤100MB during normal gameplay
- **Render Time**: ≤16ms per frame (60 FPS budget)
- **Physics Time**: ≤2ms per frame
- **Bundle Size**: ≤2MB total

### Statistical Requirements

- **Probability Tests**: p-value ≥0.05 (95% confidence)
- **Physics Determinism**: Identical results with same seed
- **Energy Conservation**: <1% error in isolated systems
- **Clutch Accuracy**: ±10% of expected torque transfer

## Test Data and Mocks

### Mock Data Helpers

Located in `tests/helpers/`, these provide consistent test data:

```typescript
// Create standardized test wheels
const wheel = createMockWheel({
  wedgeCount: 8,
  frictionCoefficient: 0.02
});

// Create test game states
const gameState = createMockGameState({
  playerCount: 3,
  currentPlayer: 0
});
```

### Test Fixtures

Predefined test scenarios in `tests/fixtures/`:

- `simple-game.json`: Basic two-wheel setup
- `complex-game.json`: Multi-player with rules
- `performance-test.json`: High-complexity scenario
- `edge-cases.json`: Boundary condition tests

## Continuous Integration

### GitHub Actions Workflow

The CI pipeline runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### CI Stages

1. **Lint and Type Check**: Code quality validation
2. **Unit Tests**: Fast, isolated tests
3. **Integration Tests**: Component interaction tests
4. **Performance Tests**: Benchmark validation
5. **E2E Tests**: Complete scenario validation
6. **Security Scan**: Dependency vulnerability check
7. **Quality Gates**: Overall quality validation

### Quality Gates

The CI pipeline enforces these quality gates:

- All tests must pass
- Coverage must meet minimum thresholds
- Performance benchmarks must pass
- No high-severity security vulnerabilities
- Bundle size within limits

## Writing New Tests

### Test File Naming

- Unit tests: `ComponentName.test.ts`
- Integration tests: `FeatureName.test.ts`
- E2E tests: `ScenarioName.test.ts`
- Performance tests: `ComponentName.performance.test.ts`

### Test Structure

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = createTestInput();
      const component = new Component();
      
      // Act
      const result = component.methodName(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Best Practices

1. **Descriptive Names**: Test names should clearly describe what is being tested
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Independent Tests**: Tests should not depend on each other
4. **Deterministic**: Tests should produce consistent results
5. **Fast Execution**: Unit tests should complete quickly
6. **Clear Assertions**: Use specific, meaningful assertions

### Mock Guidelines

- Mock external dependencies
- Use real implementations for the system under test
- Verify mock interactions when relevant
- Reset mocks between tests

```typescript
const mockPhysicsEngine = {
  stepSimulation: jest.fn(),
  isStable: jest.fn().mockReturnValue(true)
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

## Debugging Tests

### Common Issues

1. **Timing Issues**: Use `await` for async operations
2. **Mock Problems**: Ensure mocks are properly reset
3. **DOM Issues**: Verify JSDOM environment setup
4. **Canvas Issues**: Use mock canvas context for rendering tests

### Debug Commands

```bash
# Run tests with debug output
npm test -- --verbose

# Run single test with debugging
npm test -- --testNamePattern="specific test" --verbose

# Run tests without coverage (faster)
npm test -- --coverage=false
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Performance Testing

### Benchmark Categories

1. **Rendering Performance**: Frame rate during animations
2. **Physics Performance**: Calculation time per simulation step
3. **Memory Usage**: Heap size during extended gameplay
4. **Bundle Analysis**: JavaScript and CSS file sizes
5. **Load Testing**: Performance under stress conditions

### Performance Monitoring

```typescript
// Measure function execution time
const startTime = performance.now();
functionToMeasure();
const executionTime = performance.now() - startTime;

// Monitor memory usage
const memoryUsage = (performance as any).memory?.usedJSHeapSize;

// Track frame rate
const frameTimings: number[] = [];
// ... collect frame times during animation
const averageFPS = 1000 / (frameTimings.reduce((a, b) => a + b) / frameTimings.length);
```

## Statistical Testing

### Probability Validation

Use chi-square tests to validate probability distributions:

```typescript
function performChiSquareTest(observed: number[], expected: number[]): ChiSquareResult {
  let chiSquare = 0;
  for (let i = 0; i < observed.length; i++) {
    const diff = observed[i] - expected[i];
    chiSquare += (diff * diff) / expected[i];
  }
  
  const degreesOfFreedom = observed.length - 1;
  const pValue = calculatePValue(chiSquare, degreesOfFreedom);
  
  return { chiSquare, pValue, passed: pValue > 0.05 };
}
```

### Physics Validation

Verify physics simulation accuracy:

```typescript
function validateEnergyConservation(initialEnergy: number, finalEnergy: number): boolean {
  const energyLoss = Math.abs(initialEnergy - finalEnergy);
  const relativeError = energyLoss / initialEnergy;
  return relativeError < 0.01; // Less than 1% error
}
```

## Accessibility Testing

### Automated A11y Tests

```bash
npm run test:a11y  # Run accessibility tests
```

### Manual Testing Checklist

- [ ] Keyboard navigation works throughout the application
- [ ] Screen reader announcements are appropriate
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Focus indicators are visible
- [ ] Alternative text provided for images
- [ ] Form labels are properly associated

## Troubleshooting

### Common Test Failures

1. **Canvas Context Issues**: Ensure proper mock setup for canvas operations
2. **Timing Failures**: Use proper async/await patterns
3. **Memory Leaks**: Clean up event listeners and timers
4. **Flaky Tests**: Identify and fix non-deterministic behavior

### Getting Help

- Check existing test examples for patterns
- Review the [Developer Documentation](../docs/developer-guide/README.md)
- Run tests with `--verbose` flag for detailed output
- Use debugger breakpoints to inspect test execution

---

## Test Metrics Dashboard

Current test metrics (updated automatically by CI):

- **Total Tests**: 150+
- **Test Coverage**: 85%+
- **Average Test Runtime**: <30 seconds
- **Performance Benchmarks**: All passing
- **Statistical Validations**: All passing

For detailed metrics, see the latest CI build report or run `npm run benchmark` locally.