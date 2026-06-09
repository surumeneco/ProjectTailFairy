/**
 * NumPy の統計補助関数を TypeScript へ翻訳した実装です。
 */

import type { Matrix } from "./matrix";
import * as mat from "./matrix";
import type { Vec } from "./vector";
import * as vec from "./vector";

//#region 定数

const PERCENTAGE_SCALE = 100;
//#endregion

//#region 内部ヘルパー

/**
 * スカラー値が有限かを検証します。
 * @param value 検証対象の値です。
 * @param variable_name 変数名です。
 * @returns 検証済みの値です。
 */
const assertFiniteScalar = (value: number, variable_name: string): number => {
  if (!Number.isFinite(value)) {
    console.error(`[NumPyTs/stats] ${variable_name} が有限値ではありません。`, { value, variable_name });
    throw new Error(`${variable_name} が有限値ではありません。`);
  }
  return value;
};

/**
 * 0 除算につながる値でないことを検証します。
 * @param value 検証対象の値です。
 * @param variable_name 変数名です。
 * @returns 検証済みの値です。
 */
const assertNonZeroScalar = (value: number, variable_name: string): number => {
  assertFiniteScalar(value, variable_name);
  if (Math.abs(value) <= Number.EPSILON) {
    console.error(`[NumPyTs/stats] ${variable_name} が 0 に近く、計算を継続できません。`, {
      value,
      variable_name
    });
    throw new Error(`${variable_name} が 0 に近く、計算を継続できません。`);
  }
  return value;
};

//#endregion

//#region 基本統計量

/**
 * 分散を計算します。
 * @param input_vector 入力ベクトルです。
 * @param ddof 自由度補正です。
 * @returns 分散です。
 */
export const variance = (input_vector: Vec, ddof = 0): number => {
  const mean_value = vec.mean(input_vector);
  let squared_sum = 0;
  for (let index = 0; index < input_vector.length; index += 1) {
    const delta = input_vector[index] - mean_value;
    squared_sum += delta * delta;
  }
  const divisor = assertNonZeroScalar(input_vector.length - ddof, "variance_divisor");
  return squared_sum / divisor;
};

/**
 * 標準偏差を計算します。
 * @param input_vector 入力ベクトルです。
 * @param ddof 自由度補正です。
 * @returns 標準偏差です。
 */
export const std = (input_vector: Vec, ddof = 0): number => Math.sqrt(variance(input_vector, ddof));

/**
 * 共分散を計算します。
 * @param vector_x 第 1 ベクトルです。
 * @param vector_y 第 2 ベクトルです。
 * @param ddof 自由度補正です。
 * @returns 共分散です。
 */
export const cov = (vector_x: Vec, vector_y: Vec, ddof = 0): number => {
  if (vector_x.length !== vector_y.length) {
    throw new Error("cov では同じ長さのベクトルが必要です。");
  }
  const mean_x = vec.mean(vector_x);
  const mean_y = vec.mean(vector_y);
  let covariance_sum = 0;
  for (let index = 0; index < vector_x.length; index += 1) {
    covariance_sum += (vector_x[index] - mean_x) * (vector_y[index] - mean_y);
  }
  const divisor = assertNonZeroScalar(vector_x.length - ddof, "cov_divisor");
  return covariance_sum / divisor;
};

/**
 * 相関係数を計算します。
 * @param vector_x 第 1 ベクトルです。
 * @param vector_y 第 2 ベクトルです。
 * @returns 相関係数です。
 */
export const corrcoef = (vector_x: Vec, vector_y: Vec): number => {
  const denominator = assertNonZeroScalar(std(vector_x) * std(vector_y), "corrcoef_denominator");
  return cov(vector_x, vector_y) / denominator;
};

/**
 * 共分散行列を計算します。
 * @param input_matrix 観測行列です。
 * @param ddof 自由度補正です。
 * @returns 共分散行列です。
 */
export const covMatrix = (input_matrix: Matrix, ddof = 0): Matrix => {
  const observation_count = input_matrix.rows;
  const feature_count = input_matrix.cols;
  const column_means = mat.meanCols(input_matrix);
  const covariance_matrix = mat.mat(feature_count, feature_count);

  for (let row_index = 0; row_index < feature_count; row_index += 1) {
    for (let column_index = row_index; column_index < feature_count; column_index += 1) {
      let covariance_sum = 0;
      for (let observation_index = 0; observation_index < observation_count; observation_index += 1) {
        covariance_sum +=
          (input_matrix.data[observation_index * feature_count + row_index] - column_means[row_index]) *
          (input_matrix.data[observation_index * feature_count + column_index] - column_means[column_index]);
      }
      const divisor = assertNonZeroScalar(observation_count - ddof, "covariance_divisor");
      const covariance_value = covariance_sum / divisor;
      covariance_matrix.data[row_index * feature_count + column_index] = covariance_value;
      covariance_matrix.data[column_index * feature_count + row_index] = covariance_value;
    }
  }

  return covariance_matrix;
};

/**
 * 相関行列を計算します。
 * @param input_matrix 観測行列です。
 * @returns 相関行列です。
 */
export const corrMatrix = (input_matrix: Matrix): Matrix => {
  const correlation_matrix = covMatrix(input_matrix);
  const size = correlation_matrix.rows;
  const standard_deviations = new Float64Array(size);

  for (let index = 0; index < size; index += 1) {
    standard_deviations[index] = Math.sqrt(correlation_matrix.data[index * size + index]);
    assertNonZeroScalar(standard_deviations[index], `standard_deviations[${String(index)}]`);
  }

  for (let row_index = 0; row_index < size; row_index += 1) {
    for (let column_index = 0; column_index < size; column_index += 1) {
      correlation_matrix.data[row_index * size + column_index] /=
        standard_deviations[row_index] * standard_deviations[column_index];
    }
  }

  return correlation_matrix;
};

/**
 * 中央値を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 中央値です。
 */
export const median = (input_vector: Vec): number => {
  const sorted_vector = vec.sort(input_vector);
  const middle_index = Math.floor(sorted_vector.length / 2);
  return sorted_vector.length % 2 === 1
    ? sorted_vector[middle_index]
    : (sorted_vector[middle_index - 1] + sorted_vector[middle_index]) / 2;
};

/**
 * パーセンタイルを計算します。
 * @param input_vector 入力ベクトルです。
 * @param percentage パーセンタイルです。
 * @returns パーセンタイル値です。
 */
export const percentile = (input_vector: Vec, percentage: number): number => {
  const sorted_vector = vec.sort(input_vector);
  const position = (percentage / PERCENTAGE_SCALE) * (sorted_vector.length - 1);
  const lower_index = Math.floor(position);
  const upper_index = Math.ceil(position);
  if (lower_index === upper_index) {
    return sorted_vector[lower_index];
  }
  return sorted_vector[lower_index] * (upper_index - position) + sorted_vector[upper_index] * (position - lower_index);
};

/**
 * 分位点を計算します。
 * @param input_vector 入力ベクトルです。
 * @param quantile_ratio 分位比です。
 * @returns 分位点です。
 */
export const quantile = (input_vector: Vec, quantile_ratio: number): number =>
  percentile(input_vector, quantile_ratio * PERCENTAGE_SCALE);

/**
 * 重み付き平均を計算します。
 * @param input_vector 入力ベクトルです。
 * @param weights 重みベクトルです。
 * @returns 重み付き平均です。
 */
export const weightedMean = (input_vector: Vec, weights: Vec): number => {
  if (input_vector.length !== weights.length) {
    throw new Error("weightedMean では同じ長さのベクトルが必要です。");
  }
  let weighted_sum = 0;
  let weight_sum = 0;
  for (let index = 0; index < input_vector.length; index += 1) {
    weighted_sum += input_vector[index] * weights[index];
    weight_sum += weights[index];
  }
  return weighted_sum / assertNonZeroScalar(weight_sum, "weight_sum");
};

/**
 * ヒストグラムを計算します。
 * @param input_vector 入力ベクトルです。
 * @param num_bins ビン数です。
 * @returns ビン中心と頻度です。
 */
export const histogram = (input_vector: Vec, num_bins: number): { bins: Float64Array; counts: Float64Array } => {
  const min_value = vec.min(input_vector);
  const max_value = vec.max(input_vector);
  const bin_width = (max_value - min_value) / assertNonZeroScalar(num_bins, "num_bins");
  const bins = new Float64Array(num_bins);
  const counts = new Float64Array(num_bins);

  for (let index = 0; index < num_bins; index += 1) {
    bins[index] = min_value + (index + 0.5) * bin_width;
  }

  for (let index = 0; index < input_vector.length; index += 1) {
    let bin_index = Math.floor((input_vector[index] - min_value) / bin_width);
    if (bin_index >= num_bins) {
      bin_index = num_bins - 1;
    }
    if (bin_index < 0) {
      bin_index = 0;
    }
    counts[bin_index] += 1;
  }

  return { bins, counts };
};

//#endregion

//#region 多項式

/**
 * 多項式回帰係数を計算します。
 * @param vector_x 説明変数です。
 * @param vector_y 目的変数です。
 * @param degree 多項式次数です。
 * @returns 回帰係数です。
 */
export const polyreg = (vector_x: Vec, vector_y: Vec, degree: number): Float64Array => {
  if (vector_x.length !== vector_y.length) {
    throw new Error("polyreg では同じ長さのベクトルが必要です。");
  }
  const sample_count = vector_x.length;
  const coefficient_count = degree + 1;
  const design_matrix = mat.mat(sample_count, coefficient_count);

  for (let row_index = 0; row_index < sample_count; row_index += 1) {
    let current_power = 1;
    for (let column_index = 0; column_index < coefficient_count; column_index += 1) {
      design_matrix.data[row_index * coefficient_count + column_index] = current_power;
      current_power *= vector_x[row_index];
    }
  }

  const transposed_design = mat.transpose(design_matrix);
  const normal_matrix = mat.mul(transposed_design, design_matrix);
  const inverted_normal_matrix = mat.inv(normal_matrix);
  const right_hand_side = new Float64Array(coefficient_count);

  for (let column_index = 0; column_index < coefficient_count; column_index += 1) {
    let coefficient_sum = 0;
    for (let row_index = 0; row_index < sample_count; row_index += 1) {
      coefficient_sum += design_matrix.data[row_index * coefficient_count + column_index] * vector_y[row_index];
    }
    right_hand_side[column_index] = coefficient_sum;
  }

  const coefficients = new Float64Array(coefficient_count);
  for (let row_index = 0; row_index < coefficient_count; row_index += 1) {
    let coefficient_sum = 0;
    for (let column_index = 0; column_index < coefficient_count; column_index += 1) {
      coefficient_sum +=
        inverted_normal_matrix.data[row_index * coefficient_count + column_index] * right_hand_side[column_index];
    }
    coefficients[row_index] = coefficient_sum;
  }

  return coefficients;
};

/**
 * 多項式を評価します。
 * @param coefficients 係数列です。
 * @param value 評価点です。
 * @returns 評価結果です。
 */
export const polyval = (coefficients: Float64Array, value: number): number => {
  let result = 0;
  let current_power = 1;
  for (let index = 0; index < coefficients.length; index += 1) {
    result += coefficients[index] * current_power;
    current_power *= value;
  }
  return result;
};

//#endregion
