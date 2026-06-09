import { linalg as npLinalg, mean, percentile, std, sum, variance, type Matrix, type Vec } from '@project-tail-fairy/numpy-ts'

export const skewness = (v: Vec): number => {
  const avg = mean(v)
  const sigma = std(v, 0)
  let skew = 0
  for (let i = 0; i < v.length; i++) skew += Math.pow((v[i] - avg) / sigma, 3)
  return skew / v.length
}

export const skew = skewness

export const kurtosis = (v: Vec): number => {
  const avg = mean(v)
  const sigma = std(v, 0)
  let value = 0
  for (let i = 0; i < v.length; i++) value += Math.pow((v[i] - avg) / sigma, 4)
  return value / v.length - 3
}

export const iqr = (v: Vec): number => percentile(v, 75) - percentile(v, 25)

export const mode = (v: Vec): number => {
  const counts = new Map<number, number>()
  let maxCount = 0
  let modeValue = v[0]
  for (let i = 0; i < v.length; i++) {
    const nextCount = (counts.get(v[i]) || 0) + 1
    counts.set(v[i], nextCount)
    if (nextCount > maxCount) {
      maxCount = nextCount
      modeValue = v[i]
    }
  }
  return modeValue
}

export const ttest = (a: Vec, b: Vec): { t: number; pValue: number } => {
  const nA = a.length
  const nB = b.length
  const meanA = mean(a)
  const meanB = mean(b)
  const varianceA = variance(a, 1)
  const varianceB = variance(b, 1)
  const pooledStd = Math.sqrt(((nA - 1) * varianceA + (nB - 1) * varianceB) / (nA + nB - 2))
  const t = (meanA - meanB) / (pooledStd * Math.sqrt(1 / nA + 1 / nB))
  const pValue = 2 * (1 - normalCdf(Math.abs(t)))
  return { t, pValue }
}

export const ttest_ind = ttest

export const normalCdf = (x: number): number => {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const sign = x < 0 ? -1 : 1
  const scaled = Math.abs(x) / Math.SQRT2
  const t = 1 / (1 + p * scaled)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-scaled * scaled)
  return 0.5 * (1 + sign * y)
}

export const normalPdf = (x: number, mu = 0, sigma = 1): number => {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

export const norm = {
  cdf: normalCdf,
  pdf: normalPdf
}

export const kde = (v: Vec, x: Vec, bandwidth?: number): Vec => {
  const n = v.length
  const h = bandwidth ?? (1.06 * std(v) * Math.pow(n, -0.2))
  const result = new Float64Array(x.length)
  const coefficient = 1 / (n * h * Math.sqrt(2 * Math.PI))
  for (let i = 0; i < x.length; i++) {
    let density = 0
    for (let j = 0; j < n; j++) {
      const u = (x[i] - v[j]) / h
      density += Math.exp(-0.5 * u * u)
    }
    result[i] = density * coefficient
  }
  return result
}

export const gaussian_kde = kde

export const linreg = (x: Vec, y: Vec): { slope: number; intercept: number; r2: number } => {
  const avgX = mean(x)
  const avgY = mean(y)
  let ssxy = 0
  let ssxx = 0
  let ssyy = 0
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - avgX
    const dy = y[i] - avgY
    ssxy += dx * dy
    ssxx += dx * dx
    ssyy += dy * dy
  }
  const slope = ssxy / ssxx
  const intercept = avgY - slope * avgX
  const r2 = (ssxy * ssxy) / (ssxx * ssyy)
  return { slope, intercept, r2 }
}

export const linregress = linreg

export const zscore = (v: Vec): Vec => {
  const avg = mean(v)
  const sigma = std(v)
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = (v[i] - avg) / sigma
  return result
}

export const chiSquared = (observed: Matrix): { stat: number; pValue: number } => {
  const { rows, cols } = observed
  const rowSums = npLinalg.sumRows(observed)
  const colSums = npLinalg.sumCols(observed)
  const total = sum(rowSums)
  let chi2 = 0
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const expected = rowSums[i] * colSums[j] / total
      const actual = observed.data[i * cols + j]
      chi2 += (actual - expected) * (actual - expected) / expected
    }
  }
  const degreesOfFreedom = (rows - 1) * (cols - 1)
  const z = Math.pow(chi2 / degreesOfFreedom, 1 / 3) - (1 - 2 / (9 * degreesOfFreedom))
  const pValue = 1 - normalCdf(z / Math.sqrt(2 / (9 * degreesOfFreedom)))
  return { stat: chi2, pValue }
}

export const chi2_contingency = chiSquared
