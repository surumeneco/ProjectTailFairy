# Migration Notes

## Python → TypeScript Migration

The project has been migrated from Python to TypeScript.

### Old Python files removed:
- `core/__init__.py`
- `core/neuron/__init__.py`
- `core/synapse/__init__.py`
- `core/learning/__init__.py`
- `core/homeostasis/__init__.py`
- `core/plasticity/__init__.py`
- `core/models/__init__.py`
- `pyproject.toml`

### New TypeScript structure:
- `packages/core/` - Core SNN engine
- `packages/shared/` - Shared types
- `packages/simulation/` - Simulation runtime
- `apps/web/` - Nuxt 3 frontend
- `apps/cli/` - CLI tools

### WebGPU acceleration:
WGSL shaders in `packages/core/shaders/` provide GPU-accelerated neuron computation.
