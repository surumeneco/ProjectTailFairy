import type { Matrix } from '@project-tail-fairy/numpy-ts'

export const powerIteration = (m: Matrix, maxIter = 100, tol = 1e-10): { eigenvalue: number; eigenvector: Float64Array } => {
  const n = m.rows
  let v = new Float64Array(n).fill(1 / Math.sqrt(n))
  let lambda = 0
  for (let iter = 0; iter < maxIter; iter++) {
    const Av = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) Av[i] += m.data[i * n + j] * v[j]
    }
    let nextLambda = 0
    for (let i = 0; i < n; i++) nextLambda += Av[i] * Av[i]
    nextLambda = Math.sqrt(nextLambda)
    for (let i = 0; i < n; i++) Av[i] /= nextLambda
    if (Math.abs(nextLambda - lambda) < tol) return { eigenvalue: nextLambda, eigenvector: Av }
    v = Av
    lambda = nextLambda
  }
  return { eigenvalue: lambda, eigenvector: v }
}
