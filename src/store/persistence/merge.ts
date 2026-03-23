import { getDefaultPersistedSlice } from "@/store/persistence/partialize"
import type { EcisStore, PersistedEcisSlice } from "@/store/types"

/** Coerce any persisted partial (including pre–Phase-9 blobs) to a full slice. */
export function withPersistedDefaults(
  p: Partial<PersistedEcisSlice>,
): PersistedEcisSlice {
  const d = getDefaultPersistedSlice()
  return {
    settings: { ...d.settings, ...p.settings },
    system: { ...d.system, ...p.system },
    platform: { ...d.platform, ...p.platform },
    energy: { ...d.energy, ...p.energy },
    fleet: {
      ...d.fleet,
      ...p.fleet,
      annualTruckPlan: (p.fleet?.annualTruckPlan?.length
        ? p.fleet.annualTruckPlan
        : d.fleet.annualTruckPlan
      ).map((row) => ({ ...row })),
    },
    controls: { ...d.controls, ...p.controls },
    snapshotModel: {
      ...d.snapshotModel,
      ...p.snapshotModel,
      infrastructureOverrides: {
        ...d.snapshotModel.infrastructureOverrides,
        ...p.snapshotModel?.infrastructureOverrides,
      },
    },
    scalingBands:
      p.scalingBands && p.scalingBands.length > 0
        ? p.scalingBands.map((r) => ({ ...r }))
        : d.scalingBands,
    workspace: {
      ...d.workspace,
      ...p.workspace,
      panels: {
        ...d.workspace.panels,
        ...p.workspace?.panels,
      },
    },
    scenarios: {
      named: { ...d.scenarios.named, ...p.scenarios?.named },
    },
  }
}

/**
 * Deep-repair persisted slices against defaults so new fields never read as undefined.
 */
export function mergePersistedEcisSlice(
  persisted: unknown,
  current: EcisStore,
): EcisStore {
  if (!persisted || typeof persisted !== "object") {
    return current
  }

  const p = persisted as Partial<PersistedEcisSlice>

  const repaired = withPersistedDefaults(p)

  return {
    ...current,
    settings: repaired.settings,
    system: repaired.system,
    platform: repaired.platform,
    energy: repaired.energy,
    fleet: repaired.fleet,
    controls: repaired.controls,
    snapshotModel: repaired.snapshotModel,
    scalingBands: repaired.scalingBands,
    workspace: {
      ...current.workspace,
      ...repaired.workspace,
      panels: {
        ...current.workspace.panels,
        ...repaired.workspace.panels,
      },
    },
    scenarios: {
      named: { ...current.scenarios.named, ...repaired.scenarios.named },
    },
  }
}
