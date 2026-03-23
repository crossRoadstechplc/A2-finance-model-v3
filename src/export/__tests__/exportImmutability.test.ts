import { beforeEach, describe, expect, it } from "vitest"

import { assumptionsToCsvRows } from "@/export/csv/assumptionsCsv"
import { csvRowsToString } from "@/export/csv/csvEscape"
import { buildExportJsonString } from "@/export/json/buildExportJson"
import { buildAssumptionsSnapshot, getDefaultEcisDataState } from "@/store/defaults"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

function pickDataState() {
  const s = useEcisStore.getState()
  return {
    settings: s.settings,
    system: s.system,
    platform: s.platform,
    energy: s.energy,
    fleet: s.fleet,
    controls: s.controls,
    snapshotModel: s.snapshotModel,
    scalingBands: s.scalingBands,
    workspace: s.workspace,
    scenarios: s.scenarios,
    results: s.results,
    snapshot: s.snapshot,
    recomputeMeta: s.recomputeMeta,
    sensitivityRun: s.sensitivityRun,
  }
}

describe("export adapters do not mutate the store", () => {
  beforeEach(async () => {
    resetEcisStoreForTests()
    await useEcisStore.persist.rehydrate()
  })

  it("leaves zustand state unchanged after exportJson and exportCsv", () => {
    useEcisStore.setState({
      snapshot: { capturedAt: "x", label: "y" },
      results: {
        status: "ready",
        lastError: null,
        engineOutput: null,
      },
    })
    const before = pickDataState()
    useEcisStore.getState().exportJson({
      includeSnapshotSummary: true,
      includeEphemeralEngineOutput: true,
    })
    useEcisStore.getState().exportCsv()
    expect(pickDataState()).toEqual(before)
  })

  it("leaves state unchanged after direct adapter calls on a live snapshot", () => {
    const snap = buildAssumptionsSnapshot(useEcisStore.getState())
    const before = pickDataState()
    csvRowsToString(assumptionsToCsvRows(snap))
    buildExportJsonString(useEcisStore.getState(), {
      includeSnapshotSummary: true,
      includeEphemeralEngineOutput: true,
    })
    expect(pickDataState()).toEqual(before)
  })

  it("does not mutate a frozen assumptions snapshot object graph", () => {
    const snap = buildAssumptionsSnapshot(getDefaultEcisDataState())
    Object.freeze(snap)
    Object.freeze(snap.system)
    expect(() => csvRowsToString(assumptionsToCsvRows(snap))).not.toThrow()
  })
})
