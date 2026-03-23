import { describe, expect, it } from "vitest"

import { orchestrateRecompute } from "@/engine/orchestrator"
import { runEngine } from "@/engine/runEngine"
import { assumptionsToEngineInput } from "@/engine/adapter"
import { getDefaultEcisDataState } from "@/store/defaults"
import { ENGINE_OUTPUT_VERSION } from "@/engine/types"
import { ECIS_STORAGE_KEY } from "@/store/persistence/constants"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

describe("orchestrateRecompute", () => {
  it("maps adapter → engine on success and bumps revision", () => {
    const data = getDefaultEcisDataState()
    data.recomputeMeta = { revision: 3, lastRunAt: 1 }

    const patch = orchestrateRecompute(data)

    expect(patch.recomputeMeta.revision).toBe(4)
    expect(patch.recomputeMeta.lastRunAt).toBeTypeOf("number")
    expect(patch.results.status).toBe("ready")
    expect(patch.results.lastError).toBeNull()
    expect(patch.results.engineOutput).not.toBeNull()
    expect(patch.results.engineOutput?.version).toBe(ENGINE_OUTPUT_VERSION)
    expect(patch.results.engineOutput?.projection.status).toBe("ok")
    if (patch.results.engineOutput?.projection.status === "ok") {
      expect(patch.results.engineOutput.projection.scenario.version).toBe(1)
      expect(patch.results.engineOutput.projection.scenario.pipeline.demand).toBeDefined()
      expect(patch.results.engineOutput.projection.model?.version).toBe(1)
    }
    expect(patch.results.engineOutput?.engineSnapshot.status).toBe("ok")
    expect(patch.snapshot?.status).toBe("ok")
  })

  it("handles projection failure without throwing (snapshot may still succeed)", () => {
    const data = getDefaultEcisDataState()
    data.energy.renewableTargetPercent = 150
    data.platform.corridorName = "OK"

    const patch = orchestrateRecompute(data)

    expect(patch.results.engineOutput).not.toBeNull()
    expect(patch.results.engineOutput?.projection.status).toBe("failed")
    expect(patch.results.engineOutput?.engineSnapshot.status).toBe("ok")
    expect(patch.results.lastError).toMatch(/projection/i)
    expect(patch.snapshot?.status).toBe("ok")
  })

  it("handles snapshot failure while projection succeeds", () => {
    const data = getDefaultEcisDataState()
    data.platform.corridorName = "   "
    data.energy.renewableTargetPercent = 50

    const patch = orchestrateRecompute(data)

    expect(patch.results.engineOutput?.projection.status).toBe("ok")
    expect(patch.results.engineOutput?.engineSnapshot.status).toBe("failed")
    expect(patch.results.lastError).toMatch(/snapshot/i)
    expect(patch.snapshot?.status).toBe("failed")
    expect(patch.snapshot?.error).toBeDefined()
  })

  it("degrades on catastrophic adapter failure without mutating assumptions in patch", () => {
    const data = getDefaultEcisDataState()
    data.system.modelHorizonYears = Number.NaN

    const patch = orchestrateRecompute(data)

    expect(patch.results.engineOutput).toBeNull()
    expect(patch.results.lastError).toMatch(/horizon|Invalid/i)
    expect(patch.snapshot).toBeNull()
    expect(patch.recomputeMeta.revision).toBe(data.recomputeMeta.revision + 1)
  })

  it("uses injected runEngine for catastrophic engine throws", () => {
    const data = getDefaultEcisDataState()
    const throwing: typeof runEngine = () => {
      throw new Error("synthetic engine fault")
    }

    const patch = orchestrateRecompute(data, { runEngineImpl: throwing })

    expect(patch.results.engineOutput).toBeNull()
    expect(patch.results.lastError).toMatch(/synthetic engine fault/)
    expect(patch.snapshot).toBeNull()
  })

  it("store recompute updates only ephemeral fields and does not persist engine output", async () => {
    resetEcisStoreForTests()
    await useEcisStore.persist.rehydrate()

    useEcisStore.getState().recompute()

    const s = useEcisStore.getState()
    expect(s.results.engineOutput).not.toBeNull()
    expect(s.results.status).toBe("ready")

    const raw = localStorage.getItem(ECIS_STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as { state: Record<string, unknown> }
    expect(parsed.state.results).toBeUndefined()
    expect(parsed.state).not.toHaveProperty("engineOutput")
  })
})

describe("adapter + runEngine contract", () => {
  it("projection horizon matches truncated model years", () => {
    const data = getDefaultEcisDataState()
    const input = assumptionsToEngineInput(data)
    const out = runEngine(input)
    expect(out.projection.status).toBe("ok")
    if (out.projection.status === "ok") {
      expect(out.projection.periods.length).toBe(input.horizon.periodCount)
    }
  })
})
