import { describe, expect, it, vi } from "vitest"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { orchestrateRecompute } from "@/engine/orchestrator"
import { ENGINE_OUTPUT_VERSION, type EngineOutput } from "@/engine/types"
import { buildEcisDataStateForEngineRun } from "@/scenarios/runEngineForAssumptionsSnapshot"
import { runEngineForAssumptionsSnapshot } from "@/scenarios/runEngineForAssumptionsSnapshot"
import { buildAssumptionsSnapshot, getDefaultEcisDataState } from "@/store/defaults"

const stubOutput: EngineOutput = {
  version: ENGINE_OUTPUT_VERSION,
  computedAt: "",
  projection: { status: "failed", error: "stub" },
  engineSnapshot: { status: "failed", error: "stub" },
}

describe("runEngineForAssumptionsSnapshot", () => {
  it("invokes the same adapter input as orchestrateRecompute for the same assumptions", () => {
    const snap = buildAssumptionsSnapshot(getDefaultEcisDataState())
    const data = buildEcisDataStateForEngineRun(snap)
    const expectedInput = assumptionsToEngineInput(data)

    const mockRun = vi.fn(() => stubOutput)

    runEngineForAssumptionsSnapshot(snap, { runEngineImpl: mockRun })
    const first = mockRun.mock.calls[0]?.[0]
    mockRun.mockClear()

    orchestrateRecompute(
      { ...data, recomputeMeta: { revision: 0, lastRunAt: null } },
      { runEngineImpl: mockRun },
    )
    const second = mockRun.mock.calls[0]?.[0]

    expect(first).toEqual(expectedInput)
    expect(second).toEqual(expectedInput)
  })
})
