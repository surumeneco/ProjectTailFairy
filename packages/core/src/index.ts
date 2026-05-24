/**
 * ProjectTailFairy - Core SNN Engine
 * スパイキングニューラルネットワーク コアエンジン
 * 
 * AGI Development Project
 * @see wiki://AGI Development Project
 * @see wiki://Spiking Neural Network
 */

// =============================================================================
// Types
// =============================================================================

export type {
  // Basic IDs
  NeuronId,
  SynapseId,
  
  // Reward System
  RewardVector,
  ImportanceVector,
  
  // Emotion System
  EmotionVector,
  
  // Internal State
  InternalState,
  OperationalStatus,
  
  // Network Components
  SynapseState,
  NeuronState,
  InputNeuronState,
  
  // Configuration
  NetworkConfig,
  LearningConfig,
  StructuralCostCoefficients,
  DormancyConfig,
  
  // Events & Logging
  SpikeEvent,
  ExperimentLogEntry,
  
  // Dormancy
  DormancyTrigger,
  DormancyEndReason,
} from './types';

// =============================================================================
// Neuron Module
// =============================================================================

export {
  Neuron,
  InputNeuron,
  createNeuron,
  createInputNeuron,
  createNeurons,
  createInputNeurons,
} from './neuron';

// =============================================================================
// Synapse Module
// =============================================================================

export {
  Synapse,
  createSynapse,
  createRandomSynapse,
  createSynapses,
  synapseFromState,
  computeSynapseStats,
} from './synapse';

// =============================================================================
// Learning Module (R-STDP)
// =============================================================================

export {
  RSTDP,
  computeScalarReward,
  createDefaultImportanceVector,
  createZeroRewardVector,
  createDefaultLearningConfig,
  applyRewardFreeSTDP,
} from './learning';

// =============================================================================
// Homeostasis Module
// =============================================================================

export {
  updateFiringRate,
  batchUpdateFiringRates,
  updateThreshold,
  batchUpdateThresholds,
  HomeostasisController,
  computeHomeostasisStats,
} from './homeostasis';

// =============================================================================
// Structural Plasticity Module
// =============================================================================

export {
  computeStructuralCost,
  computeConnectionDensity,
  createDefaultStructuralCostCoefficients,
  StructuralPlasticityController,
  computeStructuralStats,
} from './plasticity';

// =============================================================================
// Internal State Module
// =============================================================================

export {
  createDefaultInternalState,
  InternalStateManager,
} from './internal-state';

// =============================================================================
// Emotion Module
// =============================================================================

export {
  createNeutralEmotionVector,
  EmotionManager,
  summarizeEmotion,
} from './emotion';

// =============================================================================
// Dormancy Module
// =============================================================================

export {
  createDefaultDormancyConfig,
  DormancyController,
} from './dormancy';

// =============================================================================
// Network Module
// =============================================================================

export {
  createDefaultNetworkConfig,
  SpikingNeuralNetwork,
} from './network';

// =============================================================================
// Logging Module
// =============================================================================

export {
  ExperimentLogger,
  analyzeLearningProgress,
  analyzeRewardComponents,
  analyzeInternalStateHistory,
} from './logging';

// =============================================================================
// Version
// =============================================================================

export const VERSION = '0.1.0-prototype';

/**
 * プロトタイプの状態についての注記
 * 
 * このコードベースは「TODOコメントだらけ」の状態で、
 * 基本的な構造と方向性を示すプロトタイプです。
 * 
 * 主な未実装・要検討事項:
 * 
 * 1. 数学的検証が必要な箇所 (@Schokosnuss 担当):
 *    - R-STDP の正確な式と適格性トレースの理論
 *    - ホメオスタシス制御のパラメータ最適化
 *    - ImportanceVector の値の決定方法
 *    - 構造コスト係数の最適化
 * 
 * 2. アーキテクチャ・設計の検討が必要な箇所:
 *    - Synapse インスタンスと SynapseState の扱い
 *    - GPU (WebGPU) との統合
 *    - パターン再活性化の実装
 *    - 予測誤差の計算方法
 * 
 * 3. 実装が必要な箇所:
 *    - 休止状態中の報酬なし学習の完全実装
 *    - 構造変更（ニューロン追加/削除）のロジック
 *    - 内部世界モデル / 自己モデル (Phase 5-9)
 * 
 * @see wiki://AGI Development Project#検証フェーズ
 */