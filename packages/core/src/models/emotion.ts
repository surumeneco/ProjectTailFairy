/**
 * ProjectTailFairy - Emotion Module
 * 感情ベクトルの管理
 * 
 * @see wiki://EmotionVector
 */

import type { EmotionVector, RewardVector } from './types';

// =============================================================================
// Emotion Vector Management
// =============================================================================

/**
 * デフォルトの感情ベクトルを生成（中立状態）
 */
export function createNeutralEmotionVector(): EmotionVector {
  return {
    instantPositive: 0,
    instantNegative: 0,
    longTermPositive: 0,
    longTermNegative: 0,
  };
}

/**
 * 感情ベクトルマネージャー
 * 
 * 感情は主観的経験ではなく機能的状態として表現される:
 * - 評価ベクトル（このクラスで管理）
 * - 行動バイアス（TODO: 行動選択モジュールで使用）
 */
export class EmotionManager {
  private current: EmotionVector;
  
  // 感情の時定数
  private readonly config = {
    instantDecay: 0.9,      // 即時感情の減衰率
    longTermDecay: 0.99,    // 長期感情の減衰率
    instantGain: 0.5,       // 即時感情への報酬の影響度
    longTermGain: 0.1,      // 長期感情への報酬の影響度
  };

  constructor(initial?: Partial<EmotionVector>) {
    this.current = { ...createNeutralEmotionVector(), ...initial };
  }

  /**
   * 報酬ベクトルに基づいて感情を更新
   * 
   * @param rewardVector - 8次元報酬ベクトル
   */
  updateFromReward(rewardVector: RewardVector): void {
    // 即時感情の減衰
    this.current.instantPositive *= this.config.instantDecay;
    this.current.instantNegative *= this.config.instantDecay;
    
    // 長期感情の減衰
    this.current.longTermPositive *= this.config.longTermDecay;
    this.current.longTermNegative *= this.config.longTermDecay;

    // 報酬から感情への変換
    // 正の報酬要素
    const positiveSignals = 
      rewardVector.externalSuccess +
      rewardVector.internalImprovement +
      rewardVector.stability;
    
    // 負の報酬要素
    const negativeSignals = 
      rewardVector.externalFailure +
      rewardVector.internalDeterioration +
      rewardVector.structuralCost +
      rewardVector.energyCost +
      rewardVector.predictionError;

    // 即時感情の更新
    this.current.instantPositive += this.config.instantGain * Math.max(0, positiveSignals);
    this.current.instantNegative += this.config.instantGain * Math.max(0, negativeSignals);

    // 長期感情の更新
    this.current.longTermPositive += this.config.longTermGain * Math.max(0, positiveSignals);
    this.current.longTermNegative += this.config.longTermGain * Math.max(0, negativeSignals);

    // クリッピング [0, 1]
    this.current.instantPositive = Math.min(1, this.current.instantPositive);
    this.current.instantNegative = Math.min(1, this.current.instantNegative);
    this.current.longTermPositive = Math.min(1, this.current.longTermPositive);
    this.current.longTermNegative = Math.min(1, this.current.longTermNegative);
  }

  /**
   * 感情の純価値（valence）を計算
   * 正: ポジティブ優勢、負: ネガティブ優勢
   */
  computeValence(): { instant: number; longTerm: number; overall: number } {
    const instant = this.current.instantPositive - this.current.instantNegative;
    const longTerm = this.current.longTermPositive - this.current.longTermNegative;
    const overall = (instant + longTerm) / 2;

    return { instant, longTerm, overall };
  }

  /**
   * 感情の強度（arousal）を計算
   * 高: 活発な感情状態、低: 穏やかな状態
   */
  computeArousal(): number {
    return (
      this.current.instantPositive +
      this.current.instantNegative +
      this.current.longTermPositive * 0.5 +
      this.current.longTermNegative * 0.5
    ) / 3;
  }

  /**
   * 行動バイアスを計算
   * 正: 接近行動を促進、負: 回避行動を促進
   * 
   * TODO: 行動選択モジュールで使用
   */
  computeBehavioralBias(): number {
    const valence = this.computeValence();
    const arousal = this.computeArousal();

    // 即時感情を重視しつつ、覚醒度で調整
    return valence.instant * (1 + arousal * 0.5);
  }

  /**
   * 感情状態をリセット（休止状態後など）
   */
  reset(): void {
    // 即時感情のみリセット、長期感情は維持
    this.current.instantPositive = 0;
    this.current.instantNegative = 0;
  }

  /**
   * 完全リセット
   */
  fullReset(): void {
    this.current = createNeutralEmotionVector();
  }

  /**
   * 現在の感情ベクトルを取得
   */
  getState(): Readonly<EmotionVector> {
    return { ...this.current };
  }

  /**
   * 設定を更新
   */
  setConfig(config: Partial<typeof this.config>): void {
    Object.assign(this.config, config);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * 感情ベクトルから要約情報を生成
 */
export function summarizeEmotion(emotion: EmotionVector): {
  valence: 'positive' | 'negative' | 'neutral';
  intensity: 'high' | 'medium' | 'low';
  timeHorizon: 'instant' | 'long-term' | 'mixed';
} {
  const instantNet = emotion.instantPositive - emotion.instantNegative;
  const longTermNet = emotion.longTermPositive - emotion.longTermNegative;
  const overallNet = (instantNet + longTermNet) / 2;

  // Valence
  let valence: 'positive' | 'negative' | 'neutral';
  if (overallNet > 0.1) {
    valence = 'positive';
  } else if (overallNet < -0.1) {
    valence = 'negative';
  } else {
    valence = 'neutral';
  }

  // Intensity
  const totalIntensity = 
    emotion.instantPositive + emotion.instantNegative +
    emotion.longTermPositive + emotion.longTermNegative;
  let intensity: 'high' | 'medium' | 'low';
  if (totalIntensity > 1.5) {
    intensity = 'high';
  } else if (totalIntensity > 0.5) {
    intensity = 'medium';
  } else {
    intensity = 'low';
  }

  // Time horizon
  const instantTotal = emotion.instantPositive + emotion.instantNegative;
  const longTermTotal = emotion.longTermPositive + emotion.longTermNegative;
  let timeHorizon: 'instant' | 'long-term' | 'mixed';
  if (instantTotal > longTermTotal * 2) {
    timeHorizon = 'instant';
  } else if (longTermTotal > instantTotal * 2) {
    timeHorizon = 'long-term';
  } else {
    timeHorizon = 'mixed';
  }

  return { valence, intensity, timeHorizon };
}