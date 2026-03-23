import { describe, expect, it } from "vitest"

import { buildExportJsonObject } from "@/export/json/buildExportJson"
import { getDefaultEcisDataState } from "@/store/defaults"
import type { EcisStore } from "@/store/types"

function minimalStore(overrides: Partial<EcisStore> = {}): EcisStore {
  const data = getDefaultEcisDataState()
  const noop = () => {}
  return {
    ...data,
    updateSettings: noop,
    updateSystem: noop,
    updatePlatform: noop,
    updateEnergy: noop,
    updateFleet: noop,
    updateControls: noop,
    updateSnapshotModel: noop,
    updateScalingBands: noop,
    loadScenario: noop,
    resetToDefaults: noop,
    setActivePage: noop,
    setPanelOpen: noop,
    recompute: noop,
    saveNamedScenario: () => "",
    loadNamedScenario: () => false,
    deleteNamedScenario: noop,
    toggleComparisonScenario: noop,
    exportJson: () => "",
    exportCsv: () => "",
    runSensitivityAnalysis: noop,
    ...overrides,
  }
}

describe("buildExportJsonObject", () => {
  it("excludes ephemeral top-level keys by default", () => {
    const s = minimalStore({
      snapshot: { capturedAt: "t0", label: "x" },
      results: {
        status: "ready",
        lastError: null,
        engineOutput: {
          version: 1,
          computedAt: "c0",
          projection: { status: "failed", error: "e" },
          engineSnapshot: { status: "failed", error: "snap" },
        },
      },
    })
    const doc = buildExportJsonObject(s)
    expect(doc).not.toHaveProperty("snapshotSummary")
    expect(doc).not.toHaveProperty("engineOutputSummary")
    expect((doc.payload as { results?: unknown }).results).toBeUndefined()
  })

  it("adds snapshotSummary and engineOutputSummary when requested", () => {
    const s = minimalStore({
      snapshot: { capturedAt: "t0", label: "lab", status: "ok" },
      results: {
        status: "ready",
        lastError: null,
        engineOutput: {
          version: 1,
          computedAt: "c0",
          projection: { status: "failed", error: "e" },
          engineSnapshot: { status: "failed", error: "snap" },
        },
      },
    })
    const doc = buildExportJsonObject(s, {
      includeSnapshotSummary: true,
      includeEphemeralEngineOutput: true,
    })
    expect(doc.snapshotSummary).toEqual({
      capturedAt: "t0",
      label: "lab",
      status: "ok",
      error: null,
    })
    expect(doc.engineOutputSummary).toMatchObject({
      version: 1,
      computedAt: "c0",
    })
    const summary = doc.engineOutputSummary as { projection?: { status?: string } }
    expect(summary.projection?.status).toBe("failed")
  })
})
