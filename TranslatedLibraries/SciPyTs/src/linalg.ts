import { linalg as npLinalg, type Matrix } from '@project-tail-fairy/numpy-ts'

export const lu = (m: Matrix): { L: Matrix; U: Matrix; P: number[]; parity: number } => {
  const n = m.rows
  const U = npLinalg.matClone(m)
  const L = npLinalg.eye(n)
  const P = Array.from({ length: n }, (_, i) => i)
  let parity = 1
  for (let k = 0; k < n; k++) {
    let maxValue = 0
    let maxIndex = k
    for (let i = k; i < n; i++) {
      const value = Math.abs(U.data[i * n + k])
      if (value > maxValue) {
        maxValue = value
        maxIndex = i
      }
    }
    if (maxIndex !== k) {
      ;[P[k], P[maxIndex]] = [P[maxIndex], P[k]]
      parity = -parity
      for (let j = 0; j < n; j++) {
        ;[U.data[k * n + j], U.data[maxIndex * n + j]] = [U.data[maxIndex * n + j], U.data[k * n + j]]
      }
      for (let j = 0; j < k; j++) {
        ;[L.data[k * n + j], L.data[maxIndex * n + j]] = [L.data[maxIndex * n + j], L.data[k * n + j]]
      }
    }
    const pivot = U.data[k * n + k]
    if (Math.abs(pivot) < 1e-12) continue
    for (let i = k + 1; i < n; i++) {
      const factor = U.data[i * n + k] / pivot
      L.data[i * n + k] = factor
      for (let j = k; j < n; j++) U.data[i * n + j] -= factor * U.data[k * n + j]
    }
  }
  return { L, U, P, parity }
}

export const expm = (m: Matrix): Matrix => {
  const n = m.rows
  const matrixNorm = npLinalg.norm(m)
  const s = Math.max(0, Math.ceil(Math.log2(matrixNorm / 5.4)))
  const scaled = npLinalg.scale(m, Math.pow(2, -s))
  const A2 = npLinalg.mul(scaled, scaled)
  const A4 = npLinalg.mul(A2, A2)
  const A6 = npLinalg.mul(A2, A4)
  const I = npLinalg.eye(n)
  const b = [64764752532480000, 32382376266240000, 7771770303897600, 1187353796428800, 129060195264000, 10559470521600, 670442572800, 33522128640, 1323241920, 40840800, 960960, 16380, 182, 1]
  const U2 = npLinalg.mul(
    scaled,
    npLinalg.add(
      npLinalg.add(
        npLinalg.mul(
          A6,
          npLinalg.add(npLinalg.add(npLinalg.scale(A6, b[13]), npLinalg.scale(A4, b[11])), npLinalg.scale(A2, b[9]))
        ),
        npLinalg.scale(A4, b[5])
      ),
      npLinalg.add(npLinalg.scale(A2, b[3]), npLinalg.scale(I, b[1]))
    )
  )
  const V2 = npLinalg.add(
    npLinalg.mul(
      A6,
      npLinalg.add(npLinalg.add(npLinalg.scale(A6, b[12]), npLinalg.scale(A4, b[10])), npLinalg.scale(A2, b[8]))
    ),
    npLinalg.add(npLinalg.scale(A4, b[4]), npLinalg.add(npLinalg.scale(A2, b[2]), npLinalg.scale(I, b[0])))
  )
  let F = npLinalg.mul(npLinalg.inv(npLinalg.sub(V2, U2)), npLinalg.add(V2, U2))
  for (let k = 0; k < s; k++) F = npLinalg.mul(F, F)
  return F
}
