/**
 * ProjectTailFairy - Synapse Module
 * シナプスの実装
 * 
 * @see wiki://Synapse
 */

import type { SynapseId, SynapseState, NeuronId } from './types';

// =============================================================================
// Synapse Class
// =============================================================================

/**
 * シナプス - ニューロン間の接続
 * 
 * 重みは R-STDP を使用して更新され、使用状況と値に基づいてプルーニングされる
 */
export class Synapse {
  private state: SynapseState;

  constructor(config: {
    id: SynapseId;
    inputIndex: number;
    weight?: number;
  }) {
    this.state = {
      id: config.id,
      inputIndex: config.inputIndex,
      weight: config.weight ?? (Math.random() * 0.4 - 0.2), // [-0.2, 0.2] の初期値
      eligibilityTrace: 0,
      lastUpdateTime: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Eligibility Trace
  // ---------------------------------------------------------------------------

  /**
   * 適格性トレースを更新
   * スパイク時間関係に基づいてトレースを増加/減少させる
   * 
   * @param preSpiked - プレシナプスニューロンが発火したか
   * @param postSpiked - ポストシナプスニューロンが発火したか
   * @param timeConstant - 適格性トレースの時定数
   * @param currentTime - 現在のタイムステップ
   */
  updateEligibilityTrace(
    preSpiked: boolean,
    postSpiked: boolean,
    timeConstant: number,
    currentTime: number
  ): void {
    // 時間に基づく減衰
    const dt = currentTime - this.state.lastUpdateTime;
    const decay = Math.exp(-dt / timeConstant);
    this.state.eligibilityTrace *= decay;

    // STDP: pre-before-post で増加、post-before-pre で減少
    if (preSpiked && postSpiked) {
      // 同時発火の場合、両方考慮（簡略化）
      // TODO: 正確なスパイク時間差に基づく計算
      this.state.eligibilityTrace += 0.1;
    } else if (preSpiked) {
      // プレシナプスのみ発火 - 後でポストが発火すればLTP
      this.state.eligibilityTrace += 0.05;
    } else if (postSpiked) {
      // ポストシナプスのみ発火 - LTD方向
      this.state.eligibilityTrace -= 0.025;
    }

    // トレースのクリッピング
    this.state.eligibilityTrace = Math.max(-1, Math.min(1, this.state.eligibilityTrace));
    this.state.lastUpdateTime = currentTime;
  }

  /**
   * 適格性トレースをリセット（休止状態終了時など）
   */
  resetEligibilityTrace(): void {
    this.state.eligibilityTrace = 0;
  }

  // ---------------------------------------------------------------------------
  // Weight Update
  // ---------------------------------------------------------------------------

  /**
   * R-STDP による重み更新
   * ΔW = learningRate * reward * eligibilityTrace - decay
   * 
   * @param reward - スカラー報酬値
   * @param learningRate - 学習率
   * @param weightDecay - 重み減衰係数
   */
  updateWeight(reward: number, learningRate: number, weightDecay: number): void {
    const deltaW = learningRate * reward * this.state.eligibilityTrace 
                   - weightDecay * this.state.weight;
    
    this.state.weight += deltaW;

    // 重みのクリッピング [-1, 1]
    this.state.weight = Math.max(-1, Math.min(1, this.state.weight));
  }

  /**
   * 重みを直接設定（初期化やデバッグ用）
   */
  setWeight(weight: number): void {
    this.state.weight = Math.max(-1, Math.min(1, weight));
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  get id(): SynapseId { return this.state.id; }
  get inputIndex(): number { return this.state.inputIndex; }
  get weight(): number { return this.state.weight; }
  get eligibilityTrace(): number { return this.state.eligibilityTrace; }
  get lastUpdateTime(): number { return this.state.lastUpdateTime; }

  getState(): Readonly<SynapseState> {
    return { ...this.state };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * シナプスを生成
 */
export function createSynapse(
  id: SynapseId,
  inputIndex: number,
  weight?: number
): Synapse {
  return new Synapse({ id, inputIndex, weight });
}

/**
 * ランダムな初期重みでシナプスを生成
 * @param weightRange - 重みの範囲 [min, max]
 */
export function createRandomSynapse(
  id: SynapseId,
  inputIndex: number,
  weightRange: [number, number] = [-0.2, 0.2]
): Synapse {
  const [min, max] = weightRange;
  const weight = Math.random() * (max - min) + min;
  return new Synapse({ id, inputIndex, weight });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * シナプス状態からSynapseインスタンスを復元
 */
export function synapseFromState(state: SynapseState): Synapse {
  const synapse = new Synapse({
    id: state.id,
    inputIndex: state.inputIndex,
    weight: state.weight,
  });
  // 内部状態を復元するための非公開メソッドが必要な場合は追加
  // TODO: eligibilityTrace と lastUpdateTime の復元
  return synapse;
}

/**
 * 複数のシナプスを一括生成
 * @param inputIndices - 接続する入力ニューロンのインデックス
 * @param idPrefix - ID のプレフィックス
 */
export function createSynapses(
  inputIndices: number[],
  idPrefix: string = 'syn'
): Synapse[] {
  return inputIndices.map((inputIndex, i) => 
    createRandomSynapse(`${idPrefix}_${i}`, inputIndex)
  );
}

/**
 * シナプスの統計情報を計算
 */
export function computeSynapseStats(synapses: readonly SynapseState[]): {
  count: number;
  weightMean: number;
  weightVariance: number;
  eligibilityTraceMean: number;
  eligibilityTraceVariance: number;
  eligibilityTraceMax: number;
} {
  if (synapses.length === 0) {
    return {
      count: 0,
      weightMean: 0,
      weightVariance: 0,
      eligibilityTraceMean: 0,
      eligibilityTraceVariance: 0,
      eligibilityTraceMax: 0,
    };
  }

  const n = synapses.length;
  
  // 重みの統計
  const weightSum = synapses.reduce((sum, s) => sum + s.weight, 0);
  const weightMean = weightSum / n;
  const weightVariance = synapses.reduce(
    (sum, s) => sum + Math.pow(s.weight - weightMean, 2), 0
  ) / n;

  // 適格性トレースの統計
  const etSum = synapses.reduce((sum, s) => sum + s.eligibilityTrace, 0);
  const etMean = etSum / n;
  const etVariance = synapses.reduce(
    (sum, s) => sum + Math.pow(s.eligibilityTrace - etMean, 2), 0
  ) / n;
  const etMax = Math.max(...synapses.map(s => Math.abs(s.eligibilityTrace)));

  return {
    count: n,
    weightMean,
    weightVariance,
    eligibilityTraceMean: etMean,
    eligibilityTraceVariance: etVariance,
    eligibilityTraceMax: etMax,
  };
}