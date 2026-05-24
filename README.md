# ProjectTailFairy 🧚

**Self-organizing AGI agent based on Spiking Neural Networks**

> Full TypeScript implementation with WebGPU acceleration

## Overview

This project implements a biologically-inspired artificial general intelligence system using:
- **R-STDP** (Reward-modulated Spike-Timing-Dependent Plasticity)
- **Structural Plasticity** - Dynamic synapse/neuron creation and pruning
- **Homeostatic Control** - Firing rate and threshold regulation
- **Internal Models** - World model and self-model

## Tech Stack

- **Language**: TypeScript (全体統一)
- **GPU Computing**: WebGPU + WGSL compute shaders
- **Runtime**: Deno / Bun / Node.js
- **Frontend**: Nuxt 3 + Vue 3
- **Visualization**: D3.js / Three.js

## Project Structure

```
ProjectTailFairy/
├── packages/                # Monorepo packages
│   ├── core/               # 🧠 SNN Core Engine (TypeScript + WebGPU)
│   │   ├── src/
│   │   │   ├── neuron/     # Neuron implementations (LIF, etc.)
│   │   │   ├── synapse/    # Synapse and weight management
│   │   │   ├── learning/   # R-STDP, eligibility traces
│   │   │   ├── homeostasis/# Firing rate & threshold adjustment
│   │   │   ├── plasticity/ # Structural plasticity
│   │   │   ├── models/     # Internal model, self-model
│   │   │   └── gpu/        # WebGPU compute shaders
│   │   └── shaders/        # WGSL shader files
│   ├── simulation/         # 🎮 Simulation runtime
│   │   ├── src/
│   │   │   ├── environment/# Task environments
│   │   │   └── runner/     # Simulation execution
│   │   └── ...
│   └── shared/             # 📦 Shared types & utilities
│       └── src/
├── apps/                   # Applications
│   ├── web/               # 🌐 Nuxt 3 Frontend
│   │   ├── pages/
│   │   ├── components/
│   │   └── ...
│   └── cli/               # ⌨️ CLI tools
├── experiments/           # 🧪 Verification Space
│   ├── phase1-fixed/      # Phase 1: Fixed structure learning
│   ├── phase2-synapse/    # Phase 2: Synaptic plasticity
│   ├── phase3-neuron/     # Phase 3: Neuronal plasticity
│   ├── sandbox/           # Free experimentation
│   └── benchmarks/        # Performance benchmarks
├── tests/                 # ✅ Test suites
├── docs/                  # 📚 Documentation
└── tools/                 # 🔧 Build & dev tools
```

## Branch Strategy

- `main` - Stable release (verified only)
- `develop` - Development integration branch
- `feature/*` - Feature development
- `experiment/*` - Experimental branches (safe to break)
- `math/*` - Mathematical verification branches

## Getting Started

```bash
# Install dependencies (using pnpm)
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build
```

## WebGPU Requirements

WebGPU is required for GPU-accelerated computation. Supported environments:
- Chrome 113+ / Edge 113+
- Firefox Nightly (with flags)
- Deno 1.39+
- Node.js 22+ (with `--experimental-webgpu`)

## Verification Phases

1. **Phase 1**: Fixed structure learning capability
2. **Phase 2**: Synaptic plasticity introduction
3. **Phase 3**: Neuronal plasticity introduction
4. **Phase 4**: Dormancy mechanism introduction
5. **Phase 5**: Internal world construction
6. **Phase 6**: Memory system implementation
7. **Phase 7**: Motor system learning
8. **Phase 8**: Reward system practicality
9. **Phase 9**: Self-recognition system

## Team

- **surumeneco** - Architecture design, biological similarity, conceptual design
- **Schokosnuss** - Mathematical verification, homeostatic control, parameter optimization

## License

MIT
