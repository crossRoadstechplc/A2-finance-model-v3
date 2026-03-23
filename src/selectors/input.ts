import type { EngineOutput, EngineProjectionResult } from "@/engine/types"
import type { ScalingBandRow } from "@/snapshot/scalingBands"
import type {
  ControlsState,
  EnergyAssumptions,
  FleetAssumptions,
  PlatformAssumptions,
  RecomputeMeta,
  ResultsState,
  SensitivityRunState,
  ScenariosState,
  SettingsState,
  SnapshotModelState,
  SnapshotState,
  SystemAssumptions,
  WorkspaceState,
} from "@/store/types"

/** Minimal slice selectors read — keep pure and explicit for tests. */
export type EcisSelectorInput = {
  settings: SettingsState
  system: SystemAssumptions
  platform: PlatformAssumptions
  energy: EnergyAssumptions
  fleet: FleetAssumptions
  controls: ControlsState
  snapshotModel: SnapshotModelState
  scalingBands: ScalingBandRow[]
  results: ResultsState
  snapshot: SnapshotState
  recomputeMeta: RecomputeMeta
  sensitivityRun: SensitivityRunState
  scenarios: ScenariosState
  workspace: WorkspaceState
}

export function getOkProjection(
  engineOutput: EngineOutput | null,
): Extract<EngineProjectionResult, { status: "ok" }> | null {
  if (!engineOutput) return null
  if (engineOutput.projection.status !== "ok") return null
  return engineOutput.projection
}
