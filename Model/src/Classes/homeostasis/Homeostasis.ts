/**
 * ニューロンの恒常性に関する仕様確定済みの更新式です。
 *
 * 出典: PromptQL Wiki「発火率更新」「閾値更新」(2026-05-24版)。
 * 移植元: develop/packages/core/src/homeostasis/index.ts。
 * 平滑化窓幅・更新率・目標発火率は利用側で決定し、仮のデフォルト値を設定しません。
 * 閾値上下限は未決なので、この層ではクリッピングを行いません。
 */

//#region 入力・出力検証

/**
 * 計算対象の有限性を確認します。
 * @param value 確認する値です。
 * @param variable_name 計算上の変数名です。
 * @returns 確認済みの数値です。
 */
const assertFiniteScalar = (value: number, variable_name: string): number => {
  if (!Number.isFinite(value)) {
    console.error(`[Homeostasis] ${variable_name} is not finite`, { value });
    throw new Error(`${variable_name} must be finite`);
  }
  return value;
};

//#endregion

//#region 発火率の指数移動平均

/**
 * 発火率のEMAを1ステップ更新します。
 * Φ[s+1] = (1 - 1/L) * Φ[s] + (1/L) * O[s]
 * @param current_firing_rate 現在の平滑化発火率Φ[s]です。
 * @param fired このステップで発火した場合trueです。
 * @param smoothing_window 平滑化窓幅Lです（0より大きい有限値）。
 * @returns 更新された発火率Φ[s+1]です。
 */
export const updateFiringRate = (current_firing_rate: number, fired: boolean, smoothing_window: number): number => {
  assertFiniteScalar(current_firing_rate, "current_firing_rate");
  assertFiniteScalar(smoothing_window, "smoothing_window");
  if (smoothing_window <= 0) {
    console.error("[Homeostasis] smoothing_window must be positive", { smoothing_window });
    throw new Error("smoothing_window must be positive");
  }

  const alpha = 1 / smoothing_window;
  const output = fired ? 1 : 0;
  return assertFiniteScalar((1 - alpha) * current_firing_rate + alpha * output, "next_firing_rate");
};

//#endregion

//#region 発火閾値の更新

/**
 * 発火閾値を1ステップ更新します。
 * θ[s+1] = θ[s] + Δθ * (Φ[s] - T[s])
 * @param current_threshold 現在の発火閾値θ[s]です。
 * @param current_firing_rate 現在の平滑化発火率Φ[s]です。
 * @param target_firing_rate 目標発火率T[s]です。
 * @param update_rate 閾値更新率Δθです。
 * @returns クリッピング前の閾値θ[s+1]です。
 */
export const updateThreshold = (
  current_threshold: number,
  current_firing_rate: number,
  target_firing_rate: number,
  update_rate: number
): number => {
  assertFiniteScalar(current_threshold, "current_threshold");
  assertFiniteScalar(current_firing_rate, "current_firing_rate");
  assertFiniteScalar(target_firing_rate, "target_firing_rate");
  assertFiniteScalar(update_rate, "update_rate");

  return assertFiniteScalar(
    current_threshold + update_rate * (current_firing_rate - target_firing_rate),
    "next_threshold"
  );
};

//#endregion
