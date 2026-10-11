/**
 * ProjectTailFairy の共有ドメイン型です。
 */

//#region 識別子

/**
 * ニューロン識別子です。
 */
export type NeuronId = string;

/**
 * シナプス識別子です。
 */
export type SynapseId = string;

//#endregion

//#region イベントと状態

/**
 * スパイク発火イベントです。
 */
export interface SpikeEvent {
  neuron_id: NeuronId;
  timestamp: number;
}

/**
 * ニューロン状態です。
 */
export interface NeuronState {
  id: NeuronId;
  membrane_potential: number;
  threshold: number;
  resting_potential: number;
  last_spike_time: number | null;
}

/**
 * シナプス状態です。
 */
export interface SynapseState {
  id: SynapseId;
  pre_neuron_id: NeuronId;
  post_neuron_id: NeuronId;
  weight: number;
  delay: number;
  eligibility_trace: number;
}

//#endregion

//#region 入出力

/**
 * 多次元報酬ベクトルです。
 */
export interface RewardVector {
  dimensions: number[];
  timestamp: number;
}

/**
 * ネットワーク設定です。
 */
export interface NetworkConfig {
  neuron_count: number;
  input_neuron_count: number;
  output_neuron_count: number;
  initial_connectivity: number;
  time_step: number;
}

/**
 * シミュレーション結果です。
 */
export interface SimulationResult {
  spikes: SpikeEvent[];
  final_states: NeuronState[];
  metrics: Record<string, number>;
  duration: number;
}

//#endregion
