Wheel within a Wheel
A browser-based hot-seat multiplayer game featuring a unique dual-wheel spinning system with comprehensive customization capabilities.

Features
Dual-wheel system: Outer wheel drives inner wheel through customizable "clutch" mechanics.

Skill-based power selection: Players use timing to control spin force via oscillating power bar.

Hot-seat multiplayer: Turn-based gameplay for multiple players on one device.

Comprehensive editor: Full customization of wheels, rules, content, and win/loss conditions.

Rich media support: Text, images, and videos for wedge content.

Weighted probability system: Control outcomes independent of visual wedge sizes.

Audio/visual theming: Complete customization with themed packages.

Preset management: Save and share game configurations.

Project Structure
.
├── src/
│   ├── components/       # Core game components
│   │   ├── wheels/       # Wheel rendering and physics
│   │   ├── ui/           # User interface components
│   │   └── editor/       # Game editor components
│   ├── engines/          # Core game engines
│   │   ├── physics/      # Physics calculations
│   │   └── game/         # Game flow management
│   ├── models/           # Data models and interfaces
│   │   ├── game/         # Game state models
│   │   ├── wheels/       # Wheel and wedge models
│   │   └── rules/        # Rule system models
│   ├── utils/            # Utility functions
│   │   ├── validation/   # Input validation
│   │   ├── math/         # Mathematical calculations
│   │   └── storage/      # LocalStorage management
│   ├── assets/           # Static assets
│   │   ├── images/       # Default images
│   │   ├── sounds/       # Default sound effects
│   │   └── videos/       # Default video content
│   └── constants/        # Game constants
└── ...

Technology Stack
TypeScript: Type-safe JavaScript development

HTML5 Canvas: High-performance 2D graphics rendering

Web Audio API: Sound effects and background music

HTML5 Video API: Media playback for wedge content

LocalStorage: Client-side data persistence

Webpack: Module bundling and asset optimization

Jest: Unit testing framework

ESLint: Code quality and consistency

MVP & Acceptance Criteria
- Minimal feature set
  - Hot-seat multiplayer on one device for N players (turn-based).
  - Dual-wheel spin simulation (outer wheel → inner wheel via clutch) with a playable preview.
  - Editor: create/edit wedges (label, weight, media), create wheels, assign presets.
  - Weighted probability selection implemented (visual wedge sizes may differ from selection weights).
  - Save/load presets to LocalStorage and import/export as JSON.
  - Deterministic RNG option (seeded) for reproducible previews and tests.
- Acceptance criteria (pass/fail)
  - A player can create a wheel with at least 3 wedges, spin it from the editor preview, and see a selectable wedge outcome that follows configured weights.
  - Presets saved in LocalStorage can be exported and re-imported with identical results.
  - Physics integration: inner wheel reacts to outer wheel via a clutchRatio parameter and completes spins at interactive frame rates (target: 60fps on modern desktops).
  - Unit tests cover spin math and probability mapping with deterministic RNG seeds.

Data Models (example TypeScript interfaces)
- Include representative interfaces to make expectations explicit. Example (for documentation — to be added to `src/models/` later):

[`typescript.declaration()`](vision.md:62)
interface Wheel {
  id: string;
  label: string;
  wedges: Wedge[];
  frictionCoefficient: number; // 0..1
  clutchRatio: number; // how outer → inner torque maps (0..1)
  initialAngularVelocity?: number;
}

interface Wedge {
  id: string;
  label: string;
  weight: number; // selection probability weight
  visualAngle?: number; // degrees used for rendering only
  media?: { type: 'text' | 'image' | 'video'; src: string };
  winCondition?: string; // optional rule id or description
}

interface Preset {
  id: string;
  name: string;
  createdAt: string; // ISO date
  wheels: Wheel[];
  rules: Rule[];
}

interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  score?: number;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  conditions: any; // structured rule expression (document separately)
}

Spin & Clutch Mechanics
- Overview
  - The outer wheel provides input torque derived from player power (timing skill). The inner wheel's motion is driven by the outer wheel through a clutch mechanism parameterized by clutchRatio (0..1).
  - The simulation should be deterministic given a seeded RNG and initial conditions, and use a small fixed timestep for stable integration.

- Core formulas
  - outerAngularVelocity0 = mapPowerToOmega(power, maxOmega)
  - outerTorque ≈ I_outer * angularAccelerationOuter (for a playable simulation, the outerTorque can be approximated by a value proportional to outerAngularVelocity0)
  - innerTorque = clutchRatio * outerTorque
  - angularAcceleration_inner = (innerTorque - frictionTorque_inner) / I_inner
  - frictionTorque_inner = sign(omega) * frictionCoefficient * K (K is scale factor tuned for feel)
  - Integrate with semi-implicit Euler:
    - omega += angularAcceleration * dt
    - angle += omega * dt

- Recommended parameter ranges (starting values)
  - clutchRatio: 0.0 — 1.0 (default 0.6)
  - frictionCoefficient: 0.01 — 0.2 (default 0.05)
  - maxOmega (peak angular velocity for max power): 10 — 30 rad/s (default 18)
  - dt: 1/60 (use fixed-step for deterministic behavior)
  - moment of inertia can be set relative to wheel size; use normalized values for ease (I = 1.0 default)

- Deterministic RNG
  - Use a small, fast seeded PRNG (e.g., mulberry32 or xorshift) to allow repeatable preview spins and statistical tests.

- Observable behavior expectations (acceptance)
  - Higher power produces faster initial outer wheel velocity and thus higher inner wheel acceleration via clutchRatio.
  - Increasing frictionCoefficient shortens spin duration and reduces overshoot.
  - Varying clutchRatio changes inner wheel responsiveness; low ratios decouple the inner wheel (more independent), high ratios transmit more outer torque.

- Testing & verification
  - Deterministic unit tests: with a fixed seed and power input, the simulation yields the same landed wedge every run.
  - Statistical tests: over N=10k seeded simulations, observed selection frequencies match configured weights within a tolerance (e.g., ±1–2%).

- Pseudocode (TypeScript-style)
  - Provide a small, copyable pseudocode to implement the core loop and weighted selection.

[`typescript.declaration()`](vision.md:200)
function mapPowerToOmega(power: number, maxOmega: number): number {
  return Math.max(0, Math.min(1, power)) * maxOmega;
}

function computeInnerTorque(outerTorque: number, clutchRatio: number): number {
  return outerTorque * Math.max(0, Math.min(1, clutchRatio));
}

function frictionTorque(omega: number, frictionCoefficient: number, K = 1): number {
  return -Math.sign(omega) * Math.abs(omega) * frictionCoefficient * K;
}

function stepWheelSimulation(state: {
  omega: number;
  angle: number;
  I: number;
}, torque: number, frictionCoefficient: number, dt: number) {
  const tauF = frictionTorque(state.omega, frictionCoefficient);
  const alpha = (torque + tauF) / state.I;
  // semi-implicit Euler
  state.omega += alpha * dt;
  state.angle += state.omega * dt;
  return state;
}

function weightedSelect(wedges: { id: string; weight: number }[], rng: () => number) {
  const total = wedges.reduce((s, w) => s + Math.max(0, w.weight), 0);
  const r = rng() * total;
  let acc = 0;
  for (const w of wedges) {
    acc += Math.max(0, w.weight);
    if (r <= acc) return w.id;
  }
  return wedges[wedges.length - 1].id; // fallback
}