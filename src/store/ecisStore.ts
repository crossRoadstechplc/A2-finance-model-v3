import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { assumptionsToCsvRows } from "@/export/csv/assumptionsCsv"
import { csvRowsToString } from "@/export/csv/csvEscape"
import { buildExportJsonString } from "@/export/json/buildExportJson"
import { orchestrateRecompute } from "@/engine/orchestrator"
import { runFullSensitivityAnalysis } from "@/sensitivity/runFullAnalysis"
import { applyAssumptionsFromSnapshot } from "@/store/applyAssumptionsFromSnapshot"
import {
  buildAssumptionsSnapshot,
  defaultControls,
  defaultEnergy,
  defaultFleet,
  defaultPlatform,
  defaultSettings,
  defaultSnapshot,
  defaultSnapshotModel,
  defaultSystem,
  getDefaultEcisDataState,
  staleResultsState,
} from "@/store/defaults"
import { staticScalingBandRows } from "@/snapshot/scalingBands"
import { ECIS_STORAGE_KEY, ECIS_STORAGE_VERSION } from "@/store/persistence/constants"
import { mergePersistedEcisSlice } from "@/store/persistence/merge"
import { migratePersistedState } from "@/store/persistence/migrations"
import { partializeEcisState } from "@/store/persistence/partialize"
import type { EcisDataState, EcisStore, NamedScenario } from "@/store/types"

const MAX_COMPARISON_SCENARIOS = 4

function sliceEcisData(s: EcisStore): EcisDataState {
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

export const useEcisStore = create<EcisStore>()(
  persist(
    (set, get) => ({
      ...getDefaultEcisDataState(),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      updateSystem: (patch) =>
        set((s) => ({ system: { ...s.system, ...patch } })),

      updatePlatform: (patch) =>
        set((s) => ({ platform: { ...s.platform, ...patch } })),

      updateEnergy: (patch) =>
        set((s) => ({ energy: { ...s.energy, ...patch } })),

      updateFleet: (patch) =>
        set((s) => ({ fleet: { ...s.fleet, ...patch } })),

      updateControls: (patch) =>
        set((s) => ({ controls: { ...s.controls, ...patch } })),

      updateSnapshotModel: (patch) =>
        set((s) => ({
          snapshotModel: {
            ...s.snapshotModel,
            ...patch,
            infrastructureOverrides: {
              ...s.snapshotModel.infrastructureOverrides,
              ...patch.infrastructureOverrides,
            },
          },
        })),

      updateScalingBands: (bands) =>
        set(() => ({
          scalingBands: bands.map((r) => ({ ...r })),
        })),

      loadScenario: (scenarioId) => {
        const s = get()
        if (scenarioId === "default" || scenarioId === "__defaults__") {
          const nextData: EcisDataState = {
            ...sliceEcisData(s),
            settings: { ...defaultSettings },
            system: { ...defaultSystem },
            platform: { ...defaultPlatform },
            energy: { ...defaultEnergy },
            fleet: {
              ...defaultFleet,
              annualTruckPlan: defaultFleet.annualTruckPlan.map((row) => ({ ...row })),
            },
            controls: { ...defaultControls },
            snapshotModel: {
              ...defaultSnapshotModel,
              infrastructureOverrides: {
                ...defaultSnapshotModel.infrastructureOverrides,
              },
            },
            scalingBands: staticScalingBandRows().map((r) => ({ ...r })),
            workspace: { ...s.workspace, activeScenarioId: null },
            results: staleResultsState(),
            snapshot: defaultSnapshot,
          }
          const patch = orchestrateRecompute(nextData)
          set({
            settings: nextData.settings,
            system: nextData.system,
            platform: nextData.platform,
            energy: nextData.energy,
            fleet: nextData.fleet,
            controls: nextData.controls,
            snapshotModel: nextData.snapshotModel,
            scalingBands: nextData.scalingBands,
            workspace: nextData.workspace,
            ...patch,
          })
          return
        }

        const named = s.scenarios.named[scenarioId]
        if (!named) return

        const applied = applyAssumptionsFromSnapshot(named.assumptions)
        const nextData: EcisDataState = {
          ...sliceEcisData(s),
          ...applied,
          workspace: { ...s.workspace, activeScenarioId: scenarioId },
          results: staleResultsState(),
          snapshot: defaultSnapshot,
        }
        const patch = orchestrateRecompute(nextData)
        set({
          ...applied,
          workspace: { ...s.workspace, activeScenarioId: scenarioId },
          ...patch,
        })
      },

      resetToDefaults: () =>
        set({
          ...getDefaultEcisDataState(),
        }),

      setActivePage: (path) =>
        set((s) => ({
          workspace: { ...s.workspace, activePage: path },
        })),

      setPanelOpen: (panel, open) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            panels: { ...s.workspace.panels, [panel]: open },
          },
        })),

      recompute: () =>
        set((s) => orchestrateRecompute(sliceEcisData(s))),

      saveNamedScenario: (name) => {
        const s = get()
        const id = crypto.randomUUID()
        const trimmed = name.trim() || "Untitled"
        const scenario: NamedScenario = {
          id,
          name: trimmed,
          createdAt: new Date().toISOString(),
          assumptions: buildAssumptionsSnapshot(s),
        }
        set((prev) => ({
          scenarios: {
            named: { ...prev.scenarios.named, [id]: scenario },
          },
          workspace: { ...prev.workspace, activeScenarioId: id },
        }))
        return id
      },

      loadNamedScenario: (id) => {
        const s = get()
        const named = s.scenarios.named[id]
        if (!named) return false
        const applied = applyAssumptionsFromSnapshot(named.assumptions)
        const nextData: EcisDataState = {
          ...sliceEcisData(s),
          ...applied,
          workspace: { ...s.workspace, activeScenarioId: id },
          results: staleResultsState(),
          snapshot: defaultSnapshot,
        }
        const patch = orchestrateRecompute(nextData)
        set({
          ...applied,
          workspace: { ...s.workspace, activeScenarioId: id },
          ...patch,
        })
        return true
      },

      deleteNamedScenario: (id) =>
        set((s) => {
          const nextNamed = { ...s.scenarios.named }
          delete nextNamed[id]
          return {
            scenarios: { named: nextNamed },
            workspace: {
              ...s.workspace,
              activeScenarioId:
                s.workspace.activeScenarioId === id
                  ? null
                  : s.workspace.activeScenarioId,
              comparisonScenarioIds: s.workspace.comparisonScenarioIds.filter(
                (x) => x !== id,
              ),
            },
          }
        }),

      toggleComparisonScenario: (id) =>
        set((s) => {
          const cur = [...s.workspace.comparisonScenarioIds]
          const idx = cur.indexOf(id)
          if (idx >= 0) {
            cur.splice(idx, 1)
            return {
              workspace: { ...s.workspace, comparisonScenarioIds: cur },
            }
          }
          if (cur.length >= MAX_COMPARISON_SCENARIOS) {
            return {}
          }
          return {
            workspace: {
              ...s.workspace,
              comparisonScenarioIds: [...cur, id],
            },
          }
        }),

      exportJson: (options) => buildExportJsonString(get(), options),

      exportCsv: () => {
        const s = get()
        const snapshot = buildAssumptionsSnapshot(s)
        const rows = assumptionsToCsvRows(snapshot)
        return csvRowsToString(rows)
      },

      runSensitivityAnalysis: () => {
        set((s) => ({
          sensitivityRun: {
            ...s.sensitivityRun,
            phase: "running",
            warnings: [],
          },
        }))
        queueMicrotask(() => {
          try {
            const st = get()
            const snap = buildAssumptionsSnapshot(st)
            const rev = st.recomputeMeta.revision
            const payload = runFullSensitivityAnalysis(snap)
            const merged = [...payload.warnings]
            const warnings = [...new Set(merged)]
            const phase: "ready" | "degraded" = payload.degraded
              ? "degraded"
              : "ready"
            set({
              sensitivityRun: {
                phase,
                updatedAt: Date.now(),
                basedOnRecomputeRevision: rev,
                tornadoBars: payload.tornado.bars.map((b) => ({
                  driverId: b.driverId,
                  label: b.label,
                  baseEquityNpv: b.baseEquityNpv,
                  lowEquityNpv: b.lowEquityNpv,
                  highEquityNpv: b.highEquityNpv,
                  impactMagnitude: b.impactMagnitude,
                })),
                twoWay: {
                  rowParamId: payload.twoWay.rowParamId,
                  rowParamLabel: payload.twoWay.rowParamLabel,
                  colParamId: payload.twoWay.colParamId,
                  colParamLabel: payload.twoWay.colParamLabel,
                  colLabels: payload.twoWay.colLabels,
                  rowLabels: payload.twoWay.rowLabels,
                  cells: payload.twoWay.cells,
                },
                breakevenLines: payload.breakeven.lines,
                warnings,
              },
            })
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            set((s) => ({
              sensitivityRun: {
                ...s.sensitivityRun,
                phase: "degraded",
                updatedAt: Date.now(),
                warnings: [`Sensitivity run failed: ${msg}`],
              },
            }))
          }
        })
      },
    }),
    {
      name: ECIS_STORAGE_KEY,
      version: ECIS_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => partializeEcisState(state),
      merge: (persisted, current) => mergePersistedEcisSlice(persisted, current),
      migrate: (persisted, fromVersion) =>
        migratePersistedState(persisted, fromVersion),
    },
  ),
)

/** Test / Storybook: clear disk and reset in-memory data + actions */
export function resetEcisStoreForTests() {
  useEcisStore.persist.clearStorage()
  useEcisStore.setState({
    ...getDefaultEcisDataState(),
  })
}
