import type { Vec } from '@project-tail-fairy/numpy-ts'

export const relu = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = v[i] > 0 ? v[i] : 0
  return result
}

export const leakyRelu = (v: Vec, alpha = 0.01): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = v[i] > 0 ? v[i] : alpha * v[i]
  return result
}
