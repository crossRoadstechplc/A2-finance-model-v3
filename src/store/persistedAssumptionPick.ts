import type { EcisStore } from "@/store/types"

/** Slice that drives assumption snapshots, CSV export row counts, and debounced recompute. */
export type PersistedAssumptionPick = Pick<
  EcisStore,
  | "settings"
  | "system"
  | "platform"
  | "energy"
  | "fleet"
  | "controls"
  | "snapshotModel"
  | "scalingBands"
>

export function selectPersistedAssumptionPick(s: EcisStore): PersistedAssumptionPick {
  return {
    settings: s.settings,
    system: s.system,
    platform: s.platform,
    energy: s.energy,
    fleet: s.fleet,
    controls: s.controls,
    snapshotModel: s.snapshotModel,
    scalingBands: s.scalingBands,
  }
}
