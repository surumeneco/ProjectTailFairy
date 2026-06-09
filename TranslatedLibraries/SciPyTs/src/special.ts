import { max, type Vec } from '@project-tail-fairy/numpy-ts'

export const sigmoid = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = 1 / (1 + Math.exp(-v[i]))
  return result
}

export const expit = sigmoid

export const softmax = (v: Vec): Vec => {
  const maxValue = max(v)
  const result = new Float64Array(v.length)
  let sum = 0
  for (let i = 0; i < v.length; i++) {
    result[i] = Math.exp(v[i] - maxValue)
    sum += result[i]
  }
  for (let i = 0; i < v.length; i++) result[i] /= sum
  return result
}
