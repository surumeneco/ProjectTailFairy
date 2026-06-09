// Vector operations library - Performance optimized
// Uses Float64Array for numerical precision and performance

export type Vec = Float64Array

export const vec = (n: number, data?: number[]): Vec => data ? new Float64Array(data) : new Float64Array(n)
export const vecFromArr = (arr: number[]): Vec => new Float64Array(arr)
export const vecClone = (v: Vec): Vec => new Float64Array(v)

export const zeros = (n: number): Vec => new Float64Array(n)
export const ones = (n: number): Vec => new Float64Array(n).fill(1)
export const fill = (n: number, value: number): Vec => new Float64Array(n).fill(value)

export const arange = (start: number, end: number, step = 1): Vec => {
  const n = Math.ceil((end - start) / step)
  const result = new Float64Array(n)
  for (let i = 0; i < n; i++) result[i] = start + i * step
  return result
}

export const linspace = (start: number, end: number, n: number): Vec => {
  const result = new Float64Array(n)
  const delta = (end - start) / (n - 1)
  for (let i = 0; i < n; i++) result[i] = start + i * delta
  return result
}

export const add = (a: Vec, b: Vec): Vec => {
  const result = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) result[i] = a[i] + b[i]
  return result
}

export const sub = (a: Vec, b: Vec): Vec => {
  const result = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) result[i] = a[i] - b[i]
  return result
}

export const mul = (a: Vec, b: Vec): Vec => {
  const result = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) result[i] = a[i] * b[i]
  return result
}

export const div = (a: Vec, b: Vec): Vec => {
  const result = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) result[i] = a[i] / b[i]
  return result
}

export const scale = (v: Vec, scalar: number): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = v[i] * scalar
  return result
}

export const addScalar = (v: Vec, scalar: number): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = v[i] + scalar
  return result
}

export const dot = (a: Vec, b: Vec): number => {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

export const cross = (a: Vec, b: Vec): Vec => {
  return new Float64Array([
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ])
}

export const norm = (v: Vec): number => Math.sqrt(dot(v, v))
export const norm2 = (v: Vec): number => dot(v, v)

export const normalize = (v: Vec): Vec => {
  const length = norm(v)
  return length > 1e-12 ? scale(v, 1 / length) : vecClone(v)
}

export const distance = (a: Vec, b: Vec): number => norm(sub(a, b))
export const distance2 = (a: Vec, b: Vec): number => norm2(sub(a, b))

export const sum = (v: Vec): number => {
  let total = 0
  for (let i = 0; i < v.length; i++) total += v[i]
  return total
}

export const mean = (v: Vec): number => sum(v) / v.length

export const min = (v: Vec): number => {
  let current = v[0]
  for (let i = 1; i < v.length; i++) if (v[i] < current) current = v[i]
  return current
}

export const max = (v: Vec): number => {
  let current = v[0]
  for (let i = 1; i < v.length; i++) if (v[i] > current) current = v[i]
  return current
}

export const argmin = (v: Vec): number => {
  let current = 0
  for (let i = 1; i < v.length; i++) if (v[i] < v[current]) current = i
  return current
}

export const argmax = (v: Vec): number => {
  let current = 0
  for (let i = 1; i < v.length; i++) if (v[i] > v[current]) current = i
  return current
}

export const abs = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.abs(v[i])
  return result
}

export const sqrt = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.sqrt(v[i])
  return result
}

export const pow = (v: Vec, power: number): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.pow(v[i], power)
  return result
}

export const exp = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.exp(v[i])
  return result
}

export const log = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.log(v[i])
  return result
}

export const sin = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.sin(v[i])
  return result
}

export const cos = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.cos(v[i])
  return result
}

export const tan = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.tan(v[i])
  return result
}

export const tanh = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = Math.tanh(v[i])
  return result
}

export const clip = (v: Vec, low: number, high: number): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = v[i] < low ? low : v[i] > high ? high : v[i]
  return result
}

export const cumsum = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  result[0] = v[0]
  for (let i = 1; i < v.length; i++) result[i] = result[i - 1] + v[i]
  return result
}

export const cumprod = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  result[0] = v[0]
  for (let i = 1; i < v.length; i++) result[i] = result[i - 1] * v[i]
  return result
}

export const diff = (v: Vec): Vec => {
  const result = new Float64Array(v.length - 1)
  for (let i = 0; i < result.length; i++) result[i] = v[i + 1] - v[i]
  return result
}

export const concat = (...vectors: Vec[]): Vec => {
  let length = 0
  for (const current of vectors) length += current.length
  const result = new Float64Array(length)
  let offset = 0
  for (const current of vectors) {
    result.set(current, offset)
    offset += current.length
  }
  return result
}

export const slice = (v: Vec, start: number, end?: number): Vec => v.slice(start, end)

export const reverse = (v: Vec): Vec => {
  const result = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) result[i] = v[v.length - 1 - i]
  return result
}

export const sort = (v: Vec): Vec => new Float64Array([...v].sort((a, b) => a - b))

export const argsort = (v: Vec): number[] => {
  const indices = Array.from({ length: v.length }, (_, index) => index)
  indices.sort((a, b) => v[a] - v[b])
  return indices
}

export const angle = (a: Vec, b: Vec): number => Math.acos(dot(a, b) / (norm(a) * norm(b)))
export const project = (a: Vec, b: Vec): Vec => scale(b, dot(a, b) / dot(b, b))
export const reflect = (a: Vec, n: Vec): Vec => sub(a, scale(n, 2 * dot(a, n)))
export const lerp = (a: Vec, b: Vec, t: number): Vec => add(scale(a, 1 - t), scale(b, t))

export const slerp = (a: Vec, b: Vec, t: number): Vec => {
  const theta = angle(a, b)
  if (Math.abs(theta) < 1e-12) return lerp(a, b, t)
  const sinTheta = Math.sin(theta)
  return add(scale(a, Math.sin((1 - t) * theta) / sinTheta), scale(b, Math.sin(t * theta) / sinTheta))
}

export const convolve = (a: Vec, b: Vec): Vec => {
  const n = a.length + b.length - 1
  const result = new Float64Array(n)
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j]
    }
  }
  return result
}

export const correlate = (a: Vec, b: Vec): Vec => convolve(a, reverse(b))
