/**
 * NumPy の 1 次元ベクトル演算を TypeScript へ翻訳した実装です。
 */

//#region 型と定数

export type Vec = Float64Array;

const ZERO_TOLERANCE = 1e-12;

//#endregion

//#region 内部ヘルパー

/**
 * 2 つのベクトル長が一致することを検証します。
 * @param vector_a 比較元のベクトルです。
 * @param vector_b 比較先のベクトルです。
 * @param context 呼び出し元の文脈です。
 * @returns 検証済みの要素数です。
 */
const assertSameLength = (vector_a: Vec, vector_b: Vec, context: string): number => {
  if (vector_a.length !== vector_b.length) {
    throw new Error(`${context} では同じ長さのベクトルが必要です。`);
  }
  return vector_a.length;
};

/**
 * スカラー値が有限かを検証します。
 * @param value 検証対象の値です。
 * @param variable_name 変数名です。
 * @returns 検証済みの値です。
 */
const assertFiniteScalar = (value: number, variable_name: string): number => {
  if (!Number.isFinite(value)) {
    console.error(`[NumPyTs/vector] ${variable_name} が有限値ではありません。`, { value, variable_name });
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
    console.error(`[NumPyTs/vector] ${variable_name} が 0 に近く、計算を継続できません。`, {
      value,
      variable_name
    });
    throw new Error(`${variable_name} が 0 に近く、計算を継続できません。`);
  }
  return value;
};

/**
 * 単項演算をベクトルへ適用します。
 * @param input_vector 入力ベクトルです。
 * @param transform_value 要素変換関数です。
 * @returns 変換後のベクトルです。
 */
const applyUnary = (input_vector: Vec, transform_value: (value: number, index: number) => number): Vec => {
  const result = new Float64Array(input_vector.length);
  for (let index = 0; index < input_vector.length; index += 1) {
    result[index] = transform_value(input_vector[index], index);
  }
  return result;
};

/**
 * 二項演算をベクトルへ適用します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @param transform_value 要素変換関数です。
 * @param context 呼び出し元の文脈です。
 * @returns 変換後のベクトルです。
 */
const applyBinary = (
  vector_a: Vec,
  vector_b: Vec,
  transform_value: (value_a: number, value_b: number, index: number) => number,
  context: string
): Vec => {
  const length = assertSameLength(vector_a, vector_b, context);
  const result = new Float64Array(length);
  for (let index = 0; index < length; index += 1) {
    result[index] = transform_value(vector_a[index], vector_b[index], index);
  }
  return result;
};

//#endregion

//#region 生成

/**
 * ベクトルを生成します。
 * @param length 要素数です。
 * @param data 初期データです。
 * @returns 生成したベクトルです。
 */
export const vec = (length: number, data?: number[]): Vec => (data ? new Float64Array(data) : new Float64Array(length));

/**
 * 配列からベクトルを生成します。
 * @param input_array 入力配列です。
 * @returns 生成したベクトルです。
 */
export const vecFromArr = (input_array: number[]): Vec => new Float64Array(input_array);

/**
 * ベクトルを複製します。
 * @param input_vector 入力ベクトルです。
 * @returns 複製したベクトルです。
 */
export const vecClone = (input_vector: Vec): Vec => new Float64Array(input_vector);

/**
 * 0 で初期化したベクトルを生成します。
 * @param length 要素数です。
 * @returns 生成したベクトルです。
 */
export const zeros = (length: number): Vec => new Float64Array(length);

/**
 * 1 で初期化したベクトルを生成します。
 * @param length 要素数です。
 * @returns 生成したベクトルです。
 */
export const ones = (length: number): Vec => new Float64Array(length).fill(1);

/**
 * 指定値で初期化したベクトルを生成します。
 * @param length 要素数です。
 * @param value 初期値です。
 * @returns 生成したベクトルです。
 */
export const fill = (length: number, value: number): Vec => new Float64Array(length).fill(value);

/**
 * 等差数列ベクトルを生成します。
 * @param start 開始値です。
 * @param end 終了値です。
 * @param step 刻み幅です。
 * @returns 生成したベクトルです。
 */
export const arange = (start: number, end: number, step = 1): Vec => {
  assertNonZeroScalar(step, "step");
  const length = Math.max(0, Math.ceil((end - start) / step));
  const result = new Float64Array(length);
  for (let index = 0; index < length; index += 1) {
    result[index] = start + index * step;
  }
  return result;
};

/**
 * 線形補間したベクトルを生成します。
 * @param start 開始値です。
 * @param end 終了値です。
 * @param length 要素数です。
 * @returns 生成したベクトルです。
 */
export const linspace = (start: number, end: number, length: number): Vec => {
  if (length <= 0) {
    return new Float64Array(0);
  }
  if (length === 1) {
    return new Float64Array([start]);
  }
  const step = (end - start) / (length - 1);
  const result = new Float64Array(length);
  for (let index = 0; index < length; index += 1) {
    result[index] = start + index * step;
  }
  return result;
};

//#endregion

//#region 基本演算

/**
 * ベクトル同士を加算します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 加算結果です。
 */
export const add = (vector_a: Vec, vector_b: Vec): Vec =>
  applyBinary(vector_a, vector_b, (value_a, value_b) => value_a + value_b, "add");

/**
 * ベクトル同士を減算します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 減算結果です。
 */
export const sub = (vector_a: Vec, vector_b: Vec): Vec =>
  applyBinary(vector_a, vector_b, (value_a, value_b) => value_a - value_b, "sub");

/**
 * ベクトル同士を要素積します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 要素積です。
 */
export const mul = (vector_a: Vec, vector_b: Vec): Vec =>
  applyBinary(vector_a, vector_b, (value_a, value_b) => value_a * value_b, "mul");

/**
 * ベクトル同士を要素ごとに除算します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 要素ごとの除算結果です。
 */
export const div = (vector_a: Vec, vector_b: Vec): Vec =>
  applyBinary(
    vector_a,
    vector_b,
    (value_a, value_b, index) => value_a / assertNonZeroScalar(value_b, `vector_b[${String(index)}]`),
    "div"
  );

/**
 * ベクトルをスカラー倍します。
 * @param input_vector 入力ベクトルです。
 * @param scalar スカラー値です。
 * @returns スカラー倍結果です。
 */
export const scale = (input_vector: Vec, scalar: number): Vec =>
  applyUnary(input_vector, value => value * assertFiniteScalar(scalar, "scalar"));

/**
 * ベクトルへスカラーを加算します。
 * @param input_vector 入力ベクトルです。
 * @param scalar スカラー値です。
 * @returns 加算結果です。
 */
export const addScalar = (input_vector: Vec, scalar: number): Vec =>
  applyUnary(input_vector, value => value + assertFiniteScalar(scalar, "scalar"));

/**
 * 内積を計算します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 内積です。
 */
export const dot = (vector_a: Vec, vector_b: Vec): number => {
  const length = assertSameLength(vector_a, vector_b, "dot");
  let total = 0;
  for (let index = 0; index < length; index += 1) {
    total += vector_a[index] * vector_b[index];
  }
  return assertFiniteScalar(total, "dot");
};

/**
 * 外積を計算します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 外積ベクトルです。
 */
export const cross = (vector_a: Vec, vector_b: Vec): Vec => {
  if (vector_a.length !== 3 || vector_b.length !== 3) {
    throw new Error("cross では 3 次元ベクトルが必要です。");
  }
  return new Float64Array([
    vector_a[1] * vector_b[2] - vector_a[2] * vector_b[1],
    vector_a[2] * vector_b[0] - vector_a[0] * vector_b[2],
    vector_a[0] * vector_b[1] - vector_a[1] * vector_b[0]
  ]);
};

//#endregion

//#region ノルムと距離

/**
 * 2 乗ノルムを計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 2 乗ノルムです。
 */
export const norm2 = (input_vector: Vec): number => dot(input_vector, input_vector);

/**
 * ユークリッドノルムを計算します。
 * @param input_vector 入力ベクトルです。
 * @returns ノルムです。
 */
export const norm = (input_vector: Vec): number => assertFiniteScalar(Math.sqrt(norm2(input_vector)), "norm");

/**
 * 正規化ベクトルを計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 正規化したベクトルです。
 */
export const normalize = (input_vector: Vec): Vec => {
  const length = assertNonZeroScalar(norm(input_vector), "length");
  return scale(input_vector, 1 / length);
};

/**
 * ベクトル間の距離を計算します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 距離です。
 */
export const distance = (vector_a: Vec, vector_b: Vec): number => norm(sub(vector_a, vector_b));

/**
 * ベクトル間の 2 乗距離を計算します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 2 乗距離です。
 */
export const distance2 = (vector_a: Vec, vector_b: Vec): number => norm2(sub(vector_a, vector_b));

//#endregion

//#region 集約

/**
 * 総和を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 総和です。
 */
export const sum = (input_vector: Vec): number => {
  let total = 0;
  for (let index = 0; index < input_vector.length; index += 1) {
    total += input_vector[index];
  }
  return assertFiniteScalar(total, "sum");
};

/**
 * 平均値を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 平均値です。
 */
export const mean = (input_vector: Vec): number =>
  sum(input_vector) / assertNonZeroScalar(input_vector.length, "length");

/**
 * 最小値を返します。
 * @param input_vector 入力ベクトルです。
 * @returns 最小値です。
 */
export const min = (input_vector: Vec): number => {
  if (input_vector.length === 0) {
    throw new Error("min では空ベクトルを扱えません。");
  }
  let current_value = input_vector[0];
  for (let index = 1; index < input_vector.length; index += 1) {
    if (input_vector[index] < current_value) {
      current_value = input_vector[index];
    }
  }
  return current_value;
};

/**
 * 最大値を返します。
 * @param input_vector 入力ベクトルです。
 * @returns 最大値です。
 */
export const max = (input_vector: Vec): number => {
  if (input_vector.length === 0) {
    throw new Error("max では空ベクトルを扱えません。");
  }
  let current_value = input_vector[0];
  for (let index = 1; index < input_vector.length; index += 1) {
    if (input_vector[index] > current_value) {
      current_value = input_vector[index];
    }
  }
  return current_value;
};

/**
 * 最小値の添字を返します。
 * @param input_vector 入力ベクトルです。
 * @returns 最小値の添字です。
 */
export const argmin = (input_vector: Vec): number => {
  if (input_vector.length === 0) {
    throw new Error("argmin では空ベクトルを扱えません。");
  }
  let current_index = 0;
  for (let index = 1; index < input_vector.length; index += 1) {
    if (input_vector[index] < input_vector[current_index]) {
      current_index = index;
    }
  }
  return current_index;
};

/**
 * 最大値の添字を返します。
 * @param input_vector 入力ベクトルです。
 * @returns 最大値の添字です。
 */
export const argmax = (input_vector: Vec): number => {
  if (input_vector.length === 0) {
    throw new Error("argmax では空ベクトルを扱えません。");
  }
  let current_index = 0;
  for (let index = 1; index < input_vector.length; index += 1) {
    if (input_vector[index] > input_vector[current_index]) {
      current_index = index;
    }
  }
  return current_index;
};

//#endregion

//#region 要素単位関数

/**
 * 絶対値を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 絶対値ベクトルです。
 */
export const abs = (input_vector: Vec): Vec => applyUnary(input_vector, value => Math.abs(value));

/**
 * 平方根を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 平方根ベクトルです。
 */
export const sqrt = (input_vector: Vec): Vec =>
  applyUnary(input_vector, (value, index) => Math.sqrt(assertFiniteScalar(value, `input_vector[${String(index)}]`)));

/**
 * 冪乗を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @param power 指数です。
 * @returns 冪乗結果です。
 */
export const pow = (input_vector: Vec, power: number): Vec =>
  applyUnary(input_vector, value => Math.pow(value, assertFiniteScalar(power, "power")));

/**
 * 指数関数を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 指数関数適用結果です。
 */
export const exp = (input_vector: Vec): Vec => applyUnary(input_vector, value => Math.exp(value));

/**
 * 自然対数を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 対数ベクトルです。
 */
export const log = (input_vector: Vec): Vec => {
  return applyUnary(input_vector, (value, index) => {
    const result = Math.log(value);
    return assertFiniteScalar(result, `log(input_vector[${String(index)}])`);
  });
};

/**
 * 正弦を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 正弦ベクトルです。
 */
export const sin = (input_vector: Vec): Vec => applyUnary(input_vector, value => Math.sin(value));

/**
 * 余弦を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 余弦ベクトルです。
 */
export const cos = (input_vector: Vec): Vec => applyUnary(input_vector, value => Math.cos(value));

/**
 * 正接を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 正接ベクトルです。
 */
export const tan = (input_vector: Vec): Vec => applyUnary(input_vector, value => Math.tan(value));

/**
 * 双曲線正接を要素ごとに計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 双曲線正接ベクトルです。
 */
export const tanh = (input_vector: Vec): Vec => applyUnary(input_vector, value => Math.tanh(value));

/**
 * 値を指定範囲へ切り詰めます。
 * @param input_vector 入力ベクトルです。
 * @param low 下限値です。
 * @param high 上限値です。
 * @returns 切り詰め後のベクトルです。
 */
export const clip = (input_vector: Vec, low: number, high: number): Vec =>
  applyUnary(input_vector, value => (value < low ? low : value > high ? high : value));

//#endregion

//#region 累積と並べ替え

/**
 * 累積和を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 累積和ベクトルです。
 */
export const cumsum = (input_vector: Vec): Vec => {
  const result = new Float64Array(input_vector.length);
  let running_total = 0;
  for (let index = 0; index < input_vector.length; index += 1) {
    running_total += input_vector[index];
    result[index] = running_total;
  }
  return result;
};

/**
 * 累積積を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 累積積ベクトルです。
 */
export const cumprod = (input_vector: Vec): Vec => {
  const result = new Float64Array(input_vector.length);
  let running_total = 1;
  for (let index = 0; index < input_vector.length; index += 1) {
    running_total *= input_vector[index];
    result[index] = running_total;
  }
  return result;
};

/**
 * 隣接差分を計算します。
 * @param input_vector 入力ベクトルです。
 * @returns 差分ベクトルです。
 */
export const diff = (input_vector: Vec): Vec => {
  if (input_vector.length <= 1) {
    return new Float64Array(0);
  }
  const result = new Float64Array(input_vector.length - 1);
  for (let index = 0; index < result.length; index += 1) {
    result[index] = input_vector[index + 1] - input_vector[index];
  }
  return result;
};

/**
 * ベクトルを連結します。
 * @param input_vectors 連結対象のベクトル群です。
 * @returns 連結結果です。
 */
export const concat = (...input_vectors: Vec[]): Vec => {
  let total_length = 0;
  for (const current_vector of input_vectors) {
    total_length += current_vector.length;
  }
  const result = new Float64Array(total_length);
  let offset = 0;
  for (const current_vector of input_vectors) {
    result.set(current_vector, offset);
    offset += current_vector.length;
  }
  return result;
};

/**
 * ベクトルを部分切り出しします。
 * @param input_vector 入力ベクトルです。
 * @param start_index 開始添字です。
 * @param end_index 終了添字です。
 * @returns 切り出し結果です。
 */
export const slice = (input_vector: Vec, start_index: number, end_index?: number): Vec =>
  input_vector.slice(start_index, end_index);

/**
 * ベクトルを反転します。
 * @param input_vector 入力ベクトルです。
 * @returns 反転結果です。
 */
export const reverse = (input_vector: Vec): Vec => {
  const result = new Float64Array(input_vector.length);
  for (let index = 0; index < input_vector.length; index += 1) {
    result[index] = input_vector[input_vector.length - 1 - index];
  }
  return result;
};

/**
 * ベクトルを昇順ソートします。
 * @param input_vector 入力ベクトルです。
 * @returns ソート結果です。
 */
export const sort = (input_vector: Vec): Vec =>
  new Float64Array([...input_vector].sort((value_a, value_b) => value_a - value_b));

/**
 * 昇順ソート時の添字配列を返します。
 * @param input_vector 入力ベクトルです。
 * @returns ソート添字です。
 */
export const argsort = (input_vector: Vec): number[] => {
  const indices = Array.from({ length: input_vector.length }, (_, index) => index);
  indices.sort((index_a, index_b) => input_vector[index_a] - input_vector[index_b]);
  return indices;
};

//#endregion

//#region 幾何演算

/**
 * 2 ベクトルのなす角を返します。
 * @param vector_a 左辺ベクトルです。
 * @param vector_b 右辺ベクトルです。
 * @returns 角度です。
 */
export const angle = (vector_a: Vec, vector_b: Vec): number => {
  const denominator = assertNonZeroScalar(norm(vector_a) * norm(vector_b), "denominator");
  const cosine = dot(vector_a, vector_b) / denominator;
  const clamped_cosine = Math.min(1, Math.max(-1, cosine));
  return Math.acos(clamped_cosine);
};

/**
 * vector_a を vector_b へ射影します。
 * @param vector_a 元ベクトルです。
 * @param vector_b 射影先ベクトルです。
 * @returns 射影ベクトルです。
 */
export const project = (vector_a: Vec, vector_b: Vec): Vec => {
  const denominator = assertNonZeroScalar(dot(vector_b, vector_b), "projection_denominator");
  return scale(vector_b, dot(vector_a, vector_b) / denominator);
};

/**
 * 法線ベクトルに対する反射を計算します。
 * @param vector_a 入射ベクトルです。
 * @param normal_vector 法線ベクトルです。
 * @returns 反射ベクトルです。
 */
export const reflect = (vector_a: Vec, normal_vector: Vec): Vec =>
  sub(vector_a, scale(normal_vector, 2 * dot(vector_a, normal_vector)));

/**
 * 線形補間を計算します。
 * @param vector_a 開始ベクトルです。
 * @param vector_b 終了ベクトルです。
 * @param t 補間係数です。
 * @returns 補間結果です。
 */
export const lerp = (vector_a: Vec, vector_b: Vec, t: number): Vec => add(scale(vector_a, 1 - t), scale(vector_b, t));

/**
 * 球面線形補間を計算します。
 * @param vector_a 開始ベクトルです。
 * @param vector_b 終了ベクトルです。
 * @param t 補間係数です。
 * @returns 補間結果です。
 */
export const slerp = (vector_a: Vec, vector_b: Vec, t: number): Vec => {
  const theta = angle(vector_a, vector_b);
  if (Math.abs(theta) < ZERO_TOLERANCE) {
    return lerp(vector_a, vector_b, t);
  }
  const sin_theta = assertNonZeroScalar(Math.sin(theta), "sin_theta");
  return add(scale(vector_a, Math.sin((1 - t) * theta) / sin_theta), scale(vector_b, Math.sin(t * theta) / sin_theta));
};

//#endregion

//#region 信号処理

/**
 * 畳み込みを計算します。
 * @param vector_a 入力ベクトルです。
 * @param vector_b カーネルベクトルです。
 * @returns 畳み込み結果です。
 */
export const convolve = (vector_a: Vec, vector_b: Vec): Vec => {
  const result = new Float64Array(vector_a.length + vector_b.length - 1);
  for (let index_a = 0; index_a < vector_a.length; index_a += 1) {
    for (let index_b = 0; index_b < vector_b.length; index_b += 1) {
      result[index_a + index_b] += vector_a[index_a] * vector_b[index_b];
    }
  }
  return result;
};

/**
 * 相互相関を計算します。
 * @param vector_a 入力ベクトルです。
 * @param vector_b 比較ベクトルです。
 * @returns 相互相関結果です。
 */
export const correlate = (vector_a: Vec, vector_b: Vec): Vec => convolve(vector_a, reverse(vector_b));

//#endregion
