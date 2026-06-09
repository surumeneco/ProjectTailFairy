// Statistics library - Performance optimized
// Uses Float64Array for numerical precision

import type { Matrix } from './matrix'
import type { Vec } from './vector'
import * as mat from './matrix'
import * as vec from './vector'

export const variance = (v: Vec, ddof = 0): number => {
  const mean = vec.mean(v)
  let sum = 0
  for (let i = 0; i < v.length; i++) {
    const delta = v[i] - mean
    sum += delta * delta
  }
  return sum / (v.length - ddof)
}

export const std = (v: Vec, ddof = 0): number => Math.sqrt(variance(v, ddof))

export const cov = (x: Vec, y: Vec, ddof = 0): number => {
  const meanX = vec.mean(x)
  const meanY = vec.mean(y)
  let sum = 0
  for (let i = 0; i < x.length; i++) sum += (x[i] - meanX) * (y[i] - meanY)
  return sum / (x.length - ddof)
}

export const corrcoef = (x: Vec, y: Vec): number => cov(x, y) / (std(x) * std(y))

export const covMatrix = (data: Matrix, ddof = 0): Matrix => {
  const n = data.rows
  const p = data.cols
  const means = mat.meanCols(data)
  const covariance = mat.mat(p, p)
  for (let i = 0; i < p; i++) {
    for (let j = i; j < p; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) {
        sum += (data.data[k * p + i] - means[i]) * (data.data[k * p + j] - means[j])
      }
      const value = sum / (n - ddof)
      covariance.data[i * p + j] = value
      covariance.data[j * p + i] = value
    }
  }
  return covariance
}

export const corrMatrix = (data: Matrix): Matrix => {
  const correlation = covMatrix(data)
  const size = correlation.rows
  const stds = new Float64Array(size)
  for (let i = 0; i < size; i++) stds[i] = Math.sqrt(correlation.data[i * size + i])
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      correlation.data[i * size + j] /= stds[i] * stds[j]
    }
  }
  return correlation
}

export const median = (v: Vec): number => {
  const sorted = vec.sort(v)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export const percentile = (v: Vec, p: number): number => {
  const sorted = vec.sort(v)
  const index = (p / 100) * (sorted.length - 1)
  const low = Math.floor(index)
  const high = Math.ceil(index)
  return low === high ? sorted[low] : sorted[low] * (high - index) + sorted[high] * (index - low)
}

export const quantile = (v: Vec, q: number): number => percentile(v, q * 100)

export const weightedMean = (v: Vec, w: Vec): number => {
  let sum = 0
  let weightSum = 0
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * w[i]
    weightSum += w[i]
  }
  return sum / weightSum
}

export const histogram = (v: Vec, numBins: number): { bins: Float64Array; counts: Float64Array } => {
  const min = vec.min(v)
  const max = vec.max(v)
  const binWidth = (max - min) / numBins
  const bins = new Float64Array(numBins)
  const counts = new Float64Array(numBins)
  for (let i = 0; i < numBins; i++) bins[i] = min + (i + 0.5) * binWidth
  for (let i = 0; i < v.length; i++) {
    let bin = Math.floor((v[i] - min) / binWidth)
    if (bin >= numBins) bin = numBins - 1
    if (bin < 0) bin = 0
    counts[bin]++
  }
  return { bins, counts }
}

export const polyreg = (x: Vec, y: Vec, degree: number): Float64Array => {
  const n = x.length
  const m = degree + 1
  const design = mat.mat(n, m)
  for (let i = 0; i < n; i++) {
    let xPower = 1
    for (let j = 0; j < m; j++) {
      design.data[i * m + j] = xPower
      xPower *= x[i]
    }
  }
  const designT = mat.transpose(design)
  const normal = mat.mul(designT, design)
  const normalInv = mat.inv(normal)
  const rhs = new Float64Array(m)
  for (let j = 0; j < m; j++) {
    let sum = 0
    for (let i = 0; i < n; i++) sum += design.data[i * m + j] * y[i]
    rhs[j] = sum
  }
  const coeffs = new Float64Array(m)
  for (let i = 0; i < m; i++) {
    let sum = 0
    for (let j = 0; j < m; j++) sum += normalInv.data[i * m + j] * rhs[j]
    coeffs[i] = sum
  }
  return coeffs
}

export const polyval = (coeffs: Float64Array, x: number): number => {
  let y = 0
  let xPower = 1
  for (let i = 0; i < coeffs.length; i++) {
    y += coeffs[i] * xPower
    xPower *= x
  }
  return y
}
