/**
 * NumPy の多次元配列演算を TypeScript へ翻訳した実装です。
 */

//#region 型と定数

export type NDArray = { data: Float64Array; shape: number[] };

const ZERO_TOLERANCE = 1e-12;

//#endregion

//#region 内部ヘルパー

/**
 * 形状から総要素数を計算します。
 * @param shape 配列形状です。
 * @returns 総要素数です。
 */
const calculateSize = (shape: number[]): number => {
  let size = 1;
  for (const dimension of shape) {
    size *= dimension;
  }
  return size;
};

/**
 * スカラー値が有限かを検証します。
 * @param value 検証対象の値です。
 * @param variable_name 変数名です。
 * @returns 検証済みの値です。
 */
const assertFiniteScalar = (value: number, variable_name: string): number => {
  if (!Number.isFinite(value)) {
    console.error(`[NumPyTs/array] ${variable_name} が有限値ではありません。`, { value, variable_name });
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
    console.error(`[NumPyTs/array] ${variable_name} が 0 に近く、計算を継続できません。`, {
      value,
      variable_name
    });
    throw new Error(`${variable_name} が 0 に近く、計算を継続できません。`);
  }
  return value;
};

/**
 * 形状が一致することを検証します。
 * @param array_a 左辺配列です。
 * @param array_b 右辺配列です。
 * @param context 呼び出し元の文脈です。
 * @returns 検証済みの形状です。
 */
const assertSameShape = (array_a: NDArray, array_b: NDArray, context: string): number[] => {
  if (array_a.shape.length !== array_b.shape.length) {
    throw new Error(`${context} では同じ形状の配列が必要です。`);
  }
  for (let axis_index = 0; axis_index < array_a.shape.length; axis_index += 1) {
    if (array_a.shape[axis_index] !== array_b.shape[axis_index]) {
      throw new Error(`${context} では同じ形状の配列が必要です。`);
    }
  }
  return [...array_a.shape];
};

/**
 * 軸番号を検証します。
 * @param shape 配列形状です。
 * @param axis 軸番号です。
 * @param context 呼び出し元の文脈です。
 * @returns 検証済みの軸番号です。
 */
const assertAxis = (shape: number[], axis: number, context: string): number => {
  if (axis < 0 || axis >= shape.length) {
    throw new Error(`${context} では有効な axis が必要です。`);
  }
  return axis;
};

/**
 * 行優先レイアウトのストライドを返します。
 * @param shape 配列形状です。
 * @returns ストライド配列です。
 */
const getStrides = (shape: number[]): number[] => {
  const strides = new Array<number>(shape.length);
  let stride = 1;
  for (let axis_index = shape.length - 1; axis_index >= 0; axis_index -= 1) {
    strides[axis_index] = stride;
    stride *= shape[axis_index];
  }
  return strides;
};

/**
 * 多次元添字を一次元添字へ変換します。
 * @param indices 多次元添字です。
 * @param strides ストライド配列です。
 * @returns 一次元添字です。
 */
const toFlat = (indices: number[], strides: number[]): number => {
  let flat_index = 0;
  for (let axis_index = 0; axis_index < indices.length; axis_index += 1) {
    flat_index += indices[axis_index] * strides[axis_index];
  }
  return flat_index;
};

/**
 * 一次元添字を多次元添字へ変換します。
 * @param flat_index 一次元添字です。
 * @param shape 配列形状です。
 * @returns 多次元添字です。
 */
const fromFlat = (flat_index: number, shape: number[]): number[] => {
  const indices = new Array<number>(shape.length);
  for (let axis_index = 0; axis_index < shape.length; axis_index += 1) {
    let inner_product = 1;
    for (let inner_index = axis_index + 1; inner_index < shape.length; inner_index += 1) {
      inner_product *= shape[inner_index];
    }
    indices[axis_index] = Math.floor(flat_index / inner_product) % shape[axis_index];
  }
  return indices;
};

/**
 * 単項演算を各要素へ適用します。
 * @param input_array 入力配列です。
 * @param transform_value 要素変換関数です。
 * @returns 変換後の配列です。
 */
const mapElements = (input_array: NDArray, transform_value: (value: number, index: number) => number): NDArray => {
  const result = new Float64Array(input_array.data.length);
  for (let index = 0; index < input_array.data.length; index += 1) {
    result[index] = transform_value(input_array.data[index], index);
  }
  return { data: result, shape: [...input_array.shape] };
};

/**
 * 二項演算を各要素へ適用します。
 * @param array_a 左辺配列です。
 * @param array_b 右辺配列です。
 * @param transform_value 要素変換関数です。
 * @param context 呼び出し元の文脈です。
 * @returns 変換後の配列です。
 */
const zipElements = (
  array_a: NDArray,
  array_b: NDArray,
  transform_value: (value_a: number, value_b: number, index: number) => number,
  context: string
): NDArray => {
  const shape = assertSameShape(array_a, array_b, context);
  const result = new Float64Array(array_a.data.length);
  for (let index = 0; index < array_a.data.length; index += 1) {
    result[index] = transform_value(array_a.data[index], array_b.data[index], index);
  }
  return { data: result, shape };
};

/**
 * 軸方向に集約します。
 * @param input_array 入力配列です。
 * @param axis 集約軸です。
 * @param initial_value 初期値です。
 * @param reduce_value 集約関数です。
 * @returns 集約結果です。
 */
const reduceAlongAxis = (
  input_array: NDArray,
  axis: number,
  initial_value: number,
  reduce_value: (accumulator: number, value: number) => number
): NDArray | number => {
  const safe_axis = assertAxis(input_array.shape, axis, "reduceAlongAxis");
  const reduced_shape = input_array.shape.filter((_, axis_index) => axis_index !== safe_axis);

  if (reduced_shape.length === 0) {
    let accumulator = initial_value;
    for (let index = 0; index < input_array.data.length; index += 1) {
      accumulator = reduce_value(accumulator, input_array.data[index]);
    }
    return accumulator;
  }

  const reduced_data = new Float64Array(calculateSize(reduced_shape)).fill(initial_value);
  const reduced_strides = getStrides(reduced_shape);

  for (let flat_index = 0; flat_index < input_array.data.length; flat_index += 1) {
    const source_indices = fromFlat(flat_index, input_array.shape);
    const reduced_indices = source_indices.filter((_, axis_index) => axis_index !== safe_axis);
    const reduced_flat_index = toFlat(reduced_indices, reduced_strides);
    reduced_data[reduced_flat_index] = reduce_value(reduced_data[reduced_flat_index], input_array.data[flat_index]);
  }

  return { data: reduced_data, shape: reduced_shape };
};

//#endregion

//#region 配列生成

/**
 * 多次元配列を生成します。
 * @param shape 配列形状です。
 * @param data 初期データです。
 * @returns 生成した配列です。
 */
export const ndarray = (shape: number[], data?: number[] | Float64Array): NDArray => {
  const size = calculateSize(shape);
  const array_data = data instanceof Float64Array ? data : data ? new Float64Array(data) : new Float64Array(size);
  if (array_data.length !== size) {
    throw new Error("ndarray では shape と data の要素数が一致する必要があります。");
  }
  return { data: array_data, shape: [...shape] };
};

/**
 * 0 配列を生成します。
 * @param shape 配列形状です。
 * @returns 生成した配列です。
 */
export const zeros = (shape: number[]): NDArray => ndarray(shape);

/**
 * 1 配列を生成します。
 * @param shape 配列形状です。
 * @returns 生成した配列です。
 */
export const ones = (shape: number[]): NDArray => {
  const result = ndarray(shape);
  result.data.fill(1);
  return result;
};

/**
 * 指定値で埋めた配列を生成します。
 * @param shape 配列形状です。
 * @param value 埋める値です。
 * @returns 生成した配列です。
 */
export const full = (shape: number[], value: number): NDArray => {
  const result = ndarray(shape);
  result.data.fill(value);
  return result;
};

/**
 * 等差数列配列を生成します。
 * @param start 開始値です。
 * @param end 終了値です。
 * @param step 刻み幅です。
 * @returns 生成した配列です。
 */
export const arange = (start: number, end: number, step = 1): NDArray => {
  assertNonZeroScalar(step, "step");
  const size = Math.max(0, Math.ceil((end - start) / step));
  const data = new Float64Array(size);
  for (let index = 0; index < size; index += 1) {
    data[index] = start + index * step;
  }
  return { data, shape: [size] };
};

/**
 * 線形補間配列を生成します。
 * @param start 開始値です。
 * @param end 終了値です。
 * @param length 要素数です。
 * @returns 生成した配列です。
 */
export const linspace = (start: number, end: number, length: number): NDArray => {
  if (length <= 0) {
    return { data: new Float64Array(0), shape: [0] };
  }
  if (length === 1) {
    return { data: new Float64Array([start]), shape: [1] };
  }
  const step = (end - start) / (length - 1);
  const data = new Float64Array(length);
  for (let index = 0; index < length; index += 1) {
    data[index] = start + index * step;
  }
  return { data, shape: [length] };
};

/**
 * 単位行列を生成します。
 * @param size 次数です。
 * @returns 単位行列です。
 */
export const eye = (size: number): NDArray => {
  const data = new Float64Array(size * size);
  for (let index = 0; index < size; index += 1) {
    data[index * size + index] = 1;
  }
  return { data, shape: [size, size] };
};

/**
 * 対角行列を生成します。
 * @param values 対角要素です。
 * @returns 対角行列です。
 */
export const diag = (values: Float64Array | number[]): NDArray => {
  const size = values.length;
  const data = new Float64Array(size * size);
  for (let index = 0; index < size; index += 1) {
    data[index * size + index] = values[index];
  }
  return { data, shape: [size, size] };
};

//#endregion

//#region 添字操作

/**
 * 要素を取得します。
 * @param input_array 入力配列です。
 * @param indices 多次元添字です。
 * @returns 取得した値です。
 */
export const get = (input_array: NDArray, ...indices: number[]): number =>
  input_array.data[toFlat(indices, getStrides(input_array.shape))];

/**
 * 要素を設定します。
 * @param input_array 入力配列です。
 * @param value 設定値です。
 * @param indices 多次元添字です。
 * @returns 値は返しません。
 */
export const set = (input_array: NDArray, value: number, ...indices: number[]): void => {
  input_array.data[toFlat(indices, getStrides(input_array.shape))] = value;
};

/**
 * 形状を変更します。
 * @param input_array 入力配列です。
 * @param new_shape 新しい形状です。
 * @returns 形状変更後の配列です。
 */
export const reshape = (input_array: NDArray, new_shape: number[]): NDArray => {
  if (calculateSize(new_shape) !== input_array.data.length) {
    throw new Error("reshape では要素数が一致する必要があります。");
  }
  return { data: input_array.data, shape: [...new_shape] };
};

/**
 * 配列を 1 次元へ平坦化します。
 * @param input_array 入力配列です。
 * @returns 平坦化後の配列です。
 */
export const flatten = (input_array: NDArray): NDArray => ({
  data: input_array.data,
  shape: [input_array.data.length]
});

/**
 * 2 次元配列を転置します。
 * @param input_array 入力配列です。
 * @returns 転置結果です。
 */
export const transpose = (input_array: NDArray): NDArray => {
  if (input_array.shape.length !== 2) {
    throw new Error("transpose では 2 次元配列が必要です。");
  }
  const [rows, cols] = input_array.shape;
  const data = new Float64Array(rows * cols);
  for (let row_index = 0; row_index < rows; row_index += 1) {
    for (let column_index = 0; column_index < cols; column_index += 1) {
      data[column_index * rows + row_index] = input_array.data[row_index * cols + column_index];
    }
  }
  return { data, shape: [cols, rows] };
};

/**
 * 2 軸を交換します。
 * @param input_array 入力配列です。
 * @param axis_a 第 1 軸です。
 * @param axis_b 第 2 軸です。
 * @returns 軸交換後の配列です。
 */
export const swapaxes = (input_array: NDArray, axis_a: number, axis_b: number): NDArray => {
  const safe_axis_a = assertAxis(input_array.shape, axis_a, "swapaxes");
  const safe_axis_b = assertAxis(input_array.shape, axis_b, "swapaxes");
  const new_shape = [...input_array.shape];
  [new_shape[safe_axis_a], new_shape[safe_axis_b]] = [new_shape[safe_axis_b], new_shape[safe_axis_a]];
  const data = new Float64Array(calculateSize(new_shape));
  const new_strides = getStrides(new_shape);

  for (let flat_index = 0; flat_index < input_array.data.length; flat_index += 1) {
    const swapped_indices = fromFlat(flat_index, input_array.shape);
    [swapped_indices[safe_axis_a], swapped_indices[safe_axis_b]] = [
      swapped_indices[safe_axis_b],
      swapped_indices[safe_axis_a]
    ];
    data[toFlat(swapped_indices, new_strides)] = input_array.data[flat_index];
  }

  return { data, shape: new_shape };
};

//#endregion

//#region 要素演算

/**
 * 要素ごとに加算します。
 * @param array_a 左辺配列です。
 * @param array_b 右辺配列です。
 * @returns 加算結果です。
 */
export const add = (array_a: NDArray, array_b: NDArray): NDArray =>
  zipElements(array_a, array_b, (value_a, value_b) => value_a + value_b, "add");

/**
 * 要素ごとに減算します。
 * @param array_a 左辺配列です。
 * @param array_b 右辺配列です。
 * @returns 減算結果です。
 */
export const sub = (array_a: NDArray, array_b: NDArray): NDArray =>
  zipElements(array_a, array_b, (value_a, value_b) => value_a - value_b, "sub");

/**
 * 要素ごとに乗算します。
 * @param array_a 左辺配列です。
 * @param array_b 右辺配列です。
 * @returns 乗算結果です。
 */
export const mul = (array_a: NDArray, array_b: NDArray): NDArray =>
  zipElements(array_a, array_b, (value_a, value_b) => value_a * value_b, "mul");

/**
 * 要素ごとに除算します。
 * @param array_a 左辺配列です。
 * @param array_b 右辺配列です。
 * @returns 除算結果です。
 */
export const div = (array_a: NDArray, array_b: NDArray): NDArray =>
  zipElements(
    array_a,
    array_b,
    (value_a, value_b, index) => value_a / assertNonZeroScalar(value_b, `array_b[${String(index)}]`),
    "div"
  );

/**
 * スカラー倍します。
 * @param input_array 入力配列です。
 * @param scalar スカラー値です。
 * @returns スカラー倍結果です。
 */
export const scale = (input_array: NDArray, scalar: number): NDArray =>
  mapElements(input_array, value => value * assertFiniteScalar(scalar, "scalar"));

/**
 * スカラーを加算します。
 * @param input_array 入力配列です。
 * @param scalar スカラー値です。
 * @returns 加算結果です。
 */
export const addScalar = (input_array: NDArray, scalar: number): NDArray =>
  mapElements(input_array, value => value + assertFiniteScalar(scalar, "scalar"));

/**
 * 冪乗を計算します。
 * @param input_array 入力配列です。
 * @param power 指数です。
 * @returns 冪乗結果です。
 */
export const pow = (input_array: NDArray, power: number): NDArray =>
  mapElements(input_array, value => Math.pow(value, assertFiniteScalar(power, "power")));

/**
 * 平方根を計算します。
 * @param input_array 入力配列です。
 * @returns 平方根結果です。
 */
export const sqrt = (input_array: NDArray): NDArray =>
  mapElements(input_array, (value, index) => Math.sqrt(assertFiniteScalar(value, `input_array[${String(index)}]`)));

/**
 * 指数関数を計算します。
 * @param input_array 入力配列です。
 * @returns 指数関数結果です。
 */
export const exp = (input_array: NDArray): NDArray => mapElements(input_array, value => Math.exp(value));

/**
 * 自然対数を計算します。
 * @param input_array 入力配列です。
 * @returns 自然対数結果です。
 */
export const log = (input_array: NDArray): NDArray =>
  mapElements(input_array, (value, index) => assertFiniteScalar(Math.log(value), `log(input_array[${String(index)}])`));

/**
 * 絶対値を計算します。
 * @param input_array 入力配列です。
 * @returns 絶対値結果です。
 */
export const abs = (input_array: NDArray): NDArray => mapElements(input_array, value => Math.abs(value));

/**
 * 正弦を計算します。
 * @param input_array 入力配列です。
 * @returns 正弦結果です。
 */
export const sin = (input_array: NDArray): NDArray => mapElements(input_array, value => Math.sin(value));

/**
 * 余弦を計算します。
 * @param input_array 入力配列です。
 * @returns 余弦結果です。
 */
export const cos = (input_array: NDArray): NDArray => mapElements(input_array, value => Math.cos(value));

/**
 * 双曲線正接を計算します。
 * @param input_array 入力配列です。
 * @returns 双曲線正接結果です。
 */
export const tanh = (input_array: NDArray): NDArray => mapElements(input_array, value => Math.tanh(value));

//#endregion

//#region 集約

/**
 * 総和を計算します。
 * @param input_array 入力配列です。
 * @param axis 集約軸です。
 * @returns 総和です。
 */
export const sum = (input_array: NDArray, axis?: number): NDArray | number => {
  if (axis === undefined) {
    let total = 0;
    for (let index = 0; index < input_array.data.length; index += 1) {
      total += input_array.data[index];
    }
    return total;
  }
  return reduceAlongAxis(input_array, axis, 0, (accumulator, value) => accumulator + value);
};

/**
 * 平均値を計算します。
 * @param input_array 入力配列です。
 * @param axis 集約軸です。
 * @returns 平均値です。
 */
export const mean = (input_array: NDArray, axis?: number): NDArray | number => {
  if (axis === undefined) {
    let total = 0;
    for (let index = 0; index < input_array.data.length; index += 1) {
      total += input_array.data[index];
    }
    return total / assertNonZeroScalar(input_array.data.length, "length");
  }
  const safe_axis = assertAxis(input_array.shape, axis, "mean");
  const summed = sum(input_array, safe_axis);
  const divisor = assertNonZeroScalar(input_array.shape[safe_axis], "axis_size");
  if (typeof summed === "number") {
    return summed / divisor;
  }
  return mapElements(summed, value => value / divisor);
};

/**
 * 最大値を計算します。
 * @param input_array 入力配列です。
 * @param axis 集約軸です。
 * @returns 最大値です。
 */
export const max = (input_array: NDArray, axis?: number): NDArray | number => {
  if (axis === undefined) {
    let current_value = input_array.data[0];
    for (let index = 1; index < input_array.data.length; index += 1) {
      if (input_array.data[index] > current_value) {
        current_value = input_array.data[index];
      }
    }
    return current_value;
  }
  return reduceAlongAxis(input_array, axis, -Infinity, (accumulator, value) =>
    value > accumulator ? value : accumulator
  );
};

/**
 * 最小値を計算します。
 * @param input_array 入力配列です。
 * @param axis 集約軸です。
 * @returns 最小値です。
 */
export const min = (input_array: NDArray, axis?: number): NDArray | number => {
  if (axis === undefined) {
    let current_value = input_array.data[0];
    for (let index = 1; index < input_array.data.length; index += 1) {
      if (input_array.data[index] < current_value) {
        current_value = input_array.data[index];
      }
    }
    return current_value;
  }
  return reduceAlongAxis(input_array, axis, Infinity, (accumulator, value) =>
    value < accumulator ? value : accumulator
  );
};

/**
 * 最大値の一次元添字を返します。
 * @param input_array 入力配列です。
 * @returns 最大値の添字です。
 */
export const argmax = (input_array: NDArray): number => {
  let current_index = 0;
  for (let index = 1; index < input_array.data.length; index += 1) {
    if (input_array.data[index] > input_array.data[current_index]) {
      current_index = index;
    }
  }
  return current_index;
};

/**
 * 最小値の一次元添字を返します。
 * @param input_array 入力配列です。
 * @returns 最小値の添字です。
 */
export const argmin = (input_array: NDArray): number => {
  let current_index = 0;
  for (let index = 1; index < input_array.data.length; index += 1) {
    if (input_array.data[index] < input_array.data[current_index]) {
      current_index = index;
    }
  }
  return current_index;
};

//#endregion

//#region 結合と分割

/**
 * 指定軸で連結します。
 * @param arrays 連結対象の配列群です。
 * @param axis 連結軸です。
 * @returns 連結結果です。
 */
export const concatenate = (arrays: NDArray[], axis = 0): NDArray => {
  if (arrays.length === 0) {
    throw new Error("concatenate では 1 つ以上の配列が必要です。");
  }
  const safe_axis = assertAxis(arrays[0].shape, axis, "concatenate");
  const base_shape = [...arrays[0].shape];
  const new_shape = [...base_shape];
  new_shape[safe_axis] = 0;

  for (const current_array of arrays) {
    if (current_array.shape.length !== base_shape.length) {
      throw new Error("concatenate では階数が一致する必要があります。");
    }
    for (let axis_index = 0; axis_index < base_shape.length; axis_index += 1) {
      if (axis_index !== safe_axis && current_array.shape[axis_index] !== base_shape[axis_index]) {
        throw new Error("concatenate では連結軸以外の形状が一致する必要があります。");
      }
    }
    new_shape[safe_axis] += current_array.shape[safe_axis];
  }

  const result = new Float64Array(calculateSize(new_shape));
  const result_strides = getStrides(new_shape);
  let axis_offset = 0;

  for (const current_array of arrays) {
    for (let flat_index = 0; flat_index < current_array.data.length; flat_index += 1) {
      const target_indices = fromFlat(flat_index, current_array.shape);
      target_indices[safe_axis] += axis_offset;
      result[toFlat(target_indices, result_strides)] = current_array.data[flat_index];
    }
    axis_offset += current_array.shape[safe_axis];
  }

  return { data: result, shape: new_shape };
};

/**
 * 新しい軸を追加して積み重ねます。
 * @param arrays 対象配列群です。
 * @param axis 新規軸です。
 * @returns スタック結果です。
 */
export const stack = (arrays: NDArray[], axis = 0): NDArray => {
  if (arrays.length === 0) {
    throw new Error("stack では 1 つ以上の配列が必要です。");
  }
  const first_shape = [...arrays[0].shape];
  if (axis < 0 || axis > first_shape.length) {
    throw new Error("stack では有効な axis が必要です。");
  }
  for (const current_array of arrays) {
    assertSameShape(arrays[0], current_array, "stack");
  }

  const new_shape = [...first_shape];
  new_shape.splice(axis, 0, arrays.length);
  const data = new Float64Array(calculateSize(new_shape));
  const new_strides = getStrides(new_shape);

  for (let array_index = 0; array_index < arrays.length; array_index += 1) {
    const current_array = arrays[array_index];
    for (let flat_index = 0; flat_index < current_array.data.length; flat_index += 1) {
      const target_indices = fromFlat(flat_index, current_array.shape);
      target_indices.splice(axis, 0, array_index);
      data[toFlat(target_indices, new_strides)] = current_array.data[flat_index];
    }
  }

  return { data, shape: new_shape };
};

/**
 * 指定軸で等分割します。
 * @param input_array 入力配列です。
 * @param num_sections 分割数です。
 * @param axis 分割軸です。
 * @returns 分割結果です。
 */
export const split = (input_array: NDArray, num_sections: number, axis = 0): NDArray[] => {
  const safe_axis = assertAxis(input_array.shape, axis, "split");
  const safe_sections = assertNonZeroScalar(num_sections, "num_sections");
  if (input_array.shape[safe_axis] % safe_sections !== 0) {
    throw new Error("split では分割軸の長さが num_sections で割り切れる必要があります。");
  }

  const section_size = input_array.shape[safe_axis] / safe_sections;
  const results: NDArray[] = [];
  for (let section_index = 0; section_index < safe_sections; section_index += 1) {
    const new_shape = [...input_array.shape];
    new_shape[safe_axis] = section_size;
    const data = new Float64Array(calculateSize(new_shape));
    const new_strides = getStrides(new_shape);

    for (let flat_index = 0; flat_index < input_array.data.length; flat_index += 1) {
      const target_indices = fromFlat(flat_index, input_array.shape);
      if (
        target_indices[safe_axis] >= section_index * section_size &&
        target_indices[safe_axis] < (section_index + 1) * section_size
      ) {
        target_indices[safe_axis] -= section_index * section_size;
        data[toFlat(target_indices, new_strides)] = input_array.data[flat_index];
      }
    }

    results.push({ data, shape: new_shape });
  }
  return results;
};

//#endregion

//#region 条件操作

/**
 * 値を指定範囲へ切り詰めます。
 * @param input_array 入力配列です。
 * @param low 下限値です。
 * @param high 上限値です。
 * @returns 切り詰め結果です。
 */
export const clip = (input_array: NDArray, low: number, high: number): NDArray =>
  mapElements(input_array, value => (value < low ? low : value > high ? high : value));

/**
 * 条件に応じて値を選択します。
 * @param condition 条件配列です。
 * @param array_a 真の場合の配列です。
 * @param array_b 偽の場合の配列です。
 * @returns 選択結果です。
 */
export const where = (condition: NDArray, array_a: NDArray, array_b: NDArray): NDArray => {
  assertSameShape(condition, array_a, "where");
  assertSameShape(condition, array_b, "where");
  return zipElements(
    array_a,
    array_b,
    (value_a, value_b, index) => (condition.data[index] ? value_a : value_b),
    "where"
  );
};

//#endregion

//#region 乱数

/**
 * 一様乱数配列を生成します。
 * @param shape 配列形状です。
 * @returns 生成した配列です。
 */
export const rand = (shape: number[]): NDArray => {
  const size = calculateSize(shape);
  const data = new Float64Array(size);
  for (let index = 0; index < size; index += 1) {
    data[index] = Math.random();
  }
  return { data, shape: [...shape] };
};

/**
 * 正規乱数配列を生成します。
 * @param shape 配列形状です。
 * @returns 生成した配列です。
 */
export const randn = (shape: number[]): NDArray => {
  const size = calculateSize(shape);
  const data = new Float64Array(size);
  for (let index = 0; index < size; index += 2) {
    const uniform_a = 1 - Math.random();
    const uniform_b = Math.random();
    const radius = Math.sqrt(-2 * Math.log(uniform_a));
    data[index] = radius * Math.cos(2 * Math.PI * uniform_b);
    if (index + 1 < size) {
      data[index + 1] = radius * Math.sin(2 * Math.PI * uniform_b);
    }
  }
  return { data, shape: [...shape] };
};

/**
 * 整数乱数配列を生成します。
 * @param low 下限値です。
 * @param high 上限値です。
 * @param shape 配列形状です。
 * @returns 生成した配列です。
 */
export const randint = (low: number, high: number, shape: number[]): NDArray => {
  const range = high - low;
  assertNonZeroScalar(range, "range");
  const size = calculateSize(shape);
  const data = new Float64Array(size);
  for (let index = 0; index < size; index += 1) {
    data[index] = low + Math.floor(Math.random() * range);
  }
  return { data, shape: [...shape] };
};

//#endregion

//#region 高次操作

/**
 * 2 次元 meshgrid を生成します。
 * @param x_values x 軸値です。
 * @param y_values y 軸値です。
 * @returns 生成した 2 配列です。
 */
export const meshgrid = (x_values: NDArray, y_values: NDArray): [NDArray, NDArray] => {
  const width = x_values.data.length;
  const height = y_values.data.length;
  const grid_x = new Float64Array(width * height);
  const grid_y = new Float64Array(width * height);

  for (let row_index = 0; row_index < height; row_index += 1) {
    for (let column_index = 0; column_index < width; column_index += 1) {
      grid_x[row_index * width + column_index] = x_values.data[column_index];
      grid_y[row_index * width + column_index] = y_values.data[row_index];
    }
  }

  return [
    { data: grid_x, shape: [height, width] },
    { data: grid_y, shape: [height, width] }
  ];
};

/**
 * 配列を繰り返して拡張します。
 * @param input_array 入力配列です。
 * @param reps 各軸の繰り返し数です。
 * @returns 拡張後の配列です。
 */
export const tile = (input_array: NDArray, reps: number[]): NDArray => {
  const new_shape = input_array.shape.map((dimension, axis_index) => dimension * (reps[axis_index] ?? 1));
  const data = new Float64Array(calculateSize(new_shape));
  const input_strides = getStrides(input_array.shape);

  for (let flat_index = 0; flat_index < data.length; flat_index += 1) {
    const target_indices = fromFlat(flat_index, new_shape);
    const source_indices = target_indices.map((index, axis_index) => index % input_array.shape[axis_index]);
    data[flat_index] = input_array.data[toFlat(source_indices, input_strides)];
  }

  return { data, shape: new_shape };
};

/**
 * 指定軸で反転します。
 * @param input_array 入力配列です。
 * @param axis 反転軸です。
 * @returns 反転結果です。
 */
export const flip = (input_array: NDArray, axis: number): NDArray => {
  const safe_axis = assertAxis(input_array.shape, axis, "flip");
  const data = new Float64Array(input_array.data.length);
  const strides = getStrides(input_array.shape);

  for (let flat_index = 0; flat_index < input_array.data.length; flat_index += 1) {
    const target_indices = fromFlat(flat_index, input_array.shape);
    target_indices[safe_axis] = input_array.shape[safe_axis] - 1 - target_indices[safe_axis];
    data[toFlat(target_indices, strides)] = input_array.data[flat_index];
  }

  return { data, shape: [...input_array.shape] };
};

/**
 * 指定軸で巡回シフトします。
 * @param input_array 入力配列です。
 * @param shift シフト量です。
 * @param axis シフト軸です。
 * @returns シフト結果です。
 */
export const roll = (input_array: NDArray, shift: number, axis: number): NDArray => {
  const safe_axis = assertAxis(input_array.shape, axis, "roll");
  const axis_length = input_array.shape[safe_axis];
  const data = new Float64Array(input_array.data.length);
  const strides = getStrides(input_array.shape);

  for (let flat_index = 0; flat_index < input_array.data.length; flat_index += 1) {
    const target_indices = fromFlat(flat_index, input_array.shape);
    const shifted_indices = [...target_indices];
    shifted_indices[safe_axis] = (((target_indices[safe_axis] + shift) % axis_length) + axis_length) % axis_length;
    data[toFlat(shifted_indices, strides)] = input_array.data[flat_index];
  }

  return { data, shape: [...input_array.shape] };
};

/**
 * 長さ 1 の軸を除去します。
 * @param input_array 入力配列です。
 * @returns 軸除去後の配列です。
 */
export const squeeze = (input_array: NDArray): NDArray => {
  const squeezed_shape = input_array.shape.filter(dimension => dimension !== 1);
  return { data: input_array.data, shape: squeezed_shape.length > 0 ? squeezed_shape : [1] };
};

/**
 * 長さ 1 の軸を追加します。
 * @param input_array 入力配列です。
 * @param axis 追加位置です。
 * @returns 軸追加後の配列です。
 */
export const expandDims = (input_array: NDArray, axis: number): NDArray => {
  if (axis < 0 || axis > input_array.shape.length) {
    throw new Error("expandDims では有効な axis が必要です。");
  }
  const new_shape = [...input_array.shape];
  new_shape.splice(axis, 0, 1);
  return { data: input_array.data, shape: new_shape };
};

//#endregion
