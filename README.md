# Wheel within a Wheel

A browser-based hot-seat multiplayer game featuring a unique dual-wheel spinning system with comprehensive customization capabilities.

## Project Status

This project is currently in the specification and planning phase. The implementation will transform a simple HTML wheel spinner into a sophisticated game with:

- **Dual-wheel physics system** with clutch mechanics
- **Skill-based power selection** via timing-based power meter
- **Hot-seat multiplayer** for turn-based gameplay
- **Comprehensive editor** for wheels, rules, and content
- **Rich media support** for images, videos, and themed content
- **Weighted probability system** independent of visual design
- **Preset management** with save/load/share capabilities

## Project Structure

```
.
├── .kiro/
│   ├── specs/wheel-within-wheel-game/
│   │   ├── requirements.md    # Detailed requirements and acceptance criteria
│   │   ├── design.md          # Architecture and implementation design
│   │   └── tasks.md           # Implementation task breakdown
│   └── steering/
│       └── guardian-protocol.md  # Development guidelines and standards
├── wheewheell.html           # Original simple wheel implementation
├── vision.md                 # Project vision and technical specifications
└── agents.md                 # Development protocols and guidelines
```

## Getting Started

1. Review the project specifications in `.kiro/specs/wheel-within-wheel-game/`
2. Start with Task 1 in `tasks.md` to set up the TypeScript foundation
3. Follow the Guardian Protocol guidelines for code quality and standards

## Technology Stack

- **TypeScript** for type-safe development
- **HTML5 Canvas** for high-performance rendering
- **Web Audio API** for sound effects
- **LocalStorage** for data persistence
- **Webpack** for module bundling
- **Jest** for testing

## Development Approach

The project follows a phased approach that preserves the existing functionality while gradually adding sophisticated features:

1. **Phase 1**: TypeScript foundation and modularization
2. **Phase 2**: Enhanced physics and clutch mechanics
3. **Phase 3**: Editor and multiplayer features
4. **Phase 4**: Rich media and theming system

Each phase maintains backward compatibility and includes comprehensive testing.

## Contributing

This project follows strict development protocols outlined in the Guardian Protocol. All code must be:

- Complete and functional (no placeholders or TODOs)
- Well-documented and maintainable
- Thoroughly tested
- Backward compatible during transitions

## License

[License to be determined]