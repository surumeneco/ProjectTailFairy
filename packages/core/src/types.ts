/**
 * ProjectTailFairy - Shared Types
 * AGI Development Project Type Definitions
 * 
 * Based on project wiki specifications
 */

// =============================================================================
// Basic IDs
// =============================================================================

export type NeuronId = string;
export type SynapseId = string;

// =============================================================================
// Reward System (8-dimensional)
// =============================================================================

/**
 * 8次元報酬ベクトル
 * @see wiki://RewardVector
 */
export interface RewardVector {
  /** 外部環境における成功 */
  externalSuccess: number;
  /** 外部環境における失敗 */
  externalFailure: number;
  /** 内部状態の改善 */
  internalImprovement: number;
  /** 内部状態の悪化 */
  internalDeterioration: number;
  /** ネットワークの構造コスト */
  structuralCost: number;
  /** エネルギー消費コスト */
  energyCost: number;
  /** 予測誤差 */
  predictionError: number;
  /** ネットワーク安定性 */
  stability: number;
}

/**
 * 重要度ベクトル - RewardVectorをスカラーに変換するための重み
 * scalarReward = dot(rewardVector, importanceVector)
 * @see wiki://ImportanceVector
 */
export interface ImportanceVector {
  externalSuccess: number;
  externalFailure: number;
  internalImprovement: number;
  internalDeterioration: number;
  structuralCost: number;
  energyCost: number;
  predictionError: number;
  stability: number;
}

// =============================================================================
// Emotion System (4-dimensional)
// =============================================================================

/**
 * 4次元感情ベクトル - 機能的状態としての感情表現
 * @see wiki://EmotionVector
 */
export interface EmotionVector {
  /** 即座の正の評価 */
  instantPositive: number;
  /** 即座の負の評価 */
  instantNegative: number;
  /** 長期的な正の評価 */
  longTermPositive: number;
  /** 長期的な負の評価 */
  longTermNegative: number;
}

// =============================================================================
// Internal State (5 variables)
// =============================================================================

/**
 * 内部状態 - 生理的類似変数
 * @see wiki://InternalState
 */
export interface InternalState {
  /** バッテリーレベル（飢餓/満腹感に類似） 0.0-1.0 */
  energy: number;
  /** デバイス使用率（疲労に類似） 0.0-1.0 */
  processingLoad: number;
  /** 内部デバイス温度 */
  temperature: number;
  /** キャッシュ/メモリ状態（眠気/認知負荷に類似） 0.0-1.0 */
  memoryPressure: number;
  /** 現在の動作状態 */
  operationalStatus: OperationalStatus;
}

export type OperationalStatus = 'active' | 'dormant' | 'overloaded' | 'recovering';

// =============================================================================
// Synapse
// =============================================================================

/**
 * シナプス状態
 * @see wiki://Synapse
 */
export interface SynapseState {
  /** シナプスID */
  id: SynapseId;
  /** 入力元ニューロンのインデックス */
  inputIndex: number;
  /** シナプス荷重 [-1, 1] */
  weight: number;
  /** 適格性トレース（eligibility trace） */
  eligibilityTrace: number;
  /** 最終更新時刻 */
  lastUpdateTime: number;
}

// =============================================================================
// Neuron
// =============================================================================

/**
 * ニューロン状態
 * @see wiki://Neuron
 */
export interface NeuronState {
  /** ニューロンID */
  id: NeuronId;
  /** 発火閾値 */
  threshold: number;
  /** 平均発火率（EMA） */
  firingRate: number;
  /** 目標発火率 */
  targetFiringRate: number;
  /** 弱いシナプスをプルーニングするための閾値 */
  synapseCutThreshold: number;
  /** シナプス追加レートを制御するパラメータ */
  synapseAddCoefficient: number;
  /** 入力シナプスのリスト */
  synapses: SynapseState[];
  /** 膜電位（現在のタイムステップ） */
  membranePotential: number;
  /** 最後のスパイク時刻 */
  lastSpikeTime: number | null;
  /** 現在のタイムステップで発火したか */
  hasFired: boolean;
}

/**
 * 入力ニューロン状態 - 外部入力をスパイクに変換
 * @see wiki://InputNeuron
 */
export interface InputNeuronState {
  /** ニューロンID */
  id: NeuronId;
  /** 現在のタイムステップで発火したか */
  hasFired: boolean;
  /** 入力値 */
  inputValue: number;
}

// =============================================================================
// Network
// =============================================================================

/**
 * ネットワーク設定
 */
export interface NetworkConfig {
  /** 入力ニューロン数 */
  inputNeuronCount: number;
  /** 処理ニューロン数（初期値） */
  processingNeuronCount: number;
  /** 出力ニューロン数 */
  outputNeuronCount: number;
  /** 初期接続密度 0.0-1.0 */
  initialConnectivity: number;
  /** シミュレーションタイムステップ（ms） */
  timeStep: number;
}

/**
 * 学習パラメータ
 */
export interface LearningConfig {
  /** 学習率 */
  learningRate: number;
  /** 重み減衰係数 */
  weightDecay: number;
  /** 適格性トレースの時定数 */
  eligibilityTraceTimeConstant: number;
  /** 発火率EMAの平滑化窓幅 L */
  firingRateSmoothingWindow: number;
  /** 閾値更新率 Δθ */
  thresholdUpdateRate: number;
}

/**
 * 構造コスト係数
 * structuralCost = a*neuronCount + b*synapseCount + c*meanFiringRate + d*totalSpikes + e*connectionDensity
 * @see wiki://Structural Cost
 */
export interface StructuralCostCoefficients {
  a: number;  // neuronCount係数
  b: number;  // synapseCount係数
  c: number;  // meanFiringRate係数
  d: number;  // totalSpikes係数
  e: number;  // connectionDensity係数
}

// =============================================================================
// Simulation & Logging
// =============================================================================

/**
 * スパイクイベント
 */
export interface SpikeEvent {
  neuronId: NeuronId;
  timestamp: number;
}

/**
 * 実験ログエントリ - ステップごとに記録すべきメトリクス
 * @see wiki://Experiment Logging
 */
export interface ExperimentLogEntry {
  /** 現在のタイムステップ番号 */
  step: number;
  /** 入力ニューロンへの入力値 */
  inputVector: number[];
  /** 出力ニューロンからの出力値 */
  outputVector: number[];
  /** エージェントが選択した行動 */
  selectedAction: number | null;
  /** 8次元報酬ベクトル */
  rewardVector: RewardVector;
  /** 統合されたスカラー報酬値 */
  scalarReward: number;
  /** 全ニューロンのバイナリスパイクベクトル */
  neuronSpikes: boolean[];
  /** ニューロン間の平均発火率 */
  meanFiringRate: number;
  /** 発火率の分散 */
  firingRateVariance: number;
  /** 平均シナプス重み */
  weightMean: number;
  /** シナプス重みの分散 */
  weightVariance: number;
  /** シナプスの総数 */
  synapseCount: number;
  /** ニューロンの総数 */
  neuronCount: number;
  /** 平均ニューロン閾値 */
  thresholdMean: number;
  /** 閾値の分散 */
  thresholdVariance: number;
  /** 全内部状態変数 */
  internalState: InternalState;
  /** 適格性トレースの要約統計 */
  eligibilityTraceSummary: {
    mean: number;
    variance: number;
    max: number;
  };
  /** 現在の構造コスト */
  structuralCost: number;
}

// =============================================================================
// Dormancy (休止状態)
// =============================================================================

/**
 * 休止状態設定
 * @see wiki://Dormancy Processing
 */
export interface DormancyConfig {
  /** 処理負荷の閾値 */
  processingLoadThreshold: number;
  /** メモリ圧力の閾値 */
  memoryPressureThreshold: number;
  /** エネルギーレベルの閾値 */
  energyThreshold: number;
  /** 固定休止時間間隔 */
  fixedIntervalSteps: number;
  /** 最小休止継続時間 */
  minDormancyDuration: number;
  /** 最大休止継続時間 */
  maxDormancyDuration: number;
}

export type DormancyTrigger = 
  | 'high_processing_load'
  | 'high_memory_pressure'
  | 'low_energy'
  | 'firing_rate_imbalance'
  | 'low_reward_variance'
  | 'fixed_interval';

export type DormancyEndReason =
  | 'duration_elapsed'
  | 'activity_converged'
  | 'internal_state_recovered'
  | 'important_external_input'
  | 'prediction_error_detected';