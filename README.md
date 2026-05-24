# ProjectTailFairy 🧚

**Self-organizing AGI agent based on Spiking Neural Networks**

## Overview

This project implements a biologically-inspired artificial general intelligence system using:
- **R-STDP** (Reward-modulated Spike-Timing-Dependent Plasticity)
- **Structural Plasticity** - Dynamic synapse/neuron creation and pruning
- **Homeostatic Control** - Firing rate and threshold regulation
- **Internal Models** - World model and self-model

## Project Structure

```
ProjectTailFairy/
├── core/                    # AGI Core Engine
│   ├── neuron/             # Neuron implementations (LIF, etc.)
│   ├── synapse/            # Synapse and weight management
│   ├── learning/           # R-STDP, eligibility traces
│   ├── homeostasis/        # Firing rate & threshold adjustment
│   ├── plasticity/         # Structural plasticity
│   └── models/             # Internal model, self-model
├── experiments/            # Verification Space (separated from core)
│   ├── phase1_fixed/       # Phase 1: Fixed structure learning
│   ├── phase2_synapse/     # Phase 2: Synaptic plasticity
│   ├── phase3_neuron/      # Phase 3: Neuronal plasticity
│   ├── sandbox/            # Free experimentation
│   └── benchmarks/         # Benchmarks
├── simulation/             # Simulation Environment
│   ├── environments/       # Task environments
│   └── visualization/      # Visualization tools
├── tests/                  # Unit tests
├── tools/                  # Utilities
├── configs/                # Configuration files
└── docs/                   # Documentation
```

## Branch Strategy

- `main` - Stable release (verified only)
- `develop` - Development integration branch
- `feature/*` - Feature development
- `experiment/*` - Experimental branches (safe to break)
- `math/*` - Mathematical verification branches

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

TBD
