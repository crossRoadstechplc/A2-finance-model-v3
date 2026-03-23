import { staticScalingBandRows } from "@/snapshot/scalingBands"
import { defaultFleet } from "@/store/defaults/fleet"
import { defaultSettings } from "@/store/defaults/settings"
import { defaultSnapshotModel } from "@/store/defaults/snapshotModel"
import type {
  AssumptionsSnapshot,
  EcisStore,
  SnapshotModelState,
} from "@/store/types"

function mergeSnapshotModelFromAssumptions(
  raw: AssumptionsSnapshot["snapshotModel"],
): SnapshotModelState {
  return {
    ...defaultSnapshotModel,
    ...raw,
    infrastructureOverrides: {
      ...defaultSnapshotModel.infrastructureOverrides,
      ...raw?.infrastructureOverrides,
    },
  }
}

/** Maps a saved assumptions snapshot onto store shape (used by load + engine-from-snapshot). */
export function applyAssumptionsFromSnapshot(
  assumptions: AssumptionsSnapshot,
): Pick<
  EcisStore,
  | "settings"
  | "system"
  | "platform"
  | "energy"
  | "fleet"
  | "controls"
  | "snapshotModel"
  | "scalingBands"
> {
  return {
    settings: { ...defaultSettings, ...assumptions.settings },
    system: { ...assumptions.system },
    platform: { ...assumptions.platform },
    energy: { ...assumptions.energy },
    fleet: {
      ...defaultFleet,
      ...assumptions.fleet,
      annualTruckPlan: (assumptions.fleet.annualTruckPlan?.length
        ? assumptions.fleet.annualTruckPlan
        : defaultFleet.annualTruckPlan
      ).map((row) => ({ ...row })),
    },
    controls: { ...assumptions.controls },
    snapshotModel: mergeSnapshotModelFromAssumptions(assumptions.snapshotModel),
    scalingBands:
      assumptions.scalingBands && assumptions.scalingBands.length > 0
        ? assumptions.scalingBands.map((r) => ({ ...r }))
        : staticScalingBandRows().map((r) => ({ ...r })),
  }
}
