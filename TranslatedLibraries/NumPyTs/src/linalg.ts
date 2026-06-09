/**
 * NumPy の `numpy.linalg` 公開エントリです。
 */

export type { Matrix } from "./matrix";
export {
  add,
  cholesky,
  det,
  diag,
  eig,
  eye,
  hadamard,
  inv,
  kron,
  mat,
  matClone,
  matFromArr,
  matGet,
  mul as matmul,
  matSet,
  matToArr,
  meanCols,
  meanRows,
  mul,
  norm,
  ones,
  outer,
  qr,
  scale,
  solve,
  sub,
  sumCols,
  sumRows,
  trace,
  transpose,
  zeros
} from "./matrix";
