/**
 * ProjectTailFairy - Network Module
 * スパイキングニューラルネットワーク全体の管理
 * 
 * @see wiki://Spiking Neural Network
 */

import type { 
  NetworkConfig, 
  LearningConfig,
  RewardVector,
  ImportanceVector,
  InternalState,
  ExperimentLogEntry,
  NeuronId,
  SynapseId
} from './types';
import { Neuron, InputNeuron, createNeurons, createInputNeurons } from './neuron';
import { Synapse, createRandomSynapse, computeSynapseStats } from './synapse';
import { RSTDP, createDefaultLearningConfig, computeScalarReward, createZeroRewardVector } from './learning';
import { HomeostasisController, computeHomeostasisStats } from './homeostasis';
import { StructuralPlasticityController, computeStructuralStats } from './plasticity';
import { InternalStateManager } from './internal-state';
import { EmotionManager } from './emotion';
import { DormancyController } from './dormancy';

// =============================================================================
// Network Configuration
// =============================================================================

/**
 * デフォルトのネットワーク設定を生成
 */
export function createDefaultNetworkConfig(): NetworkConfig {
  return {
    inputNeuronCount: 10,
    processingNeuronCount: 100,
    outputNeuronCount: 4,
    initialConnectivity: 0.1,
    timeStep: 1,  // ms
  };
}

// =============================================================================
// Spiking Neural Network
// =============================================================================

/**
 * スパイキングニューラルネットワーク
 * 
 * 動的に調整される要素:
 * - ニューロン数
 * - シナプス数
 * - シナプス重み
 * - 発火閾値
 * - 発火頻度
 * 
 * @see wiki://Spiking Neural Network
 */
export class SpikingNeuralNetwork {
  // ネットワーク構成要素
  private inputNeurons: InputNeuron[];
  private processingNeurons: Neuron[];
  private outputNeurons: Neuron[];
  
  // 学習・制御モジュール
  private rstdp: RSTDP;
  private homeostasis: HomeostasisController;
  private plasticity: StructuralPlasticityController;
  private internalState: InternalStateManager;
  private emotion: EmotionManager;
  private dormancy: DormancyController;

  // 設定
  private config: NetworkConfig;
  private learningConfig: LearningConfig;

  // 状態追跡
  private currentStep: number = 0;
  private lastRewardVector: RewardVector;

  constructor(
    networkConfig?: Partial<NetworkConfig>,
    learningConfig?: Partial<LearningConfig>,
    importanceVector?: ImportanceVector
  ) {
    this.config = { ...createDefaultNetworkConfig(), ...networkConfig };
    this.learningConfig = { ...createDefaultLearningConfig(), ...learningConfig };
    this.lastRewardVector = createZeroRewardVector();

    // ニューロンの初期化
    this.inputNeurons = createInputNeurons(this.config.inputNeuronCount, 'in');
    this.processingNeurons = createNeurons(this.config.processingNeuronCount, 'proc');
    this.outputNeurons = createNeurons(this.config.outputNeuronCount, 'out');

    // モジュールの初期化
    this.rstdp = new RSTDP(this.learningConfig, importanceVector);
    this.homeostasis = new HomeostasisController({
      smoothingWindow: this.learningConfig.firingRateSmoothingWindow,
      thresholdUpdateRate: this.learningConfig.thresholdUpdateRate,
    });
    this.plasticity = new StructuralPlasticityController();
    this.internalState = new InternalStateManager();
    this.emotion = new EmotionManager();
    this.dormancy = new DormancyController();

    // 初期接続の生成
    this.initializeConnections();
  }

  /**
   * 初期シナプス接続を生成
   */
  private initializeConnections(): void {
    const allSourceCount = this.inputNeurons.length + this.processingNeurons.length;
    
    // 処理ニューロンへの接続
    for (const neuron of this.processingNeurons) {
      for (let i = 0; i < allSourceCount; i++) {
        if (Math.random() < this.config.initialConnectivity) {
          const synapse = createRandomSynapse(
            `syn_${neuron.id}_${i}`,
            i
          );
          neuron.addSynapse(synapse.getState());
        }
      }
    }

    // 出力ニューロンへの接続（処理ニューロンからのみ）
    const procOffset = this.inputNeurons.length;
    for (const neuron of this.outputNeurons) {
      for (let i = 0; i < this.processingNeurons.length; i++) {
        if (Math.random() < this.config.initialConnectivity * 2) {  // 出力への接続は密に
          const synapse = createRandomSynapse(
            `syn_${neuron.id}_${i}`,
            procOffset + i
          );
          neuron.addSynapse(synapse.getState());
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Main Simulation Loop
  // ---------------------------------------------------------------------------

  /**
   * 1ステップのシミュレーションを実行
   * 
   * @param inputs - 入力値の配列（入力ニューロン数と同じ長さ）
   * @param externalReward - 外部からの報酬ベクトル（オプション）
   * @returns 出力ニューロンの発火状態
   */
  step(
    inputs: number[],
    externalReward?: Partial<RewardVector>
  ): boolean[] {
    // 休止状態中の処理
    if (this.dormancy.dormant) {
      return this.processDormantStep();
    }

    this.currentStep++;

    // 1. 入力ニューロンの更新
    this.updateInputNeurons(inputs);

    // 2. 全ニューロンの発火状態を収集
    const inputFired = this.inputNeurons.map(n => n.hasFired);
    const processingFired = this.stepProcessingNeurons(inputFired);
    const outputFired = this.stepOutputNeurons(inputFired, processingFired);

    // 3. 総スパイク数の計算
    const totalSpikes = 
      inputFired.filter(Boolean).length +
      processingFired.filter(Boolean).length +
      outputFired.filter(Boolean).length;

    // 4. 内部状態の更新
    const totalSynapses = this.getTotalSynapseCount();
    this.internalState.step(totalSpikes, totalSynapses);

    // 5. 報酬ベクトルの構築
    const rewardVector = this.buildRewardVector(externalReward, totalSpikes);
    this.lastRewardVector = rewardVector;

    // 6. 感情の更新
    this.emotion.updateFromReward(rewardVector);

    // 7. 学習（R-STDP）
    this.applyLearning(inputFired, processingFired, outputFired, rewardVector);

    // 8. ホメオスタシス
    this.homeostasis.updateNeurons(this.processingNeurons);
    this.homeostasis.updateNeurons(this.outputNeurons);

    // 9. 報酬の記録（休止判定用）
    const scalarReward = computeScalarReward(rewardVector, this.rstdp.getImportanceVector());
    this.dormancy.recordReward(scalarReward);

    // 10. 休止状態への遷移チェック
    this.checkDormancyTransition();

    // 11. リセット
    this.resetForNextStep();

    return outputFired;
  }

  /**
   * 入力ニューロンを更新
   */
  private updateInputNeurons(inputs: number[]): void {
    for (let i = 0; i < this.inputNeurons.length; i++) {
      const value = inputs[i] ?? 0;
      this.inputNeurons[i].setInput(value);
    }
  }

  /**
   * 処理ニューロンのステップを実行
   */
  private stepProcessingNeurons(inputFired: boolean[]): boolean[] {
    // 処理ニューロンは入力ニューロン + 他の処理ニューロンから入力を受ける
    const allFired = [...inputFired];  // 最初は入力のみ
    const processingFired: boolean[] = [];

    for (const neuron of this.processingNeurons) {
      const fired = neuron.step(allFired, this.currentStep);
      processingFired.push(fired);
      allFired.push(fired);  // 次のニューロンの入力に追加
    }

    return processingFired;
  }

  /**
   * 出力ニューロンのステップを実行
   */
  private stepOutputNeurons(
    inputFired: boolean[],
    processingFired: boolean[]
  ): boolean[] {
    const allFired = [...inputFired, ...processingFired];
    const outputFired: boolean[] = [];

    for (const neuron of this.outputNeurons) {
      const fired = neuron.step(allFired, this.currentStep);
      outputFired.push(fired);
    }

    return outputFired;
  }

  /**
   * 報酬ベクトルを構築
   */
  private buildRewardVector(
    externalReward: Partial<RewardVector> | undefined,
    totalSpikes: number
  ): RewardVector {
    // 内部状態からの報酬寄与
    const internalContribution = this.internalState.computeRewardContribution();

    // 構造コスト
    const structuralCost = this.plasticity.computeCost(
      [...this.processingNeurons, ...this.outputNeurons],
      this.inputNeurons.length,
      totalSpikes
    );

    // 安定性（発火率の分散の逆数的な指標）
    const stats = computeHomeostasisStats([...this.processingNeurons, ...this.outputNeurons]);
    const stability = 1 / (1 + stats.firingRateVariance * 10);

    return {
      externalSuccess: externalReward?.externalSuccess ?? 0,
      externalFailure: externalReward?.externalFailure ?? 0,
      internalImprovement: internalContribution.internalImprovement,
      internalDeterioration: internalContribution.internalDeterioration,
      structuralCost: structuralCost,
      energyCost: this.internalState.getState().processingLoad * 0.1,
      predictionError: externalReward?.predictionError ?? 0,
      stability: stability,
    };
  }

  /**
   * R-STDP学習を適用
   */
  private applyLearning(
    inputFired: boolean[],
    processingFired: boolean[],
    outputFired: boolean[],
    rewardVector: RewardVector
  ): void {
    const allPreFired = [...inputFired, ...processingFired];
    const preSpikedIndices = new Set(
      allPreFired.map((fired, i) => fired ? i : -1).filter(i => i >= 0)
    );

    // 処理ニューロンのシナプスを更新
    for (let i = 0; i < this.processingNeurons.length; i++) {
      const neuron = this.processingNeurons[i];
      const postSpiked = processingFired[i];
      
      // TODO: Synapseインスタンスを取得して更新する必要がある
      // 現在はSynapseStateのみ保持しているため、直接更新ロジックが必要
    }

    // 出力ニューロンのシナプスを更新
    for (let i = 0; i < this.outputNeurons.length; i++) {
      const neuron = this.outputNeurons[i];
      const postSpiked = outputFired[i];
      
      // TODO: 同上
    }
  }

  /**
   * 休止状態への遷移をチェック
   */
  private checkDormancyTransition(): void {
    const firingRates = [
      ...this.processingNeurons.map(n => n.firingRate),
      ...this.outputNeurons.map(n => n.firingRate),
    ];

    const trigger = this.dormancy.shouldEnterDormancy(
      this.internalState.getState(),
      firingRates,
      this.currentStep
    );

    if (trigger) {
      this.dormancy.enterDormancy(trigger, this.currentStep);
      this.internalState.enterDormancy();
    }
  }

  /**
   * 休止状態中のステップ処理
   */
  private processDormantStep(): boolean[] {
    this.currentStep++;

    // 内部状態の回復
    this.internalState.dormancyRecovery();

    // 休止処理
    const endReason = this.dormancy.processDormancyStep(
      [...this.processingNeurons, ...this.outputNeurons],
      this.learningConfig.learningRate * 0.1  // 休止中は学習率を下げる
    );

    // 内部状態回復による終了チェック
    const recoveryEnd = this.dormancy.checkInternalStateRecovery(
      this.internalState.getState()
    );

    if (endReason || recoveryEnd) {
      this.dormancy.exitDormancy(endReason ?? recoveryEnd!, this.currentStep);
    }

    // 休止中は出力なし
    return this.outputNeurons.map(() => false);
  }

  /**
   * 次のステップに向けてリセット
   */
  private resetForNextStep(): void {
    for (const neuron of this.inputNeurons) {
      neuron.resetForNextStep();
    }
    for (const neuron of this.processingNeurons) {
      neuron.resetForNextStep();
    }
    for (const neuron of this.outputNeurons) {
      neuron.resetForNextStep();
    }
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * 総シナプス数を取得
   */
  getTotalSynapseCount(): number {
    return [
      ...this.processingNeurons,
      ...this.outputNeurons
    ].reduce((sum, n) => sum + n.synapses.length, 0);
  }

  /**
   * 出力を行動インデックスに変換（最も活発な出力ニューロン）
   */
  selectAction(outputFired: boolean[]): number | null {
    const firedIndices = outputFired
      .map((fired, i) => fired ? i : -1)
      .filter(i => i >= 0);
    
    if (firedIndices.length === 0) return null;
    
    // 複数発火した場合はランダムに選択
    return firedIndices[Math.floor(Math.random() * firedIndices.length)];
  }

  // ---------------------------------------------------------------------------
  // Logging Support
  // ---------------------------------------------------------------------------

  /**
   * 実験ログエントリを生成
   */
  generateLogEntry(
    inputVector: number[],
    outputFired: boolean[],
    selectedAction: number | null
  ): ExperimentLogEntry {
    const allNeurons = [...this.processingNeurons, ...this.outputNeurons];
    const homeostasisStats = computeHomeostasisStats(allNeurons);
    const structuralStats = computeStructuralStats(allNeurons, this.inputNeurons.length);
    
    // シナプス統計
    const allSynapses = allNeurons.flatMap(n => [...n.synapses]);
    const synapseStats = computeSynapseStats(allSynapses);

    const scalarReward = computeScalarReward(
      this.lastRewardVector,
      this.rstdp.getImportanceVector()
    );

    return {
      step: this.currentStep,
      inputVector,
      outputVector: outputFired.map(f => f ? 1 : 0),
      selectedAction,
      rewardVector: this.lastRewardVector,
      scalarReward,
      neuronSpikes: [
        ...this.inputNeurons.map(n => n.hasFired),
        ...this.processingNeurons.map(n => n.hasFired),
        ...this.outputNeurons.map(n => n.hasFired),
      ],
      meanFiringRate: homeostasisStats.meanFiringRate,
      firingRateVariance: homeostasisStats.firingRateVariance,
      weightMean: synapseStats.weightMean,
      weightVariance: synapseStats.weightVariance,
      synapseCount: structuralStats.synapseCount,
      neuronCount: structuralStats.neuronCount,
      thresholdMean: homeostasisStats.meanThreshold,
      thresholdVariance: homeostasisStats.thresholdVariance,
      internalState: this.internalState.getState(),
      eligibilityTraceSummary: {
        mean: synapseStats.eligibilityTraceMean,
        variance: synapseStats.eligibilityTraceVariance,
        max: synapseStats.eligibilityTraceMax,
      },
      structuralCost: this.plasticity.computeCost(
        allNeurons,
        this.inputNeurons.length,
        0  // TODO: track totalSpikes
      ),
    };
  }

  // ---------------------------------------------------------------------------
  // State Access
  // ---------------------------------------------------------------------------

  getConfig(): Readonly<NetworkConfig> {
    return { ...this.config };
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getInternalState(): Readonly<InternalState> {
    return this.internalState.getState();
  }

  getEmotionState() {
    return this.emotion.getState();
  }

  getDormancyStatus() {
    return this.dormancy.getStatus();
  }

  getNetworkStats() {
    return {
      inputNeuronCount: this.inputNeurons.length,
      processingNeuronCount: this.processingNeurons.length,
      outputNeuronCount: this.outputNeurons.length,
      totalSynapseCount: this.getTotalSynapseCount(),
      ...computeHomeostasisStats([...this.processingNeurons, ...this.outputNeurons]),
    };
  }
}