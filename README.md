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

- **Language**: TypeScript (unified across the repo)
- **GPU Computing**: WebGPU + WGSL compute shaders (`Model/src/Utils/Gpu/`)
- **Package Manager**: pnpm with workspaces (Turborepo removed)
- **Testing**: Vitest (per-package config, bundled at root)
- **Frontend / Verification env**: Nuxt 3 (`Playground/`)
- **Lint / Format**: ESLint (Flat Config, strict-type-checked) + Prettier (format-on-save)

## Project Structure

```
ProjectTailFairy/
├── Model/                  # Publish target: the AI model itself
│   ├── src/
│   │   ├── Classes/        # Model classes/methods + shared domain types
│   │   └── Utils/
│   │       └── Gpu/        # WebGPU code + .wgsl shaders (excluded from Prettier)
│   └── tests/              # Vitest implementation-verification tests
├── TranslatedLibraries/    # Publish target(s): Python-translated libraries
│   └── Numerical/          # NumPy/SciPy-style numerical computing (array/matrix/vector/stats)
│       ├── src/
│       └── tests/
├── Playground/             # Not published: Nuxt verification environment
│   ├── pages/Phases/       # Per-phase achievement-check pages
│   ├── pages/Experiments/  # Performance tests / benchmarks
│   └── composables/ utils/ # Web Worker / genetic-algorithm execution
└── Docs/                   # Documentation
```

**Dependencies (one-directional; reverse imports prohibited):**
`Playground` (pages) → `Model/Classes` → `Model/Utils`; `Playground`/`Model` → `TranslatedLibraries`. `TranslatedLibraries` depends on nothing else (pure TypeScript / published TS modules only).

## Branch Strategy

- `main` - Stable version; the newest currently-working state
- `develop` - Development integration branch
- `feature` - Feature development branches
- `release` - Completed state per phase/stage
- `sandbox` - Mathematical verification and experimental branches

Direct commits to `main` / `develop` / `release` are prohibited in principle (reflect via merge or cherry-pick).

## Getting Started

```bash
pnpm install
pnpm lint            # ESLint
pnpm format          # Prettier write
pnpm test            # Run all package tests
pnpm test:model      # Model only
pnpm test:numerical  # Numerical library only
```

## WebGPU Requirements

WebGPU is required for GPU-accelerated computation (Chrome/Edge 113+, etc.).

## Verification Phases

Phases 1-9 (fixed-structure learning → self-recognition). See Docs and the project wiki for details.

## Team

- **surumeneco** - Architecture design, biological similarity, conceptual design
- **Schokosnuss** - Mathematical verification, homeostatic control, parameter optimization

## License

MIT
