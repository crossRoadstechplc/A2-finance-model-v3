import { defaultControls } from "@/store/defaults/controls"
import { defaultEnergy } from "@/store/defaults/energy"
import { defaultFleet } from "@/store/defaults/fleet"
import {
  defaultRecomputeMeta,
  defaultResults,
  defaultSensitivityRun,
  defaultSnapshot,
  staleResultsState,
} from "@/store/defaults/ephemeral"
import { defaultPlatform } from "@/store/defaults/platform"
import { defaultScenarios } from "@/store/defaults/scenarios"
import { defaultSettings } from "@/store/defaults/settings"
import { defaultSnapshotModel } from "@/store/defaults/snapshotModel"
import { defaultSystem } from "@/store/defaults/system"
import { defaultWorkspace } from "@/store/defaults/workspace"
import type { AssumptionsSnapshot, EcisDataState } from "@/store/types"
import { staticScalingBandRows } from "@/snapshot/scalingBands"

export {
  defaultControls,
  defaultEnergy,
  defaultFleet,
  defaultPlatform,
  defaultRecomputeMeta,
  defaultResults,
  defaultScenarios,
  defaultSensitivityRun,
  defaultSettings,
  defaultSnapshot,
  defaultSnapshotModel,
  defaultSystem,
  defaultWorkspace,
  staleResultsState,
}

export function buildAssumptionsSnapshot(
  state: Pick<
    EcisDataState,
    | "settings"
    | "system"
    | "platform"
    | "energy"
    | "fleet"
    | "controls"
    | "snapshotModel"
    | "scalingBands"
  >,
): AssumptionsSnapshot {
  return {
    settings: { ...state.settings },
    system: { ...state.system },
    platform: { ...state.platform },
    energy: { ...state.energy },
    fleet: {
      ...state.fleet,
      annualTruckPlan: state.fleet.annualTruckPlan.map((row) => ({ ...row })),
    },
    controls: { ...state.controls },
    snapshotModel: {
      ...state.snapshotModel,
      infrastructureOverrides: {
        ...state.snapshotModel.infrastructureOverrides,
      },
    },
    scalingBands: state.scalingBands.map((r) => ({ ...r })),
  }
}

export function getDefaultEcisDataState(): EcisDataState {
  return {
    settings: { ...defaultSettings },
    system: { ...defaultSystem },
    platform: {
      ...defaultPlatform,
      goLiveYear: new Date().getFullYear(),
    },
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
    workspace: {
      ...defaultWorkspace,
      panels: { ...defaultWorkspace.panels },
    },
    scenarios: { named: { ...defaultScenarios.named } },
    results: { ...defaultResults },
    snapshot: defaultSnapshot,
    recomputeMeta: { ...defaultRecomputeMeta },
    sensitivityRun: { ...defaultSensitivityRun },
  }
}
