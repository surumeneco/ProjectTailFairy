/**
 * Shared Types for ProjectTailFairy
 */

/** Basic neuron ID type */
export type NeuronId = string

/** Basic synapse ID type */
export type SynapseId = string

/** Spike event */
export interface SpikeEvent {
  neuronId: NeuronId
  timestamp: number
}

/** Neuron state */
export interface NeuronState {
  id: NeuronId
  membranePotential: number
  threshold: number
  restingPotential: number
  lastSpikeTime: number | null
}

/** Synapse state */
export interface SynapseState {
  id: SynapseId
  preNeuronId: NeuronId
  postNeuronId: NeuronId
  weight: number
  delay: number
  eligibilityTrace: number
}

/** Reward vector (multi-dimensional) */
export interface RewardVector {
  dimensions: number[]
  timestamp: number
}

/** Network configuration */
export interface NetworkConfig {
  neuronCount: number
  inputNeuronCount: number
  outputNeuronCount: number
  initialConnectivity: number
  timeStep: number
}

/** Simulation result */
export interface SimulationResult {
  spikes: SpikeEvent[]
  finalStates: NeuronState[]
  metrics: Record<string, number>
  duration: number
}
