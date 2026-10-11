import { describe, expect, it } from "vitest";

import { leakyRelu, relu } from "../src/Utils/Activation";

describe("Model activation operations", () => {
  it("applies ReLU without mutating the input", () => {
    const input_vector = new Float64Array([-2, 0, 3]);
    expect(Array.from(relu(input_vector))).toEqual([0, 0, 3]);
    expect(Array.from(input_vector)).toEqual([-2, 0, 3]);
  });

  it("uses the default leaky ReLU slope for negative inputs", () => {
    expect(Array.from(leakyRelu(new Float64Array([-2, 3])))).toEqual([-0.02, 3]);
  });
});
