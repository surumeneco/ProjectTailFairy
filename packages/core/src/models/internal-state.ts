/**
 * ProjectTailFairy - Internal State Module
 * 内部状態の管理
 * 
 * @see wiki://InternalState
 */

import type { InternalState, OperationalStatus, RewardVector } from './types';

// =============================================================================
// Internal State Management
// =============================================================================

/**
 * デフォルトの内部状態を生成
 */
export function createDefaultInternalState(): InternalState {
  return {
    energy: 1.0,
    processingLoad: 0.0,
    temperature: 0.5,  // 正規化された温度 0-1
    memoryPressure: 0.0,
    operationalStatus: 'active',
  };
}

/**
 * 内部状態マネージャー
 * エージェントの生理的類似変数を管理
 */
export class InternalStateManager {
  private state: InternalState;
  private previousState: InternalState;

  // 状態変化の閾値
  private readonly config = {
    energyDecayRate: 0.001,        // ステップごとのエネルギー消費
    processingLoadIncrement: 0.01, // スパイクごとの処理負荷増加
    processingLoadDecay: 0.005,    // ステップごとの処理負荷回復
    temperatureIncrement: 0.001,   // 処理による温度上昇
    temperatureCooling: 0.002,     // 自然冷却
    memoryPressureIncrement: 0.005,// メモリ使用量増加
    memoryPressureDecay: 0.002,    // メモリ解放

    // 状態遷移の閾値
    overloadThreshold: 0.9,
    recoveryThreshold: 0.3,
    dormancyEnergyThreshold: 0.2,
    dormancyMemoryThreshold: 0.8,
  };

  constructor(initialState?: Partial<InternalState>) {
    this.state = { ...createDefaultInternalState(), ...initialState };
    this.previousState = { ...this.state };
  }

  /**
   * 内部状態を1ステップ更新
   * 
   * @param totalSpikes - このステップでの総スパイク数
   * @param synapseCount - 現在のシナプス数（メモリ圧力に影響）
   */
  step(totalSpikes: number, synapseCount: number): void {
    this.previousState = { ...this.state };

    // エネルギー消費
    const energyConsumption = this.config.energyDecayRate + 
                              totalSpikes * 0.0001;
    this.state.energy = Math.max(0, this.state.energy - energyConsumption);

    // 処理負荷
    const loadIncrease = totalSpikes * this.config.processingLoadIncrement;
    this.state.processingLoad = Math.min(
      1,
      Math.max(0, this.state.processingLoad + loadIncrease - this.config.processingLoadDecay)
    );

    // 温度
    const tempIncrease = totalSpikes * this.config.temperatureIncrement;
    this.state.temperature = Math.min(
      1,
      Math.max(0, this.state.temperature + tempIncrease - this.config.temperatureCooling)
    );

    // メモリ圧力（シナプス数に比例）
    const memoryBase = synapseCount * 0.00001;
    this.state.memoryPressure = Math.min(
      1,
      Math.max(0, memoryBase + this.state.memoryPressure * 0.99)
    );

    // 操作状態の更新
    this.updateOperationalStatus();
  }

  /**
   * 操作状態を更新
   */
  private updateOperationalStatus(): void {
    const { processingLoad, energy, memoryPressure } = this.state;

    if (this.state.operationalStatus === 'dormant') {
      // 休止状態からの回復判定
      if (
        energy > this.config.recoveryThreshold &&
        processingLoad < this.config.recoveryThreshold &&
        memoryPressure < this.config.recoveryThreshold
      ) {
        this.state.operationalStatus = 'recovering';
      }
    } else if (this.state.operationalStatus === 'recovering') {
      // 回復完了判定
      if (
        energy > 0.5 &&
        processingLoad < 0.2 &&
        memoryPressure < 0.3
      ) {
        this.state.operationalStatus = 'active';
      }
    } else if (
      processingLoad > this.config.overloadThreshold ||
      memoryPressure > this.config.overloadThreshold
    ) {
      this.state.operationalStatus = 'overloaded';
    } else if (this.state.operationalStatus === 'overloaded') {
      if (
        processingLoad < 0.7 &&
        memoryPressure < 0.7
      ) {
        this.state.operationalStatus = 'active';
      }
    }
  }

  /**
   * 休止状態に入る必要があるか判定
   * @see wiki://Dormancy Processing
   */
  shouldEnterDormancy(): boolean {
    return (
      this.state.energy < this.config.dormancyEnergyThreshold ||
      this.state.memoryPressure > this.config.dormancyMemoryThreshold ||
      this.state.processingLoad > this.config.overloadThreshold
    );
  }

  /**
   * 休止状態を開始
   */
  enterDormancy(): void {
    this.state.operationalStatus = 'dormant';
  }

  /**
   * 休止状態中の回復処理
   */
  dormancyRecovery(): void {
    // 休止中はより速く回復
    this.state.energy = Math.min(1, this.state.energy + 0.01);
    this.state.processingLoad = Math.max(0, this.state.processingLoad - 0.02);
    this.state.memoryPressure = Math.max(0, this.state.memoryPressure - 0.01);
    this.state.temperature = Math.max(0.3, this.state.temperature - 0.005);
  }

  /**
   * エネルギーを補充（外部からの「食事」に相当）
   */
  refillEnergy(amount: number = 0.5): void {
    this.state.energy = Math.min(1, this.state.energy + amount);
  }

  /**
   * 内部状態の変化から RewardVector への寄与を計算
   */
  computeRewardContribution(): Pick<RewardVector, 'internalImprovement' | 'internalDeterioration'> {
    const energyChange = this.state.energy - this.previousState.energy;
    const loadChange = this.state.processingLoad - this.previousState.processingLoad;
    const tempChange = this.state.temperature - this.previousState.temperature;
    const memoryChange = this.state.memoryPressure - this.previousState.memoryPressure;

    // 改善: エネルギー増加、負荷・温度・メモリ減少
    const improvement = Math.max(0, energyChange) +
                        Math.max(0, -loadChange) +
                        Math.max(0, -tempChange) +
                        Math.max(0, -memoryChange);

    // 悪化: エネルギー減少、負荷・温度・メモリ増加
    const deterioration = Math.max(0, -energyChange) +
                          Math.max(0, loadChange) +
                          Math.max(0, tempChange) +
                          Math.max(0, memoryChange);

    return {
      internalImprovement: improvement,
      internalDeterioration: deterioration,
    };
  }

  /**
   * 状態を取得
   */
  getState(): Readonly<InternalState> {
    return { ...this.state };
  }

  /**
   * 状態を直接設定（テスト・デバッグ用）
   */
  setState(state: Partial<InternalState>): void {
    this.state = { ...this.state, ...state };
  }

  /**
   * 設定を更新
   */
  setConfig(config: Partial<typeof this.config>): void {
    Object.assign(this.config, config);
  }
}