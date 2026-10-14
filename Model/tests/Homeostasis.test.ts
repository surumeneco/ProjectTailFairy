import { describe, expect, it, vi } from "vitest";

import { updateFiringRate, updateThreshold } from "../src/Classes/homeostasis";

describe("homeostasis equations", () => {
  it("uses the documented EMA formula when a spike occurs", () => {
    expect(updateFiringRate(0.2, true, 10)).toBeCloseTo(0.28);
  });

  it("uses the documented EMA formula without a spike", () => {
    expect(updateFiringRate(0.2, false, 10)).toBeCloseTo(0.18);
  });

  it("reduces the EMA update at larger smoothing windows", () => {
    expect(updateFiringRate(0.2, true, 100)).toBeCloseTo(0.208);
  });

  it("raises the threshold above the target firing rate", () => {
    expect(updateThreshold(1, 0.3, 0.1, 0.5)).toBeCloseTo(1.1);
  });

  it("lowers the threshold below the target firing rate", () => {
    expect(updateThreshold(1, 0.1, 0.3, 0.5)).toBeCloseTo(0.9);
  });

  it("does not impose the old prototype's threshold clipping", () => {
    expect(updateThreshold(0.05, 0, 1, 1)).toBeCloseTo(-0.95);
  });

  it("rejects an undefined or non-positive smoothing window", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => updateFiringRate(0, true, 0)).toThrow("smoothing_window");
      expect(() => updateFiringRate(0, true, Number.NaN)).toThrow("smoothing_window");
    } finally {
      error_spy.mockRestore();
    }
  });

  it("rejects non-finite threshold inputs", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => updateThreshold(1, Number.POSITIVE_INFINITY, 0.5, 0.1)).toThrow("current_firing_rate");
    } finally {
      error_spy.mockRestore();
    }
  });
});
