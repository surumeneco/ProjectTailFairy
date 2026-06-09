// Vector operations library - Performance optimized
// Uses Float64Array for numerical precision and performance

export type Vec = Float64Array

export const vec = (n: number, data?: number[]): Vec => data ? new Float64Array(data) : new Float64Array(n)
export const vecFromArr = (arr: number[]): Vec => new Float64Array(arr)
export const vecClone = (v: Vec): Vec => new Float64Array(v)

export const zeros = (n: number): Vec => new Float64Array(n)
export const ones = (n: number): Vec => new Float64Array(n).fill(1)
export const fill = (n: number, val: number): Vec => new Float64Array(n).fill(val)

export const arange = (start: number, end: number, step = 1): Vec => {
  const n = Math.ceil((end - start) / step)
  const r = new Float64Array(n)
  for (let i = 0; i < n; i++) r[i] = start + i * step
  return r
}

export const linspace = (start: number, end: number, n: number): Vec => {
  const r = new Float64Array(n)
  const d = (end - start) / (n - 1)
  for (let i = 0; i < n; i++) r[i] = start + i * d
  return r
}

export const add = (a: Vec, b: Vec): Vec => {
  const r = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) r[i] = a[i] + b[i]
  return r
}

export const sub = (a: Vec, b: Vec): Vec => {
  const r = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) r[i] = a[i] - b[i]
  return r
}

export const mul = (a: Vec, b: Vec): Vec => {
  const r = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) r[i] = a[i] * b[i]
  return r
}

export const div = (a: Vec, b: Vec): Vec => {
  const r = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) r[i] = a[i] / b[i]
  return r
}

export const scale = (v: Vec, s: number): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = v[i] * s
  return r
}

export const addScalar = (v: Vec, s: number): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = v[i] + s
  return r
}

export const dot = (a: Vec, b: Vec): number => {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
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
  const n = norm(v)
  return n > 1e-12 ? scale(v, 1 / n) : vecClone(v)
}

export const distance = (a: Vec, b: Vec): number => norm(sub(a, b))
export const distance2 = (a: Vec, b: Vec): number => norm2(sub(a, b))

export const sum = (v: Vec): number => {
  let s = 0
  for (let i = 0; i < v.length; i++) s += v[i]
  return s
}

export const mean = (v: Vec): number => sum(v) / v.length

export const min = (v: Vec): number => {
  let m = v[0]
  for (let i = 1; i < v.length; i++) if (v[i] < m) m = v[i]
  return m
}

export const max = (v: Vec): number => {
  let m = v[0]
  for (let i = 1; i < v.length; i++) if (v[i] > m) m = v[i]
  return m
}

export const argmin = (v: Vec): number => {
  let m = 0
  for (let i = 1; i < v.length; i++) if (v[i] < v[m]) m = i
  return m
}

export const argmax = (v: Vec): number => {
  let m = 0
  for (let i = 1; i < v.length; i++) if (v[i] > v[m]) m = i
  return m
}

export const abs = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.abs(v[i])
  return r
}

export const sqrt = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.sqrt(v[i])
  return r
}

export const pow = (v: Vec, p: number): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.pow(v[i], p)
  return r
}

export const exp = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.exp(v[i])
  return r
}

export const log = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.log(v[i])
  return r
}

export const sin = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.sin(v[i])
  return r
}

export const cos = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.cos(v[i])
  return r
}

export const tan = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.tan(v[i])
  return r
}

export const tanh = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = Math.tanh(v[i])
  return r
}

export const sigmoid = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = 1 / (1 + Math.exp(-v[i]))
  return r
}

export const relu = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = v[i] > 0 ? v[i] : 0
  return r
}

export const leakyRelu = (v: Vec, alpha = 0.01): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = v[i] > 0 ? v[i] : alpha * v[i]
  return r
}

export const softmax = (v: Vec): Vec => {
  const m = max(v)
  const e = new Float64Array(v.length)
  let s = 0
  for (let i = 0; i < v.length; i++) { e[i] = Math.exp(v[i] - m); s += e[i] }
  for (let i = 0; i < v.length; i++) e[i] /= s
  return e
}

export const clip = (v: Vec, lo: number, hi: number): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = v[i] < lo ? lo : v[i] > hi ? hi : v[i]
  return r
}

// Cumulative sum
export const cumsum = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  r[0] = v[0]
  for (let i = 1; i < v.length; i++) r[i] = r[i - 1] + v[i]
  return r
}

// Cumulative product
export const cumprod = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  r[0] = v[0]
  for (let i = 1; i < v.length; i++) r[i] = r[i - 1] * v[i]
  return r
}

// First difference
export const diff = (v: Vec): Vec => {
  const r = new Float64Array(v.length - 1)
  for (let i = 0; i < r.length; i++) r[i] = v[i + 1] - v[i]
  return r
}

// Concatenate vectors
export const concat = (...vecs: Vec[]): Vec => {
  let len = 0
  for (const v of vecs) len += v.length
  const r = new Float64Array(len)
  let off = 0
  for (const v of vecs) { r.set(v, off); off += v.length }
  return r
}

// Slice
export const slice = (v: Vec, start: number, end?: number): Vec => v.slice(start, end)

// Reverse
export const reverse = (v: Vec): Vec => {
  const r = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) r[i] = v[v.length - 1 - i]
  return r
}

// Sort (ascending)
export const sort = (v: Vec): Vec => new Float64Array([...v].sort((a, b) => a - b))

// Argsort (indices that would sort the array)
export const argsort = (v: Vec): number[] => {
  const idx = Array.from({ length: v.length }, (_, i) => i)
  idx.sort((a, b) => v[a] - v[b])
  return idx
}

// Angle between vectors
export const angle = (a: Vec, b: Vec): number => Math.acos(dot(a, b) / (norm(a) * norm(b)))

// Project a onto b
export const project = (a: Vec, b: Vec): Vec => scale(b, dot(a, b) / dot(b, b))

// Reflect a across plane with normal n
export const reflect = (a: Vec, n: Vec): Vec => sub(a, scale(n, 2 * dot(a, n)))

// Linear interpolation
export const lerp = (a: Vec, b: Vec, t: number): Vec => add(scale(a, 1 - t), scale(b, t))

// Spherical linear interpolation
export const slerp = (a: Vec, b: Vec, t: number): Vec => {
  const theta = angle(a, b)
  if (Math.abs(theta) < 1e-12) return lerp(a, b, t)
  const st = Math.sin(theta)
  return add(scale(a, Math.sin((1 - t) * theta) / st), scale(b, Math.sin(t * theta) / st))
}

// Random uniform [0, 1)
export const rand = (n: number): Vec => {
  const r = new Float64Array(n)
  for (let i = 0; i < n; i++) r[i] = Math.random()
  return r
}

// Random normal (Box-Muller)
export const randn = (n: number): Vec => {
  const r = new Float64Array(n)
  for (let i = 0; i < n; i += 2) {
    const u1 = Math.random(), u2 = Math.random()
    const s = Math.sqrt(-2 * Math.log(u1))
    r[i] = s * Math.cos(2 * Math.PI * u2)
    if (i + 1 < n) r[i + 1] = s * Math.sin(2 * Math.PI * u2)
  }
  return r
}

// Convolve (full)
export const convolve = (a: Vec, b: Vec): Vec => {
  const n = a.length + b.length - 1
  const r = new Float64Array(n)
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) r[i + j] += a[i] * b[j]
  return r
}

// Cross-correlation
export const correlate = (a: Vec, b: Vec): Vec => convolve(a, reverse(b))
