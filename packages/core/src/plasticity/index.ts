/**
 * ProjectTailFairy - Structural Plasticity Module
 * 構造的可塑性と構造コストの実装
 * 
 * @see wiki://Structural Cost
 */

import type { 
  StructuralCostCoefficients, 
  SynapseState,
  NeuronId,
  SynapseId
} from './types';
import { Neuron } from './neuron';
import { Synapse, createRandomSynapse } from './synapse';

// =============================================================================
// Structural Cost Calculation
// =============================================================================

/**
 * 構造コストを計算
 * 
 * 式: structuralCost = a*neuronCount + b*synapseCount + c*meanFiringRate + d*totalSpikes + e*connectionDensity
 * 
 * @see wiki://Structural Cost
 */
export function computeStructuralCost(
  params: {
    neuronCount: number;
    synapseCount: number;
    meanFiringRate: number;
    totalSpikes: number;
    connectionDensity: number;
  },
  coefficients: StructuralCostCoefficients
): number {
  return (
    coefficients.a * params.neuronCount +
    coefficients.b * params.synapseCount +
    coefficients.c * params.meanFiringRate +
    coefficients.d * params.totalSpikes +
    coefficients.e * params.connectionDensity
  );
}

/**
 * 接続密度を計算
 * connectionDensity = existingSynapses / possibleSynapses
 */
export function computeConnectionDensity(
  synapseCount: number,
  neuronCount: number,
  inputNeuronCount: number
): number {
  // 可能なシナプス数 = (入力ニューロン + 処理ニューロン) × 処理ニューロン
  // (処理ニューロンは他のすべてのニューロンから入力を受けられる)
  const possibleSynapses = (inputNeuronCount + neuronCount) * neuronCount;
  
  if (possibleSynapses === 0) return 0;
  
  return synapseCount / possibleSynapses;
}

/**
 * デフォルトの構造コスト係数を生成
 * TODO: パラメータの最適化は Schokosnuss の担当
 */
export function createDefaultStructuralCostCoefficients(): StructuralCostCoefficients {
  return {
    a: 0.001,  // neuronCount: 軽いペナルティ
    b: 0.0001, // synapseCount: 非常に軽いペナルティ
    c: 0.01,   // meanFiringRate: 中程度のペナルティ
    d: 0.0001, // totalSpikes: 非常に軽いペナルティ
    e: 0.1,    // connectionDensity: 中程度のペナルティ
  };
}

// =============================================================================
// Structural Plasticity Controller
// =============================================================================

/**
 * 構造的可塑性コントローラー
 * シナプスの追加・削除、ニューロンの追加・削除を管理
 */
export class StructuralPlasticityController {
  private coefficients: StructuralCostCoefficients;
  private synapseIdCounter: number = 0;
  private neuronIdCounter: number = 0;

  constructor(
    coefficients?: StructuralCostCoefficients,
    initialSynapseIdCounter: number = 0,
    initialNeuronIdCounter: number = 0
  ) {
    this.coefficients = coefficients ?? createDefaultStructuralCostCoefficients();
    this.synapseIdCounter = initialSynapseIdCounter;
    this.neuronIdCounter = initialNeuronIdCounter;
  }

  /**
   * 新しいシナプスIDを生成
   */
  private generateSynapseId(): SynapseId {
    return `syn_${this.synapseIdCounter++}`;
  }

  /**
   * 新しいニューロンIDを生成
   */
  private generateNeuronId(): NeuronId {
    return `n_${this.neuronIdCounter++}`;
  }

  /**
   * 構造コストを計算
   */
  computeCost(
    neurons: Neuron[],
    inputNeuronCount: number,
    totalSpikes: number
  ): number {
    const neuronCount = neurons.length;
    const synapseCount = neurons.reduce(
      (sum, n) => sum + n.synapses.length, 0
    );
    const meanFiringRate = neurons.length > 0
      ? neurons.reduce((sum, n) => sum + n.firingRate, 0) / neurons.length
      : 0;
    const connectionDensity = computeConnectionDensity(
      synapseCount, neuronCount, inputNeuronCount
    );

    return computeStructuralCost(
      { neuronCount, synapseCount, meanFiringRate, totalSpikes, connectionDensity },
      this.coefficients
    );
  }

  // ---------------------------------------------------------------------------
  // Synapse Operations
  // ---------------------------------------------------------------------------

  /**
   * ニューロンにシナプスを追加
   * 
   * @param neuron - シナプスを追加するニューロン
   * @param inputIndex - 接続する入力ニューロンのインデックス
   * @param weight - 初期重み（オプション）
   * @returns 追加されたシナプス
   */
  addSynapse(
    neuron: Neuron,
    inputIndex: number,
    weight?: number
  ): Synapse {
    const synapse = weight !== undefined
      ? new Synapse({ id: this.generateSynapseId(), inputIndex, weight })
      : createRandomSynapse(this.generateSynapseId(), inputIndex);
    
    neuron.addSynapse(synapse.getState());
    return synapse;
  }

  /**
   * 弱いシナプスをプルーニング
   * 
   * @param neurons - プルーニング対象のニューロン配列
   * @returns 削除されたシナプスの総数
   */
  pruneWeakSynapses(neurons: Neuron[]): number {
    let totalPruned = 0;
    for (const neuron of neurons) {
      const pruned = neuron.pruneWeakSynapses();
      totalPruned += pruned.length;
    }
    return totalPruned;
  }

  /**
   * 使用されていないシナプスを特定
   * 適格性トレースが長期間低い状態のシナプスを返す
   */
  findUnusedSynapses(
    neurons: Neuron[],
    minEligibilityTrace: number = 0.001,
    minWeight: number = 0.01
  ): Array<{ neuronId: NeuronId; synapseId: SynapseId }> {
    const unused: Array<{ neuronId: NeuronId; synapseId: SynapseId }> = [];

    for (const neuron of neurons) {
      for (const synapse of neuron.synapses) {
        if (
          Math.abs(synapse.eligibilityTrace) < minEligibilityTrace &&
          Math.abs(synapse.weight) < minWeight
        ) {
          unused.push({ neuronId: neuron.id, synapseId: synapse.id });
        }
      }
    }

    return unused;
  }

  // ---------------------------------------------------------------------------
  // Neuron Operations
  // ---------------------------------------------------------------------------

  /**
   * 新しいニューロンを生成
   * TODO: ニューロン追加の条件と接続戦略を決定
   */
  createNeuron(options?: {
    threshold?: number;
    targetFiringRate?: number;
  }): Neuron {
    const { Neuron: NeuronClass } = require('./neuron');
    return new NeuronClass({
      id: this.generateNeuronId(),
      ...options,
    });
  }

  /**
   * 発火しないニューロン（沈黙ニューロン）を特定
   */
  findSilentNeurons(
    neurons: Neuron[],
    minFiringRate: number = 0.001
  ): Neuron[] {
    return neurons.filter(n => n.firingRate < minFiringRate);
  }

  /**
   * 過活動ニューロンを特定
   */
  findOveractiveNeurons(
    neurons: Neuron[],
    maxFiringRate: number = 0.9
  ): Neuron[] {
    return neurons.filter(n => n.firingRate > maxFiringRate);
  }

  // ---------------------------------------------------------------------------
  // Structural Plasticity Decisions
  // ---------------------------------------------------------------------------

  /**
   * 構造変更が必要かどうかを判定
   * TODO: より洗練された判定ロジック
   */
  shouldModifyStructure(
    neurons: Neuron[],
    inputNeuronCount: number,
    recentRewardVariance: number
  ): {
    shouldAddSynapses: boolean;
    shouldPruneSynapses: boolean;
    shouldAddNeurons: boolean;
    shouldRemoveNeurons: boolean;
  } {
    const silentNeurons = this.findSilentNeurons(neurons);
    const overactiveNeurons = this.findOveractiveNeurons(neurons);
    const synapseCount = neurons.reduce((sum, n) => sum + n.synapses.length, 0);
    const connectionDensity = computeConnectionDensity(
      synapseCount, neurons.length, inputNeuronCount
    );

    return {
      // 報酬分散が高い（不安定な環境）ときにシナプスを追加
      shouldAddSynapses: recentRewardVariance > 0.1 && connectionDensity < 0.5,
      // 接続密度が高すぎる場合にプルーニング
      shouldPruneSynapses: connectionDensity > 0.7,
      // 多くのニューロンが過活動の場合にニューロンを追加
      shouldAddNeurons: overactiveNeurons.length > neurons.length * 0.3,
      // 多くのニューロンが沈黙している場合に削除候補
      shouldRemoveNeurons: silentNeurons.length > neurons.length * 0.3,
    };
  }

  /**
   * 係数を更新
   */
  setCoefficients(coefficients: Partial<StructuralCostCoefficients>): void {
    this.coefficients = { ...this.coefficients, ...coefficients };
  }

  getCoefficients(): Readonly<StructuralCostCoefficients> {
    return { ...this.coefficients };
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * ネットワーク構造の統計情報を計算
 */
export function computeStructuralStats(
  neurons: Neuron[],
  inputNeuronCount: number
): {
  neuronCount: number;
  synapseCount: number;
  meanSynapsesPerNeuron: number;
  connectionDensity: number;
  synapsesWithPositiveWeight: number;
  synapsesWithNegativeWeight: number;
} {
  const neuronCount = neurons.length;
  const synapseCount = neurons.reduce((sum, n) => sum + n.synapses.length, 0);
  const meanSynapsesPerNeuron = neuronCount > 0 ? synapseCount / neuronCount : 0;
  const connectionDensity = computeConnectionDensity(
    synapseCount, neuronCount, inputNeuronCount
  );

  let synapsesWithPositiveWeight = 0;
  let synapsesWithNegativeWeight = 0;
  for (const neuron of neurons) {
    for (const synapse of neuron.synapses) {
      if (synapse.weight > 0) {
        synapsesWithPositiveWeight++;
      } else if (synapse.weight < 0) {
        synapsesWithNegativeWeight++;
      }
    }
  }

  return {
    neuronCount,
    synapseCount,
    meanSynapsesPerNeuron,
    connectionDensity,
    synapsesWithPositiveWeight,
    synapsesWithNegativeWeight,
  };
}