/**
 * NumPy の行列演算を TypeScript へ翻訳した実装です。
 */

//#region 型と定数

export type Matrix = { data: Float64Array; rows: number; cols: number };

const ZERO_TOLERANCE = 1e-12;
const DEFAULT_MAX_ITERATIONS = 100;

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
    console.error(`[NumPyTs/matrix] ${variable_name} が有限値ではありません。`, { value, variable_name });
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
  if (Math.abs(value) <= ZERO_TOLERANCE) {
    console.error(`[NumPyTs/matrix] ${variable_name} が 0 に近く、計算を継続できません。`, {
      value,
      variable_name
    });
    throw new Error(`${variable_name} が 0 に近く、計算を継続できません。`);
  }
  return value;
};

/**
 * 同一形状の行列であることを検証します。
 * @param matrix_a 左辺行列です。
 * @param matrix_b 右辺行列です。
 * @param context 呼び出し元の文脈です。
 * @returns 検証済みの行列サイズです。
 */
const assertSameShape = (matrix_a: Matrix, matrix_b: Matrix, context: string): { rows: number; cols: number } => {
  if (matrix_a.rows !== matrix_b.rows || matrix_a.cols !== matrix_b.cols) {
    throw new Error(`${context} では同じ形状の行列が必要です。`);
  }
  return { rows: matrix_a.rows, cols: matrix_a.cols };
};

/**
 * 正方行列であることを検証します。
 * @param input_matrix 対象行列です。
 * @param context 呼び出し元の文脈です。
 * @returns 検証済みの次数です。
 */
const assertSquareMatrix = (input_matrix: Matrix, context: string): number => {
  if (input_matrix.rows !== input_matrix.cols) {
    throw new Error(`${context} では正方行列が必要です。`);
  }
  return input_matrix.rows;
};

/**
 * 行列積が成立することを検証します。
 * @param matrix_a 左辺行列です。
 * @param matrix_b 右辺行列です。
 * @returns 計算結果の形状です。
 */
const assertMultiplicable = (matrix_a: Matrix, matrix_b: Matrix): { rows: number; cols: number; inner: number } => {
  if (matrix_a.cols !== matrix_b.rows) {
    throw new Error("mul では内側次元が一致する必要があります。");
  }
  return { rows: matrix_a.rows, cols: matrix_b.cols, inner: matrix_a.cols };
};

/**
 * LU 分解を行います。
 * @param input_matrix 対象行列です。
 * @returns 分解結果です。
 */
const luDecompose = (input_matrix: Matrix): { lower: Matrix; upper: Matrix; permutation: number[]; parity: number } => {
  const size = assertSquareMatrix(input_matrix, "luDecompose");
  const upper = matClone(input_matrix);
  const lower = eye(size);
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

  return { lower, upper, permutation, parity };
};

//#endregion

//#region 生成

/**
 * 行列を生成します。
 * @param rows 行数です。
 * @param cols 列数です。
 * @param data 初期データです。
 * @returns 生成した行列です。
 */
export const mat = (rows: number, cols: number, data?: number[] | Float64Array): Matrix => {
  const matrix_data =
    data instanceof Float64Array ? data : data ? new Float64Array(data) : new Float64Array(rows * cols);
  return { data: matrix_data, rows, cols };
};

/**
 * 二次元配列から行列を生成します。
 * @param input_array 入力配列です。
 * @returns 生成した行列です。
 */
export const matFromArr = (input_array: number[][]): Matrix => {
  const rows = input_array.length;
  const cols = input_array[0]?.length ?? 0;
  const matrix_data = new Float64Array(rows * cols);
  for (let row_index = 0; row_index < rows; row_index += 1) {
    if (input_array[row_index].length !== cols) {
      throw new Error("matFromArr では各行の列数が一致している必要があります。");
    }
    for (let column_index = 0; column_index < cols; column_index += 1) {
      matrix_data[row_index * cols + column_index] = input_array[row_index][column_index];
    }
  }
  return { data: matrix_data, rows, cols };
};

/**
 * 行列を二次元配列へ変換します。
 * @param input_matrix 入力行列です。
 * @returns 変換結果です。
 */
export const matToArr = (input_matrix: Matrix): number[][] => {
  const result: number[][] = [];
  for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
    const row: number[] = [];
    for (let column_index = 0; column_index < input_matrix.cols; column_index += 1) {
      row.push(input_matrix.data[row_index * input_matrix.cols + column_index]);
    }
    result.push(row);
  }
  return result;
};

/**
 * 行列要素を取得します。
 * @param input_matrix 入力行列です。
 * @param row_index 行添字です。
 * @param column_index 列添字です。
 * @returns 取得した値です。
 */
export const matGet = (input_matrix: Matrix, row_index: number, column_index: number): number =>
  input_matrix.data[row_index * input_matrix.cols + column_index];

/**
 * 行列要素を設定します。
 * @param input_matrix 入力行列です。
 * @param row_index 行添字です。
 * @param column_index 列添字です。
 * @param value 設定値です。
 * @returns 値は返しません。
 */
export const matSet = (input_matrix: Matrix, row_index: number, column_index: number, value: number): void => {
  input_matrix.data[row_index * input_matrix.cols + column_index] = value;
};

/**
 * 行列を複製します。
 * @param input_matrix 入力行列です。
 * @returns 複製した行列です。
 */
export const matClone = (input_matrix: Matrix): Matrix =>
  mat(input_matrix.rows, input_matrix.cols, new Float64Array(input_matrix.data));

/**
 * 0 行列を生成します。
 * @param rows 行数です。
 * @param cols 列数です。
 * @returns 生成した行列です。
 */
export const zeros = (rows: number, cols: number): Matrix => mat(rows, cols);

/**
 * 1 行列を生成します。
 * @param rows 行数です。
 * @param cols 列数です。
 * @returns 生成した行列です。
 */
export const ones = (rows: number, cols: number): Matrix => ({
  data: new Float64Array(rows * cols).fill(1),
  rows,
  cols
});

/**
 * 単位行列を生成します。
 * @param size 次数です。
 * @returns 単位行列です。
 */
export const eye = (size: number): Matrix => {
  const identity = mat(size, size);
  for (let index = 0; index < size; index += 1) {
    identity.data[index * size + index] = 1;
  }
  return identity;
};

/**
 * 対角行列を生成します。
 * @param values 対角成分です。
 * @returns 対角行列です。
 */
export const diag = (values: number[] | Float64Array): Matrix => {
  const size = values.length;
  const diagonal_matrix = mat(size, size);
  for (let index = 0; index < size; index += 1) {
    diagonal_matrix.data[index * size + index] = values[index];
  }
  return diagonal_matrix;
};

//#endregion

//#region 基本演算

/**
 * 転置行列を返します。
 * @param input_matrix 入力行列です。
 * @returns 転置行列です。
 */
export const transpose = (input_matrix: Matrix): Matrix => {
  const result = mat(input_matrix.cols, input_matrix.rows);
  for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
    for (let column_index = 0; column_index < input_matrix.cols; column_index += 1) {
      result.data[column_index * result.cols + row_index] =
        input_matrix.data[row_index * input_matrix.cols + column_index];
    }
  }
  return result;
};

/**
 * 行列同士を加算します。
 * @param matrix_a 左辺行列です。
 * @param matrix_b 右辺行列です。
 * @returns 加算結果です。
 */
export const add = (matrix_a: Matrix, matrix_b: Matrix): Matrix => {
  const { rows, cols } = assertSameShape(matrix_a, matrix_b, "add");
  const result = mat(rows, cols);
  for (let index = 0; index < matrix_a.data.length; index += 1) {
    result.data[index] = matrix_a.data[index] + matrix_b.data[index];
  }
  return result;
};

/**
 * 行列同士を減算します。
 * @param matrix_a 左辺行列です。
 * @param matrix_b 右辺行列です。
 * @returns 減算結果です。
 */
export const sub = (matrix_a: Matrix, matrix_b: Matrix): Matrix => {
  const { rows, cols } = assertSameShape(matrix_a, matrix_b, "sub");
  const result = mat(rows, cols);
  for (let index = 0; index < matrix_a.data.length; index += 1) {
    result.data[index] = matrix_a.data[index] - matrix_b.data[index];
  }
  return result;
};

/**
 * 行列をスカラー倍します。
 * @param input_matrix 入力行列です。
 * @param scalar スカラー値です。
 * @returns スカラー倍結果です。
 */
export const scale = (input_matrix: Matrix, scalar: number): Matrix => {
  const result = mat(input_matrix.rows, input_matrix.cols);
  const finite_scalar = assertFiniteScalar(scalar, "scalar");
  for (let index = 0; index < input_matrix.data.length; index += 1) {
    result.data[index] = input_matrix.data[index] * finite_scalar;
  }
  return result;
};

/**
 * 行列積を計算します。
 * @param matrix_a 左辺行列です。
 * @param matrix_b 右辺行列です。
 * @returns 行列積です。
 */
export const mul = (matrix_a: Matrix, matrix_b: Matrix): Matrix => {
  const { rows, cols, inner } = assertMultiplicable(matrix_a, matrix_b);
  const result = mat(rows, cols);
  for (let row_index = 0; row_index < rows; row_index += 1) {
    for (let inner_index = 0; inner_index < inner; inner_index += 1) {
      const left_value = matrix_a.data[row_index * inner + inner_index];
      const right_offset = inner_index * cols;
      for (let column_index = 0; column_index < cols; column_index += 1) {
        result.data[row_index * cols + column_index] += left_value * matrix_b.data[right_offset + column_index];
      }
    }
  }
  return result;
};

/**
 * 要素ごとの積を計算します。
 * @param matrix_a 左辺行列です。
 * @param matrix_b 右辺行列です。
 * @returns 要素積です。
 */
export const hadamard = (matrix_a: Matrix, matrix_b: Matrix): Matrix => {
  const { rows, cols } = assertSameShape(matrix_a, matrix_b, "hadamard");
  const result = mat(rows, cols);
  for (let index = 0; index < matrix_a.data.length; index += 1) {
    result.data[index] = matrix_a.data[index] * matrix_b.data[index];
  }
  return result;
};

/**
 * トレースを計算します。
 * @param input_matrix 入力行列です。
 * @returns トレースです。
 */
export const trace = (input_matrix: Matrix): number => {
  const size = Math.min(input_matrix.rows, input_matrix.cols);
  let total = 0;
  for (let index = 0; index < size; index += 1) {
    total += input_matrix.data[index * input_matrix.cols + index];
  }
  return total;
};

//#endregion

//#region 分解と線形方程式

/**
 * 行列式を計算します。
 * @param input_matrix 入力行列です。
 * @returns 行列式です。
 */
export const det = (input_matrix: Matrix): number => {
  const size = assertSquareMatrix(input_matrix, "det");
  const { upper, parity } = luDecompose(input_matrix);
  let determinant = parity;
  for (let index = 0; index < size; index += 1) {
    determinant *= upper.data[index * size + index];
  }
  return determinant;
};

/**
 * 線形方程式を解きます。
 * @param coefficient_matrix 係数行列です。
 * @param right_hand_side 右辺ベクトルです。
 * @returns 解ベクトルです。
 */
export const solve = (coefficient_matrix: Matrix, right_hand_side: number[] | Float64Array): Float64Array => {
  const size = assertSquareMatrix(coefficient_matrix, "solve");
  if (right_hand_side.length !== size) {
    throw new Error("solve では右辺ベクトル長が行列サイズと一致する必要があります。");
  }

  const { lower, upper, permutation } = luDecompose(coefficient_matrix);
  const permuted_rhs = new Float64Array(size);
  for (let row_index = 0; row_index < size; row_index += 1) {
    permuted_rhs[row_index] = right_hand_side[permutation[row_index]];
  }

  const forward_solution = new Float64Array(size);
  for (let row_index = 0; row_index < size; row_index += 1) {
    let value = permuted_rhs[row_index];
    for (let column_index = 0; column_index < row_index; column_index += 1) {
      value -= lower.data[row_index * size + column_index] * forward_solution[column_index];
    }
    forward_solution[row_index] = value;
  }

  const result = new Float64Array(size);
  for (let row_index = size - 1; row_index >= 0; row_index -= 1) {
    let value = forward_solution[row_index];
    for (let column_index = row_index + 1; column_index < size; column_index += 1) {
      value -= upper.data[row_index * size + column_index] * result[column_index];
    }
    const pivot_value = assertNonZeroScalar(
      upper.data[row_index * size + row_index],
      `upper_pivot[${String(row_index)}]`
    );
    result[row_index] = value / pivot_value;
  }

  return result;
};

/**
 * 逆行列を計算します。
 * @param input_matrix 入力行列です。
 * @returns 逆行列です。
 */
export const inv = (input_matrix: Matrix): Matrix => {
  const size = assertSquareMatrix(input_matrix, "inv");
  const result = mat(size, size);
  const basis_vector = new Float64Array(size);

  for (let column_index = 0; column_index < size; column_index += 1) {
    basis_vector.fill(0);
    basis_vector[column_index] = 1;
    const solved_column = solve(input_matrix, basis_vector);
    for (let row_index = 0; row_index < size; row_index += 1) {
      result.data[row_index * size + column_index] = solved_column[row_index];
    }
  }

  return result;
};

/**
 * Frobenius ノルムを計算します。
 * @param input_matrix 入力行列です。
 * @returns ノルムです。
 */
export const norm = (input_matrix: Matrix): number => {
  let squared_sum = 0;
  for (let index = 0; index < input_matrix.data.length; index += 1) {
    squared_sum += input_matrix.data[index] * input_matrix.data[index];
  }
  return Math.sqrt(squared_sum);
};

/**
 * Gram-Schmidt 法で QR 分解を行います。
 * @param input_matrix 入力行列です。
 * @returns QR 分解結果です。
 */
export const qr = (input_matrix: Matrix): { Q: Matrix; R: Matrix } => {
  const orthogonal_matrix = mat(input_matrix.rows, input_matrix.cols);
  const upper_matrix = mat(input_matrix.cols, input_matrix.cols);

  for (let column_index = 0; column_index < input_matrix.cols; column_index += 1) {
    const basis_vector = new Float64Array(input_matrix.rows);
    for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
      basis_vector[row_index] = input_matrix.data[row_index * input_matrix.cols + column_index];
    }

    for (let previous_index = 0; previous_index < column_index; previous_index += 1) {
      let projection = 0;
      for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
        projection +=
          orthogonal_matrix.data[row_index * input_matrix.cols + previous_index] *
          input_matrix.data[row_index * input_matrix.cols + column_index];
      }
      upper_matrix.data[previous_index * input_matrix.cols + column_index] = projection;
      for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
        basis_vector[row_index] -= projection * orthogonal_matrix.data[row_index * input_matrix.cols + previous_index];
      }
    }

    let column_norm = 0;
    for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
      column_norm += basis_vector[row_index] * basis_vector[row_index];
    }
    column_norm = Math.sqrt(column_norm);
    upper_matrix.data[column_index * input_matrix.cols + column_index] = column_norm;

    if (column_norm > ZERO_TOLERANCE) {
      for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
        orthogonal_matrix.data[row_index * input_matrix.cols + column_index] = basis_vector[row_index] / column_norm;
      }
    }
  }

  return { Q: orthogonal_matrix, R: upper_matrix };
};

/**
 * QR 法で固有値を近似します。
 * @param input_matrix 入力行列です。
 * @param max_iterations 最大反復回数です。
 * @returns 固有値近似です。
 */
export const eig = (input_matrix: Matrix, max_iterations = DEFAULT_MAX_ITERATIONS): Float64Array => {
  const size = assertSquareMatrix(input_matrix, "eig");
  let working_matrix = matClone(input_matrix);
  for (let iteration = 0; iteration < max_iterations; iteration += 1) {
    const { Q: orthogonal_matrix, R: upper_matrix } = qr(working_matrix);
    working_matrix = mul(upper_matrix, orthogonal_matrix);
  }
  const eigenvalues = new Float64Array(size);
  for (let index = 0; index < size; index += 1) {
    eigenvalues[index] = working_matrix.data[index * size + index];
  }
  return eigenvalues;
};

/**
 * Cholesky 分解を計算します。
 * @param input_matrix 入力行列です。
 * @returns 下三角行列です。
 */
export const cholesky = (input_matrix: Matrix): Matrix => {
  const size = assertSquareMatrix(input_matrix, "cholesky");
  const lower = mat(size, size);

  for (let row_index = 0; row_index < size; row_index += 1) {
    for (let column_index = 0; column_index <= row_index; column_index += 1) {
      let subtotal = 0;
      for (let inner_index = 0; inner_index < column_index; inner_index += 1) {
        subtotal += lower.data[row_index * size + inner_index] * lower.data[column_index * size + inner_index];
      }

      if (row_index === column_index) {
        const diagonal_term = input_matrix.data[row_index * size + row_index] - subtotal;
        if (diagonal_term <= ZERO_TOLERANCE) {
          console.error("[NumPyTs/matrix] diagonal_term が正でなく、Cholesky 分解できません。", {
            diagonal_term,
            row_index
          });
          throw new Error("diagonal_term が正でなく、Cholesky 分解できません。");
        }
        lower.data[row_index * size + column_index] = Math.sqrt(diagonal_term);
      } else {
        const pivot_value = assertNonZeroScalar(lower.data[column_index * size + column_index], "lower_pivot");
        lower.data[row_index * size + column_index] =
          (input_matrix.data[row_index * size + column_index] - subtotal) / pivot_value;
      }
    }
  }

  return lower;
};

//#endregion

//#region 集約

/**
 * 行ごとの総和を計算します。
 * @param input_matrix 入力行列です。
 * @returns 行ごとの総和です。
 */
export const sumRows = (input_matrix: Matrix): Float64Array => {
  const result = new Float64Array(input_matrix.rows);
  for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
    for (let column_index = 0; column_index < input_matrix.cols; column_index += 1) {
      result[row_index] += input_matrix.data[row_index * input_matrix.cols + column_index];
    }
  }
  return result;
};

/**
 * 列ごとの総和を計算します。
 * @param input_matrix 入力行列です。
 * @returns 列ごとの総和です。
 */
export const sumCols = (input_matrix: Matrix): Float64Array => {
  const result = new Float64Array(input_matrix.cols);
  for (let row_index = 0; row_index < input_matrix.rows; row_index += 1) {
    for (let column_index = 0; column_index < input_matrix.cols; column_index += 1) {
      result[column_index] += input_matrix.data[row_index * input_matrix.cols + column_index];
    }
  }
  return result;
};

/**
 * 行ごとの平均を計算します。
 * @param input_matrix 入力行列です。
 * @returns 行ごとの平均です。
 */
export const meanRows = (input_matrix: Matrix): Float64Array => {
  const result = sumRows(input_matrix);
  const divisor = assertNonZeroScalar(input_matrix.cols, "cols");
  for (let index = 0; index < result.length; index += 1) {
    result[index] /= divisor;
  }
  return result;
};

/**
 * 列ごとの平均を計算します。
 * @param input_matrix 入力行列です。
 * @returns 列ごとの平均です。
 */
export const meanCols = (input_matrix: Matrix): Float64Array => {
  const result = sumCols(input_matrix);
  const divisor = assertNonZeroScalar(input_matrix.rows, "rows");
  for (let index = 0; index < result.length; index += 1) {
    result[index] /= divisor;
  }
  return result;
};

//#endregion

//#region 特殊積

/**
 * 外積を計算します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 外積行列です。
 */
export const outer = (vector_a: number[] | Float64Array, vector_b: number[] | Float64Array): Matrix => {
  const result = mat(vector_a.length, vector_b.length);
  for (let row_index = 0; row_index < vector_a.length; row_index += 1) {
    for (let column_index = 0; column_index < vector_b.length; column_index += 1) {
      result.data[row_index * result.cols + column_index] = vector_a[row_index] * vector_b[column_index];
    }
  }
  return result;
};

/**
 * Kronecker 積を計算します。
 * @param matrix_a 左辺行列です。
 * @param matrix_b 右辺行列です。
 * @returns Kronecker 積です。
 */
export const kron = (matrix_a: Matrix, matrix_b: Matrix): Matrix => {
  const result = mat(matrix_a.rows * matrix_b.rows, matrix_a.cols * matrix_b.cols);
  for (let row_index = 0; row_index < matrix_a.rows; row_index += 1) {
    for (let column_index = 0; column_index < matrix_a.cols; column_index += 1) {
      const left_value = matrix_a.data[row_index * matrix_a.cols + column_index];
      for (let sub_row_index = 0; sub_row_index < matrix_b.rows; sub_row_index += 1) {
        for (let sub_column_index = 0; sub_column_index < matrix_b.cols; sub_column_index += 1) {
          result.data[
            (row_index * matrix_b.rows + sub_row_index) * result.cols + column_index * matrix_b.cols + sub_column_index
          ] = left_value * matrix_b.data[sub_row_index * matrix_b.cols + sub_column_index];
        }
      }
    }
  }
  return result;
};

//#endregion
