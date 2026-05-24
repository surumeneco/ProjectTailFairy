// Statistics library - Performance optimized
// Uses Float64Array for numerical precision

import type { Vec } from './vector'
import type { Matrix } from './matrix'
import * as vec from './vector'
import * as mat from './matrix'

export const sum = (v: Vec): number => {
  let s = 0
  for (let i = 0; i < v.length; i++) s += v[i]
  return s
}

export const mean = (v: Vec): number => sum(v) / v.length

export const variance = (v: Vec, ddof = 0): number => {
  const m = mean(v)
  let s = 0
  for (let i = 0; i < v.length; i++) { const d = v[i] - m; s += d * d }
  return s / (v.length - ddof)
}

export const std = (v: Vec, ddof = 0): number => Math.sqrt(variance(v, ddof))

export const cov = (x: Vec, y: Vec, ddof = 0): number => {
  const mx = mean(x), my = mean(y)
  let s = 0
  for (let i = 0; i < x.length; i++) s += (x[i] - mx) * (y[i] - my)
  return s / (x.length - ddof)
}

export const corrcoef = (x: Vec, y: Vec): number => cov(x, y) / (std(x) * std(y))

// Covariance matrix from data matrix (rows = samples, cols = features)
export const covMatrix = (data: Matrix, ddof = 0): Matrix => {
  const n = data.rows, p = data.cols
  const means = mat.meanCols(data)
  const C = mat.mat(p, p)
  for (let i = 0; i < p; i++) {
    for (let j = i; j < p; j++) {
      let s = 0
      for (let k = 0; k < n; k++) {
        s += (data.data[k * p + i] - means[i]) * (data.data[k * p + j] - means[j])
      }
      s /= (n - ddof)
      C.data[i * p + j] = s
      C.data[j * p + i] = s
    }
  }
  return C
}

// Correlation matrix
export const corrMatrix = (data: Matrix): Matrix => {
  const C = covMatrix(data)
  const p = C.rows
  const stds = new Float64Array(p)
  for (let i = 0; i < p; i++) stds[i] = Math.sqrt(C.data[i * p + i])
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      C.data[i * p + j] /= stds[i] * stds[j]
    }
  }
  return C
}

export const median = (v: Vec): number => {
  const s = vec.sort(v)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export const percentile = (v: Vec, p: number): number => {
  const s = vec.sort(v)
  const i = (p / 100) * (s.length - 1)
  const lo = Math.floor(i), hi = Math.ceil(i)
  return lo === hi ? s[lo] : s[lo] * (hi - i) + s[hi] * (i - lo)
}

export const quantile = (v: Vec, q: number): number => percentile(v, q * 100)

export const iqr = (v: Vec): number => percentile(v, 75) - percentile(v, 25)

export const mode = (v: Vec): number => {
  const counts = new Map<number, number>()
  let maxCount = 0, modeVal = v[0]
  for (let i = 0; i < v.length; i++) {
    const c = (counts.get(v[i]) || 0) + 1
    counts.set(v[i], c)
    if (c > maxCount) { maxCount = c; modeVal = v[i] }
  }
  return modeVal
}

export const skewness = (v: Vec): number => {
  const m = mean(v), s = std(v, 0)
  let sk = 0
  for (let i = 0; i < v.length; i++) sk += Math.pow((v[i] - m) / s, 3)
  return sk / v.length
}

export const kurtosis = (v: Vec): number => {
  const m = mean(v), s = std(v, 0)
  let ku = 0
  for (let i = 0; i < v.length; i++) ku += Math.pow((v[i] - m) / s, 4)
  return ku / v.length - 3
}

// Z-score normalization
export const zscore = (v: Vec): Vec => {
  const m = mean(v), s = std(v)
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = (v[i] - m) / s
  return r
}

// Min-max normalization
export const minmax = (v: Vec): Vec => {
  const mn = vec.min(v), mx = vec.max(v)
  const range = mx - mn
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = (v[i] - mn) / range
  return r
}

// Simple linear regression: returns {slope, intercept, r2}
export const linreg = (x: Vec, y: Vec): { slope: number; intercept: number; r2: number } => {
  const n = x.length
  const mx = mean(x), my = mean(y)
  let ssxy = 0, ssxx = 0, ssyy = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my
    ssxy += dx * dy; ssxx += dx * dx; ssyy += dy * dy
  }
  const slope = ssxy / ssxx
  const intercept = my - slope * mx
  const r2 = (ssxy * ssxy) / (ssxx * ssyy)
  return { slope, intercept, r2 }
}

// Polynomial regression (returns coefficients [a0, a1, ..., an] for y = a0 + a1*x + a2*x^2 + ...)
export const polyreg = (x: Vec, y: Vec, degree: number): Float64Array => {
  const n = x.length
  const m = degree + 1
  const X = mat.mat(n, m)
  for (let i = 0; i < n; i++) {
    let xi = 1
    for (let j = 0; j < m; j++) { X.data[i * m + j] = xi; xi *= x[i] }
  }
  // Normal equations: (X'X)^-1 X'y
  const Xt = mat.transpose(X)
  const XtX = mat.mul(Xt, X)
  const XtXinv = mat.inv(XtX)
  const Xty = new Float64Array(m)
  for (let j = 0; j < m; j++) {
    let s = 0
    for (let i = 0; i < n; i++) s += X.data[i * m + j] * y[i]
    Xty[j] = s
  }
  const coeffs = new Float64Array(m)
  for (let i = 0; i < m; i++) {
    let s = 0
    for (let j = 0; j < m; j++) s += XtXinv.data[i * m + j] * Xty[j]
    coeffs[i] = s
  }
  return coeffs
}

// Evaluate polynomial
export const polyval = (coeffs: Float64Array, x: number): number => {
  let y = 0, xi = 1
  for (let i = 0; i < coeffs.length; i++) { y += coeffs[i] * xi; xi *= x }
  return y
}

// Moving average
export const movingAvg = (v: Vec, window: number): Vec => {
  const r = new Float64Array(v.length - window + 1)
  let s = 0
  for (let i = 0; i < window; i++) s += v[i]
  r[0] = s / window
  for (let i = window; i < v.length; i++) {
    s += v[i] - v[i - window]
    r[i - window + 1] = s / window
  }
  return r
}

// Exponential moving average
export const ema = (v: Vec, alpha: number): Vec => {
  const r = new Float64Array(v.length)
  r[0] = v[0]
  for (let i = 1; i < v.length; i++) r[i] = alpha * v[i] + (1 - alpha) * r[i - 1]
  return r
}

// Weighted mean
export const weightedMean = (v: Vec, w: Vec): number => {
  let s = 0, ws = 0
  for (let i = 0; i < v.length; i++) { s += v[i] * w[i]; ws += w[i] }
  return s / ws
}

// Histogram (returns {bins, counts})
export const histogram = (v: Vec, numBins: number): { bins: Float64Array; counts: Float64Array } => {
  const mn = vec.min(v), mx = vec.max(v)
  const binWidth = (mx - mn) / numBins
  const bins = new Float64Array(numBins)
  const counts = new Float64Array(numBins)
  for (let i = 0; i < numBins; i++) bins[i] = mn + (i + 0.5) * binWidth
  for (let i = 0; i < v.length; i++) {
    let bin = Math.floor((v[i] - mn) / binWidth)
    if (bin >= numBins) bin = numBins - 1
    if (bin < 0) bin = 0
    counts[bin]++
  }
  return { bins, counts }
}

// Kernel density estimation (Gaussian kernel)
export const kde = (v: Vec, x: Vec, bandwidth?: number): Vec => {
  const n = v.length
  const h = bandwidth ?? (1.06 * std(v) * Math.pow(n, -0.2))
  const r = new Float64Array(x.length)
  const c = 1 / (n * h * Math.sqrt(2 * Math.PI))
  for (let i = 0; i < x.length; i++) {
    let s = 0
    for (let j = 0; j < n; j++) {
      const u = (x[i] - v[j]) / h
      s += Math.exp(-0.5 * u * u)
    }
    r[i] = s * c
  }
  return r
}

// PCA (returns {eigenvalues, eigenvectors, scores})
export const pca = (data: Matrix): { eigenvalues: Float64Array; eigenvectors: Matrix; scores: Matrix } => {
  const n = data.rows, p = data.cols
  // Center data
  const means = mat.meanCols(data)
  const centered = mat.mat(n, p)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      centered.data[i * p + j] = data.data[i * p + j] - means[j]
    }
  }
  // Covariance matrix
  const C = covMatrix(centered)
  // Eigendecomposition (simplified: uses QR iteration)
  const eigenvalues = mat.eig(C)
  // Sort eigenvalues descending
  const idx = vec.argsort(eigenvalues).reverse()
  const sortedEv = new Float64Array(p)
  for (let i = 0; i < p; i++) sortedEv[i] = eigenvalues[idx[i]]
  // Get eigenvectors via inverse iteration (simplified)
  const eigenvectors = mat.eye(p) // Placeholder - full impl would compute proper eigenvectors
  // Scores = centered data * eigenvectors
  const scores = mat.mul(centered, eigenvectors)
  return { eigenvalues: sortedEv, eigenvectors, scores }
}

// K-means clustering
export const kmeans = (data: Matrix, k: number, maxIter = 100): { centroids: Matrix; labels: number[] } => {
  const n = data.rows, p = data.cols
  // Random initialization
  const centroids = mat.mat(k, p)
  const used = new Set<number>()
  for (let i = 0; i < k; i++) {
    let idx: number
    do { idx = Math.floor(Math.random() * n) } while (used.has(idx))
    used.add(idx)
    for (let j = 0; j < p; j++) centroids.data[i * p + j] = data.data[idx * p + j]
  }
  const labels = new Array<number>(n).fill(0)
  for (let iter = 0; iter < maxIter; iter++) {
    // Assignment step
    let changed = false
    for (let i = 0; i < n; i++) {
      let minDist = Infinity, minK = 0
      for (let kk = 0; kk < k; kk++) {
        let d = 0
        for (let j = 0; j < p; j++) {
          const diff = data.data[i * p + j] - centroids.data[kk * p + j]
          d += diff * diff
        }
        if (d < minDist) { minDist = d; minK = kk }
      }
      if (labels[i] !== minK) { labels[i] = minK; changed = true }
    }
    if (!changed) break
    // Update step
    const counts = new Float64Array(k)
    for (let i = 0; i < k * p; i++) centroids.data[i] = 0
    for (let i = 0; i < n; i++) {
      const kk = labels[i]
      counts[kk]++
      for (let j = 0; j < p; j++) centroids.data[kk * p + j] += data.data[i * p + j]
    }
    for (let kk = 0; kk < k; kk++) {
      if (counts[kk] > 0) {
        for (let j = 0; j < p; j++) centroids.data[kk * p + j] /= counts[kk]
      }
    }
  }
  return { centroids, labels }
}

// t-test (two-sample, equal variance)
export const ttest = (a: Vec, b: Vec): { t: number; pValue: number } => {
  const na = a.length, nb = b.length
  const ma = mean(a), mb = mean(b)
  const va = variance(a, 1), vb = variance(b, 1)
  const sp = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2))
  const t = (ma - mb) / (sp * Math.sqrt(1 / na + 1 / nb))
  const df = na + nb - 2
  // Approximate p-value using normal distribution for large df
  const pValue = 2 * (1 - normalCdf(Math.abs(t)))
  return { t, pValue }
}

// Standard normal CDF approximation
export const normalCdf = (x: number): number => {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.SQRT2
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1 + sign * y)
}

// Standard normal PDF
export const normalPdf = (x: number, mu = 0, sigma = 1): number => {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

// Chi-squared test for independence
export const chiSquared = (observed: Matrix): { stat: number; pValue: number } => {
  const { rows, cols } = observed
  const rowSums = mat.sumRows(observed)
  const colSums = mat.sumCols(observed)
  const total = sum(rowSums)
  let chi2 = 0
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const exp = rowSums[i] * colSums[j] / total
      const obs = observed.data[i * cols + j]
      chi2 += (obs - exp) * (obs - exp) / exp
    }
  }
  const df = (rows - 1) * (cols - 1)
  // Approximate p-value (Wilson-Hilferty approximation)
  const k = df
  const z = Math.pow(chi2 / k, 1 / 3) - (1 - 2 / (9 * k))
  const pValue = 1 - normalCdf(z / Math.sqrt(2 / (9 * k)))
  return { stat: chi2, pValue }
}
