import { staticScalingBandRows } from "@/snapshot/scalingBands"
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
import type {
  AssumptionsSnapshot,
  PersistedEcisSlice,
} from "@/store/types"

import { withPersistedDefaults } from "@/store/persistence/merge"
import { getDefaultPersistedSlice } from "@/store/persistence/partialize"

type LegacyV0Shape = {
  assumptions?: Partial<AssumptionsSnapshot>
  workspace?: Partial<PersistedEcisSlice["workspace"]>
  scenarios?: { named?: PersistedEcisSlice["scenarios"]["named"] }
}

function normalizeSystem(
  system: Partial<PersistedEcisSlice["system"]> | undefined,
): PersistedEcisSlice["system"] {
  return {
    modelHorizonYears: system?.modelHorizonYears ?? defaultSystem.modelHorizonYears,
    discountRatePercent: system?.discountRatePercent ?? defaultSystem.discountRatePercent,
    inflationAssumptionPercent:
      system?.inflationAssumptionPercent ?? defaultSystem.inflationAssumptionPercent,
    terminalGrowthRatePercent:
      system?.terminalGrowthRatePercent ?? defaultSystem.terminalGrowthRatePercent,
    exitMultiple: system?.exitMultiple ?? defaultSystem.exitMultiple,
    corridorWideDiscountRatePercent:
      system?.corridorWideDiscountRatePercent ??
      defaultSystem.corridorWideDiscountRatePercent,
    dscrMinimum: system?.dscrMinimum ?? defaultSystem.dscrMinimum,
    dscrLockupThreshold:
      system?.dscrLockupThreshold ?? defaultSystem.dscrLockupThreshold,
    dscrDistributionThreshold:
      system?.dscrDistributionThreshold ?? defaultSystem.dscrDistributionThreshold,
    debtServiceReserveMonths:
      system?.debtServiceReserveMonths ?? defaultSystem.debtServiceReserveMonths,
    maintenanceReservePercentCapex:
      system?.maintenanceReservePercentCapex ??
      defaultSystem.maintenanceReservePercentCapex,
    cashSweepTriggerDscr:
      system?.cashSweepTriggerDscr ?? defaultSystem.cashSweepTriggerDscr,
    contingencyPercentCapex:
      system?.contingencyPercentCapex ?? defaultSystem.contingencyPercentCapex,
    developmentCostPercentCapex:
      system?.developmentCostPercentCapex ??
      defaultSystem.developmentCostPercentCapex,
    notes: system?.notes ?? defaultSystem.notes,
  }
}

/**
 * Maps older persisted blobs into the current PersistedEcisSlice.
 * `fromVersion` is the version stored on disk (before migration target).
 */
export function migratePersistedState(
  persisted: unknown,
  fromVersion: number,
): PersistedEcisSlice {
  if (fromVersion === 0) {
    return withPersistedDefaults(migrateFromV0(persisted))
  }

  if (persisted && typeof persisted === "object") {
    return withPersistedDefaults(persisted as Partial<PersistedEcisSlice>)
  }

  return getDefaultPersistedSlice()
}

function migrateFromV0(raw: unknown): PersistedEcisSlice {
  if (!raw || typeof raw !== "object") {
    return getDefaultPersistedSlice()
  }

  const legacy = raw as LegacyV0Shape & Partial<PersistedEcisSlice>

  if (legacy.assumptions) {
    const a = legacy.assumptions
    return {
      settings: { ...defaultSettings, ...a.settings },
      system: normalizeSystem(a.system),
      platform: { ...defaultPlatform, ...a.platform },
      energy: { ...defaultEnergy, ...a.energy },
      fleet: {
        ...defaultFleet,
        ...a.fleet,
        annualTruckPlan: (a.fleet?.annualTruckPlan?.length
          ? a.fleet.annualTruckPlan
          : defaultFleet.annualTruckPlan
        ).map((row) => ({ ...row })),
      },
      controls: { ...defaultControls, ...a.controls },
      scalingBands:
        a.scalingBands && a.scalingBands.length > 0
          ? a.scalingBands.map((r) => ({ ...r }))
          : staticScalingBandRows().map((r) => ({ ...r })),
      snapshotModel: {
        ...defaultSnapshotModel,
        ...a.snapshotModel,
        infrastructureOverrides: {
          ...defaultSnapshotModel.infrastructureOverrides,
          ...a.snapshotModel?.infrastructureOverrides,
        },
      },
      workspace: {
        ...defaultWorkspace,
        ...legacy.workspace,
        panels: {
          ...defaultWorkspace.panels,
          ...legacy.workspace?.panels,
        },
      },
      scenarios: {
        named: {
          ...defaultScenarios.named,
          ...legacy.scenarios?.named,
        },
      },
    }
  }

  return {
    settings: { ...defaultSettings, ...legacy.settings },
    system: normalizeSystem(legacy.system),
    platform: { ...defaultPlatform, ...legacy.platform },
    energy: { ...defaultEnergy, ...legacy.energy },
    fleet: {
      ...defaultFleet,
      ...legacy.fleet,
      annualTruckPlan: (legacy.fleet?.annualTruckPlan?.length
        ? legacy.fleet.annualTruckPlan
        : defaultFleet.annualTruckPlan
      ).map((row) => ({ ...row })),
    },
    controls: { ...defaultControls, ...legacy.controls },
    scalingBands:
      legacy.scalingBands && legacy.scalingBands.length > 0
        ? legacy.scalingBands.map((r) => ({ ...r }))
        : staticScalingBandRows().map((r) => ({ ...r })),
    snapshotModel: {
      ...defaultSnapshotModel,
      ...legacy.snapshotModel,
      infrastructureOverrides: {
        ...defaultSnapshotModel.infrastructureOverrides,
        ...legacy.snapshotModel?.infrastructureOverrides,
      },
    },
    workspace: {
      ...defaultWorkspace,
      ...legacy.workspace,
      panels: {
        ...defaultWorkspace.panels,
        ...legacy.workspace?.panels,
      },
    },
    scenarios: {
      named: {
        ...defaultScenarios.named,
        ...legacy.scenarios?.named,
      },
    },
  }
}
