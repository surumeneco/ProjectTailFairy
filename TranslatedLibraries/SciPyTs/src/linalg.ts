/**
 * SciPy の `scipy.linalg` 相当関数を TypeScript へ翻訳した実装です。
 */

import { linalg as npLinalg, type Matrix } from "@project-tail-fairy/numpy-ts";

//#region 定数

const ZERO_TOLERANCE = 1e-12;
const PADE_THETA_13 = 5.4;
const PADE_13_COEFFICIENTS = [
  64764752532480000, 32382376266240000, 7771770303897600, 1187353796428800, 129060195264000, 10559470521600,
  670442572800, 33522128640, 1323241920, 40840800, 960960, 16380, 182, 1
];

//#endregion

//#region 公開関数

/**
 * LU 分解を計算します。
 * @param input_matrix 入力行列です。
 * @returns 分解結果です。
 */
export const lu = (input_matrix: Matrix): { L: Matrix; U: Matrix; P: number[]; parity: number } => {
  const size = input_matrix.rows;
  const upper = npLinalg.matClone(input_matrix);
  const lower = npLinalg.eye(size);
  const permutation = Array.from({ length: size }, (_, index) => index);
  let parity = 1;

  for (let pivot_index = 0; pivot_index < size; pivot_index += 1) {
    let max_value = 0;
    let max_index = pivot_index;
    for (let row_index = pivot_index; row_index < size; row_index += 1) {
      const candidate_value = Math.abs(upper.data[row_index * size + pivot_index]);
      if (candidate_value > max_value) {
        max_value = candidate_value;
        max_index = row_index;
      }
    }

    if (max_index !== pivot_index) {
      [permutation[pivot_index], permutation[max_index]] = [permutation[max_index], permutation[pivot_index]];
      parity *= -1;
      for (let column_index = 0; column_index < size; column_index += 1) {
        [upper.data[pivot_index * size + column_index], upper.data[max_index * size + column_index]] = [
          upper.data[max_index * size + column_index],
          upper.data[pivot_index * size + column_index]
        ];
      }
      for (let column_index = 0; column_index < pivot_index; column_index += 1) {
        [lower.data[pivot_index * size + column_index], lower.data[max_index * size + column_index]] = [
          lower.data[max_index * size + column_index],
          lower.data[pivot_index * size + column_index]
        ];
      }
    }

    const pivot_value = upper.data[pivot_index * size + pivot_index];
    if (Math.abs(pivot_value) <= ZERO_TOLERANCE) {
      continue;
    }

    for (let row_index = pivot_index + 1; row_index < size; row_index += 1) {
      const factor = upper.data[row_index * size + pivot_index] / pivot_value;
      lower.data[row_index * size + pivot_index] = factor;
      for (let column_index = pivot_index; column_index < size; column_index += 1) {
        upper.data[row_index * size + column_index] -= factor * upper.data[pivot_index * size + column_index];
      }
    }
  }

  return { L: lower, U: upper, P: permutation, parity };
};

/**
 * 行列指数関数を計算します。
 * @param input_matrix 入力行列です。
 * @returns 行列指数関数です。
 */
export const expm = (input_matrix: Matrix): Matrix => {
  const size = input_matrix.rows;
  const matrix_norm = npLinalg.norm(input_matrix);
  const scaling_exponent = Math.max(0, Math.ceil(Math.log2(matrix_norm / PADE_THETA_13)));
  const scaled_matrix = npLinalg.scale(input_matrix, Math.pow(2, -scaling_exponent));
  const matrix_square = npLinalg.mul(scaled_matrix, scaled_matrix);
  const matrix_quartic = npLinalg.mul(matrix_square, matrix_square);
  const matrix_sextic = npLinalg.mul(matrix_square, matrix_quartic);
  const identity_matrix = npLinalg.eye(size);

  const numerator_matrix = npLinalg.mul(
    scaled_matrix,
    npLinalg.add(
      npLinalg.add(
        npLinalg.mul(
          matrix_sextic,
          npLinalg.add(
            npLinalg.add(
              npLinalg.scale(matrix_sextic, PADE_13_COEFFICIENTS[13]),
              npLinalg.scale(matrix_quartic, PADE_13_COEFFICIENTS[11])
            ),
            npLinalg.scale(matrix_square, PADE_13_COEFFICIENTS[9])
          )
        ),
        npLinalg.scale(matrix_quartic, PADE_13_COEFFICIENTS[5])
      ),
      npLinalg.add(
        npLinalg.scale(matrix_square, PADE_13_COEFFICIENTS[3]),
        npLinalg.scale(identity_matrix, PADE_13_COEFFICIENTS[1])
      )
    )
  );

  const denominator_matrix = npLinalg.add(
    npLinalg.mul(
      matrix_sextic,
      npLinalg.add(
        npLinalg.add(
          npLinalg.scale(matrix_sextic, PADE_13_COEFFICIENTS[12]),
          npLinalg.scale(matrix_quartic, PADE_13_COEFFICIENTS[10])
        ),
        npLinalg.scale(matrix_square, PADE_13_COEFFICIENTS[8])
      )
    ),
    npLinalg.add(
      npLinalg.scale(matrix_quartic, PADE_13_COEFFICIENTS[4]),
      npLinalg.add(
        npLinalg.scale(matrix_square, PADE_13_COEFFICIENTS[2]),
        npLinalg.scale(identity_matrix, PADE_13_COEFFICIENTS[0])
      )
    )
  );

  let result_matrix = npLinalg.mul(
    npLinalg.inv(npLinalg.sub(denominator_matrix, numerator_matrix)),
    npLinalg.add(denominator_matrix, numerator_matrix)
  );

  for (let iteration = 0; iteration < scaling_exponent; iteration += 1) {
    result_matrix = npLinalg.mul(result_matrix, result_matrix);
  }

  return result_matrix;
};

//#endregion
