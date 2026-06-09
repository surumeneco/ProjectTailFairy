import type { Vec } from "@project-tail-fairy/numpy-ts";

//#region 定数

const DEFAULT_LEAKY_RELU_ALPHA = 0.01;

//#endregion

//#region 活性化関数

/**
 * ReLU 活性化関数を適用します。
 * @param input_vector 入力ベクトルです。
 * @returns 活性化後のベクトルです。
 */
export const relu = (input_vector: Vec): Vec => {
  const result = new Float64Array(input_vector.length);
  for (let index = 0; index < input_vector.length; index += 1) {
    result[index] = input_vector[index] > 0 ? input_vector[index] : 0;
  }
  return result;
};

/**
 * Leaky ReLU 活性化関数を適用します。
 * @param input_vector 入力ベクトルです。
 * @param alpha 負値側の傾きです。
 * @returns 活性化後のベクトルです。
 */
export const leakyRelu = (input_vector: Vec, alpha = DEFAULT_LEAKY_RELU_ALPHA): Vec => {
  const result = new Float64Array(input_vector.length);
  for (let index = 0; index < input_vector.length; index += 1) {
    result[index] = input_vector[index] > 0 ? input_vector[index] : alpha * input_vector[index];
  }
  return result;
};

//#endregion
