import { describe, expect, it } from "vitest";

import { expit, sigmoid, softmax } from "../src/special";

describe("SciPyTs special operations", () => {
  it("computes the sigmoid at zero", () => {
    expect(sigmoid(new Float64Array([0]))[0]).toBeCloseTo(0.5);
    expect(expit(new Float64Array([0]))[0]).toBeCloseTo(0.5);
  });

  it("normalizes equal softmax inputs", () => {
    expect(Array.from(softmax(new Float64Array([0, 0])))).toEqual([0.5, 0.5]);
  });
});
