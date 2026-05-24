/**
 * ProjectTailFairy - Neuron Module
 * ニューロンの実装
 * 
 * @see wiki://Neuron
 * @see wiki://InputNeuron
 */

import type { 
  NeuronId, 
  NeuronState, 
  InputNeuronState, 
  SynapseState,
  SynapseId 
} from './types';

// =============================================================================
// Neuron Class
// =============================================================================

/**
 * ニューロン - 入力を受け取りスパイク出力を生成する計算単位
 * 
 * 発火条件: O[s, x] = (θ[x] < Σ_k (I[s, x, k] * W[s, x, k])) ? 1 : 0
 */
export class Neuron {
  private state: NeuronState;

  constructor(config: {
    id: NeuronId;
    threshold?: number;
    targetFiringRate?: number;
    synapseCutThreshold?: number;
    synapseAddCoefficient?: number;
  }) {
    this.state = {
      id: config.id,
      threshold: config.threshold ?? 1.0,
      firingRate: 0.0,
      targetFiringRate: config.targetFiringRate ?? 0.1, // TODO: 適切なデフォルト値を検討
      synapseCutThreshold: config.synapseCutThreshold ?? 0.01,
      synapseAddCoefficient: config.synapseAddCoefficient ?? 0.1,
      synapses: [],
      membranePotential: 0.0,
      lastSpikeTime: null,
      hasFired: false,
    };
  }

  // ---------------------------------------------------------------------------
  // Core Operations
  // ---------------------------------------------------------------------------

  /**
   * ニューロンの状態を1タイムステップ更新
   * @param inputs - 各入力ニューロンの発火状態（インデックスは inputIndex に対応）
   * @param currentTime - 現在のタイムステップ
   * @returns 発火したかどうか
   */
  step(inputs: boolean[], currentTime: number): boolean {
    // 加重和を計算: Σ_k (I[s, x, k] * W[s, x, k])
    let weightedSum = 0;
    for (const synapse of this.state.synapses) {
      const inputFired = inputs[synapse.inputIndex] ? 1 : 0;
      weightedSum += inputFired * synapse.weight;
    }

    this.state.membranePotential = weightedSum;

    // 発火判定: θ < weightedSum
    this.state.hasFired = this.state.threshold < weightedSum;
    
    if (this.state.hasFired) {
      this.state.lastSpikeTime = currentTime;
    }

    return this.state.hasFired;
  }

  /**
   * タイムステップ終了時のリセット処理
   */
  resetForNextStep(): void {
    this.state.hasFired = false;
    this.state.membranePotential = 0;
    // TODO: 必要に応じてリーク項などを追加（LIFモデル拡張時）
  }

  // ---------------------------------------------------------------------------
  // Synapse Management
  // ---------------------------------------------------------------------------

  /**
   * シナプスを追加
   */
  addSynapse(synapse: SynapseState): void {
    this.state.synapses.push(synapse);
  }

  /**
   * シナプスを削除
   */
  removeSynapse(synapseId: SynapseId): void {
    this.state.synapses = this.state.synapses.filter(s => s.id !== synapseId);
  }

  /**
   * 弱いシナプスをプルーニング
   * @returns 削除されたシナプスのID
   */
  pruneWeakSynapses(): SynapseId[] {
    const toRemove: SynapseId[] = [];
    
    for (const synapse of this.state.synapses) {
      if (Math.abs(synapse.weight) < this.state.synapseCutThreshold) {
        toRemove.push(synapse.id);
      }
    }

    this.state.synapses = this.state.synapses.filter(
      s => !toRemove.includes(s.id)
    );

    return toRemove;
  }

  // ---------------------------------------------------------------------------
  // Homeostasis (see homeostasis.ts for full implementation)
  // ---------------------------------------------------------------------------

  /**
   * 発火率を更新（EMA）
   * Φ[s+1] = (1 - α) * Φ[s] + α * O[s]
   * where α = 1/L
   * 
   * @param smoothingWindow - 平滑化窓幅 L
   */
  updateFiringRate(smoothingWindow: number): void {
    const alpha = 1 / smoothingWindow;
    const fired = this.state.hasFired ? 1 : 0;
    this.state.firingRate = (1 - alpha) * this.state.firingRate + alpha * fired;
  }

  /**
   * 閾値を更新（ホメオスタティック可塑性）
   * θ[s+1] = θ[s] + Δθ * (Φ[s] - T[s])
   * 
   * @param thresholdUpdateRate - 閾値更新率 Δθ
   */
  updateThreshold(thresholdUpdateRate: number): void {
    const diff = this.state.firingRate - this.state.targetFiringRate;
    this.state.threshold += thresholdUpdateRate * diff;
    
    // TODO: 閾値の上下限を設定するか検討
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  get id(): NeuronId { return this.state.id; }
  get threshold(): number { return this.state.threshold; }
  get firingRate(): number { return this.state.firingRate; }
  get targetFiringRate(): number { return this.state.targetFiringRate; }
  get synapses(): readonly SynapseState[] { return this.state.synapses; }
  get hasFired(): boolean { return this.state.hasFired; }
  get lastSpikeTime(): number | null { return this.state.lastSpikeTime; }
  get membranePotential(): number { return this.state.membranePotential; }

  getState(): Readonly<NeuronState> {
    return { ...this.state, synapses: [...this.state.synapses] };
  }
}

// =============================================================================
// Input Neuron Class
// =============================================================================

/**
 * 入力ニューロン - 外部入力をスパイクに変換する特殊ニューロン
 * 
 * 特性:
 * - シナプスを持たない
 * - 学習や重み更新を行わない
 * - 入力スパイクを直接出力
 */
export class InputNeuron {
  private state: InputNeuronState;

  constructor(id: NeuronId) {
    this.state = {
      id,
      hasFired: false,
      inputValue: 0,
    };
  }

  /**
   * 入力値を設定し、発火を決定
   * @param value - 入力値（0または1、または確率的発火の場合は0-1の値）
   * @param stochastic - 確率的発火を使用するか
   */
  setInput(value: number, stochastic: boolean = false): void {
    this.state.inputValue = value;
    
    if (stochastic) {
      // 確率的発火: valueを発火確率として扱う
      this.state.hasFired = Math.random() < value;
    } else {
      // 決定的発火: value > 0.5 で発火
      this.state.hasFired = value > 0.5;
    }
  }

  /**
   * タイムステップ終了時のリセット処理
   */
  resetForNextStep(): void {
    this.state.hasFired = false;
    this.state.inputValue = 0;
  }

  get id(): NeuronId { return this.state.id; }
  get hasFired(): boolean { return this.state.hasFired; }
  get inputValue(): number { return this.state.inputValue; }

  getState(): Readonly<InputNeuronState> {
    return { ...this.state };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * ニューロンを生成
 */
export function createNeuron(
  id: NeuronId,
  options?: Partial<{
    threshold: number;
    targetFiringRate: number;
    synapseCutThreshold: number;
    synapseAddCoefficient: number;
  }>
): Neuron {
  return new Neuron({ id, ...options });
}

/**
 * 入力ニューロンを生成
 */
export function createInputNeuron(id: NeuronId): InputNeuron {
  return new InputNeuron(id);
}

/**
 * 複数のニューロンを一括生成
 */
export function createNeurons(
  count: number,
  idPrefix: string = 'n',
  options?: Partial<{
    threshold: number;
    targetFiringRate: number;
    synapseCutThreshold: number;
    synapseAddCoefficient: number;
  }>
): Neuron[] {
  return Array.from({ length: count }, (_, i) => 
    createNeuron(`${idPrefix}_${i}`, options)
  );
}

/**
 * 複数の入力ニューロンを一括生成
 */
export function createInputNeurons(
  count: number,
  idPrefix: string = 'in'
): InputNeuron[] {
  return Array.from({ length: count }, (_, i) => 
    createInputNeuron(`${idPrefix}_${i}`)
  );
}