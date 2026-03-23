import { describe, expect, it } from "vitest"

import {
  formatPercentDelta,
  indicesOfBestValues,
} from "@/scenarios/comparisonMetrics"

describe("comparisonMetrics", () => {
  it("indicesOfBestValues picks all ties for higher-is-better", () => {
    const idx = indicesOfBestValues([1, 5, 5, 2], true)
    expect([...idx].sort()).toEqual([1, 2])
  })

  it("indicesOfBestValues picks minimum when lower is better", () => {
    const idx = indicesOfBestValues([100, 20, 20, 50], false)
    expect([...idx].sort()).toEqual([1, 2])
  })

  it("indicesOfBestValues ignores nulls", () => {
    const idx = indicesOfBestValues([null, 3, 1], true)
    expect([...idx]).toEqual([1])
  })

  it("formatPercentDelta handles base zero as em dash", () => {
    expect(formatPercentDelta(0, 10, "en-US")).toBe("—")
  })

  it("formatPercentDelta shows signed percent", () => {
    const s = formatPercentDelta(100, 150, "en-US")
    expect(s).toMatch(/50/)
    expect(s).toMatch(/%/)
  })
})
