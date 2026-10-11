import { describe, expect, it } from "vitest";

import { add, dot, vecFromArr } from "../src/vector";

describe("NumPyTs vector operations", () => {
  it("adds vectors elementwise", () => {
    expect(Array.from(add(vecFromArr([1, 2]), vecFromArr([3, 4])))).toEqual([4, 6]);
  });

  it("computes a dot product", () => {
    expect(dot(vecFromArr([1, 2]), vecFromArr([3, 4]))).toBe(11);
  });

  it("rejects vectors of different lengths", () => {
    expect(() => add(vecFromArr([1]), vecFromArr([1, 2]))).toThrow();
  });
});
