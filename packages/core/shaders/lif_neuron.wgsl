// LIF (Leaky Integrate-and-Fire) Neuron Compute Shader
// This shader computes membrane potential updates for multiple neurons in parallel

struct NeuronParams {
  threshold: f32,
  restingPotential: f32,
  leakRate: f32,
  timeStep: f32,
}

struct NeuronState {
  membranePotential: f32,
  lastSpikeTime: f32,
  refractoryCounter: f32,
  _padding: f32,  // Align to 16 bytes
}

@group(0) @binding(0) var<uniform> params: NeuronParams;
@group(0) @binding(1) var<storage, read_write> states: array<NeuronState>;
@group(0) @binding(2) var<storage, read> inputs: array<f32>;
@group(0) @binding(3) var<storage, read_write> spikes: array<u32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= arrayLength(&states)) {
    return;
  }
  
  var state = states[idx];
  let input = inputs[idx];
  
  // Skip if in refractory period
  if (state.refractoryCounter > 0.0) {
    state.refractoryCounter -= params.timeStep;
    states[idx] = state;
    spikes[idx] = 0u;
    return;
  }
  
  // Leaky integration
  let dV = params.leakRate * (params.restingPotential - state.membranePotential) + input;
  state.membranePotential += dV * params.timeStep;
  
  // Spike generation
  if (state.membranePotential >= params.threshold) {
    spikes[idx] = 1u;
    state.membranePotential = params.restingPotential;
    state.refractoryCounter = 2.0;  // 2ms refractory period
  } else {
    spikes[idx] = 0u;
  }
  
  states[idx] = state;
}
