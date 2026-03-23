import { describe, expect, it } from "vitest"

import { runFullSensitivityAnalysis } from "@/sensitivity/runFullAnalysis"
import { buildAssumptionsSnapshot, getDefaultEcisDataState } from "@/store/defaults"

describe("heavy sensitivity sweeps", () => {
  it("returns degraded with warnings instead of throwing when the engine budget is tiny", () => {
    const snap = buildAssumptionsSnapshot(getDefaultEcisDataState())
    const out = runFullSensitivityAnalysis(snap, {
      maxEngineCalls: 3,
      maxDurationMs: 5,
    })
    expect(out.degraded).toBe(true)
    expect(
      out.warnings.some((w) => w.includes("sensitivity-budget-exceeded")),
    ).toBe(true)
  })
})
