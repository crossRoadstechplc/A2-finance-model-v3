import type { EcisDataState } from "@/store/types"

import {
  ENGINE_INPUT_VERSION,
  type EngineInput,
} from "@/engine/types"

/**
 * Maps persisted/UI assumption slices into a stable, versioned engine input.
 * Percent fields from the store become **decimals** here.
 *
 * @throws When required numeric fields are non-finite or structurally invalid.
 */
export function assumptionsToEngineInput(data: EcisDataState): EngineInput {
  const {
    system,
    platform,
    energy,
    fleet,
    controls,
    settings,
    snapshotModel,
    scalingBands,
  } = data

  if (!Number.isFinite(system.modelHorizonYears)) {
    throw new Error("Invalid model horizon")
  }
  const periodCount = Math.trunc(system.modelHorizonYears)
  if (periodCount <= 0 || periodCount > 200) {
    throw new Error("Model horizon must be between 1 and 200 periods")
  }

  if (
    !Number.isFinite(system.discountRatePercent) ||
    !Number.isFinite(system.inflationAssumptionPercent)
  ) {
    throw new Error("Invalid system rate inputs")
  }

  return {
    version: ENGINE_INPUT_VERSION,
    horizon: {
      periodCount,
      discountRatePerPeriod: system.discountRatePercent / 100,
      inflationRatePerPeriod: system.inflationAssumptionPercent / 100,
    },
    platform: {
      corridorName: platform.corridorName,
      stagingPhases: platform.stagingPhases,
      goLiveYear: platform.goLiveYear,
      interoperabilityTier: platform.interoperabilityTier,
      corridorDistanceKm: platform.corridorDistanceKm,
      staffPerStation: platform.staffPerStation,
      staffCostPerPersonPerYearUsd: platform.staffCostPerPersonPerYearUsd,
      cooledWarehouseSizeSqmPerStation: platform.cooledWarehouseSizeSqmPerStation,
      stationCapexUsd: platform.stationCapexUsd,
      swapBayCapexUsd: platform.swapBayCapexUsd,
      chargingSocketCapexUsd: platform.chargingSocketCapexUsd,
      cooledWarehouseCapexPerSqmUsd: platform.cooledWarehouseCapexPerSqmUsd,
      softwareDevelopmentCostUsd: platform.softwareDevelopmentCostUsd,
      softwareMaintenanceCostUsdPerYear: platform.softwareMaintenanceCostUsdPerYear,
      maintenancePercentInfraCapex: platform.maintenancePercentInfraCapex,
      insurancePercentAssets: platform.insurancePercentAssets,
      platformFeeTargetUsdPerKwh: platform.platformFeeTargetUsdPerKwh,
      stationUsefulLifeYears: platform.stationUsefulLifeYears,
      equipmentUsefulLifeYears: platform.equipmentUsefulLifeYears,
      softwareUsefulLifeYears: platform.softwareUsefulLifeYears,
      taxRatePercent: platform.taxRatePercent,
      debtSharePercent: platform.debtSharePercent,
      costOfDebtPercent: platform.costOfDebtPercent,
      targetEquityReturnPercent: platform.targetEquityReturnPercent,
      adminOverheadUsdPerYear: platform.adminOverheadUsdPerYear,
    },
    energy: {
      gridCarbonIntensityGPerKwh: energy.gridCarbonIntensityGPerKwh,
      renewableTargetPercent: energy.renewableTargetPercent,
      peakDemandMw: energy.peakDemandMw,
      batteryCostPerUnitUsd: energy.batteryCostPerUnitUsd,
      batteryCycleLife: energy.batteryCycleLife,
      batteryCapacityKwh: energy.batteryCapacityKwh,
      chargeTimeMinutes: energy.chargeTimeMinutes,
      swapTimeMinutes: energy.swapTimeMinutes,
      chargingWindowStartHour: energy.chargingWindowStartHour,
      chargingWindowEndHour: energy.chargingWindowEndHour,
      kwhConsumptionPerKm: energy.kwhConsumptionPerKm,
      gridElectricityTariffUsdPerKwh: energy.gridElectricityTariffUsdPerKwh,
      batteryPoolRatio: energy.batteryPoolRatio,
      targetMarginPerCycleUsd: energy.targetMarginPerCycleUsd,
      sinkingFundContributionPerCycleUsd: energy.sinkingFundContributionPerCycleUsd,
      sinkingFundGrowthBufferPercent: energy.sinkingFundGrowthBufferPercent,
      batteryResidualValueUsd: energy.batteryResidualValueUsd,
      insurancePerBatteryPerYearUsd: energy.insurancePerBatteryPerYearUsd,
      monitoringPerBatteryPerYearUsd: energy.monitoringPerBatteryPerYearUsd,
      taxRatePercent: energy.taxRatePercent,
      debtSharePercent: energy.debtSharePercent,
      costOfDebtPercent: energy.costOfDebtPercent,
      targetEquityReturnPercent: energy.targetEquityReturnPercent,
    },
    fleet: {
      vehicleCount: fleet.vehicleCount,
      utilizationPercent: fleet.utilizationPercent,
      averageDutyCycleHours: fleet.averageDutyCycleHours,
      annualTruckPlan: fleet.annualTruckPlan.map((row) => ({ ...row })),
      tripsPerTruckPerDay: fleet.tripsPerTruckPerDay,
      freightRatePerTonKmUsd: fleet.freightRatePerTonKmUsd,
      averagePayloadTons: fleet.averagePayloadTons,
      dieselBenchmarkPricePerLiterUsd: fleet.dieselBenchmarkPricePerLiterUsd,
      dieselTruckFuelConsumptionLitersPerKm: fleet.dieselTruckFuelConsumptionLitersPerKm,
      truckPurchaseCostUsd: fleet.truckPurchaseCostUsd,
      truckUsefulLifeYears: fleet.truckUsefulLifeYears,
      driverCostPerTruckPerYearUsd: fleet.driverCostPerTruckPerYearUsd,
      maintenancePerTruckPerYearUsd: fleet.maintenancePerTruckPerYearUsd,
      insurancePerTruckPerYearUsd: fleet.insurancePerTruckPerYearUsd,
      tyreCostPerTruckPerYearUsd: fleet.tyreCostPerTruckPerYearUsd,
      licensingAndPermitsPerTruckPerYearUsd:
        fleet.licensingAndPermitsPerTruckPerYearUsd,
      adminOverheadUsdPerYear: fleet.adminOverheadUsdPerYear,
      taxRatePercent: fleet.taxRatePercent,
      debtSharePercent: fleet.debtSharePercent,
      costOfDebtPercent: fleet.costOfDebtPercent,
      targetEquityReturnPercent: fleet.targetEquityReturnPercent,
    },
    controls: {
      monteCarloIterations: controls.monteCarloIterations,
      sensitivityMode: controls.sensitivityMode,
      stressCase: controls.stressCase,
    },
    financePolicy: {
      corridorWideDiscountRatePercent: system.corridorWideDiscountRatePercent,
      terminalGrowthRatePercent: system.terminalGrowthRatePercent,
      exitMultiple: system.exitMultiple,
      dscrMinimum: system.dscrMinimum,
      dscrLockupThreshold: system.dscrLockupThreshold,
      dscrDistributionThreshold: system.dscrDistributionThreshold,
      debtServiceReserveMonths: system.debtServiceReserveMonths,
      maintenanceReservePercentCapex: system.maintenanceReservePercentCapex,
      cashSweepTriggerDscr: system.cashSweepTriggerDscr,
      contingencyPercentCapex: system.contingencyPercentCapex,
      developmentCostPercentCapex: system.developmentCostPercentCapex,
    },
    presentation: {
      locale: settings.locale,
      currency: settings.currency,
    },
    snapshotModel: { ...snapshotModel },
    scalingBands: scalingBands.map((r) => ({ ...r })),
  }
}
