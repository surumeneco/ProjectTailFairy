import type { Matrix } from "@project-tail-fairy/numpy-ts";

//#region 定数

const DEFAULT_MAX_ITERATIONS = 100;
const DEFAULT_TOLERANCE = 1e-10;
const ZERO_NORM_TOLERANCE = 1e-12;

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
    console.error(`[LinAlgHelpers] ${variable_name} が有限値ではありません。`, { value, variable_name });
    throw new Error(`${variable_name} が有限値ではありません。`);
  }
  return value;
};

//#endregion

//#region 固有値近似

/**
 * べき乗法で最大固有値と固有ベクトルを近似します。
 * @param matrix 対象行列です。
 * @param max_iterations 最大反復回数です。
 * @param tolerance 収束判定の許容誤差です。
 * @returns 近似した固有値と固有ベクトルです。
 */
export const powerIteration = (
  matrix: Matrix,
  max_iterations = DEFAULT_MAX_ITERATIONS,
  tolerance = DEFAULT_TOLERANCE
): { eigenvalue: number; eigenvector: Float64Array } => {
  const dimension = matrix.rows;
  let eigenvector = new Float64Array(dimension).fill(1 / Math.sqrt(dimension));
  let eigenvalue = 0;

  for (let iteration = 0; iteration < max_iterations; iteration += 1) {
    const matrix_vector_product = new Float64Array(dimension);
    for (let row_index = 0; row_index < dimension; row_index += 1) {
      for (let column_index = 0; column_index < dimension; column_index += 1) {
        matrix_vector_product[row_index] +=
          matrix.data[row_index * dimension + column_index] * eigenvector[column_index];
      }
    }

    let next_eigenvalue = 0;
    for (let row_index = 0; row_index < dimension; row_index += 1) {
      next_eigenvalue += matrix_vector_product[row_index] * matrix_vector_product[row_index];
    }
    next_eigenvalue = assertFiniteScalar(Math.sqrt(next_eigenvalue), "next_eigenvalue");

    if (next_eigenvalue <= ZERO_NORM_TOLERANCE) {
      console.error("[LinAlgHelpers] next_eigenvalue が 0 に近く、正規化できません。", {
        next_eigenvalue
      });
      throw new Error("next_eigenvalue が 0 に近く、正規化できません。");
    }

    for (let row_index = 0; row_index < dimension; row_index += 1) {
      matrix_vector_product[row_index] /= next_eigenvalue;
    }

    if (Math.abs(next_eigenvalue - eigenvalue) < tolerance) {
      return { eigenvalue: next_eigenvalue, eigenvector: matrix_vector_product };
    }

    eigenvector = matrix_vector_product;
    eigenvalue = next_eigenvalue;
  }

  return { eigenvalue, eigenvector };
};

//#endregion
