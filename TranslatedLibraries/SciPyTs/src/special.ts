/**
 * SciPy の `scipy.special` 相当関数を TypeScript へ翻訳した実装です。
 */

import { max, type Vec } from "@project-tail-fairy/numpy-ts";

//#region 内部ヘルパー

/**
 * スカラー値が有限かを検証します。
 * @param value 検証対象の値です。
 * @param variable_name 変数名です。
 * @returns 検証済みの値です。
 */
const assertFiniteScalar = (value: number, variable_name: string): number => {
  if (!Number.isFinite(value)) {
    console.error(`[SciPyTs/special] ${variable_name} が有限値ではありません。`, { value, variable_name });
    throw new Error(`${variable_name} が有限値ではありません。`);
  }
  return value;
};

//#endregion

//#region 公開関数

/**
 * シグモイド関数を適用します。
 * @param input_vector 入力ベクトルです。
 * @returns 適用後のベクトルです。
 */
export const sigmoid = (input_vector: Vec): Vec => {
  const result = new Float64Array(input_vector.length);
  for (let index = 0; index < input_vector.length; index += 1) {
    result[index] = 1 / (1 + Math.exp(-input_vector[index]));
  }
  return result;
};

/**
 * `sigmoid` の別名です。
 * @param input_vector 入力ベクトルです。
 * @returns 適用後のベクトルです。
 */
export const expit = (input_vector: Vec): Vec => sigmoid(input_vector);

/**
 * softmax を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns softmax 結果です。
 */
export const softmax = (input_vector: Vec): Vec => {
  const max_value = max(input_vector);
  const result = new Float64Array(input_vector.length);
  let sum_exponentials = 0;

  for (let index = 0; index < input_vector.length; index += 1) {
    result[index] = Math.exp(input_vector[index] - max_value);
    sum_exponentials += result[index];
  }

  const divisor = assertFiniteScalar(sum_exponentials, "sum_exponentials");
  for (let index = 0; index < input_vector.length; index += 1) {
    result[index] /= divisor;
  }

  return result;
};

//#endregion
