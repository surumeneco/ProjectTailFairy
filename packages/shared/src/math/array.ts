// Array utility library - Performance optimized
// NumPy-like array operations for TypeScript

export type NDArray = { data: Float64Array; shape: number[] }

export const ndarray = (shape: number[], data?: number[] | Float64Array): NDArray => {
  let size = 1
  for (const s of shape) size *= s
  const d = data ? (data instanceof Float64Array ? data : new Float64Array(data)) : new Float64Array(size)
  return { data: d, shape: [...shape] }
}

export const zeros = (shape: number[]): NDArray => ndarray(shape)
export const ones = (shape: number[]): NDArray => {
  const arr = ndarray(shape)
  arr.data.fill(1)
  return arr
}

export const full = (shape: number[], value: number): NDArray => {
  const arr = ndarray(shape)
  arr.data.fill(value)
  return arr
}

export const arange = (start: number, end: number, step = 1): NDArray => {
  const n = Math.ceil((end - start) / step)
  const data = new Float64Array(n)
  for (let i = 0; i < n; i++) data[i] = start + i * step
  return { data, shape: [n] }
}

export const linspace = (start: number, end: number, n: number): NDArray => {
  const data = new Float64Array(n)
  const d = (end - start) / (n - 1)
  for (let i = 0; i < n; i++) data[i] = start + i * d
  return { data, shape: [n] }
}

export const eye = (n: number): NDArray => {
  const data = new Float64Array(n * n)
  for (let i = 0; i < n; i++) data[i * n + i] = 1
  return { data, shape: [n, n] }
}

export const diag = (v: Float64Array | number[]): NDArray => {
  const n = v.length
  const data = new Float64Array(n * n)
  for (let i = 0; i < n; i++) data[i * n + i] = v[i]
  return { data, shape: [n, n] }
}

// Get strides for row-major layout
const getStrides = (shape: number[]): number[] => {
  const strides = new Array(shape.length)
  let stride = 1
  for (let i = shape.length - 1; i >= 0; i--) {
    strides[i] = stride
    stride *= shape[i]
  }
  return strides
}

// Convert multi-index to flat index
const toFlat = (indices: number[], strides: number[]): number => {
  let idx = 0
  for (let i = 0; i < indices.length; i++) idx += indices[i] * strides[i]
  return idx
}

// Convert flat index to multi-index
const fromFlat = (flat: number, shape: number[]): number[] => {
  const indices = new Array(shape.length)
  for (let i = 0; i < shape.length; i++) {
    let prod = 1
    for (let j = i + 1; j < shape.length; j++) prod *= shape[j]
    indices[i] = Math.floor(flat / prod) % shape[i]
  }
  return indices
}

export const get = (arr: NDArray, ...indices: number[]): number => {
  const strides = getStrides(arr.shape)
  return arr.data[toFlat(indices, strides)]
}

export const set = (arr: NDArray, value: number, ...indices: number[]): void => {
  const strides = getStrides(arr.shape)
  arr.data[toFlat(indices, strides)] = value
}

export const reshape = (arr: NDArray, newShape: number[]): NDArray => {
  let size = 1
  for (const s of newShape) size *= s
  if (size !== arr.data.length) throw new Error('Invalid reshape')
  return { data: arr.data, shape: [...newShape] }
}

export const flatten = (arr: NDArray): NDArray => ({ data: arr.data, shape: [arr.data.length] })

export const transpose = (arr: NDArray): NDArray => {
  if (arr.shape.length !== 2) throw new Error('Transpose requires 2D array')
  const [r, c] = arr.shape
  const data = new Float64Array(r * c)
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) data[j * r + i] = arr.data[i * c + j]
  return { data, shape: [c, r] }
}

export const swapaxes = (arr: NDArray, ax1: number, ax2: number): NDArray => {
  const newShape = [...arr.shape]
  ;[newShape[ax1], newShape[ax2]] = [newShape[ax2], newShape[ax1]]
  let size = 1
  for (const s of newShape) size *= s
  const data = new Float64Array(size)
  const oldStrides = getStrides(arr.shape)
  const newStrides = getStrides(newShape)
  for (let i = 0; i < arr.data.length; i++) {
    const indices = fromFlat(i, arr.shape)
    ;[indices[ax1], indices[ax2]] = [indices[ax2], indices[ax1]]
    data[toFlat(indices, newStrides)] = arr.data[i]
  }
  return { data, shape: newShape }
}

// Element-wise operations
export const add = (a: NDArray, b: NDArray): NDArray => {
  const data = new Float64Array(a.data.length)
  for (let i = 0; i < a.data.length; i++) data[i] = a.data[i] + b.data[i]
  return { data, shape: [...a.shape] }
}

export const sub = (a: NDArray, b: NDArray): NDArray => {
  const data = new Float64Array(a.data.length)
  for (let i = 0; i < a.data.length; i++) data[i] = a.data[i] - b.data[i]
  return { data, shape: [...a.shape] }
}

export const mul = (a: NDArray, b: NDArray): NDArray => {
  const data = new Float64Array(a.data.length)
  for (let i = 0; i < a.data.length; i++) data[i] = a.data[i] * b.data[i]
  return { data, shape: [...a.shape] }
}

export const div = (a: NDArray, b: NDArray): NDArray => {
  const data = new Float64Array(a.data.length)
  for (let i = 0; i < a.data.length; i++) data[i] = a.data[i] / b.data[i]
  return { data, shape: [...a.shape] }
}

export const scale = (arr: NDArray, s: number): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = arr.data[i] * s
  return { data, shape: [...arr.shape] }
}

export const addScalar = (arr: NDArray, s: number): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = arr.data[i] + s
  return { data, shape: [...arr.shape] }
}

export const pow = (arr: NDArray, p: number): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = Math.pow(arr.data[i], p)
  return { data, shape: [...arr.shape] }
}

export const sqrt = (arr: NDArray): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = Math.sqrt(arr.data[i])
  return { data, shape: [...arr.shape] }
}

export const exp = (arr: NDArray): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = Math.exp(arr.data[i])
  return { data, shape: [...arr.shape] }
}

export const log = (arr: NDArray): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = Math.log(arr.data[i])
  return { data, shape: [...arr.shape] }
}

export const abs = (arr: NDArray): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = Math.abs(arr.data[i])
  return { data, shape: [...arr.shape] }
}

export const sin = (arr: NDArray): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = Math.sin(arr.data[i])
  return { data, shape: [...arr.shape] }
}

export const cos = (arr: NDArray): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = Math.cos(arr.data[i])
  return { data, shape: [...arr.shape] }
}

export const tanh = (arr: NDArray): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) data[i] = Math.tanh(arr.data[i])
  return { data, shape: [...arr.shape] }
}

// Reductions
export const sum = (arr: NDArray, axis?: number): NDArray | number => {
  if (axis === undefined) {
    let s = 0
    for (let i = 0; i < arr.data.length; i++) s += arr.data[i]
    return s
  }
  const newShape = arr.shape.filter((_, i) => i !== axis)
  if (newShape.length === 0) {
    let s = 0
    for (let i = 0; i < arr.data.length; i++) s += arr.data[i]
    return s
  }
  let size = 1
  for (const s of newShape) size *= s
  const data = new Float64Array(size)
  for (let i = 0; i < arr.data.length; i++) {
    const indices = fromFlat(i, arr.shape)
    const newIndices = indices.filter((_, j) => j !== axis)
    const newStrides = getStrides(newShape)
    data[toFlat(newIndices, newStrides)] += arr.data[i]
  }
  return { data, shape: newShape }
}

export const mean = (arr: NDArray, axis?: number): NDArray | number => {
  if (axis === undefined) {
    let s = 0
    for (let i = 0; i < arr.data.length; i++) s += arr.data[i]
    return s / arr.data.length
  }
  const s = sum(arr, axis)
  if (typeof s === 'number') return s / arr.shape[axis]
  const axisSize = arr.shape[axis]
  for (let i = 0; i < s.data.length; i++) s.data[i] /= axisSize
  return s
}

export const max = (arr: NDArray, axis?: number): NDArray | number => {
  if (axis === undefined) {
    let m = arr.data[0]
    for (let i = 1; i < arr.data.length; i++) if (arr.data[i] > m) m = arr.data[i]
    return m
  }
  const newShape = arr.shape.filter((_, i) => i !== axis)
  let size = 1
  for (const s of newShape) size *= s
  const data = new Float64Array(size).fill(-Infinity)
  for (let i = 0; i < arr.data.length; i++) {
    const indices = fromFlat(i, arr.shape)
    const newIndices = indices.filter((_, j) => j !== axis)
    const newStrides = getStrides(newShape)
    const idx = toFlat(newIndices, newStrides)
    if (arr.data[i] > data[idx]) data[idx] = arr.data[i]
  }
  return { data, shape: newShape }
}

export const min = (arr: NDArray, axis?: number): NDArray | number => {
  if (axis === undefined) {
    let m = arr.data[0]
    for (let i = 1; i < arr.data.length; i++) if (arr.data[i] < m) m = arr.data[i]
    return m
  }
  const newShape = arr.shape.filter((_, i) => i !== axis)
  let size = 1
  for (const s of newShape) size *= s
  const data = new Float64Array(size).fill(Infinity)
  for (let i = 0; i < arr.data.length; i++) {
    const indices = fromFlat(i, arr.shape)
    const newIndices = indices.filter((_, j) => j !== axis)
    const newStrides = getStrides(newShape)
    const idx = toFlat(newIndices, newStrides)
    if (arr.data[i] < data[idx]) data[idx] = arr.data[i]
  }
  return { data, shape: newShape }
}

export const argmax = (arr: NDArray): number => {
  let idx = 0
  for (let i = 1; i < arr.data.length; i++) if (arr.data[i] > arr.data[idx]) idx = i
  return idx
}

export const argmin = (arr: NDArray): number => {
  let idx = 0
  for (let i = 1; i < arr.data.length; i++) if (arr.data[i] < arr.data[idx]) idx = i
  return idx
}

// Concatenate along axis
export const concatenate = (arrays: NDArray[], axis = 0): NDArray => {
  const first = arrays[0]
  const newShape = [...first.shape]
  for (let i = 1; i < arrays.length; i++) newShape[axis] += arrays[i].shape[axis]
  let size = 1
  for (const s of newShape) size *= s
  const data = new Float64Array(size)
  let offset = 0
  for (const arr of arrays) {
    // Simplified: just copy for axis=0 case
    if (axis === 0) {
      data.set(arr.data, offset)
      offset += arr.data.length
    }
  }
  return { data, shape: newShape }
}

// Stack arrays along new axis
export const stack = (arrays: NDArray[], axis = 0): NDArray => {
  const first = arrays[0]
  const newShape = [...first.shape]
  newShape.splice(axis, 0, arrays.length)
  let size = 1
  for (const s of newShape) size *= s
  const data = new Float64Array(size)
  const newStrides = getStrides(newShape)
  for (let a = 0; a < arrays.length; a++) {
    const arr = arrays[a]
    for (let i = 0; i < arr.data.length; i++) {
      const indices = fromFlat(i, arr.shape)
      indices.splice(axis, 0, a)
      data[toFlat(indices, newStrides)] = arr.data[i]
    }
  }
  return { data, shape: newShape }
}

// Split array into chunks along axis
export const split = (arr: NDArray, numSections: number, axis = 0): NDArray[] => {
  const result: NDArray[] = []
  const sectionSize = arr.shape[axis] / numSections
  for (let s = 0; s < numSections; s++) {
    const newShape = [...arr.shape]
    newShape[axis] = sectionSize
    let size = 1
    for (const sz of newShape) size *= sz
    const data = new Float64Array(size)
    for (let i = 0; i < arr.data.length; i++) {
      const indices = fromFlat(i, arr.shape)
      if (indices[axis] >= s * sectionSize && indices[axis] < (s + 1) * sectionSize) {
        indices[axis] -= s * sectionSize
        const newStrides = getStrides(newShape)
        data[toFlat(indices, newStrides)] = arr.data[i]
      }
    }
    result.push({ data, shape: newShape })
  }
  return result
}

// Clip values
export const clip = (arr: NDArray, lo: number, hi: number): NDArray => {
  const data = new Float64Array(arr.data.length)
  for (let i = 0; i < arr.data.length; i++) {
    data[i] = arr.data[i] < lo ? lo : arr.data[i] > hi ? hi : arr.data[i]
  }
  return { data, shape: [...arr.shape] }
}

// Where (ternary selection)
export const where = (cond: NDArray, a: NDArray, b: NDArray): NDArray => {
  const data = new Float64Array(cond.data.length)
  for (let i = 0; i < cond.data.length; i++) {
    data[i] = cond.data[i] ? a.data[i] : b.data[i]
  }
  return { data, shape: [...cond.shape] }
}

// Random arrays
export const rand = (shape: number[]): NDArray => {
  let size = 1
  for (const s of shape) size *= s
  const data = new Float64Array(size)
  for (let i = 0; i < size; i++) data[i] = Math.random()
  return { data, shape: [...shape] }
}

export const randn = (shape: number[]): NDArray => {
  let size = 1
  for (const s of shape) size *= s
  const data = new Float64Array(size)
  for (let i = 0; i < size; i += 2) {
    const u1 = Math.random(), u2 = Math.random()
    const s = Math.sqrt(-2 * Math.log(u1))
    data[i] = s * Math.cos(2 * Math.PI * u2)
    if (i + 1 < size) data[i + 1] = s * Math.sin(2 * Math.PI * u2)
  }
  return { data, shape: [...shape] }
}

export const randint = (low: number, high: number, shape: number[]): NDArray => {
  let size = 1
  for (const s of shape) size *= s
  const data = new Float64Array(size)
  const range = high - low
  for (let i = 0; i < size; i++) data[i] = low + Math.floor(Math.random() * range)
  return { data, shape: [...shape] }
}

// Meshgrid (2D only)
export const meshgrid = (x: NDArray, y: NDArray): [NDArray, NDArray] => {
  const nx = x.data.length, ny = y.data.length
  const X = new Float64Array(ny * nx)
  const Y = new Float64Array(ny * nx)
  for (let i = 0; i < ny; i++) {
    for (let j = 0; j < nx; j++) {
      X[i * nx + j] = x.data[j]
      Y[i * nx + j] = y.data[i]
    }
  }
  return [{ data: X, shape: [ny, nx] }, { data: Y, shape: [ny, nx] }]
}

// Tile (repeat array)
export const tile = (arr: NDArray, reps: number[]): NDArray => {
  const newShape = arr.shape.map((s, i) => s * (reps[i] || 1))
  let size = 1
  for (const s of newShape) size *= s
  const data = new Float64Array(size)
  const newStrides = getStrides(newShape)
  for (let i = 0; i < size; i++) {
    const indices = fromFlat(i, newShape)
    const srcIndices = indices.map((idx, j) => idx % arr.shape[j])
    const srcStrides = getStrides(arr.shape)
    data[i] = arr.data[toFlat(srcIndices, srcStrides)]
  }
  return { data, shape: newShape }
}

// Flip along axis
export const flip = (arr: NDArray, axis: number): NDArray => {
  const data = new Float64Array(arr.data.length)
  const strides = getStrides(arr.shape)
  for (let i = 0; i < arr.data.length; i++) {
    const indices = fromFlat(i, arr.shape)
    indices[axis] = arr.shape[axis] - 1 - indices[axis]
    data[toFlat(indices, strides)] = arr.data[i]
  }
  return { data, shape: [...arr.shape] }
}

// Roll (circular shift) along axis
export const roll = (arr: NDArray, shift: number, axis: number): NDArray => {
  const data = new Float64Array(arr.data.length)
  const strides = getStrides(arr.shape)
  const n = arr.shape[axis]
  for (let i = 0; i < arr.data.length; i++) {
    const indices = fromFlat(i, arr.shape)
    const newIndices = [...indices]
    newIndices[axis] = ((indices[axis] + shift) % n + n) % n
    data[toFlat(newIndices, strides)] = arr.data[i]
  }
  return { data, shape: [...arr.shape] }
}

// Squeeze (remove size-1 dimensions)
export const squeeze = (arr: NDArray): NDArray => {
  const newShape = arr.shape.filter(s => s !== 1)
  return { data: arr.data, shape: newShape.length ? newShape : [1] }
}

// Expand dims (add size-1 dimension)
export const expandDims = (arr: NDArray, axis: number): NDArray => {
  const newShape = [...arr.shape]
  newShape.splice(axis, 0, 1)
  return { data: arr.data, shape: newShape }
}
