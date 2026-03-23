import { describe, expect, it, vi } from "vitest"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { orchestrateRecompute } from "@/engine/orchestrator"
import { buildEcisDataStateForEngineRun } from "@/scenarios/runEngineForAssumptionsSnapshot"
import { runSensitivityCell } from "@/sensitivity/runCell"
import { stubEngineForSensitivity } from "@/sensitivity/__tests__/stubEngineOutput"
import { buildAssumptionsSnapshot, getDefaultEcisDataState } from "@/store/defaults"

describe("sensitivity engine contract", () => {
  it("uses the same adapter input as orchestrateRecompute", () => {
    const snap = buildAssumptionsSnapshot(getDefaultEcisDataState())
    const data = buildEcisDataStateForEngineRun(snap)
    const expected = assumptionsToEngineInput(data)

    const mockRun = vi.fn(() => stubEngineForSensitivity({ equityNpv: 1 }))
    runSensitivityCell(snap, { runEngineImpl: mockRun })
    const first = mockRun.mock.calls[0]?.[0]
    mockRun.mockClear()

    orchestrateRecompute(
      { ...data, recomputeMeta: { revision: 0, lastRunAt: null } },
      { runEngineImpl: mockRun },
    )
    const second = mockRun.mock.calls[0]?.[0]

    expect(first).toEqual(expected)
    expect(second).toEqual(expected)
  })
})
