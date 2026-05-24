/**
 * ProjectTailFairy - Experiment Logging Module
 * 実験ログ記録の実装
 * 
 * @see wiki://Experiment Logging
 */

import type { ExperimentLogEntry, RewardVector, InternalState } from './types';

// =============================================================================
// Experiment Logger
// =============================================================================

/**
 * 実験ログ記録クラス
 * 
 * ログがなければ、エージェントが実際に学習しているのか、
 * 単にランダムに行動しているのかを判断することは不可能である。
 */
export class ExperimentLogger {
  private logs: ExperimentLogEntry[] = [];
  private maxLogSize: number;
  private logInterval: number;
  private lastLoggedStep: number = 0;

  constructor(config?: {
    maxLogSize?: number;
    logInterval?: number;
  }) {
    this.maxLogSize = config?.maxLogSize ?? 100000;  // デフォルト10万エントリ
    this.logInterval = config?.logInterval ?? 1;      // 毎ステップ記録
  }

  /**
   * ログエントリを追加
   */
  log(entry: ExperimentLogEntry): void {
    // ログ間隔のチェック
    if (entry.step - this.lastLoggedStep < this.logInterval) {
      return;
    }

    this.logs.push(entry);
    this.lastLoggedStep = entry.step;

    // サイズ制限
    if (this.logs.length > this.maxLogSize) {
      // 古いログを削除（最初の10%を削除）
      const removeCount = Math.floor(this.maxLogSize * 0.1);
      this.logs = this.logs.slice(removeCount);
    }
  }

  /**
   * 全ログを取得
   */
  getLogs(): readonly ExperimentLogEntry[] {
    return this.logs;
  }

  /**
   * 最新N件のログを取得
   */
  getRecentLogs(count: number): ExperimentLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 特定ステップ範囲のログを取得
   */
  getLogRange(startStep: number, endStep: number): ExperimentLogEntry[] {
    return this.logs.filter(log => log.step >= startStep && log.step <= endStep);
  }

  /**
   * ログをクリア
   */
  clear(): void {
    this.logs = [];
    this.lastLoggedStep = 0;
  }

  /**
   * ログをJSON形式でエクスポート
   */
  exportToJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * ログをCSV形式でエクスポート（簡易版）
   */
  exportToCsv(): string {
    if (this.logs.length === 0) return '';

    // ヘッダー
    const headers = [
      'step',
      'selectedAction',
      'scalarReward',
      'meanFiringRate',
      'firingRateVariance',
      'weightMean',
      'weightVariance',
      'synapseCount',
      'neuronCount',
      'thresholdMean',
      'thresholdVariance',
      'structuralCost',
      'energy',
      'processingLoad',
      'temperature',
      'memoryPressure',
      'operationalStatus',
    ];

    const rows = this.logs.map(log => [
      log.step,
      log.selectedAction ?? '',
      log.scalarReward,
      log.meanFiringRate,
      log.firingRateVariance,
      log.weightMean,
      log.weightVariance,
      log.synapseCount,
      log.neuronCount,
      log.thresholdMean,
      log.thresholdVariance,
      log.structuralCost,
      log.internalState.energy,
      log.internalState.processingLoad,
      log.internalState.temperature,
      log.internalState.memoryPressure,
      log.internalState.operationalStatus,
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * ログサイズを取得
   */
  get size(): number {
    return this.logs.length;
  }

  /**
   * 設定を更新
   */
  setConfig(config: {
    maxLogSize?: number;
    logInterval?: number;
  }): void {
    if (config.maxLogSize !== undefined) {
      this.maxLogSize = config.maxLogSize;
    }
    if (config.logInterval !== undefined) {
      this.logInterval = config.logInterval;
    }
  }
}

// =============================================================================
// Analysis Functions
// =============================================================================

/**
 * ログから学習進捗を分析
 */
export function analyzeLearningProgress(logs: ExperimentLogEntry[]): {
  isLearning: boolean;
  rewardTrend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  firingRateStability: 'stable' | 'unstable' | 'unknown';
  weightConvergence: 'converging' | 'diverging' | 'unknown';
} {
  if (logs.length < 100) {
    return {
      isLearning: false,
      rewardTrend: 'unknown',
      firingRateStability: 'unknown',
      weightConvergence: 'unknown',
    };
  }

  // 報酬のトレンド分析
  const rewardTrend = analyzeRewardTrend(logs);

  // 発火率の安定性分析
  const firingRateStability = analyzeFiringRateStability(logs);

  // 重みの収束分析
  const weightConvergence = analyzeWeightConvergence(logs);

  // 学習しているかの総合判定
  const isLearning = 
    rewardTrend === 'increasing' || 
    (firingRateStability === 'stable' && weightConvergence === 'converging');

  return {
    isLearning,
    rewardTrend,
    firingRateStability,
    weightConvergence,
  };
}

/**
 * 報酬のトレンドを分析
 */
function analyzeRewardTrend(
  logs: ExperimentLogEntry[]
): 'increasing' | 'decreasing' | 'stable' | 'unknown' {
  if (logs.length < 20) return 'unknown';

  // 前半と後半の平均報酬を比較
  const midpoint = Math.floor(logs.length / 2);
  const firstHalf = logs.slice(0, midpoint);
  const secondHalf = logs.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, l) => sum + l.scalarReward, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, l) => sum + l.scalarReward, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  const threshold = 0.05;

  if (diff > threshold) return 'increasing';
  if (diff < -threshold) return 'decreasing';
  return 'stable';
}

/**
 * 発火率の安定性を分析
 */
function analyzeFiringRateStability(
  logs: ExperimentLogEntry[]
): 'stable' | 'unstable' | 'unknown' {
  if (logs.length < 20) return 'unknown';

  // 最近のログから発火率分散の変動を見る
  const recentLogs = logs.slice(-50);
  const variances = recentLogs.map(l => l.firingRateVariance);
  
  const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
  const varianceOfVariance = variances.reduce(
    (sum, v) => sum + Math.pow(v - avgVariance, 2), 0
  ) / variances.length;

  // 発火率分散が安定しているかチェック
  if (avgVariance < 0.05 && varianceOfVariance < 0.001) {
    return 'stable';
  }
  return 'unstable';
}

/**
 * 重みの収束を分析
 */
function analyzeWeightConvergence(
  logs: ExperimentLogEntry[]
): 'converging' | 'diverging' | 'unknown' {
  if (logs.length < 50) return 'unknown';

  // 重み分散の推移を見る
  const recentLogs = logs.slice(-50);
  const variances = recentLogs.map(l => l.weightVariance);

  // 線形回帰的に傾きを計算（簡易版）
  const n = variances.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = variances.reduce((a, b) => a + b, 0);
  const sumXY = variances.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  if (slope < -0.0001) return 'converging';
  if (slope > 0.001) return 'diverging';
  return 'converging';  // 安定も収束と見なす
}

/**
 * 報酬成分の分析
 */
export function analyzeRewardComponents(logs: ExperimentLogEntry[]): {
  averages: RewardVector;
  dominantComponent: keyof RewardVector;
} {
  if (logs.length === 0) {
    return {
      averages: {
        externalSuccess: 0,
        externalFailure: 0,
        internalImprovement: 0,
        internalDeterioration: 0,
        structuralCost: 0,
        energyCost: 0,
        predictionError: 0,
        stability: 0,
      },
      dominantComponent: 'externalSuccess',
    };
  }

  const sum: RewardVector = {
    externalSuccess: 0,
    externalFailure: 0,
    internalImprovement: 0,
    internalDeterioration: 0,
    structuralCost: 0,
    energyCost: 0,
    predictionError: 0,
    stability: 0,
  };

  for (const log of logs) {
    sum.externalSuccess += log.rewardVector.externalSuccess;
    sum.externalFailure += log.rewardVector.externalFailure;
    sum.internalImprovement += log.rewardVector.internalImprovement;
    sum.internalDeterioration += log.rewardVector.internalDeterioration;
    sum.structuralCost += log.rewardVector.structuralCost;
    sum.energyCost += log.rewardVector.energyCost;
    sum.predictionError += log.rewardVector.predictionError;
    sum.stability += log.rewardVector.stability;
  }

  const n = logs.length;
  const averages: RewardVector = {
    externalSuccess: sum.externalSuccess / n,
    externalFailure: sum.externalFailure / n,
    internalImprovement: sum.internalImprovement / n,
    internalDeterioration: sum.internalDeterioration / n,
    structuralCost: sum.structuralCost / n,
    energyCost: sum.energyCost / n,
    predictionError: sum.predictionError / n,
    stability: sum.stability / n,
  };

  // 絶対値で最大の成分を特定
  let maxAbsValue = 0;
  let dominantComponent: keyof RewardVector = 'externalSuccess';
  
  for (const key of Object.keys(averages) as (keyof RewardVector)[]) {
    const absValue = Math.abs(averages[key]);
    if (absValue > maxAbsValue) {
      maxAbsValue = absValue;
      dominantComponent = key;
    }
  }

  return { averages, dominantComponent };
}

/**
 * 内部状態の推移を分析
 */
export function analyzeInternalStateHistory(logs: ExperimentLogEntry[]): {
  energyTrend: 'increasing' | 'decreasing' | 'stable';
  averageProcessingLoad: number;
  dormancyCount: number;
} {
  if (logs.length < 10) {
    return {
      energyTrend: 'stable',
      averageProcessingLoad: 0,
      dormancyCount: 0,
    };
  }

  // エネルギートレンド
  const firstEnergy = logs.slice(0, 10).reduce((sum, l) => sum + l.internalState.energy, 0) / 10;
  const lastEnergy = logs.slice(-10).reduce((sum, l) => sum + l.internalState.energy, 0) / 10;
  const energyDiff = lastEnergy - firstEnergy;
  
  let energyTrend: 'increasing' | 'decreasing' | 'stable';
  if (energyDiff > 0.1) {
    energyTrend = 'increasing';
  } else if (energyDiff < -0.1) {
    energyTrend = 'decreasing';
  } else {
    energyTrend = 'stable';
  }

  // 平均処理負荷
  const averageProcessingLoad = logs.reduce(
    (sum, l) => sum + l.internalState.processingLoad, 0
  ) / logs.length;

  // 休止状態の回数
  let dormancyCount = 0;
  let wasDormant = false;
  for (const log of logs) {
    const isDormant = log.internalState.operationalStatus === 'dormant';
    if (isDormant && !wasDormant) {
      dormancyCount++;
    }
    wasDormant = isDormant;
  }

  return {
    energyTrend,
    averageProcessingLoad,
    dormancyCount,
  };
}