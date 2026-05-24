/**
 * ProjectTailFairy - Example Usage
 * プロトタイプの使用例
 * 
 * このファイルは Phase 1: 固定構造での学習能力の実証 に向けた
 * 基本的な使用方法を示します。
 */

import {
  SpikingNeuralNetwork,
  ExperimentLogger,
  analyzeLearningProgress,
  createDefaultNetworkConfig,
  createDefaultLearningConfig,
} from './index';

/**
 * シンプルなXOR学習タスクの例
 * 
 * 入力: 2つのバイナリ値
 * 出力: XOR結果
 */
async function runXORExperiment() {
  console.log('=== XOR Learning Experiment ===\n');

  // ネットワークの初期化
  const network = new SpikingNeuralNetwork(
    {
      inputNeuronCount: 2,      // XORの2入力
      processingNeuronCount: 20, // 小規模な処理層
      outputNeuronCount: 2,     // 0 or 1
      initialConnectivity: 0.3,
    },
    {
      learningRate: 0.05,
      weightDecay: 0.0001,
      firingRateSmoothingWindow: 50,
      thresholdUpdateRate: 0.002,
    }
  );

  // ロガーの初期化
  const logger = new ExperimentLogger({ logInterval: 10 });

  // XORの学習データ
  const xorData = [
    { inputs: [0, 0], expected: 0 },
    { inputs: [0, 1], expected: 1 },
    { inputs: [1, 0], expected: 1 },
    { inputs: [1, 1], expected: 0 },
  ];

  // 学習ループ
  const totalSteps = 1000;
  let correctCount = 0;
  let recentCorrect = 0;

  for (let step = 0; step < totalSteps; step++) {
    // ランダムにデータを選択
    const data = xorData[step % xorData.length];
    
    // ネットワークを実行
    const outputFired = network.step(data.inputs);
    
    // 出力を解釈（どちらの出力ニューロンが発火したか）
    const selectedAction = network.selectAction(outputFired);
    const predicted = selectedAction ?? -1;
    
    // 正解判定
    const isCorrect = predicted === data.expected;
    if (isCorrect) {
      correctCount++;
      recentCorrect++;
    }

    // 報酬を与える
    const reward = isCorrect 
      ? { externalSuccess: 1.0 }
      : { externalFailure: 0.5 };
    
    // 次のステップで報酬を反映（遅延報酬として）
    if (step < totalSteps - 1) {
      network.step(data.inputs, reward);
    }

    // ログ記録
    const logEntry = network.generateLogEntry(
      data.inputs,
      outputFired,
      selectedAction
    );
    logger.log(logEntry);

    // 進捗表示
    if ((step + 1) % 100 === 0) {
      const accuracy = (recentCorrect / 100) * 100;
      console.log(`Step ${step + 1}: Recent accuracy = ${accuracy.toFixed(1)}%`);
      console.log(`  Internal state: energy=${network.getInternalState().energy.toFixed(2)}, ` +
                  `load=${network.getInternalState().processingLoad.toFixed(2)}`);
      console.log(`  Network stats: synapses=${network.getNetworkStats().totalSynapseCount}`);
      recentCorrect = 0;
    }
  }

  // 最終結果
  console.log('\n=== Results ===');
  console.log(`Total accuracy: ${((correctCount / totalSteps) * 100).toFixed(1)}%`);
  
  // 学習分析
  const analysis = analyzeLearningProgress(logger.getLogs() as any[]);
  console.log(`Learning detected: ${analysis.isLearning}`);
  console.log(`Reward trend: ${analysis.rewardTrend}`);
  console.log(`Firing rate stability: ${analysis.firingRateStability}`);
  console.log(`Weight convergence: ${analysis.weightConvergence}`);

  // ログのエクスポート（コメントアウト）
  // const csv = logger.exportToCsv();
  // console.log('\nCSV export preview (first 500 chars):');
  // console.log(csv.substring(0, 500));
}

/**
 * 休止状態のテスト
 */
async function testDormancy() {
  console.log('\n=== Dormancy Test ===\n');

  const network = new SpikingNeuralNetwork({
    inputNeuronCount: 4,
    processingNeuronCount: 50,
    outputNeuronCount: 2,
  });

  // 高負荷をシミュレート
  for (let i = 0; i < 500; i++) {
    const inputs = [1, 1, 1, 1];  // 全入力ON
    network.step(inputs);
    
    const status = network.getDormancyStatus();
    if (status.isDormant && i % 50 === 0) {
      console.log(`Step ${i}: DORMANT (trigger: ${status.dormancyTrigger})`);
    }
  }

  console.log('\nFinal internal state:', network.getInternalState());
  console.log('Dormancy status:', network.getDormancyStatus());
}

/**
 * メイン実行
 */
async function main() {
  console.log('ProjectTailFairy Prototype Demo\n');
  console.log('================================\n');

  await runXORExperiment();
  await testDormancy();

  console.log('\n================================');
  console.log('Demo complete!');
  console.log('\nNote: This is a prototype with many TODOs.');
  console.log('See index.ts for details on what needs to be implemented.');
}

// 実行
main().catch(console.error);