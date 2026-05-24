/**
 * ProjectTailFairy - Dormancy Processing Module
 * 休止状態処理の実装
 * 
 * @see wiki://Dormancy Processing
 */

import type { 
  DormancyConfig, 
  DormancyTrigger, 
  DormancyEndReason,
  InternalState,
  RewardVector
} from './types';
import { Neuron } from './neuron';
import { Synapse } from './synapse';
import { applyRewardFreeSTDP } from './learning';

// =============================================================================
// Dormancy Configuration
// =============================================================================

/**
 * デフォルトの休止状態設定を生成
 */
export function createDefaultDormancyConfig(): DormancyConfig {
  return {
    processingLoadThreshold: 0.8,
    memoryPressureThreshold: 0.8,
    energyThreshold: 0.2,
    fixedIntervalSteps: 10000,  // 10000ステップごとに休止
    minDormancyDuration: 100,   // 最小100ステップ
    maxDormancyDuration: 1000,  // 最大1000ステップ
  };
}

// =============================================================================
// Dormancy Controller
// =============================================================================

/**
 * 休止状態コントローラー
 * 
 * 休止状態中の処理:
 * - 報酬なし学習（報酬変調なしのSTDP）
 * - 保存パターンの再活性化
 * - メモリ統合
 * - 構造評価
 * - 低価値結合のプルーニング
 * - 高再現性経路の保存
 */
export class DormancyController {
  private config: DormancyConfig;
  private isDormant: boolean = false;
  private dormancyStartStep: number = 0;
  private currentDormancyDuration: number = 0;
  private lastDormancyEndStep: number = 0;
  private dormancyTrigger: DormancyTrigger | null = null;
  
  // 報酬分散の追跡（休止トリガー用）
  private recentRewards: number[] = [];
  private readonly rewardHistorySize: number = 100;

  constructor(config?: Partial<DormancyConfig>) {
    this.config = { ...createDefaultDormancyConfig(), ...config };
  }

  // ---------------------------------------------------------------------------
  // Dormancy Trigger Detection
  // ---------------------------------------------------------------------------

  /**
   * 休止状態に入るべきか判定
   * 
   * @param internalState - 現在の内部状態
   * @param firingRates - 各ニューロンの発火率
   * @param currentStep - 現在のステップ
   * @returns トリガー理由（nullなら休止不要）
   */
  shouldEnterDormancy(
    internalState: InternalState,
    firingRates: number[],
    currentStep: number
  ): DormancyTrigger | null {
    if (this.isDormant) return null;

    // 処理負荷が高い
    if (internalState.processingLoad > this.config.processingLoadThreshold) {
      return 'high_processing_load';
    }

    // メモリ圧力が高い
    if (internalState.memoryPressure > this.config.memoryPressureThreshold) {
      return 'high_memory_pressure';
    }

    // エネルギーが低い
    if (internalState.energy < this.config.energyThreshold) {
      return 'low_energy';
    }

    // 発火率の不均衡
    if (firingRates.length > 0) {
      const mean = firingRates.reduce((a, b) => a + b, 0) / firingRates.length;
      const variance = firingRates.reduce(
        (sum, r) => sum + Math.pow(r - mean, 2), 0
      ) / firingRates.length;
      if (variance > 0.1) {  // TODO: 閾値を調整
        return 'firing_rate_imbalance';
      }
    }

    // 報酬分散が低い（環境が安定）
    if (this.recentRewards.length >= this.rewardHistorySize) {
      const rewardVariance = this.computeRewardVariance();
      if (rewardVariance < 0.01) {  // TODO: 閾値を調整
        return 'low_reward_variance';
      }
    }

    // 固定間隔
    const stepsSinceLastDormancy = currentStep - this.lastDormancyEndStep;
    if (stepsSinceLastDormancy >= this.config.fixedIntervalSteps) {
      return 'fixed_interval';
    }

    return null;
  }

  /**
   * 報酬分散を計算
   */
  private computeRewardVariance(): number {
    if (this.recentRewards.length === 0) return 0;
    const mean = this.recentRewards.reduce((a, b) => a + b, 0) / this.recentRewards.length;
    return this.recentRewards.reduce(
      (sum, r) => sum + Math.pow(r - mean, 2), 0
    ) / this.recentRewards.length;
  }

  /**
   * 報酬履歴を更新
   */
  recordReward(scalarReward: number): void {
    this.recentRewards.push(scalarReward);
    if (this.recentRewards.length > this.rewardHistorySize) {
      this.recentRewards.shift();
    }
  }

  // ---------------------------------------------------------------------------
  // Dormancy Start
  // ---------------------------------------------------------------------------

  /**
   * 休止状態を開始
   */
  enterDormancy(trigger: DormancyTrigger, currentStep: number): void {
    this.isDormant = true;
    this.dormancyStartStep = currentStep;
    this.currentDormancyDuration = 0;
    this.dormancyTrigger = trigger;
  }

  // ---------------------------------------------------------------------------
  // Dormancy Processing
  // ---------------------------------------------------------------------------

  /**
   * 休止状態中の1ステップ処理
   * 
   * @param neurons - ニューロン配列
   * @param learningRate - 報酬なし学習の学習率
   * @returns 終了理由（継続中ならnull）
   */
  processDormancyStep(
    neurons: Neuron[],
    learningRate: number
  ): DormancyEndReason | null {
    if (!this.isDormant) return null;

    this.currentDormancyDuration++;

    // 1. 報酬なし学習（純粋なSTDP）
    this.applyRewardFreeLearning(neurons, learningRate);

    // 2. パターン再活性化（TODO: 実装）
    // this.reactivatePatterns(neurons);

    // 3. 構造評価とプルーニング（TODO: 実装）
    // this.evaluateAndPrune(neurons);

    // 終了条件のチェック
    return this.checkDormancyEndCondition(neurons);
  }

  /**
   * 報酬なし学習を適用
   */
  private applyRewardFreeLearning(neurons: Neuron[], learningRate: number): void {
    // ランダムな自発活動をシミュレート
    const spontaneousFiring = neurons.map(() => Math.random() < 0.05);

    for (let i = 0; i < neurons.length; i++) {
      const neuron = neurons[i];
      const postSpiked = spontaneousFiring[i];

      for (const synapseState of neuron.synapses) {
        const preSpiked = spontaneousFiring[synapseState.inputIndex] ?? false;
        
        // 報酬なしSTDPを適用
        // TODO: Synapseインスタンスを取得して適用する必要がある
        // 現在はSynapseStateのみなので、直接更新するヘルパーが必要
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Dormancy End Detection
  // ---------------------------------------------------------------------------

  /**
   * 休止終了条件をチェック
   */
  private checkDormancyEndCondition(neurons: Neuron[]): DormancyEndReason | null {
    // 最大継続時間を超過
    if (this.currentDormancyDuration >= this.config.maxDormancyDuration) {
      return 'duration_elapsed';
    }

    // 最小継続時間未満なら継続
    if (this.currentDormancyDuration < this.config.minDormancyDuration) {
      return null;
    }

    // 活動パターンの収束チェック（TODO: 実装）
    // if (this.hasActivityConverged(neurons)) {
    //   return 'activity_converged';
    // }

    return null;
  }

  /**
   * 外部からの重要入力による休止終了
   */
  checkImportantExternalInput(inputStrength: number): DormancyEndReason | null {
    if (!this.isDormant) return null;
    
    // 重要な入力があれば休止を終了
    if (inputStrength > 0.8) {  // TODO: 閾値を調整
      return 'important_external_input';
    }
    return null;
  }

  /**
   * 予測誤差による休止終了
   */
  checkPredictionError(predictionError: number): DormancyEndReason | null {
    if (!this.isDormant) return null;
    
    // 大きな予測誤差があれば環境変化と判断
    if (predictionError > 0.5) {  // TODO: 閾値を調整
      return 'prediction_error_detected';
    }
    return null;
  }

  /**
   * 内部状態回復による休止終了チェック
   */
  checkInternalStateRecovery(internalState: InternalState): DormancyEndReason | null {
    if (!this.isDormant) return null;
    if (this.currentDormancyDuration < this.config.minDormancyDuration) return null;

    // 十分に回復したかチェック
    if (
      internalState.energy > 0.7 &&
      internalState.processingLoad < 0.3 &&
      internalState.memoryPressure < 0.3
    ) {
      return 'internal_state_recovered';
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Dormancy End
  // ---------------------------------------------------------------------------

  /**
   * 休止状態を終了
   */
  exitDormancy(reason: DormancyEndReason, currentStep: number): void {
    this.isDormant = false;
    this.lastDormancyEndStep = currentStep;
    this.dormancyTrigger = null;
    
    // 報酬履歴をクリア（新しい環境状態からスタート）
    this.recentRewards = [];
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  getStatus(): {
    isDormant: boolean;
    dormancyTrigger: DormancyTrigger | null;
    dormancyDuration: number;
    stepsSinceLastDormancy: number;
  } {
    return {
      isDormant: this.isDormant,
      dormancyTrigger: this.dormancyTrigger,
      dormancyDuration: this.currentDormancyDuration,
      stepsSinceLastDormancy: this.lastDormancyEndStep,
    };
  }

  get dormant(): boolean {
    return this.isDormant;
  }

  setConfig(config: Partial<DormancyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}