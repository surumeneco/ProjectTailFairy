/**
 * NumPy 互換 API の公開エントリです。
 */

import type { NDArray } from "./array";
import {
  abs as absArray,
  add as addArray,
  addScalar as addScalarArray,
  arange,
  argmax as argmaxArray,
  argmin as argminArray,
  clip as clipArray,
  concatenate,
  cos as cosArray,
  diag,
  div as divArray,
  exp as expArray,
  expandDims,
  eye,
  flatten,
  flip,
  full,
  get,
  linspace,
  log as logArray,
  max as maxArray,
  mean as meanArray,
  meshgrid,
  min as minArray,
  mul as mulArray,
  ndarray,
  ones,
  pow as powArray,
  rand,
  randint,
  randn,
  reshape,
  roll,
  scale as scaleArray,
  set,
  sin as sinArray,
  split,
  sqrt as sqrtArray,
  squeeze,
  stack,
  sub as subArray,
  sum as sumArray,
  swapaxes,
  tanh as tanhArray,
  tile,
  transpose,
  where,
  zeros
} from "./array";
import {
  corrcoef,
  corrMatrix,
  cov,
  covMatrix,
  histogram,
  median,
  percentile,
  polyreg,
  polyval,
  quantile,
  std,
  variance,
  weightedMean
} from "./stats";
import type { Vec } from "./vector";
import {
  abs as absVec,
  add as addVec,
  addScalar as addScalarVec,
  angle,
  argmax as argmaxVec,
  argmin as argminVec,
  argsort,
  clip as clipVec,
  concat,
  convolve,
  correlate,
  cos as cosVec,
  cross,
  cumprod,
  cumsum,
  diff,
  distance,
  distance2,
  div as divVec,
  dot,
  exp as expVec,
  fill,
  lerp,
  log as logVec,
  max as maxVec,
  mean as meanVec,
  min as minVec,
  mul as mulVec,
  norm,
  norm2,
  normalize,
  pow as powVec,
  project,
  reflect,
  reverse,
  scale as scaleVec,
  sin as sinVec,
  slerp,
  slice,
  sort,
  sqrt as sqrtVec,
  sub as subVec,
  sum as sumVec,
  tan,
  tanh as tanhVec,
  vec,
  vecClone,
  vecFromArr
} from "./vector";

//#region 内部ヘルパー

/**
 * 値が NDArray かどうかを判定します。
 * @param value 判定対象です。
 * @returns NDArray の場合は true です。
 */
const isNdarray = (value: NDArray | Vec): value is NDArray => !ArrayBuffer.isView(value);

//#endregion

//#region 統合演算

/**
 * 要素ごとに加算します。
 * @param left 左辺値です。
 * @param right 右辺値です。
 * @returns 加算結果です。
 */
export function add(left: NDArray, right: NDArray): NDArray;
export function add(left: Vec, right: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する加算実装です。
 * @param left 左辺値です。
 * @param right 右辺値です。
 * @returns 加算結果です。
 */
export function add(left: NDArray | Vec, right: NDArray | Vec): NDArray | Vec {
  return isNdarray(left) && isNdarray(right) ? addArray(left, right) : addVec(left as Vec, right as Vec);
}

/**
 * 要素ごとに減算します。
 * @param left 左辺値です。
 * @param right 右辺値です。
 * @returns 減算結果です。
 */
export function sub(left: NDArray, right: NDArray): NDArray;
export function sub(left: Vec, right: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する減算実装です。
 * @param left 左辺値です。
 * @param right 右辺値です。
 * @returns 減算結果です。
 */
export function sub(left: NDArray | Vec, right: NDArray | Vec): NDArray | Vec {
  return isNdarray(left) && isNdarray(right) ? subArray(left, right) : subVec(left as Vec, right as Vec);
}

/**
 * 要素ごとに乗算します。
 * @param left 左辺値です。
 * @param right 右辺値です。
 * @returns 乗算結果です。
 */
export function mul(left: NDArray, right: NDArray): NDArray;
export function mul(left: Vec, right: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する乗算実装です。
 * @param left 左辺値です。
 * @param right 右辺値です。
 * @returns 乗算結果です。
 */
export function mul(left: NDArray | Vec, right: NDArray | Vec): NDArray | Vec {
  return isNdarray(left) && isNdarray(right) ? mulArray(left, right) : mulVec(left as Vec, right as Vec);
}

/**
 * 要素ごとに除算します。
 * @param left 左辺値です。
 * @param right 右辺値です。
 * @returns 除算結果です。
 */
export function div(left: NDArray, right: NDArray): NDArray;
export function div(left: Vec, right: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する除算実装です。
 * @param left 左辺値です。
 * @param right 右辺値です。
 * @returns 除算結果です。
 */
export function div(left: NDArray | Vec, right: NDArray | Vec): NDArray | Vec {
  return isNdarray(left) && isNdarray(right) ? divArray(left, right) : divVec(left as Vec, right as Vec);
}

/**
 * スカラー倍します。
 * @param value 入力値です。
 * @param scalar スカラー値です。
 * @returns 計算結果です。
 */
export function scale(value: NDArray, scalar: number): NDArray;
export function scale(value: Vec, scalar: number): Vec;
/**
 * NDArray と Vec の両方へ対応するスカラー倍実装です。
 * @param value 入力値です。
 * @param scalar スカラー値です。
 * @returns 計算結果です。
 */
export function scale(value: NDArray | Vec, scalar: number): NDArray | Vec {
  return isNdarray(value) ? scaleArray(value, scalar) : scaleVec(value, scalar);
}

/**
 * スカラーを加算します。
 * @param value 入力値です。
 * @param scalar スカラー値です。
 * @returns 計算結果です。
 */
export function addScalar(value: NDArray, scalar: number): NDArray;
export function addScalar(value: Vec, scalar: number): Vec;
/**
 * NDArray と Vec の両方へ対応するスカラー加算実装です。
 * @param value 入力値です。
 * @param scalar スカラー値です。
 * @returns 計算結果です。
 */
export function addScalar(value: NDArray | Vec, scalar: number): NDArray | Vec {
  return isNdarray(value) ? addScalarArray(value, scalar) : addScalarVec(value, scalar);
}

/**
 * 冪乗を計算します。
 * @param value 入力値です。
 * @param power 指数です。
 * @returns 計算結果です。
 */
export function pow(value: NDArray, power: number): NDArray;
export function pow(value: Vec, power: number): Vec;
/**
 * NDArray と Vec の両方へ対応する冪乗実装です。
 * @param value 入力値です。
 * @param power 指数です。
 * @returns 計算結果です。
 */
export function pow(value: NDArray | Vec, power: number): NDArray | Vec {
  return isNdarray(value) ? powArray(value, power) : powVec(value, power);
}

/**
 * 平方根を計算します。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function sqrt(value: NDArray): NDArray;
export function sqrt(value: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する平方根実装です。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function sqrt(value: NDArray | Vec): NDArray | Vec {
  return isNdarray(value) ? sqrtArray(value) : sqrtVec(value);
}

/**
 * 指数関数を計算します。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function exp(value: NDArray): NDArray;
export function exp(value: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する指数関数実装です。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function exp(value: NDArray | Vec): NDArray | Vec {
  return isNdarray(value) ? expArray(value) : expVec(value);
}

/**
 * 自然対数を計算します。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function log(value: NDArray): NDArray;
export function log(value: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する対数実装です。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function log(value: NDArray | Vec): NDArray | Vec {
  return isNdarray(value) ? logArray(value) : logVec(value);
}

/**
 * 絶対値を計算します。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function abs(value: NDArray): NDArray;
export function abs(value: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する絶対値実装です。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function abs(value: NDArray | Vec): NDArray | Vec {
  return isNdarray(value) ? absArray(value) : absVec(value);
}

/**
 * 正弦を計算します。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function sin(value: NDArray): NDArray;
export function sin(value: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する正弦実装です。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function sin(value: NDArray | Vec): NDArray | Vec {
  return isNdarray(value) ? sinArray(value) : sinVec(value);
}

/**
 * 余弦を計算します。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function cos(value: NDArray): NDArray;
export function cos(value: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する余弦実装です。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function cos(value: NDArray | Vec): NDArray | Vec {
  return isNdarray(value) ? cosArray(value) : cosVec(value);
}

/**
 * 双曲線正接を計算します。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function tanh(value: NDArray): NDArray;
export function tanh(value: Vec): Vec;
/**
 * NDArray と Vec の両方へ対応する双曲線正接実装です。
 * @param value 入力値です。
 * @returns 計算結果です。
 */
export function tanh(value: NDArray | Vec): NDArray | Vec {
  return isNdarray(value) ? tanhArray(value) : tanhVec(value);
}

/**
 * 値を範囲に切り詰めます。
 * @param value 入力値です。
 * @param low 下限値です。
 * @param high 上限値です。
 * @returns 計算結果です。
 */
export function clip(value: NDArray, low: number, high: number): NDArray;
export function clip(value: Vec, low: number, high: number): Vec;
/**
 * NDArray と Vec の両方へ対応する切り詰め実装です。
 * @param value 入力値です。
 * @param low 下限値です。
 * @param high 上限値です。
 * @returns 計算結果です。
 */
export function clip(value: NDArray | Vec, low: number, high: number): NDArray | Vec {
  return isNdarray(value) ? clipArray(value, low, high) : clipVec(value, low, high);
}

/**
 * 総和を計算します。
 * @param value 入力値です。
 * @param axis 集約軸です。
 * @returns 計算結果です。
 */
export function sum(value: NDArray, axis?: number): NDArray | number;
export function sum(value: Vec): number;
/**
 * NDArray と Vec の両方へ対応する総和実装です。
 * @param value 入力値です。
 * @param axis 集約軸です。
 * @returns 計算結果です。
 */
export function sum(value: NDArray | Vec, axis?: number): NDArray | number {
  return isNdarray(value) ? sumArray(value, axis) : sumVec(value);
}

/**
 * 平均値を計算します。
 * @param value 入力値です。
 * @param axis 集約軸です。
 * @returns 計算結果です。
 */
export function mean(value: NDArray, axis?: number): NDArray | number;
export function mean(value: Vec): number;
/**
 * NDArray と Vec の両方へ対応する平均値実装です。
 * @param value 入力値です。
 * @param axis 集約軸です。
 * @returns 計算結果です。
 */
export function mean(value: NDArray | Vec, axis?: number): NDArray | number {
  return isNdarray(value) ? meanArray(value, axis) : meanVec(value);
}

/**
 * 最大値を計算します。
 * @param value 入力値です。
 * @param axis 集約軸です。
 * @returns 計算結果です。
 */
export function max(value: NDArray, axis?: number): NDArray | number;
export function max(value: Vec): number;
/**
 * NDArray と Vec の両方へ対応する最大値実装です。
 * @param value 入力値です。
 * @param axis 集約軸です。
 * @returns 計算結果です。
 */
export function max(value: NDArray | Vec, axis?: number): NDArray | number {
  return isNdarray(value) ? maxArray(value, axis) : maxVec(value);
}

/**
 * 最小値を計算します。
 * @param value 入力値です。
 * @param axis 集約軸です。
 * @returns 計算結果です。
 */
export function min(value: NDArray, axis?: number): NDArray | number;
export function min(value: Vec): number;
/**
 * NDArray と Vec の両方へ対応する最小値実装です。
 * @param value 入力値です。
 * @param axis 集約軸です。
 * @returns 計算結果です。
 */
export function min(value: NDArray | Vec, axis?: number): NDArray | number {
  return isNdarray(value) ? minArray(value, axis) : minVec(value);
}

/**
 * 最大値の添字を返します。
 * @param value 入力値です。
 * @returns 添字です。
 */
export const argmax = (value: NDArray | Vec): number => (isNdarray(value) ? argmaxArray(value) : argmaxVec(value));

/**
 * 最小値の添字を返します。
 * @param value 入力値です。
 * @returns 添字です。
 */
export const argmin = (value: NDArray | Vec): number => (isNdarray(value) ? argminArray(value) : argminVec(value));

//#endregion

//#region 名前空間

export * as linalg from "./linalg";
export * as random from "./random";

//#endregion

//#region 直接公開

export {
  angle,
  arange,
  argsort,
  concat,
  concatenate,
  convolve,
  corrcoef,
  correlate,
  corrMatrix,
  cov,
  covMatrix,
  cross,
  cumprod,
  cumsum,
  diag,
  diff,
  distance,
  distance2,
  dot,
  expandDims,
  eye,
  fill,
  flatten,
  flip,
  full,
  get,
  histogram,
  lerp,
  linspace,
  median,
  meshgrid,
  ndarray,
  norm,
  norm2,
  normalize,
  ones,
  percentile,
  polyreg,
  polyval,
  project,
  quantile,
  rand,
  randint,
  randn,
  reflect,
  reshape,
  reverse,
  roll,
  set,
  slerp,
  slice,
  sort,
  split,
  squeeze,
  stack,
  std,
  swapaxes,
  tan,
  tile,
  transpose,
  variance,
  vec,
  vecClone,
  vecFromArr,
  weightedMean,
  where,
  zeros
};

export { weightedMean as average, polyreg as polyfit, variance as var };

//#endregion

//#region 型公開

export type { NDArray } from "./array";
export type { Matrix } from "./matrix";
export type { Vec } from "./vector";

//#endregion
