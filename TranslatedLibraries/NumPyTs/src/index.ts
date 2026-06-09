import type { NDArray } from './array'
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
} from './array'
import {
  angle,
  abs as absVec,
  add as addVec,
  addScalar as addScalarVec,
  argmax as argmaxVec,
  argmin as argminVec,
  argsort,
  clip as clipVec,
  concat,
  convolve,
  correlate,
  cos as cosVec,
  cross,
  cumsum,
  cumprod,
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
  slice,
  sort,
  sqrt as sqrtVec,
  slerp,
  sub as subVec,
  sum as sumVec,
  tan,
  tanh as tanhVec,
  vec,
  vecClone,
  vecFromArr
} from './vector'
import { corrMatrix, corrcoef, cov, covMatrix, histogram, median, percentile, polyreg, polyval, quantile, std, variance, weightedMean } from './stats'
import type { Vec } from './vector'

const isNDArray = (value: NDArray | Vec): value is NDArray => !ArrayBuffer.isView(value)

export function add(a: NDArray, b: NDArray): NDArray
export function add(a: Vec, b: Vec): Vec
export function add(a: NDArray | Vec, b: NDArray | Vec): NDArray | Vec {
  return isNDArray(a) && isNDArray(b) ? addArray(a, b) : addVec(a as Vec, b as Vec)
}

export function sub(a: NDArray, b: NDArray): NDArray
export function sub(a: Vec, b: Vec): Vec
export function sub(a: NDArray | Vec, b: NDArray | Vec): NDArray | Vec {
  return isNDArray(a) && isNDArray(b) ? subArray(a, b) : subVec(a as Vec, b as Vec)
}

export function mul(a: NDArray, b: NDArray): NDArray
export function mul(a: Vec, b: Vec): Vec
export function mul(a: NDArray | Vec, b: NDArray | Vec): NDArray | Vec {
  return isNDArray(a) && isNDArray(b) ? mulArray(a, b) : mulVec(a as Vec, b as Vec)
}

export function div(a: NDArray, b: NDArray): NDArray
export function div(a: Vec, b: Vec): Vec
export function div(a: NDArray | Vec, b: NDArray | Vec): NDArray | Vec {
  return isNDArray(a) && isNDArray(b) ? divArray(a, b) : divVec(a as Vec, b as Vec)
}

export function scale(value: NDArray, scalar: number): NDArray
export function scale(value: Vec, scalar: number): Vec
export function scale(value: NDArray | Vec, scalar: number): NDArray | Vec {
  return isNDArray(value) ? scaleArray(value, scalar) : scaleVec(value, scalar)
}

export function addScalar(value: NDArray, scalar: number): NDArray
export function addScalar(value: Vec, scalar: number): Vec
export function addScalar(value: NDArray | Vec, scalar: number): NDArray | Vec {
  return isNDArray(value) ? addScalarArray(value, scalar) : addScalarVec(value, scalar)
}

export function pow(value: NDArray, power: number): NDArray
export function pow(value: Vec, power: number): Vec
export function pow(value: NDArray | Vec, power: number): NDArray | Vec {
  return isNDArray(value) ? powArray(value, power) : powVec(value, power)
}

export function sqrt(value: NDArray): NDArray
export function sqrt(value: Vec): Vec
export function sqrt(value: NDArray | Vec): NDArray | Vec {
  return isNDArray(value) ? sqrtArray(value) : sqrtVec(value)
}

export function exp(value: NDArray): NDArray
export function exp(value: Vec): Vec
export function exp(value: NDArray | Vec): NDArray | Vec {
  return isNDArray(value) ? expArray(value) : expVec(value)
}

export function log(value: NDArray): NDArray
export function log(value: Vec): Vec
export function log(value: NDArray | Vec): NDArray | Vec {
  return isNDArray(value) ? logArray(value) : logVec(value)
}

export function abs(value: NDArray): NDArray
export function abs(value: Vec): Vec
export function abs(value: NDArray | Vec): NDArray | Vec {
  return isNDArray(value) ? absArray(value) : absVec(value)
}

export function sin(value: NDArray): NDArray
export function sin(value: Vec): Vec
export function sin(value: NDArray | Vec): NDArray | Vec {
  return isNDArray(value) ? sinArray(value) : sinVec(value)
}

export function cos(value: NDArray): NDArray
export function cos(value: Vec): Vec
export function cos(value: NDArray | Vec): NDArray | Vec {
  return isNDArray(value) ? cosArray(value) : cosVec(value)
}

export function tanh(value: NDArray): NDArray
export function tanh(value: Vec): Vec
export function tanh(value: NDArray | Vec): NDArray | Vec {
  return isNDArray(value) ? tanhArray(value) : tanhVec(value)
}

export function clip(value: NDArray, low: number, high: number): NDArray
export function clip(value: Vec, low: number, high: number): Vec
export function clip(value: NDArray | Vec, low: number, high: number): NDArray | Vec {
  return isNDArray(value) ? clipArray(value, low, high) : clipVec(value, low, high)
}

export function sum(value: NDArray, axis?: number): NDArray | number
export function sum(value: Vec): number
export function sum(value: NDArray | Vec, axis?: number): NDArray | number {
  return isNDArray(value) ? sumArray(value, axis) : sumVec(value)
}

export function mean(value: NDArray, axis?: number): NDArray | number
export function mean(value: Vec): number
export function mean(value: NDArray | Vec, axis?: number): NDArray | number {
  return isNDArray(value) ? meanArray(value, axis) : meanVec(value)
}

export function max(value: NDArray, axis?: number): NDArray | number
export function max(value: Vec): number
export function max(value: NDArray | Vec, axis?: number): NDArray | number {
  return isNDArray(value) ? maxArray(value, axis) : maxVec(value)
}

export function min(value: NDArray, axis?: number): NDArray | number
export function min(value: Vec): number
export function min(value: NDArray | Vec, axis?: number): NDArray | number {
  return isNDArray(value) ? minArray(value, axis) : minVec(value)
}

export function argmax(value: NDArray): number
export function argmax(value: Vec): number
export function argmax(value: NDArray | Vec): number {
  return isNDArray(value) ? argmaxArray(value) : argmaxVec(value)
}

export function argmin(value: NDArray): number
export function argmin(value: Vec): number
export function argmin(value: NDArray | Vec): number {
  return isNDArray(value) ? argminArray(value) : argminVec(value)
}

export * as linalg from './linalg'
export * as random from './random'

export {
  angle,
  arange,
  argsort,
  concatenate,
  concat,
  convolve,
  correlate,
  corrMatrix,
  corrcoef,
  cov,
  covMatrix,
  cross,
  cumsum,
  cumprod,
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
  reflect,
  reshape,
  reverse,
  roll,
  set,
  slice,
  sort,
  split,
  slerp,
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
}

export { variance as var, weightedMean as average, polyreg as polyfit }

export type { Matrix } from './matrix'
export type { NDArray } from './array'
export type { Vec } from './vector'
