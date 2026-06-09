// Matrix operations library - Performance optimized
// Uses Float64Array for numerical precision and performance

export type Matrix = { data: Float64Array; rows: number; cols: number }

export const mat = (rows: number, cols: number, data?: number[] | Float64Array): Matrix => {
  const d = data ? (data instanceof Float64Array ? data : new Float64Array(data)) : new Float64Array(rows * cols)
  return { data: d, rows, cols }
}

export const matFromArr = (arr: number[][]): Matrix => {
  const rows = arr.length, cols = arr[0]?.length || 0
  const d = new Float64Array(rows * cols)
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) d[i * cols + j] = arr[i][j]
  return { data: d, rows, cols }
}

export const matToArr = (m: Matrix): number[][] => {
  const r: number[][] = []
  for (let i = 0; i < m.rows; i++) {
    r[i] = []
    for (let j = 0; j < m.cols; j++) r[i][j] = m.data[i * m.cols + j]
  }
  return r
}

export const matGet = (m: Matrix, i: number, j: number): number => m.data[i * m.cols + j]
export const matSet = (m: Matrix, i: number, j: number, v: number): void => { m.data[i * m.cols + j] = v }

export const matClone = (m: Matrix): Matrix => mat(m.rows, m.cols, new Float64Array(m.data))

export const zeros = (rows: number, cols: number): Matrix => mat(rows, cols)
export const ones = (rows: number, cols: number): Matrix => {
  const d = new Float64Array(rows * cols).fill(1)
  return { data: d, rows, cols }
}

export const eye = (n: number): Matrix => {
  const m = mat(n, n)
  for (let i = 0; i < n; i++) m.data[i * n + i] = 1
  return m
}

export const diag = (v: number[] | Float64Array): Matrix => {
  const n = v.length, m = mat(n, n)
  for (let i = 0; i < n; i++) m.data[i * n + i] = v[i]
  return m
}

export const transpose = (m: Matrix): Matrix => {
  const r = mat(m.cols, m.rows)
  for (let i = 0; i < m.rows; i++) for (let j = 0; j < m.cols; j++) r.data[j * r.cols + i] = m.data[i * m.cols + j]
  return r
}

export const add = (a: Matrix, b: Matrix): Matrix => {
  const r = mat(a.rows, a.cols)
  for (let i = 0; i < a.data.length; i++) r.data[i] = a.data[i] + b.data[i]
  return r
}

export const sub = (a: Matrix, b: Matrix): Matrix => {
  const r = mat(a.rows, a.cols)
  for (let i = 0; i < a.data.length; i++) r.data[i] = a.data[i] - b.data[i]
  return r
}

export const scale = (m: Matrix, s: number): Matrix => {
  const r = mat(m.rows, m.cols)
  for (let i = 0; i < m.data.length; i++) r.data[i] = m.data[i] * s
  return r
}

export const mul = (a: Matrix, b: Matrix): Matrix => {
  const r = mat(a.rows, b.cols)
  const ac = a.cols, bc = b.cols
  for (let i = 0; i < a.rows; i++) {
    const ri = i * bc, ai = i * ac
    for (let k = 0; k < ac; k++) {
      const aik = a.data[ai + k], bk = k * bc
      for (let j = 0; j < bc; j++) r.data[ri + j] += aik * b.data[bk + j]
    }
  }
  return r
}

export const hadamard = (a: Matrix, b: Matrix): Matrix => {
  const r = mat(a.rows, a.cols)
  for (let i = 0; i < a.data.length; i++) r.data[i] = a.data[i] * b.data[i]
  return r
}

export const trace = (m: Matrix): number => {
  let t = 0
  const n = Math.min(m.rows, m.cols)
  for (let i = 0; i < n; i++) t += m.data[i * m.cols + i]
  return t
}

// LU decomposition with partial pivoting, returns {L, U, P, parity}
export const lu = (m: Matrix): { L: Matrix; U: Matrix; P: number[]; parity: number } => {
  const n = m.rows
  const U = matClone(m), L = eye(n)
  const P = Array.from({ length: n }, (_, i) => i)
  let parity = 1
  for (let k = 0; k < n; k++) {
    let maxVal = 0, maxIdx = k
    for (let i = k; i < n; i++) {
      const v = Math.abs(U.data[i * n + k])
      if (v > maxVal) { maxVal = v; maxIdx = i }
    }
    if (maxIdx !== k) {
      [P[k], P[maxIdx]] = [P[maxIdx], P[k]]
      parity = -parity
      for (let j = 0; j < n; j++) {
        [U.data[k * n + j], U.data[maxIdx * n + j]] = [U.data[maxIdx * n + j], U.data[k * n + j]]
      }
      for (let j = 0; j < k; j++) {
        [L.data[k * n + j], L.data[maxIdx * n + j]] = [L.data[maxIdx * n + j], L.data[k * n + j]]
      }
    }
    const ukk = U.data[k * n + k]
    if (Math.abs(ukk) < 1e-12) continue
    for (let i = k + 1; i < n; i++) {
      const f = U.data[i * n + k] / ukk
      L.data[i * n + k] = f
      for (let j = k; j < n; j++) U.data[i * n + j] -= f * U.data[k * n + j]
    }
  }
  return { L, U, P, parity }
}

export const det = (m: Matrix): number => {
  const { U, parity } = lu(m)
  let d = parity
  for (let i = 0; i < m.rows; i++) d *= U.data[i * m.cols + i]
  return d
}

// Solve Ax = b using LU decomposition
export const solve = (A: Matrix, b: number[] | Float64Array): Float64Array => {
  const { L, U, P } = lu(A)
  const n = A.rows
  const pb = new Float64Array(n)
  for (let i = 0; i < n; i++) pb[i] = b[P[i]]
  // Forward substitution Ly = pb
  const y = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    y[i] = pb[i]
    for (let j = 0; j < i; j++) y[i] -= L.data[i * n + j] * y[j]
  }
  // Back substitution Ux = y
  const x = new Float64Array(n)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = y[i]
    for (let j = i + 1; j < n; j++) x[i] -= U.data[i * n + j] * x[j]
    x[i] /= U.data[i * n + i]
  }
  return x
}

export const inv = (m: Matrix): Matrix => {
  const n = m.rows
  const r = mat(n, n)
  const e = new Float64Array(n)
  for (let j = 0; j < n; j++) {
    e.fill(0); e[j] = 1
    const col = solve(m, e)
    for (let i = 0; i < n; i++) r.data[i * n + j] = col[i]
  }
  return r
}

// Frobenius norm
export const norm = (m: Matrix): number => {
  let s = 0
  for (let i = 0; i < m.data.length; i++) s += m.data[i] * m.data[i]
  return Math.sqrt(s)
}

// Power iteration for dominant eigenvalue/vector
export const powerIteration = (m: Matrix, maxIter = 100, tol = 1e-10): { eigenvalue: number; eigenvector: Float64Array } => {
  const n = m.rows
  let v = new Float64Array(n).fill(1 / Math.sqrt(n))
  let lambda = 0
  for (let iter = 0; iter < maxIter; iter++) {
    const Av = new Float64Array(n)
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Av[i] += m.data[i * n + j] * v[j]
    let nrm = 0
    for (let i = 0; i < n; i++) nrm += Av[i] * Av[i]
    nrm = Math.sqrt(nrm)
    const newLambda = nrm
    for (let i = 0; i < n; i++) Av[i] /= nrm
    if (Math.abs(newLambda - lambda) < tol) return { eigenvalue: newLambda, eigenvector: Av }
    v = Av; lambda = newLambda
  }
  return { eigenvalue: lambda, eigenvector: v }
}

// QR decomposition using Gram-Schmidt
export const qr = (m: Matrix): { Q: Matrix; R: Matrix } => {
  const { rows, cols } = m
  const Q = mat(rows, cols), R = mat(cols, cols)
  for (let j = 0; j < cols; j++) {
    const v = new Float64Array(rows)
    for (let i = 0; i < rows; i++) v[i] = m.data[i * cols + j]
    for (let k = 0; k < j; k++) {
      let d = 0
      for (let i = 0; i < rows; i++) d += Q.data[i * cols + k] * m.data[i * cols + j]
      R.data[k * cols + j] = d
      for (let i = 0; i < rows; i++) v[i] -= d * Q.data[i * cols + k]
    }
    let nrm = 0
    for (let i = 0; i < rows; i++) nrm += v[i] * v[i]
    nrm = Math.sqrt(nrm)
    R.data[j * cols + j] = nrm
    if (nrm > 1e-12) for (let i = 0; i < rows; i++) Q.data[i * cols + j] = v[i] / nrm
  }
  return { Q, R }
}

// Eigenvalues via QR algorithm (for symmetric matrices)
export const eig = (m: Matrix, maxIter = 100): Float64Array => {
  let A = matClone(m)
  const n = A.rows
  for (let iter = 0; iter < maxIter; iter++) {
    const { Q, R } = qr(A)
    A = mul(R, Q)
  }
  const ev = new Float64Array(n)
  for (let i = 0; i < n; i++) ev[i] = A.data[i * n + i]
  return ev
}

// Cholesky decomposition for positive definite matrices
export const cholesky = (m: Matrix): Matrix => {
  const n = m.rows
  const L = mat(n, n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = 0
      for (let k = 0; k < j; k++) s += L.data[i * n + k] * L.data[j * n + k]
      L.data[i * n + j] = i === j ? Math.sqrt(m.data[i * n + i] - s) : (m.data[i * n + j] - s) / L.data[j * n + j]
    }
  }
  return L
}

// Matrix exponential via Pade approximation (order 6)
export const expm = (m: Matrix): Matrix => {
  const n = m.rows
  const nrm = norm(m)
  const s = Math.max(0, Math.ceil(Math.log2(nrm / 5.4)))
  const A = scale(m, Math.pow(2, -s))
  const A2 = mul(A, A), A4 = mul(A2, A2), A6 = mul(A2, A4)
  const I = eye(n)
  const b = [64764752532480000, 32382376266240000, 7771770303897600, 1187353796428800, 129060195264000, 10559470521600, 670442572800, 33522128640, 1323241920, 40840800, 960960, 16380, 182, 1]
  const U = add(add(add(scale(A6, b[13]), scale(A4, b[11])), scale(A2, b[9])), scale(I, b[7]))
  const V = add(add(add(scale(A6, b[12]), scale(A4, b[10])), scale(A2, b[8])), scale(I, b[6]))
  const U2 = mul(A, add(add(mul(A6, add(add(scale(A6, b[13]), scale(A4, b[11])), scale(A2, b[9]))), scale(A4, b[5])), add(scale(A2, b[3]), scale(I, b[1]))))
  const V2 = add(mul(A6, add(add(scale(A6, b[12]), scale(A4, b[10])), scale(A2, b[8]))), add(scale(A4, b[4]), add(scale(A2, b[2]), scale(I, b[0]))))
  let F = mul(inv(sub(V2, U2)), add(V2, U2))
  for (let k = 0; k < s; k++) F = mul(F, F)
  return F
}

export const sumRows = (m: Matrix): Float64Array => {
  const r = new Float64Array(m.rows)
  for (let i = 0; i < m.rows; i++) for (let j = 0; j < m.cols; j++) r[i] += m.data[i * m.cols + j]
  return r
}

export const sumCols = (m: Matrix): Float64Array => {
  const r = new Float64Array(m.cols)
  for (let i = 0; i < m.rows; i++) for (let j = 0; j < m.cols; j++) r[j] += m.data[i * m.cols + j]
  return r
}

export const meanRows = (m: Matrix): Float64Array => {
  const r = sumRows(m)
  for (let i = 0; i < r.length; i++) r[i] /= m.cols
  return r
}

export const meanCols = (m: Matrix): Float64Array => {
  const r = sumCols(m)
  for (let i = 0; i < r.length; i++) r[i] /= m.rows
  return r
}

// Outer product of two vectors
export const outer = (a: number[] | Float64Array, b: number[] | Float64Array): Matrix => {
  const m = a.length, n = b.length
  const r = mat(m, n)
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) r.data[i * n + j] = a[i] * b[j]
  return r
}

// Kronecker product
export const kron = (a: Matrix, b: Matrix): Matrix => {
  const r = mat(a.rows * b.rows, a.cols * b.cols)
  for (let i = 0; i < a.rows; i++) {
    for (let j = 0; j < a.cols; j++) {
      const aij = a.data[i * a.cols + j]
      for (let k = 0; k < b.rows; k++) {
        for (let l = 0; l < b.cols; l++) {
          r.data[(i * b.rows + k) * r.cols + (j * b.cols + l)] = aij * b.data[k * b.cols + l]
        }
      }
    }
  }
  return r
}
