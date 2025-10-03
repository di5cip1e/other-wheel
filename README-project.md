# Wheel within a Wheel Game

A comprehensive browser-based hot-seat multiplayer wheel spinning game with physics simulation and customization capabilities.

## Project Structure

```
├── src/                    # Source code
│   ├── components/         # UI components
│   ├── engines/           # Game engines (physics, audio, theme)
│   ├── models/            # Data models and interfaces
│   ├── utils/             # Utility functions and services
│   ├── managers/          # Manager classes (PlayerManager, PresetManager)
│   ├── styles/            # CSS styles
│   ├── index.html         # HTML template
│   └── index.ts           # Application entry point
├── tests/                 # Test files
├── dist/                  # Built application (generated)
├── coverage/              # Test coverage reports (generated)
└── node_modules/          # Dependencies (generated)
```

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check without building
npm run type-check
```

### Development Server

The development server runs on `http://localhost:3000` with hot module replacement enabled.

## Technology Stack

- **TypeScript**: Strict type checking and modern JavaScript features
- **Webpack**: Module bundling and development server
- **Jest**: Unit testing framework with TypeScript support
- **ESLint**: Code linting with TypeScript rules
- **Canvas API**: High-performance wheel rendering
- **CSS3**: Responsive design and animations

## Key Features

- Dual-wheel physics simulation with clutch mechanics
- Skill-based power selection system
- Hot-seat multiplayer (2-8 players)
- Comprehensive game editor
- Rich media support (images, videos)
- **Weighted probability system** - Control outcome probability independent of visual wedge size
- Preset management with import/export
- Audio and visual theming
- Responsive design and accessibility

### Weighted Probability System

The game now includes a sophisticated weighted probability system that allows you to control the likelihood of landing on each wedge independent of its visual size:

#### Features:
- **Hidden Probability Weights**: Set custom weight values for each wedge (0.1 to 100+)
- **Visual Independence**: Probability is separate from wedge visual size
- **Real-time Updates**: Weights can be changed during gameplay
- **Statistical Accuracy**: Uses deterministic RNG for consistent results
- **Visual Indicators**: Editor shows probability vs visual size differences

#### How to Use:
1. In the wheel editor, each wedge now has a "Weight" input field
2. Higher weights = higher probability of selection
3. Default weight is 1.0 for all wedges (equal probability)
4. Set a wedge to weight 2.0 to make it twice as likely as weight 1.0 wedges
5. Set a wedge to weight 0.5 to make it half as likely
6. The game will show actual probability percentages in results

#### Example:
- Wedge A: Weight 1 → 20% chance
- Wedge B: Weight 2 → 40% chance  
- Wedge C: Weight 1 → 20% chance
- Wedge D: Weight 1 → 20% chance

This allows for creating "rare" outcomes, bonus rounds, or balanced gameplay regardless of visual wheel design.

## Testing

The project includes comprehensive testing setup:

- Unit tests with Jest and ts-jest
- Mocked Canvas API and browser APIs
- Coverage reporting
- Test utilities for game scenarios

## Code Quality

- Strict TypeScript configuration
- ESLint with TypeScript rules
- Consistent code formatting
- Path aliases for clean imports
- Modular architecture

## Build System

- Webpack with TypeScript loader
- CSS and asset handling
- Development and production configurations
- Source maps for debugging
- Code splitting and optimization