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
│   ├── NumPyTs/            # NumPy translation (`import * as np from "@project-tail-fairy/numpy-ts"`)
│   │   ├── src/
│   │   └── tests/
│   └── SciPyTs/            # SciPy translation (`import * as scipy from "@project-tail-fairy/scipy-ts"`)
│       ├── src/
│       └── tests/
├── Playground/             # Not published: Nuxt verification environment
│   ├── pages/Phases/       # Per-phase achievement-check pages
│   ├── pages/Experiments/  # Performance tests / benchmarks
│   └── composables/ utils/ # Web Worker / genetic-algorithm execution
└── Docs/                   # Documentation
```

**Dependencies (one-directional; reverse imports prohibited):** `Playground` (pages) → `Model/Classes` → `Model/Utils`; `Playground`/`Model` → `TranslatedLibraries/NumPyTs`; `TranslatedLibraries/SciPyTs` → `TranslatedLibraries/NumPyTs`. Reverse imports are prohibited.

## Branch Strategy

- `main` — Stable baseline. Changes only through a reviewed `develop -> main` promotion or an urgent `hotfix/* -> main` PR; mark stable checkpoints with release tags.
- `develop` — Latest integrated development state. Base new feature branches on `develop` and merge them back through PRs.
- `feature/*` — One independently reviewable implementation or refactoring task; branch from `develop`, PR into `develop`.
- `hotfix/*` — Urgent corrections based on `main`; PR into `main` and propagate the same fix into `develop`.
- `archive/*` — Historical read-only references, never a source for routine merges.
- `release/*` — Optional, only when a dedicated stabilization period is necessary. Not part of the default flow.

Direct commits to `main` and `develop` are prohibited by project policy. Do not force-push either branch after the one-time October 2026 migration. CI checks formatting, lint, TypeScript builds, tests, and PR direction for both branches. GitHub branch protection/rulesets must additionally be enabled in repository settings for server-side enforcement.

The legacy `develop` prototype (HEAD `b1928b5ed224704a169e7f0d9e73a45456521ebe`) is preserved in `archive/develop-legacy-20261016`. The modern `develop` was re-established from `main` at `6edf796e6282f10addd7c032a1236d2769ce6428` on October 16, 2026. The old `packages/core` prototype is research history, not an automatically integrated implementation.

See [branch and release operations](Docs/branching-and-release.md) for merge rules, promotion criteria, required GitHub settings, and legacy migration details.

## Getting Started

```bash
pnpm install
pnpm lint            # ESLint
pnpm format          # Prettier write
pnpm test            # Run all package tests
pnpm test:model      # Model only
pnpm test:numpy      # NumPyTs only
pnpm test:scipy      # SciPyTs only
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
