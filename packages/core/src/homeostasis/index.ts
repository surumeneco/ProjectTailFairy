/**
 * ProjectTailFairy - Homeostasis Module
 * ホメオスタティック可塑性の実装
 * 
 * @see wiki://Firing Rate Update
 * @see wiki://Threshold Update
 */

import type { NeuronState, LearningConfig } from './types';
import { Neuron } from './neuron';

// =============================================================================
// Firing Rate Update (発火率更新)
// =============================================================================

/**
 * 発火率更新 - EMA（指数移動平均）を使用
 * 
 * 式: Φ[s+1] = (1 - α) * Φ[s] + α * O[s]
 * where α = 1/L, L = smoothing window length
 * 
 * @param currentFiringRate - 現在の発火率
 * @param fired - このステップで発火したか (0 or 1)
 * @param smoothingWindow - 平滑化窓幅 L
 * @returns 更新後の発火率
 */
export function updateFiringRate(
  currentFiringRate: number,
  fired: boolean,
  smoothingWindow: number
): number {
  const alpha = 1 / smoothingWindow;
  const output = fired ? 1 : 0;
  return (1 - alpha) * currentFiringRate + alpha * output;
}

/**
 * バッチで発火率を更新
 * 
 * @param firingRates - 現在の発火率配列
 * @param firedFlags - 各ニューロンの発火フラグ
 * @param smoothingWindow - 平滑化窓幅 L
 * @returns 更新後の発火率配列
 */
export function batchUpdateFiringRates(
  firingRates: number[],
  firedFlags: boolean[],
  smoothingWindow: number
): number[] {
  const alpha = 1 / smoothingWindow;
  return firingRates.map((rate, i) => {
    const output = firedFlags[i] ? 1 : 0;
    return (1 - alpha) * rate + alpha * output;
  });
}

// =============================================================================
// Threshold Update (閾値更新)
// =============================================================================

/**
 * 閾値更新 - ホメオスタティック可塑性
 * 
 * 式: θ[s+1] = θ[s] + Δθ * (Φ[s] - T[s])
 * 
 * 発火率が目標を超えた場合 → 閾値上昇（発火しにくくなる）
 * 発火率が目標を下回った場合 → 閾値低下（発火しやすくなる）
 * 
 * @param currentThreshold - 現在の閾値
 * @param currentFiringRate - 現在の発火率 Φ
 * @param targetFiringRate - 目標発火率 T
 * @param updateRate - 閾値更新率 Δθ
 * @param minThreshold - 閾値の下限（オプション）
 * @param maxThreshold - 閾値の上限（オプション）
 * @returns 更新後の閾値
 */
export function updateThreshold(
  currentThreshold: number,
  currentFiringRate: number,
  targetFiringRate: number,
  updateRate: number,
  minThreshold: number = 0.1,
  maxThreshold: number = 10.0
): number {
  const diff = currentFiringRate - targetFiringRate;
  let newThreshold = currentThreshold + updateRate * diff;
  
  // 閾値のクリッピング
  newThreshold = Math.max(minThreshold, Math.min(maxThreshold, newThreshold));
  
  return newThreshold;
}

/**
 * バッチで閾値を更新
 */
export function batchUpdateThresholds(
  thresholds: number[],
  firingRates: number[],
  targetFiringRates: number[],
  updateRate: number,
  minThreshold: number = 0.1,
  maxThreshold: number = 10.0
): number[] {
  return thresholds.map((threshold, i) => 
    updateThreshold(
      threshold,
      firingRates[i],
      targetFiringRates[i],
      updateRate,
      minThreshold,
      maxThreshold
    )
  );
}

// =============================================================================
// Homeostasis Controller
// =============================================================================

/**
 * ホメオスタシスコントローラー
 * ネットワーク全体の恒常性を維持
 */
export class HomeostasisController {
  private smoothingWindow: number;
  private thresholdUpdateRate: number;
  private minThreshold: number;
  private maxThreshold: number;
  private targetFiringRateGlobal: number;

  constructor(config: {
    smoothingWindow?: number;
    thresholdUpdateRate?: number;
    minThreshold?: number;
    maxThreshold?: number;
    targetFiringRate?: number;
  } = {}) {
    this.smoothingWindow = config.smoothingWindow ?? 100;
    this.thresholdUpdateRate = config.thresholdUpdateRate ?? 0.001;
    this.minThreshold = config.minThreshold ?? 0.1;
    this.maxThreshold = config.maxThreshold ?? 10.0;
    this.targetFiringRateGlobal = config.targetFiringRate ?? 0.1;
  }

  /**
   * ニューロンの恒常性を更新
   */
  updateNeuron(neuron: Neuron): void {
    neuron.updateFiringRate(this.smoothingWindow);
    neuron.updateThreshold(this.thresholdUpdateRate);
  }

  /**
   * 複数のニューロンの恒常性を一括更新
   */
  updateNeurons(neurons: Neuron[]): void {
    for (const neuron of neurons) {
      this.updateNeuron(neuron);
    }
  }

  /**
   * ネットワーク全体の発火率バランスをチェック
   * @returns 発火率の不均衡度（0に近いほど均衡）
   */
  checkFiringRateBalance(neurons: Neuron[]): number {
    if (neurons.length === 0) return 0;

    const firingRates = neurons.map(n => n.firingRate);
    const mean = firingRates.reduce((a, b) => a + b, 0) / firingRates.length;
    const variance = firingRates.reduce(
      (sum, rate) => sum + Math.pow(rate - mean, 2), 0
    ) / firingRates.length;

    return Math.sqrt(variance); // 標準偏差
  }

  /**
   * グローバル目標発火率からの偏差をチェック
   */
  checkGlobalFiringRateDeviation(neurons: Neuron[]): number {
    if (neurons.length === 0) return 0;

    const firingRates = neurons.map(n => n.firingRate);
    const mean = firingRates.reduce((a, b) => a + b, 0) / firingRates.length;
    
    return Math.abs(mean - this.targetFiringRateGlobal);
  }

  /**
   * 設定を更新
   */
  setConfig(config: Partial<{
    smoothingWindow: number;
    thresholdUpdateRate: number;
    minThreshold: number;
    maxThreshold: number;
    targetFiringRate: number;
  }>): void {
    if (config.smoothingWindow !== undefined) {
      this.smoothingWindow = config.smoothingWindow;
    }
    if (config.thresholdUpdateRate !== undefined) {
      this.thresholdUpdateRate = config.thresholdUpdateRate;
    }
    if (config.minThreshold !== undefined) {
      this.minThreshold = config.minThreshold;
    }
    if (config.maxThreshold !== undefined) {
      this.maxThreshold = config.maxThreshold;
    }
    if (config.targetFiringRate !== undefined) {
      this.targetFiringRateGlobal = config.targetFiringRate;
    }
  }

  getConfig() {
    return {
      smoothingWindow: this.smoothingWindow,
      thresholdUpdateRate: this.thresholdUpdateRate,
      minThreshold: this.minThreshold,
      maxThreshold: this.maxThreshold,
      targetFiringRate: this.targetFiringRateGlobal,
    };
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * ホメオスタシスの統計情報を計算
 */
export function computeHomeostasisStats(neurons: Neuron[]): {
  meanFiringRate: number;
  firingRateVariance: number;
  meanThreshold: number;
  thresholdVariance: number;
  neuronsAboveTarget: number;
  neuronsBelowTarget: number;
} {
  if (neurons.length === 0) {
    return {
      meanFiringRate: 0,
      firingRateVariance: 0,
      meanThreshold: 0,
      thresholdVariance: 0,
      neuronsAboveTarget: 0,
      neuronsBelowTarget: 0,
    };
  }

  const n = neurons.length;
  
  // 発火率の統計
  const firingRates = neurons.map(n => n.firingRate);
  const meanFiringRate = firingRates.reduce((a, b) => a + b, 0) / n;
  const firingRateVariance = firingRates.reduce(
    (sum, rate) => sum + Math.pow(rate - meanFiringRate, 2), 0
  ) / n;

  // 閾値の統計
  const thresholds = neurons.map(n => n.threshold);
  const meanThreshold = thresholds.reduce((a, b) => a + b, 0) / n;
  const thresholdVariance = thresholds.reduce(
    (sum, t) => sum + Math.pow(t - meanThreshold, 2), 0
  ) / n;

  // 目標発火率との比較
  let neuronsAboveTarget = 0;
  let neuronsBelowTarget = 0;
  for (const neuron of neurons) {
    if (neuron.firingRate > neuron.targetFiringRate) {
      neuronsAboveTarget++;
    } else if (neuron.firingRate < neuron.targetFiringRate) {
      neuronsBelowTarget++;
    }
  }

  return {
    meanFiringRate,
    firingRateVariance,
    meanThreshold,
    thresholdVariance,
    neuronsAboveTarget,
    neuronsBelowTarget,
  };
}