import { buildDebtSchedule, type DebtScheduleRow } from "@/finance/debtSchedule"
import { nearlyEqual } from "@/finance/math"
import { sinkingFundPayment } from "@/finance/sinkingFund"
import type { EngineInput } from "@/engine/types"
import { buildAnalyticsPack } from "@/model/analytics"
import {
  defaultProjectionModelParametersForScenario,
  mergeProjectionModelParameters,
  type ProjectionModelParameters,
} from "@/model/parameters"
import type { ScenarioSnapshotOutput } from "@/snapshot/types"
import {
  selectScalingBandFromRows,
  type ScalingBandRow,
} from "@/snapshot/scalingBands"
import type {
  AnnualBalanceSheet,
  AnnualCashFlowStatement,
  AnnualEquityStatement,
  AnnualIncomeStatement,
  CapexDeploymentRow,
  ConsolidatedAnnualPack,
  EliminationLine,
  EntityProjectionPack,
  ModelEntityId,
  ModelRunOutput,
  SourcesUsesRow,
} from "@/model/types"
import { MODEL_OUTPUT_VERSION } from "@/model/types"

function roundMoney(x: number): number {
  if (!Number.isFinite(x)) return x
  return Math.round(x * 100) / 100
}

type StraightLineVintage = {
  amount: number
  lifeYears: number
  ageYears: number
}

type YearPlan = {
  periodIndex: number
  truckCount: number
  operatingTrucks: number
  annualEnergySoldKwh: number
  annualSwaps: number
  annualFreightRevenueUsd: number
  stations: number
  sockets: number
  bays: number
  batteryPool: number
  platformCapexRaw: {
    stationUsd: number
    equipmentUsd: number
    softwareUsd: number
    totalUsd: number
  }
  energyBatteryCapexUsd: number
  fleetTruckCapexUsd: number
  sinkingFundContributionUsd: number
}

type EntityCashState = {
  cash: number
  equity: number
}

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0
  return Math.max(0, Math.min(1, percent / 100))
}

function valueAtPeriod(
  plan: readonly { yearIndex: number; truckCount: number }[],
  fallbackTruckCount: number,
  periodIndex: number,
): number {
  const sorted = [...plan]
    .filter((row) => Number.isFinite(row.yearIndex) && row.yearIndex > 0)
    .sort((a, b) => a.yearIndex - b.yearIndex)
  if (sorted.length === 0) return Math.max(0, fallbackTruckCount)

  let chosen = Math.max(0, fallbackTruckCount)
  for (const row of sorted) {
    if (row.yearIndex > periodIndex) break
    chosen = Math.max(0, row.truckCount)
  }
  return chosen
}

function overrideOrDefault(
  totalOverride: number | null,
  bandDefault: number,
): number {
  if (totalOverride === null || !Number.isFinite(totalOverride)) {
    return Math.max(0, bandDefault)
  }
  return Math.max(0, totalOverride)
}

function applyStraightLineDepreciation(vintages: StraightLineVintage[]): number {
  let depreciation = 0
  for (const vintage of vintages) {
    if (vintage.ageYears >= vintage.lifeYears) continue
    depreciation += vintage.amount / vintage.lifeYears
    vintage.ageYears += 1
  }
  return depreciation
}

function grossFromVintages(vintages: readonly StraightLineVintage[]): number {
  return vintages.reduce((sum, vintage) => sum + vintage.amount, 0)
}

function netBookFromVintages(vintages: readonly StraightLineVintage[]): number {
  return vintages.reduce((sum, vintage) => {
    const consumedLife = Math.min(vintage.ageYears, vintage.lifeYears)
    const remainingShare = Math.max(0, 1 - consumedLife / vintage.lifeYears)
    return sum + vintage.amount * remainingShare
  }, 0)
}

function aggregatedDebtSchedule(
  drawsByPeriod: readonly number[],
  annualRate: number,
  tenorPeriods: number,
): DebtScheduleRow[] {
  const n = drawsByPeriod.length
  const tranches = drawsByPeriod.map((draw, index) => {
    if (!Number.isFinite(draw) || draw <= 1e-9) return null
    const schedule = buildDebtSchedule({
      initialPrincipal: draw,
      periodInterestRate: annualRate,
      numPeriods: Math.max(1, Math.min(tenorPeriods, n - index)),
    })
    if (!schedule.ok) {
      throw new Error(schedule.error)
    }
    return {
      startPeriod: index + 1,
      rows: schedule.rows,
    }
  })

  const rows: DebtScheduleRow[] = []
  let priorClosing = 0
  for (let period = 1; period <= n; period++) {
    const drawdown = drawsByPeriod[period - 1] ?? 0
    let interest = 0
    let principal = 0
    for (const tranche of tranches) {
      if (!tranche) continue
      const offset = period - tranche.startPeriod
      if (offset < 0 || offset >= tranche.rows.length) continue
      const row = tranche.rows[offset]!
      interest += row.interestPortion
      principal += row.principalPortion
    }
    const beginningBalance = priorClosing
    const scheduledPayment = interest + principal
    const endingBalance = Math.max(0, beginningBalance + drawdown - principal)
    rows.push({
      period,
      beginningBalance: roundMoney(beginningBalance),
      drawdown: roundMoney(drawdown),
      scheduledPayment: roundMoney(scheduledPayment),
      interestPortion: roundMoney(interest),
      principalPortion: roundMoney(principal),
      endingBalance: roundMoney(endingBalance),
    })
    priorClosing = endingBalance
  }
  return rows
}

function entityCapexRow(
  entityId: ModelEntityId,
  periodIndex: number,
  capexUsd: number,
): CapexDeploymentRow {
  return {
    periodIndex,
    energyInfrastructureUsd: 0,
    energyBatteryUsd: entityId === "energy" ? roundMoney(capexUsd) : 0,
    platformUsd: entityId === "platform" ? roundMoney(capexUsd) : 0,
    fleetTrucksUsd: entityId === "fleet" ? roundMoney(capexUsd) : 0,
    totalUsd: roundMoney(capexUsd),
  }
}

function entitySourcesUsesRow(
  entityId: ModelEntityId,
  periodIndex: number,
  equityContributionUsd: number,
  debtDrawUsd: number,
  capexUsd: number,
): SourcesUsesRow {
  return {
    periodIndex,
    equityContributionUsd: roundMoney(equityContributionUsd),
    debtDrawUsd: roundMoney(debtDrawUsd),
    totalSourcesUsd: roundMoney(equityContributionUsd + debtDrawUsd),
    energyInfrastructureUsd: 0,
    energyBatteryUsd: entityId === "energy" ? roundMoney(capexUsd) : 0,
    platformUsd: entityId === "platform" ? roundMoney(capexUsd) : 0,
    fleetTrucksUsd: entityId === "fleet" ? roundMoney(capexUsd) : 0,
    totalUsesUsd: roundMoney(capexUsd),
  }
}

function buildYearPlans(
  input: EngineInput,
  scenario: ScenarioSnapshotOutput,
  n: number,
  p: ProjectionModelParameters,
): YearPlan[] {
  const plans: YearPlan[] = []
  const utilization = clampPercent(input.fleet.utilizationPercent)
  const chargingShare = Math.max(0, Math.min(1, scenario.pipeline.demand.fleetChargingShare))
  const swapShare = Math.max(0, 1 - chargingShare)
  const annualDistancePerOperatingTruckKm =
    Math.max(0, input.platform.corridorDistanceKm) *
    Math.max(0, input.fleet.tripsPerTruckPerDay) *
    365
  const batteryCostUnit = Math.max(0, input.energy.batteryCostPerUnitUsd)
  let priorStations = 0
  let priorSockets = 0
  let priorBays = 0
  let priorBatteryPool = 0
  let priorTrucks = 0
  let cumulativeEquivalentBatteryRetirements = 0
  let replacementUnitsPurchased = 0

  for (let periodIndex = 1; periodIndex <= n; periodIndex++) {
    const truckCount = valueAtPeriod(
      input.fleet.annualTruckPlan,
      input.fleet.vehicleCount,
      periodIndex,
    )
    const operatingTrucks = truckCount * utilization
    const annualEnergySoldKwh =
      operatingTrucks *
      annualDistancePerOperatingTruckKm *
      Math.max(0, input.energy.kwhConsumptionPerKm)
    const annualSwaps =
      operatingTrucks *
      Math.max(0, input.fleet.tripsPerTruckPerDay) *
      365 *
      swapShare
    const annualFreightRevenueUsd =
      operatingTrucks *
      annualDistancePerOperatingTruckKm *
      Math.max(0, input.fleet.averagePayloadTons) *
      Math.max(0, input.fleet.freightRatePerTonKmUsd)

    const band = selectScalingBandFromRows(
      truckCount,
      input.scalingBands as ScalingBandRow[],
    )
    const stations = overrideOrDefault(
      input.snapshotModel.infrastructureOverrides.stations,
      Math.max(0, band.baseStations),
    )
    const sockets = overrideOrDefault(
      input.snapshotModel.infrastructureOverrides.sockets,
      stations * Math.max(0, band.defaultSocketsPerStation),
    )
    const bays = overrideOrDefault(
      input.snapshotModel.infrastructureOverrides.bays,
      stations * Math.max(0, band.defaultBaysPerStation),
    )
    const batteryPool = Math.max(
      Math.max(0, band.defaultBatteryPool),
      Math.ceil(Math.max(0, truckCount) * Math.max(0, input.energy.batteryPoolRatio)),
    )

    cumulativeEquivalentBatteryRetirements +=
      annualEnergySoldKwh /
      Math.max(1e-9, input.energy.batteryCapacityKwh) /
      Math.max(1, input.energy.batteryCycleLife)
    const replacementUnitsNeeded = Math.max(
      0,
      Math.floor(cumulativeEquivalentBatteryRetirements + 1e-9) -
        replacementUnitsPurchased,
    )
    replacementUnitsPurchased += replacementUnitsNeeded
    const batteryGrowthUnits = Math.max(0, batteryPool - priorBatteryPool)
    const energyBatteryCapexUsd =
      periodIndex === 1
        ? roundMoney(p.batteryPackTotalCostUsd)
        : roundMoney((batteryGrowthUnits + replacementUnitsNeeded) * batteryCostUnit)

    const stationDelta = Math.max(0, stations - priorStations)
    const socketDelta = Math.max(0, sockets - priorSockets)
    const bayDelta = Math.max(0, bays - priorBays)
    const rawStationCapex =
      stationDelta * Math.max(0, input.platform.stationCapexUsd) +
      stationDelta *
        Math.max(0, input.platform.cooledWarehouseSizeSqmPerStation) *
        Math.max(0, input.platform.cooledWarehouseCapexPerSqmUsd)
    const rawEquipmentCapex =
      socketDelta * Math.max(0, input.platform.chargingSocketCapexUsd) +
      bayDelta * Math.max(0, input.platform.swapBayCapexUsd)
    const rawSoftwareCapex =
      periodIndex === 1 ? Math.max(0, input.platform.softwareDevelopmentCostUsd) : 0
    const rawPlatformCapexTotal =
      rawStationCapex + rawEquipmentCapex + rawSoftwareCapex
    const platformCapexRaw =
      periodIndex === 1 && rawPlatformCapexTotal > 0
        ? (() => {
            const factor = p.platformInitialCapexUsd / rawPlatformCapexTotal
            return {
              stationUsd: rawStationCapex * factor,
              equipmentUsd: rawEquipmentCapex * factor,
              softwareUsd: rawSoftwareCapex * factor,
              totalUsd: p.platformInitialCapexUsd,
            }
          })()
        : {
            stationUsd: rawStationCapex,
            equipmentUsd: rawEquipmentCapex,
            softwareUsd: rawSoftwareCapex,
            totalUsd: rawPlatformCapexTotal,
          }

    const fleetTruckCapexUsd =
      roundMoney(
        Math.max(0, truckCount - priorTrucks) * Math.max(0, p.truckCapexUsdPerVehicle),
      )
    const annualCycles =
      annualEnergySoldKwh / Math.max(1e-9, input.energy.batteryCapacityKwh)
    const sinkTarget = sinkingFundPayment({
      targetFutureValue: Math.max(0, p.sinkingFundTargetFutureValueUsd),
      periodRate: Math.max(0, p.sinkingFundPeriodRate),
      numPeriods: Math.max(1, n),
    })
    const annualSinkFromCycles =
      annualCycles * Math.max(0, input.energy.sinkingFundContributionPerCycleUsd)
    const sinkingFundContributionUsd = roundMoney(
      Math.max(
        annualSinkFromCycles,
        sinkTarget.ok ? sinkTarget.paymentPerPeriod : 0,
      ),
    )

    plans.push({
      periodIndex,
      truckCount,
      operatingTrucks,
      annualEnergySoldKwh: roundMoney(annualEnergySoldKwh),
      annualSwaps: roundMoney(annualSwaps),
      annualFreightRevenueUsd: roundMoney(
        annualFreightRevenueUsd > 0
          ? annualFreightRevenueUsd
          : truckCount * Math.max(0, p.fleetRevenueUsdPerVehicleYear),
      ),
      stations,
      sockets,
      bays,
      batteryPool,
      platformCapexRaw: {
        stationUsd: roundMoney(platformCapexRaw.stationUsd),
        equipmentUsd: roundMoney(platformCapexRaw.equipmentUsd),
        softwareUsd: roundMoney(platformCapexRaw.softwareUsd),
        totalUsd: roundMoney(platformCapexRaw.totalUsd),
      },
      energyBatteryCapexUsd,
      fleetTruckCapexUsd,
      sinkingFundContributionUsd,
    })

    priorStations = stations
    priorSockets = sockets
    priorBays = bays
    priorBatteryPool = batteryPool
    priorTrucks = truckCount
  }

  return plans
}

export function runModel(
  input: EngineInput,
  scenario: ScenarioSnapshotOutput,
  parameterOverrides?: Partial<ProjectionModelParameters>,
): ModelRunOutput {
  const n = Math.max(1, Math.trunc(input.horizon.periodCount))
  const base = defaultProjectionModelParametersForScenario(input, scenario)
  const p = mergeProjectionModelParameters(base, parameterOverrides)
  const pr = scenario.pipeline.pricing

  const yearPlans = buildYearPlans(input, scenario, n, p)
  const energyDebtDraws = yearPlans.map((row) =>
    row.energyBatteryCapexUsd *
    Math.max(
      0,
      Math.min(
        1,
        parameterOverrides?.debtShareOfEnergyCapex ?? p.debtShareOfEnergyCapex,
      ),
    ),
  )
  const platformDebtDraws = yearPlans.map((row) =>
    row.platformCapexRaw.totalUsd * clampPercent(input.platform.debtSharePercent),
  )
  const fleetDebtDraws = yearPlans.map((row) =>
    row.fleetTruckCapexUsd * clampPercent(input.fleet.debtSharePercent),
  )

  const energyDebtRows = aggregatedDebtSchedule(
    energyDebtDraws,
    Math.max(
      0,
      parameterOverrides?.loanNominalAnnualRate ??
        input.energy.costOfDebtPercent / 100,
    ),
    Math.max(1, Math.min(n, p.loanTenorPeriods)),
  )
  const platformDebtRows = aggregatedDebtSchedule(
    platformDebtDraws,
    Math.max(0, input.platform.costOfDebtPercent / 100),
    Math.max(1, Math.min(n, p.loanTenorPeriods)),
  )
  const fleetDebtRows = aggregatedDebtSchedule(
    fleetDebtDraws,
    Math.max(0, input.fleet.costOfDebtPercent / 100),
    Math.max(1, Math.min(n, p.loanTenorPeriods)),
  )

  const energyIs: AnnualIncomeStatement[] = []
  const energyBs: AnnualBalanceSheet[] = []
  const energyCf: AnnualCashFlowStatement[] = []
  const energyEq: AnnualEquityStatement[] = []
  const energyCapexRows: CapexDeploymentRow[] = []
  const energySourcesRows: SourcesUsesRow[] = []

  const platformIs: AnnualIncomeStatement[] = []
  const platformBs: AnnualBalanceSheet[] = []
  const platformCf: AnnualCashFlowStatement[] = []
  const platformEq: AnnualEquityStatement[] = []
  const platformCapexRows: CapexDeploymentRow[] = []
  const platformSourcesRows: SourcesUsesRow[] = []

  const fleetIs: AnnualIncomeStatement[] = []
  const fleetBs: AnnualBalanceSheet[] = []
  const fleetCf: AnnualCashFlowStatement[] = []
  const fleetEq: AnnualEquityStatement[] = []
  const fleetCapexRows: CapexDeploymentRow[] = []
  const fleetSourcesRows: SourcesUsesRow[] = []

  const eliminations: EliminationLine[] = []
  const consolidated: ConsolidatedAnnualPack[] = []
  const cfadsSeries: number[] = []
  const debtServiceSeries: number[] = []
  const unleveredFcf: number[] = []
  const equityCf: number[] = []

  const platformStationVintages: StraightLineVintage[] = []
  const platformEquipmentVintages: StraightLineVintage[] = []
  const platformSoftwareVintages: StraightLineVintage[] = []
  const fleetTruckVintages: StraightLineVintage[] = []

  const energyState: EntityCashState & {
    sinkingFundAsset: number
    batteryGross: number
    accumulatedBatteryDep: number
  } = {
    cash: 0,
    equity: 0,
    sinkingFundAsset: 0,
    batteryGross: 0,
    accumulatedBatteryDep: 0,
  }
  const platformState: EntityCashState = { cash: 0, equity: 0 }
  const fleetState: EntityCashState = { cash: 0, equity: 0 }

  let firstYearPlatformInternalCharge = 0
  let firstYearFleetCorridorCharge = 0
  let priorConsolidatedEquity = 0

  for (const row of yearPlans) {
    const periodIndex = row.periodIndex
    const energyCapexUsd = row.energyBatteryCapexUsd
    const platformCapexUsd = row.platformCapexRaw.totalUsd
    const fleetCapexUsd = row.fleetTruckCapexUsd

    const energyDebtRow = energyDebtRows[periodIndex - 1]
    const platformDebtRow = platformDebtRows[periodIndex - 1]
    const fleetDebtRow = fleetDebtRows[periodIndex - 1]

    const energyDebtDraw = energyDebtRow?.drawdown ?? 0
    const platformDebtDraw = platformDebtRow?.drawdown ?? 0
    const fleetDebtDraw = fleetDebtRow?.drawdown ?? 0

    const energyEquityIssuance = energyCapexUsd - energyDebtDraw
    const platformEquityIssuance = platformCapexUsd - platformDebtDraw
    const fleetEquityIssuance = fleetCapexUsd - fleetDebtDraw

    if (row.platformCapexRaw.stationUsd > 0) {
      platformStationVintages.push({
        amount: row.platformCapexRaw.stationUsd,
        lifeYears: Math.max(1, input.platform.stationUsefulLifeYears),
        ageYears: 0,
      })
    }
    if (row.platformCapexRaw.equipmentUsd > 0) {
      platformEquipmentVintages.push({
        amount: row.platformCapexRaw.equipmentUsd,
        lifeYears: Math.max(1, input.platform.equipmentUsefulLifeYears),
        ageYears: 0,
      })
    }
    if (row.platformCapexRaw.softwareUsd > 0) {
      platformSoftwareVintages.push({
        amount: row.platformCapexRaw.softwareUsd,
        lifeYears: Math.max(1, input.platform.softwareUsefulLifeYears),
        ageYears: 0,
      })
    }
    if (fleetCapexUsd > 0) {
      fleetTruckVintages.push({
        amount: fleetCapexUsd,
        lifeYears: Math.max(1, input.fleet.truckUsefulLifeYears),
        ageYears: 0,
      })
    }
    energyState.batteryGross += energyCapexUsd

    const platformDep =
      applyStraightLineDepreciation(platformStationVintages) +
      applyStraightLineDepreciation(platformEquipmentVintages) +
      applyStraightLineDepreciation(platformSoftwareVintages)
    const fleetDep = applyStraightLineDepreciation(fleetTruckVintages)

    const annualCycles =
      row.annualEnergySoldKwh / Math.max(1e-9, input.energy.batteryCapacityKwh)
    const batteryResidualFloor =
      Math.max(0, row.batteryPool) *
      Math.max(0, input.energy.batteryResidualValueUsd)
    const currentBatteryDep = Math.min(
      Math.max(
        0,
        energyState.batteryGross -
          batteryResidualFloor -
          energyState.accumulatedBatteryDep,
      ),
      annualCycles *
        Math.max(
          0,
          (Math.max(0, input.energy.batteryCostPerUnitUsd) -
            Math.max(0, input.energy.batteryResidualValueUsd)) /
            Math.max(1, input.energy.batteryCycleLife),
        ),
    )
    energyState.accumulatedBatteryDep += currentBatteryDep

    const platformRevenue =
      row.annualEnergySoldKwh * Math.max(0, pr.a2PlatformUsdPerKwh) +
      row.annualSwaps * Math.max(0, input.snapshotModel.swapServiceUsdPerSwap)
    const energyRevenue =
      row.annualEnergySoldKwh * Math.max(0, pr.a2EnergyUsdPerKwh)
    const fleetEnergyCost =
      row.annualEnergySoldKwh * Math.max(0, pr.totalRetailUsdPerKwh)
    const gridCost =
      row.annualEnergySoldKwh * Math.max(0, pr.gridPassThroughUsdPerKwh)

    if (periodIndex === 1) {
      firstYearPlatformInternalCharge = platformRevenue
      firstYearFleetCorridorCharge = fleetEnergyCost
    }

    const platformCogs =
      Math.max(0, input.platform.staffPerStation) *
      Math.max(0, input.platform.staffCostPerPersonPerYearUsd) *
      row.stations
    const platformNetAssets =
      netBookFromVintages(platformStationVintages) +
      netBookFromVintages(platformEquipmentVintages) +
      netBookFromVintages(platformSoftwareVintages)
    const platformOpex =
      grossFromVintages(platformStationVintages.concat(platformEquipmentVintages)) *
        clampPercent(input.platform.maintenancePercentInfraCapex) +
      platformNetAssets * clampPercent(input.platform.insurancePercentAssets) +
      Math.max(0, input.platform.softwareMaintenanceCostUsdPerYear) +
      Math.max(0, input.platform.adminOverheadUsdPerYear)
    const platformEbitda = platformRevenue - platformCogs - platformOpex
    const platformInterest = platformDebtRow?.interestPortion ?? 0
    const platformEbit = platformEbitda - platformDep
    const platformPretax = platformEbit - platformInterest
    const platformTax =
      Math.max(0, platformPretax) * clampPercent(input.platform.taxRatePercent)
    const platformNi = platformPretax - platformTax

    const energyCogs = currentBatteryDep
    const energyOpex =
      row.batteryPool *
      Math.max(
        0,
        input.energy.insurancePerBatteryPerYearUsd +
          input.energy.monitoringPerBatteryPerYearUsd,
      )
    const energyEbitda = energyRevenue - energyCogs - energyOpex
    const energyInterest = energyDebtRow?.interestPortion ?? 0
    const energyEbit = energyEbitda
    const energyPretax = energyEbit - energyInterest
    const energyTax =
      Math.max(0, energyPretax) * clampPercent(input.energy.taxRatePercent)
    const energyNi = energyPretax - energyTax

    const fleetDriverCost =
      row.truckCount * Math.max(0, input.fleet.driverCostPerTruckPerYearUsd)
    const fleetTyreCost =
      row.truckCount * Math.max(0, input.fleet.tyreCostPerTruckPerYearUsd)
    const fleetCogs = fleetEnergyCost + fleetDriverCost + fleetTyreCost
    const fleetOpex =
      row.truckCount *
        Math.max(
          0,
          input.fleet.maintenancePerTruckPerYearUsd +
            input.fleet.insurancePerTruckPerYearUsd +
            input.fleet.licensingAndPermitsPerTruckPerYearUsd,
        ) +
      Math.max(0, input.fleet.adminOverheadUsdPerYear)
    const fleetEbitda = row.annualFreightRevenueUsd - fleetCogs - fleetOpex
    const fleetInterest = fleetDebtRow?.interestPortion ?? 0
    const fleetEbit = fleetEbitda - fleetDep
    const fleetPretax = fleetEbit - fleetInterest
    const fleetTax =
      Math.max(0, fleetPretax) * clampPercent(input.fleet.taxRatePercent)
    const fleetNi = fleetPretax - fleetTax

    const energyCfo = energyNi + currentBatteryDep
    const energyCfi = -energyCapexUsd - row.sinkingFundContributionUsd
    const energyCff =
      energyDebtDraw +
      energyEquityIssuance -
      (energyDebtRow?.principalPortion ?? 0)
    energyState.sinkingFundAsset += row.sinkingFundContributionUsd
    energyState.cash += energyCfo + energyCfi + energyCff
    const energyBeginningEquity = energyState.equity
    energyState.equity += energyEquityIssuance + energyNi

    const platformCfo = platformNi + platformDep
    const platformCfi = -platformCapexUsd
    const platformCff =
      platformDebtDraw +
      platformEquityIssuance -
      (platformDebtRow?.principalPortion ?? 0)
    platformState.cash += platformCfo + platformCfi + platformCff
    const platformBeginningEquity = platformState.equity
    platformState.equity += platformEquityIssuance + platformNi

    const fleetCfo = fleetNi + fleetDep
    const fleetCfi = -fleetCapexUsd
    const fleetCff =
      fleetDebtDraw +
      fleetEquityIssuance -
      (fleetDebtRow?.principalPortion ?? 0)
    fleetState.cash += fleetCfo + fleetCfi + fleetCff
    const fleetBeginningEquity = fleetState.equity
    fleetState.equity += fleetEquityIssuance + fleetNi

    const energyPpeGross = energyState.batteryGross
    const energyAccumDep = energyState.accumulatedBatteryDep
    const energyPpeNet = energyPpeGross - energyAccumDep
    const energyDebt = energyDebtRow?.endingBalance ?? 0
    const energyAssets =
      energyState.cash + energyState.sinkingFundAsset + energyPpeNet

    const platformPpeGross =
      grossFromVintages(platformStationVintages) +
      grossFromVintages(platformEquipmentVintages) +
      grossFromVintages(platformSoftwareVintages)
    const platformPpeNet = platformNetAssets
    const platformAccumDep = platformPpeGross - platformPpeNet
    const platformDebt = platformDebtRow?.endingBalance ?? 0
    const platformAssets = platformState.cash + platformPpeNet

    const fleetPpeGross = grossFromVintages(fleetTruckVintages)
    const fleetPpeNet = netBookFromVintages(fleetTruckVintages)
    const fleetAccumDep = fleetPpeGross - fleetPpeNet
    const fleetDebt = fleetDebtRow?.endingBalance ?? 0
    const fleetAssets = fleetState.cash + fleetPpeNet

    energyIs.push({
      periodIndex,
      revenue: roundMoney(energyRevenue),
      costOfGoodsSold: roundMoney(energyCogs),
      operatingExpenses: roundMoney(energyOpex),
      ebitda: roundMoney(energyEbitda),
      depreciation: 0,
      ebit: roundMoney(energyEbit),
      interestExpense: roundMoney(energyInterest),
      pretaxIncome: roundMoney(energyPretax),
      taxExpense: roundMoney(energyTax),
      netIncome: roundMoney(energyNi),
    })
    energyBs.push({
      periodIndex,
      cash: roundMoney(energyState.cash),
      sinkingFundAsset: roundMoney(energyState.sinkingFundAsset),
      ppeGross: roundMoney(energyPpeGross),
      accumulatedDepreciation: roundMoney(energyAccumDep),
      totalAssets: roundMoney(energyAssets),
      debt: roundMoney(energyDebt),
      totalLiabilities: roundMoney(energyDebt),
      equity: roundMoney(energyState.equity),
      totalLiabilitiesAndEquity: roundMoney(energyDebt + energyState.equity),
    })
    energyCf.push({
      periodIndex,
      cashFromOperations: roundMoney(energyCfo),
      cashFromInvesting: roundMoney(energyCfi),
      cashFromFinancing: roundMoney(energyCff),
      sinkingFundContribution: roundMoney(row.sinkingFundContributionUsd),
      netChangeInCash: roundMoney(energyCfo + energyCfi + energyCff),
    })
    energyEq.push({
      periodIndex,
      beginningEquity: roundMoney(energyBeginningEquity),
      equityIssuance: roundMoney(energyEquityIssuance),
      netIncome: roundMoney(energyNi),
      dividends: 0,
      endingEquity: roundMoney(energyState.equity),
    })
    energyCapexRows.push(entityCapexRow("energy", periodIndex, energyCapexUsd))
    energySourcesRows.push(
      entitySourcesUsesRow(
        "energy",
        periodIndex,
        energyEquityIssuance,
        energyDebtDraw,
        energyCapexUsd,
      ),
    )

    platformIs.push({
      periodIndex,
      revenue: roundMoney(platformRevenue),
      costOfGoodsSold: roundMoney(platformCogs),
      operatingExpenses: roundMoney(platformOpex),
      ebitda: roundMoney(platformEbitda),
      depreciation: roundMoney(platformDep),
      ebit: roundMoney(platformEbit),
      interestExpense: roundMoney(platformInterest),
      pretaxIncome: roundMoney(platformPretax),
      taxExpense: roundMoney(platformTax),
      netIncome: roundMoney(platformNi),
    })
    platformBs.push({
      periodIndex,
      cash: roundMoney(platformState.cash),
      sinkingFundAsset: 0,
      ppeGross: roundMoney(platformPpeGross),
      accumulatedDepreciation: roundMoney(platformAccumDep),
      totalAssets: roundMoney(platformAssets),
      debt: roundMoney(platformDebt),
      totalLiabilities: roundMoney(platformDebt),
      equity: roundMoney(platformState.equity),
      totalLiabilitiesAndEquity: roundMoney(platformDebt + platformState.equity),
    })
    platformCf.push({
      periodIndex,
      cashFromOperations: roundMoney(platformCfo),
      cashFromInvesting: roundMoney(platformCfi),
      cashFromFinancing: roundMoney(platformCff),
      sinkingFundContribution: 0,
      netChangeInCash: roundMoney(platformCfo + platformCfi + platformCff),
    })
    platformEq.push({
      periodIndex,
      beginningEquity: roundMoney(platformBeginningEquity),
      equityIssuance: roundMoney(platformEquityIssuance),
      netIncome: roundMoney(platformNi),
      dividends: 0,
      endingEquity: roundMoney(platformState.equity),
    })
    platformCapexRows.push(
      entityCapexRow("platform", periodIndex, platformCapexUsd),
    )
    platformSourcesRows.push(
      entitySourcesUsesRow(
        "platform",
        periodIndex,
        platformEquityIssuance,
        platformDebtDraw,
        platformCapexUsd,
      ),
    )

    fleetIs.push({
      periodIndex,
      revenue: roundMoney(row.annualFreightRevenueUsd),
      costOfGoodsSold: roundMoney(fleetCogs),
      operatingExpenses: roundMoney(fleetOpex),
      ebitda: roundMoney(fleetEbitda),
      depreciation: roundMoney(fleetDep),
      ebit: roundMoney(fleetEbit),
      interestExpense: roundMoney(fleetInterest),
      pretaxIncome: roundMoney(fleetPretax),
      taxExpense: roundMoney(fleetTax),
      netIncome: roundMoney(fleetNi),
    })
    fleetBs.push({
      periodIndex,
      cash: roundMoney(fleetState.cash),
      sinkingFundAsset: 0,
      ppeGross: roundMoney(fleetPpeGross),
      accumulatedDepreciation: roundMoney(fleetAccumDep),
      totalAssets: roundMoney(fleetAssets),
      debt: roundMoney(fleetDebt),
      totalLiabilities: roundMoney(fleetDebt),
      equity: roundMoney(fleetState.equity),
      totalLiabilitiesAndEquity: roundMoney(fleetDebt + fleetState.equity),
    })
    fleetCf.push({
      periodIndex,
      cashFromOperations: roundMoney(fleetCfo),
      cashFromInvesting: roundMoney(fleetCfi),
      cashFromFinancing: roundMoney(fleetCff),
      sinkingFundContribution: 0,
      netChangeInCash: roundMoney(fleetCfo + fleetCfi + fleetCff),
    })
    fleetEq.push({
      periodIndex,
      beginningEquity: roundMoney(fleetBeginningEquity),
      equityIssuance: roundMoney(fleetEquityIssuance),
      netIncome: roundMoney(fleetNi),
      dividends: 0,
      endingEquity: roundMoney(fleetState.equity),
    })
    fleetCapexRows.push(entityCapexRow("fleet", periodIndex, fleetCapexUsd))
    fleetSourcesRows.push(
      entitySourcesUsesRow(
        "fleet",
        periodIndex,
        fleetEquityIssuance,
        fleetDebtDraw,
        fleetCapexUsd,
      ),
    )

    eliminations.push({
      code: "ELIM_FLEET_ENERGY_CORRIDOR",
      periodIndex,
      amountUsd: roundMoney(energyRevenue),
      description: "Fleet energy spend ↔ A2 Energy service revenue",
    })
    eliminations.push({
      code: "ELIM_ENERGY_PLATFORM_SERVICES",
      periodIndex,
      amountUsd: roundMoney(platformRevenue),
      description: "Fleet platform swap spend ↔ A2 Platform revenue",
    })

    const consolidatedRevenue = row.annualFreightRevenueUsd
    const consolidatedCogs =
      gridCost + currentBatteryDep + platformCogs + fleetDriverCost + fleetTyreCost
    const consolidatedOpex = platformOpex + energyOpex + fleetOpex
    const consolidatedEbitda =
      consolidatedRevenue - consolidatedCogs - consolidatedOpex
    const consolidatedDep = platformDep + currentBatteryDep + fleetDep
    const consolidatedInterest = platformInterest + energyInterest + fleetInterest
    const consolidatedEbit = consolidatedEbitda - consolidatedDep
    const consolidatedPretax = consolidatedEbit - consolidatedInterest
    const consolidatedTax = platformTax + energyTax + fleetTax
    const consolidatedNi = consolidatedPretax - consolidatedTax

    const consolidatedCash =
      energyState.cash + platformState.cash + fleetState.cash
    const consolidatedSinking = energyState.sinkingFundAsset
    const consolidatedPpeGross =
      energyPpeGross + platformPpeGross + fleetPpeGross
    const consolidatedAccumDep =
      energyAccumDep + platformAccumDep + fleetAccumDep
    const consolidatedAssets =
      consolidatedCash +
      consolidatedSinking +
      (consolidatedPpeGross - consolidatedAccumDep)
    const consolidatedDebt = energyDebt + platformDebt + fleetDebt
    const consolidatedEquity =
      energyState.equity + platformState.equity + fleetState.equity

    if (
      !nearlyEqual(
        consolidatedAssets,
        consolidatedDebt + consolidatedEquity,
        1e-2,
      )
    ) {
      throw new Error("Consolidated balance sheet mismatch")
    }

    consolidated.push({
      periodIndex,
      incomeStatement: {
        periodIndex,
        revenue: roundMoney(consolidatedRevenue),
        costOfGoodsSold: roundMoney(consolidatedCogs),
        operatingExpenses: roundMoney(consolidatedOpex),
        ebitda: roundMoney(consolidatedEbitda),
        depreciation: roundMoney(consolidatedDep),
        ebit: roundMoney(consolidatedEbit),
        interestExpense: roundMoney(consolidatedInterest),
        pretaxIncome: roundMoney(consolidatedPretax),
        taxExpense: roundMoney(consolidatedTax),
        netIncome: roundMoney(consolidatedNi),
      },
      balanceSheet: {
        periodIndex,
        cash: roundMoney(consolidatedCash),
        sinkingFundAsset: roundMoney(consolidatedSinking),
        ppeGross: roundMoney(consolidatedPpeGross),
        accumulatedDepreciation: roundMoney(consolidatedAccumDep),
        totalAssets: roundMoney(consolidatedAssets),
        debt: roundMoney(consolidatedDebt),
        totalLiabilities: roundMoney(consolidatedDebt),
        equity: roundMoney(consolidatedEquity),
        totalLiabilitiesAndEquity: roundMoney(
          consolidatedDebt + consolidatedEquity,
        ),
      },
      cashFlowStatement: {
        periodIndex,
        cashFromOperations: roundMoney(energyCfo + platformCfo + fleetCfo),
        cashFromInvesting: roundMoney(energyCfi + platformCfi + fleetCfi),
        cashFromFinancing: roundMoney(energyCff + platformCff + fleetCff),
        sinkingFundContribution: roundMoney(row.sinkingFundContributionUsd),
        netChangeInCash: roundMoney(
          energyCfo +
            platformCfo +
            fleetCfo +
            energyCfi +
            platformCfi +
            fleetCfi +
            energyCff +
            platformCff +
            fleetCff,
        ),
      },
      equityStatement: {
        periodIndex,
        beginningEquity: roundMoney(priorConsolidatedEquity),
        equityIssuance: roundMoney(
          energyEquityIssuance + platformEquityIssuance + fleetEquityIssuance,
        ),
        netIncome: roundMoney(consolidatedNi),
        dividends: 0,
        endingEquity: roundMoney(
          priorConsolidatedEquity +
            energyEquityIssuance +
            platformEquityIssuance +
            fleetEquityIssuance +
            consolidatedNi,
        ),
      },
    })
    priorConsolidatedEquity = consolidatedEquity

    const debtService =
      (energyDebtRow?.scheduledPayment ?? 0) +
      (platformDebtRow?.scheduledPayment ?? 0) +
      (fleetDebtRow?.scheduledPayment ?? 0)
    const cfads = consolidatedEbitda - consolidatedTax
    cfadsSeries.push(cfads)
    debtServiceSeries.push(debtService)

    unleveredFcf.push(
      consolidatedNi +
        consolidatedDep +
        consolidatedInterest -
        energyCapexUsd -
        platformCapexUsd -
        fleetCapexUsd -
        row.sinkingFundContributionUsd,
    )
    equityCf.push(
      consolidatedNi +
        consolidatedDep -
        energyCapexUsd -
        platformCapexUsd -
        fleetCapexUsd -
        row.sinkingFundContributionUsd +
        energyDebtDraw +
        platformDebtDraw +
        fleetDebtDraw -
        (energyDebtRow?.principalPortion ?? 0) -
        (platformDebtRow?.principalPortion ?? 0) -
        (fleetDebtRow?.principalPortion ?? 0),
    )
  }

  const entities: Record<ModelEntityId, EntityProjectionPack> = {
    energy: {
      incomeStatement: energyIs,
      balanceSheet: energyBs,
      cashFlowStatement: energyCf,
      equityStatement: energyEq,
      capexDeployment: energyCapexRows,
      debtSchedule: energyDebtRows,
      sourcesUses: energySourcesRows,
    },
    platform: {
      incomeStatement: platformIs,
      balanceSheet: platformBs,
      cashFlowStatement: platformCf,
      equityStatement: platformEq,
      capexDeployment: platformCapexRows,
      debtSchedule: platformDebtRows,
      sourcesUses: platformSourcesRows,
    },
    fleet: {
      incomeStatement: fleetIs,
      balanceSheet: fleetBs,
      cashFlowStatement: fleetCf,
      equityStatement: fleetEq,
      capexDeployment: fleetCapexRows,
      debtSchedule: fleetDebtRows,
      sourcesUses: fleetSourcesRows,
    },
  }

  const consolidatedDebtSchedule: DebtScheduleRow[] = yearPlans.map((row, index) => ({
    period: row.periodIndex,
    beginningBalance: roundMoney(
      (energyDebtRows[index]?.beginningBalance ?? 0) +
        (platformDebtRows[index]?.beginningBalance ?? 0) +
        (fleetDebtRows[index]?.beginningBalance ?? 0),
    ),
    drawdown: roundMoney(
      (energyDebtRows[index]?.drawdown ?? 0) +
        (platformDebtRows[index]?.drawdown ?? 0) +
        (fleetDebtRows[index]?.drawdown ?? 0),
    ),
    scheduledPayment: roundMoney(
      (energyDebtRows[index]?.scheduledPayment ?? 0) +
        (platformDebtRows[index]?.scheduledPayment ?? 0) +
        (fleetDebtRows[index]?.scheduledPayment ?? 0),
    ),
    interestPortion: roundMoney(
      (energyDebtRows[index]?.interestPortion ?? 0) +
        (platformDebtRows[index]?.interestPortion ?? 0) +
        (fleetDebtRows[index]?.interestPortion ?? 0),
    ),
    principalPortion: roundMoney(
      (energyDebtRows[index]?.principalPortion ?? 0) +
        (platformDebtRows[index]?.principalPortion ?? 0) +
        (fleetDebtRows[index]?.principalPortion ?? 0),
    ),
    endingBalance: roundMoney(
      (energyDebtRows[index]?.endingBalance ?? 0) +
        (platformDebtRows[index]?.endingBalance ?? 0) +
        (fleetDebtRows[index]?.endingBalance ?? 0),
    ),
  }))

  const analytics = {
    corridor: buildAnalyticsPack({
      incomeStatement: consolidated.map((row) => row.incomeStatement),
      balanceSheet: consolidated.map((row) => row.balanceSheet),
      cashFlowStatement: consolidated.map((row) => row.cashFlowStatement),
      equityStatement: consolidated.map((row) => row.equityStatement),
      debtSchedule: consolidatedDebtSchedule,
      periodRate: input.horizon.discountRatePerPeriod,
      terminalGrowthRate: input.financePolicy.terminalGrowthRatePercent / 100,
      exitMultiple: input.financePolicy.exitMultiple,
      costOfEquity: input.financePolicy.corridorWideDiscountRatePercent / 100,
      costOfDebtPreTax:
        ((input.energy.costOfDebtPercent +
          input.platform.costOfDebtPercent +
          input.fleet.costOfDebtPercent) /
          3) /
        100,
      taxRate:
        ((input.energy.taxRatePercent +
          input.platform.taxRatePercent +
          input.fleet.taxRatePercent) /
          3) /
        100,
      maintenanceReservePercentCapex:
        input.financePolicy.maintenanceReservePercentCapex / 100,
      debtServiceReserveMonths: input.financePolicy.debtServiceReserveMonths,
      dscrLockupThreshold: input.financePolicy.dscrLockupThreshold,
      dscrDistributionThreshold: input.financePolicy.dscrDistributionThreshold,
      sinkingFundOnly: false,
    }),
    entities: {
      energy: buildAnalyticsPack({
        incomeStatement: energyIs,
        balanceSheet: energyBs,
        cashFlowStatement: energyCf,
        equityStatement: energyEq,
        debtSchedule: energyDebtRows,
        periodRate: input.horizon.discountRatePerPeriod,
        terminalGrowthRate: input.financePolicy.terminalGrowthRatePercent / 100,
        exitMultiple: input.financePolicy.exitMultiple,
        costOfEquity: input.energy.targetEquityReturnPercent / 100,
        costOfDebtPreTax: input.energy.costOfDebtPercent / 100,
        taxRate: input.energy.taxRatePercent / 100,
        maintenanceReservePercentCapex:
          input.financePolicy.maintenanceReservePercentCapex / 100,
        debtServiceReserveMonths: input.financePolicy.debtServiceReserveMonths,
        dscrLockupThreshold: input.financePolicy.dscrLockupThreshold,
        dscrDistributionThreshold: input.financePolicy.dscrDistributionThreshold,
        sinkingFundOnly: true,
      }),
      platform: buildAnalyticsPack({
        incomeStatement: platformIs,
        balanceSheet: platformBs,
        cashFlowStatement: platformCf,
        equityStatement: platformEq,
        debtSchedule: platformDebtRows,
        periodRate: input.horizon.discountRatePerPeriod,
        terminalGrowthRate: input.financePolicy.terminalGrowthRatePercent / 100,
        exitMultiple: input.financePolicy.exitMultiple,
        costOfEquity: input.platform.targetEquityReturnPercent / 100,
        costOfDebtPreTax: input.platform.costOfDebtPercent / 100,
        taxRate: input.platform.taxRatePercent / 100,
        maintenanceReservePercentCapex:
          input.financePolicy.maintenanceReservePercentCapex / 100,
        debtServiceReserveMonths: input.financePolicy.debtServiceReserveMonths,
        dscrLockupThreshold: input.financePolicy.dscrLockupThreshold,
        dscrDistributionThreshold: input.financePolicy.dscrDistributionThreshold,
        sinkingFundOnly: false,
      }),
      fleet: buildAnalyticsPack({
        incomeStatement: fleetIs,
        balanceSheet: fleetBs,
        cashFlowStatement: fleetCf,
        equityStatement: fleetEq,
        debtSchedule: fleetDebtRows,
        periodRate: input.horizon.discountRatePerPeriod,
        terminalGrowthRate: input.financePolicy.terminalGrowthRatePercent / 100,
        exitMultiple: input.financePolicy.exitMultiple,
        costOfEquity: input.fleet.targetEquityReturnPercent / 100,
        costOfDebtPreTax: input.fleet.costOfDebtPercent / 100,
        taxRate: input.fleet.taxRatePercent / 100,
        maintenanceReservePercentCapex:
          input.financePolicy.maintenanceReservePercentCapex / 100,
        debtServiceReserveMonths: input.financePolicy.debtServiceReserveMonths,
        dscrLockupThreshold: input.financePolicy.dscrLockupThreshold,
        dscrDistributionThreshold: input.financePolicy.dscrDistributionThreshold,
        sinkingFundOnly: false,
      }),
    },
  }

  return {
    version: MODEL_OUTPUT_VERSION,
    periodCount: n,
    parameters: p,
    platformIntercompanyUsdPerYear: roundMoney(firstYearPlatformInternalCharge),
    fleetCorridorChargeUsdPerYear: roundMoney(firstYearFleetCorridorCharge),
    entities,
    eliminations,
    consolidated,
    coverage: analytics.corridor.coverage,
    returnMetrics: analytics.corridor.returnMetrics,
    dcfSupport: analytics.corridor.dcfSupport,
    analytics,
  }
}
