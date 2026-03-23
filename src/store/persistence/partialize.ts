import {
  defaultControls,
  defaultEnergy,
  defaultFleet,
  defaultPlatform,
  defaultScenarios,
  defaultSettings,
  defaultSnapshotModel,
  defaultSystem,
  defaultWorkspace,
} from "@/store/defaults"
import { staticScalingBandRows } from "@/snapshot/scalingBands"
import type { EcisStore, PersistedEcisSlice } from "@/store/types"

export function getDefaultPersistedSlice(): PersistedEcisSlice {
  return {
    settings: { ...defaultSettings },
    system: { ...defaultSystem },
    platform: { ...defaultPlatform },
    energy: { ...defaultEnergy },
    fleet: { ...defaultFleet },
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
  }
}

/** Persist assumptions (system…controls), workspace, and named scenarios only */
export function partializeEcisState(state: EcisStore): PersistedEcisSlice {
  return {
    settings: state.settings,
    system: state.system,
    platform: state.platform,
    energy: state.energy,
    fleet: state.fleet,
    controls: state.controls,
    snapshotModel: state.snapshotModel,
    scalingBands: state.scalingBands,
    workspace: state.workspace,
    scenarios: { named: state.scenarios.named },
  }
}
