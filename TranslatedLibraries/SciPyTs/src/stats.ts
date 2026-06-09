/**
 * SciPy の `scipy.stats` 相当関数を TypeScript へ翻訳した実装です。
 */

import {
  linalg as npLinalg,
  type Matrix,
  mean,
  percentile,
  std,
  sum,
  variance,
  type Vec
} from "@project-tail-fairy/numpy-ts";

//#region 定数

const EXCESS_KURTOSIS_OFFSET = 3;
const SILVERMAN_COEFFICIENT = 1.06;
const BANDWIDTH_EXPONENT = -0.2;
const NORMALIZATION_FACTOR = Math.sqrt(2 * Math.PI);
const HALF = 0.5;
const ERF_A1 = 0.254829592;
const ERF_A2 = -0.284496736;
const ERF_A3 = 1.421413741;
const ERF_A4 = -1.453152027;
const ERF_A5 = 1.061405429;
const ERF_P = 0.3275911;

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
    console.error(`[SciPyTs/stats] ${variable_name} が有限値ではありません。`, { value, variable_name });
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
    console.error(`[SciPyTs/stats] ${variable_name} が 0 に近く、計算を継続できません。`, {
      value,
      variable_name
    });
    throw new Error(`${variable_name} が 0 に近く、計算を継続できません。`);
  }
  return value;
};

//#endregion

//#region 分布と要約

/**
 * 歪度を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 歪度です。
 */
export const skewness = (input_vector: Vec): number => {
  const mean_value = mean(input_vector);
  const sigma = assertNonZeroScalar(std(input_vector, 0), "sigma");
  let skew_sum = 0;
  for (let index = 0; index < input_vector.length; index += 1) {
    skew_sum += Math.pow((input_vector[index] - mean_value) / sigma, 3);
  }
  return skew_sum / input_vector.length;
};

/**
 * `skewness` の別名です。
 * @param input_vector 入力ベクトルです。
 * @returns 歪度です。
 */
export const skew = (input_vector: Vec): number => skewness(input_vector);

/**
 * 尖度を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 尖度です。
 */
export const kurtosis = (input_vector: Vec): number => {
  const mean_value = mean(input_vector);
  const sigma = assertNonZeroScalar(std(input_vector, 0), "sigma");
  let kurtosis_sum = 0;
  for (let index = 0; index < input_vector.length; index += 1) {
    kurtosis_sum += Math.pow((input_vector[index] - mean_value) / sigma, 4);
  }
  return kurtosis_sum / input_vector.length - EXCESS_KURTOSIS_OFFSET;
};

/**
 * 四分位範囲を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 四分位範囲です。
 */
export const iqr = (input_vector: Vec): number => percentile(input_vector, 75) - percentile(input_vector, 25);

/**
 * 最頻値を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 最頻値です。
 */
export const mode = (input_vector: Vec): number => {
  const counts = new Map<number, number>();
  let max_count = 0;
  let mode_value = input_vector[0];
  for (let index = 0; index < input_vector.length; index += 1) {
    const next_count = (counts.get(input_vector[index]) ?? 0) + 1;
    counts.set(input_vector[index], next_count);
    if (next_count > max_count) {
      max_count = next_count;
      mode_value = input_vector[index];
    }
  }
  return mode_value;
};

/**
 * 独立 2 標本 t 検定を計算します。
 * @param vector_a 第 1 標本です。
 * @param vector_b 第 2 標本です。
 * @returns 検定統計量と p 値です。
 */
export const ttest = (vector_a: Vec, vector_b: Vec): { t: number; p_value: number } => {
  const sample_count_a = vector_a.length;
  const sample_count_b = vector_b.length;
  const mean_a = mean(vector_a);
  const mean_b = mean(vector_b);
  const variance_a = variance(vector_a, 1);
  const variance_b = variance(vector_b, 1);
  const pooled_std = Math.sqrt(
    ((sample_count_a - 1) * variance_a + (sample_count_b - 1) * variance_b) / (sample_count_a + sample_count_b - 2)
  );
  const safe_pooled_std = assertNonZeroScalar(pooled_std, "pooled_std");
  const t = (mean_a - mean_b) / (safe_pooled_std * Math.sqrt(1 / sample_count_a + 1 / sample_count_b));
  const p_value = 2 * (1 - normalCdf(Math.abs(t)));
  return { t, p_value };
};

/**
 * 標準正規分布の累積分布関数を近似します。
 * @param value 入力値です。
 * @returns 累積分布値です。
 */
export const normalCdf = (value: number): number => {
  const sign = value < 0 ? -1 : 1;
  const scaled_value = Math.abs(value) / Math.SQRT2;
  const approximation = 1 / (1 + ERF_P * scaled_value);
  const error_function =
    1 -
    ((((ERF_A5 * approximation + ERF_A4) * approximation + ERF_A3) * approximation + ERF_A2) * approximation + ERF_A1) *
      approximation *
      Math.exp(-scaled_value * scaled_value);
  return HALF * (1 + sign * error_function);
};

/**
 * 正規分布の確率密度関数を計算します。
 * @param value 入力値です。
 * @param mu 平均値です。
 * @param sigma 標準偏差です。
 * @returns 確率密度です。
 */
export const normalPdf = (value: number, mu = 0, sigma = 1): number => {
  const safe_sigma = assertNonZeroScalar(sigma, "sigma");
  const z_score = (value - mu) / safe_sigma;
  return Math.exp(-HALF * z_score * z_score) / (safe_sigma * NORMALIZATION_FACTOR);
};

/**
 * 正規分布 API のまとめです。
 */
export const norm = {
  cdf: normalCdf,
  pdf: normalPdf
};

/**
 * カーネル密度推定を計算します。
 * @param input_vector 標本ベクトルです。
 * @param evaluation_points 評価点ベクトルです。
 * @param bandwidth バンド幅です。
 * @returns 推定密度です。
 */
export const kde = (input_vector: Vec, evaluation_points: Vec, bandwidth?: number): Vec => {
  const sample_count = input_vector.length;
  const effective_bandwidth =
    bandwidth ?? SILVERMAN_COEFFICIENT * std(input_vector) * Math.pow(sample_count, BANDWIDTH_EXPONENT);
  const safe_bandwidth = assertNonZeroScalar(effective_bandwidth, "bandwidth");
  const coefficient = 1 / (sample_count * safe_bandwidth * NORMALIZATION_FACTOR);
  const result = new Float64Array(evaluation_points.length);

  for (let point_index = 0; point_index < evaluation_points.length; point_index += 1) {
    let density_sum = 0;
    for (let sample_index = 0; sample_index < sample_count; sample_index += 1) {
      const normalized_distance = (evaluation_points[point_index] - input_vector[sample_index]) / safe_bandwidth;
      density_sum += Math.exp(-HALF * normalized_distance * normalized_distance);
    }
    result[point_index] = density_sum * coefficient;
  }

  return result;
};

//#endregion

//#region 回帰と標準化

/**
 * 線形回帰を計算します。
 * @param vector_x 説明変数です。
 * @param vector_y 目的変数です。
 * @returns 回帰係数と決定係数です。
 */
export const linreg = (vector_x: Vec, vector_y: Vec): { slope: number; intercept: number; r2: number } => {
  const mean_x = mean(vector_x);
  const mean_y = mean(vector_y);
  let covariance_sum = 0;
  let variance_x_sum = 0;
  let variance_y_sum = 0;

  for (let index = 0; index < vector_x.length; index += 1) {
    const delta_x = vector_x[index] - mean_x;
    const delta_y = vector_y[index] - mean_y;
    covariance_sum += delta_x * delta_y;
    variance_x_sum += delta_x * delta_x;
    variance_y_sum += delta_y * delta_y;
  }

  const slope = covariance_sum / assertNonZeroScalar(variance_x_sum, "variance_x_sum");
  const intercept = mean_y - slope * mean_x;
  const r2 = (covariance_sum * covariance_sum) / assertNonZeroScalar(variance_x_sum * variance_y_sum, "r2_denominator");
  return { slope, intercept, r2 };
};

/**
 * z-score を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns z-score ベクトルです。
 */
export const zscore = (input_vector: Vec): Vec => {
  const mean_value = mean(input_vector);
  const sigma = assertNonZeroScalar(std(input_vector), "sigma");
  const result = new Float64Array(input_vector.length);
  for (let index = 0; index < input_vector.length; index += 1) {
    result[index] = (input_vector[index] - mean_value) / sigma;
  }
  return result;
};

//#endregion

//#region 検定

/**
 * カイ二乗検定量を計算します。
 * @param observed 観測度数表です。
 * @returns 検定統計量と p 値です。
 */
export const chiSquared = (observed: Matrix): { stat: number; p_value: number } => {
  const row_sums = npLinalg.sumRows(observed);
  const col_sums = npLinalg.sumCols(observed);
  const total = sum(row_sums);
  let chi_squared = 0;

  for (let row_index = 0; row_index < observed.rows; row_index += 1) {
    for (let column_index = 0; column_index < observed.cols; column_index += 1) {
      const expected = (row_sums[row_index] * col_sums[column_index]) / total;
      const safe_expected = assertNonZeroScalar(expected, `expected[${String(row_index)},${String(column_index)}]`);
      const actual = observed.data[row_index * observed.cols + column_index];
      chi_squared += ((actual - safe_expected) * (actual - safe_expected)) / safe_expected;
    }
  }

  const degrees_of_freedom = assertNonZeroScalar((observed.rows - 1) * (observed.cols - 1), "degrees_of_freedom");
  const z_value = Math.pow(chi_squared / degrees_of_freedom, 1 / 3) - (1 - 2 / (9 * degrees_of_freedom));
  const p_value = 1 - normalCdf(z_value / Math.sqrt(2 / (9 * degrees_of_freedom)));
  return { stat: chi_squared, p_value };
};

//#endregion

//#region 互換エイリアス

export { chiSquared as chi2_contingency, kde as gaussian_kde, linreg as linregress, ttest as ttest_ind };

//#endregion
