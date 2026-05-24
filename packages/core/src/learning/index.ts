/**
 * ProjectTailFairy - Learning Module
 * R-STDP（報酬調整スパイク時間依存可塑性）の実装
 * 
 * @see wiki://R-STDP
 */

import type { 
  RewardVector, 
  ImportanceVector, 
  LearningConfig,
  SynapseState 
} from './types';
import { Synapse } from './synapse';

// =============================================================================
// Reward Computation
// =============================================================================

/**
 * RewardVector と ImportanceVector から スカラー報酬を計算
 * scalarReward = dot(rewardVector, importanceVector)
 */
export function computeScalarReward(
  rewardVector: RewardVector,
  importanceVector: ImportanceVector
): number {
  return (
    rewardVector.externalSuccess * importanceVector.externalSuccess +
    rewardVector.externalFailure * importanceVector.externalFailure +
    rewardVector.internalImprovement * importanceVector.internalImprovement +
    rewardVector.internalDeterioration * importanceVector.internalDeterioration +
    rewardVector.structuralCost * importanceVector.structuralCost +
    rewardVector.energyCost * importanceVector.energyCost +
    rewardVector.predictionError * importanceVector.predictionError +
    rewardVector.stability * importanceVector.stability
  );
}

/**
 * デフォルトの ImportanceVector を生成
 * TODO: 適切な値の決定は Schokosnuss の担当
 */
export function createDefaultImportanceVector(): ImportanceVector {
  return {
    externalSuccess: 1.0,      // 外部成功を重視
    externalFailure: -1.0,     // 外部失敗をペナルティ
    internalImprovement: 0.5,  // 内部改善を適度に重視
    internalDeterioration: -0.5, // 内部悪化をペナルティ
    structuralCost: -0.1,      // 構造コストを軽くペナルティ
    energyCost: -0.1,          // エネルギーコストを軽くペナルティ
    predictionError: -0.3,     // 予測誤差をペナルティ
    stability: 0.2,            // 安定性を適度に重視
  };
}

/**
 * ゼロの RewardVector を生成
 */
export function createZeroRewardVector(): RewardVector {
  return {
    externalSuccess: 0,
    externalFailure: 0,
    internalImprovement: 0,
    internalDeterioration: 0,
    structuralCost: 0,
    energyCost: 0,
    predictionError: 0,
    stability: 0,
  };
}

// =============================================================================
// R-STDP Learning Rule
// =============================================================================

/**
 * R-STDP 学習則の管理クラス
 * 
 * 重み更新式: ΔW = learningRate * reward * eligibilityTrace - decay
 */
export class RSTDP {
  private config: LearningConfig;
  private importanceVector: ImportanceVector;

  constructor(
    config: LearningConfig,
    importanceVector?: ImportanceVector
  ) {
    this.config = config;
    this.importanceVector = importanceVector ?? createDefaultImportanceVector();
  }

  /**
   * シナプスの適格性トレースを更新
   * 
   * @param synapse - 更新対象のシナプス
   * @param preSpiked - プレシナプスニューロンが発火したか
   * @param postSpiked - ポストシナプスニューロンが発火したか
   * @param currentTime - 現在のタイムステップ
   */
  updateEligibilityTrace(
    synapse: Synapse,
    preSpiked: boolean,
    postSpiked: boolean,
    currentTime: number
  ): void {
    synapse.updateEligibilityTrace(
      preSpiked,
      postSpiked,
      this.config.eligibilityTraceTimeConstant,
      currentTime
    );
  }

  /**
   * 報酬に基づいてシナプスの重みを更新
   * 
   * @param synapse - 更新対象のシナプス
   * @param rewardVector - 8次元報酬ベクトル
   */
  updateWeight(synapse: Synapse, rewardVector: RewardVector): void {
    const scalarReward = computeScalarReward(rewardVector, this.importanceVector);
    synapse.updateWeight(
      scalarReward,
      this.config.learningRate,
      this.config.weightDecay
    );
  }

  /**
   * スカラー報酬を使用してシナプスの重みを更新
   * 
   * @param synapse - 更新対象のシナプス
   * @param scalarReward - スカラー報酬値
   */
  updateWeightWithScalar(synapse: Synapse, scalarReward: number): void {
    synapse.updateWeight(
      scalarReward,
      this.config.learningRate,
      this.config.weightDecay
    );
  }

  /**
   * 複数のシナプスを一括更新
   * 
   * @param synapses - 更新対象のシナプス配列
   * @param preSpikedIndices - 発火したプレシナプスニューロンのインデックス
   * @param postSpiked - ポストシナプスニューロンが発火したか
   * @param rewardVector - 8次元報酬ベクトル
   * @param currentTime - 現在のタイムステップ
   */
  batchUpdate(
    synapses: Synapse[],
    preSpikedIndices: Set<number>,
    postSpiked: boolean,
    rewardVector: RewardVector,
    currentTime: number
  ): void {
    const scalarReward = computeScalarReward(rewardVector, this.importanceVector);

    for (const synapse of synapses) {
      const preSpiked = preSpikedIndices.has(synapse.inputIndex);
      
      // 適格性トレースを更新
      this.updateEligibilityTrace(synapse, preSpiked, postSpiked, currentTime);
      
      // 重みを更新
      synapse.updateWeight(scalarReward, this.config.learningRate, this.config.weightDecay);
    }
  }

  /**
   * ImportanceVector を更新
   */
  setImportanceVector(importanceVector: ImportanceVector): void {
    this.importanceVector = importanceVector;
  }

  /**
   * 学習設定を更新
   */
  setConfig(config: Partial<LearningConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): Readonly<LearningConfig> {
    return { ...this.config };
  }

  getImportanceVector(): Readonly<ImportanceVector> {
    return { ...this.importanceVector };
  }
}

// =============================================================================
// Learning Config Factory
// =============================================================================

/**
 * デフォルトの学習設定を生成
 * TODO: パラメータの最適化は Schokosnuss の担当
 */
export function createDefaultLearningConfig(): LearningConfig {
  return {
    learningRate: 0.01,
    weightDecay: 0.0001,
    eligibilityTraceTimeConstant: 20, // タイムステップ単位
    firingRateSmoothingWindow: 100,   // L = 100
    thresholdUpdateRate: 0.001,       // Δθ
  };
}

// =============================================================================
// Reward-Free Learning (for Dormancy)
// =============================================================================

/**
 * 報酬なし学習（休止状態中のSTDP）
 * 報酬変調なしで純粋なSTDPを適用
 * 
 * @param synapse - 更新対象のシナプス
 * @param preSpiked - プレシナプスニューロンが発火したか
 * @param postSpiked - ポストシナプスニューロンが発火したか
 * @param learningRate - 学習率
 */
export function applyRewardFreeSTDP(
  synapse: Synapse,
  preSpiked: boolean,
  postSpiked: boolean,
  learningRate: number
): void {
  // 報酬 = 1.0 として扱う（純粋なSTDP）
  // 適格性トレースをそのまま重み変化に使用
  if (preSpiked && postSpiked) {
    // LTP
    const currentWeight = synapse.weight;
    const newWeight = currentWeight + learningRate * 0.1;
    synapse.setWeight(Math.min(1, newWeight));
  } else if (postSpiked && !preSpiked) {
    // LTD (ポストが先に発火していた場合)
    const currentWeight = synapse.weight;
    const newWeight = currentWeight - learningRate * 0.05;
    synapse.setWeight(Math.max(-1, newWeight));
  }
  // TODO: より精密なスパイク時間差に基づく計算
}