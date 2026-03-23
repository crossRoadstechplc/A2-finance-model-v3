import { describe, expect, it } from "vitest"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { nearlyEqual } from "@/finance/math"
import { runModel } from "@/model/runModel"
import { buildScenarioRunInput, runScenario } from "@/snapshot/runScenario"
import { getDefaultEcisDataState } from "@/store/defaults"

describe("runModel", () => {
  function fixture() {
    const data = getDefaultEcisDataState()
    data.system.modelHorizonYears = 10
    data.system.discountRatePercent = 8
    data.system.inflationAssumptionPercent = 0
    data.fleet.vehicleCount = 40
    data.snapshotModel.fleetChargingShare = 0.5
    data.snapshotModel.gridPassThroughUsdPerKwh = 0.12
    data.snapshotModel.a2EnergyUsdPerKwh = 0.05
    data.snapshotModel.a2PlatformUsdPerKwh = 0.03
    data.snapshotModel.swapServiceUsdPerSwap = 40
    const input = assumptionsToEngineInput(data)
    const scenario = runScenario(buildScenarioRunInput(input))
    const model = runModel(input, scenario, {
      batteryPackTotalCostUsd: 900_000,
      truckCapexUsdPerVehicle: 100_000,
      platformInitialCapexUsd: 200_000,
      fleetRevenueUsdPerVehicleYear: 200_000,
      debtShareOfEnergyCapex: 0.6,
      loanNominalAnnualRate: 0.06,
      loanTenorPeriods: 10,
      sinkingFundTargetFutureValueUsd: 100_000,
      sinkingFundPeriodRate: 0.06,
      infrastructureUsefulLifeYears: 10,
      truckUsefulLifeYears: 5,
      platformUsefulLifeYears: 5,
      batteryTotalCycles: 500_000,
      kwhPerBatteryCycle: 4000,
    })
    return { input, scenario, model }
  }

  it("produces internally consistent consolidated statements", () => {
    const { model } = fixture()
    for (const pack of model.consolidated) {
      const { incomeStatement: is, balanceSheet: bs, cashFlowStatement: cf, equityStatement: eq } =
        pack
      expect(is.ebit).toBeCloseTo(is.ebitda - is.depreciation, 1)
      expect(is.pretaxIncome).toBeCloseTo(is.ebit - is.interestExpense, 1)
      expect(is.netIncome).toBeCloseTo(is.pretaxIncome - is.taxExpense, 1)

      expect(
        nearlyEqual(bs.totalAssets, bs.totalLiabilitiesAndEquity, 1e-2),
      ).toBe(true)
      expect(eq.endingEquity).toBeCloseTo(
        eq.beginningEquity + eq.equityIssuance + eq.netIncome,
        1,
      )

      const deltaCash =
        cf.cashFromOperations + cf.cashFromInvesting + cf.cashFromFinancing
      expect(cf.netChangeInCash).toBeCloseTo(deltaCash, 2)
    }
  })

  it("rolls debt balances per the amortization schedule", () => {
    const { model } = fixture()
    const rows = model.entities.energy.debtSchedule
    expect(rows.length).toBeGreaterThan(0)
    const last = rows[rows.length - 1]!
    expect(last.endingBalance).toBeCloseTo(0, 0)

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!
      const next = rows[i + 1]
      if (!next) break
      expect(next.beginningBalance).toBeCloseTo(r.endingBalance, 6)
    }
  })

  it("keeps capex and funding schedules entity-specific", () => {
    const { model } = fixture()
    const energyCapex = model.entities.energy.capexDeployment[0]!
    const platformCapex = model.entities.platform.capexDeployment[0]!
    const fleetCapex = model.entities.fleet.capexDeployment[0]!

    expect(energyCapex.energyBatteryUsd).toBeGreaterThan(0)
    expect(energyCapex.platformUsd).toBe(0)
    expect(energyCapex.fleetTrucksUsd).toBe(0)

    expect(platformCapex.platformUsd).toBeGreaterThan(0)
    expect(platformCapex.energyBatteryUsd).toBe(0)
    expect(platformCapex.fleetTrucksUsd).toBe(0)

    expect(fleetCapex.fleetTrucksUsd).toBeGreaterThan(0)
    expect(fleetCapex.energyBatteryUsd).toBe(0)
    expect(fleetCapex.platformUsd).toBe(0)

    expect(model.entities.platform.debtSchedule[0]?.drawdown ?? 0).toBeGreaterThan(0)
    expect(model.entities.fleet.debtSchedule[0]?.drawdown ?? 0).toBeGreaterThan(0)
  })

  it("books per-cycle battery depreciation in Energy COGS", () => {
    const { model } = fixture()
    const y1 = model.entities.energy.incomeStatement[0]!
    expect(y1.costOfGoodsSold).toBeGreaterThan(0)
    const battDep = y1.costOfGoodsSold
    expect(battDep).toBeGreaterThan(0)
    expect(model.entities.energy.incomeStatement[1]!.costOfGoodsSold).toBeGreaterThan(0)
  })

  it("elimination envelope removes corridor and platform double counting in consolidation", () => {
    const { model } = fixture()
    const t1 = model.consolidated[0]!
    const sumEntityRevenue =
      model.entities.energy.incomeStatement[0]!.revenue +
      model.entities.platform.incomeStatement[0]!.revenue +
      model.entities.fleet.incomeStatement[0]!.revenue
    expect(sumEntityRevenue).toBeGreaterThan(t1.incomeStatement.revenue)
    const totalElims = model.eliminations
      .filter((e) => e.periodIndex === 1)
      .reduce((sum, e) => sum + e.amountUsd, 0)
    expect(sumEntityRevenue - totalElims).toBeCloseTo(
      t1.incomeStatement.revenue,
      6,
    )

    const elimCorridor = model.eliminations.filter(
      (e) => e.code === "ELIM_FLEET_ENERGY_CORRIDOR",
    )
    const elimPlat = model.eliminations.filter(
      (e) => e.code === "ELIM_ENERGY_PLATFORM_SERVICES",
    )
    expect(elimCorridor[0]?.amountUsd).toBeCloseTo(
      model.entities.energy.incomeStatement[0]!.revenue,
      6,
    )
    expect(elimPlat[0]?.amountUsd).toBeCloseTo(model.platformIntercompanyUsdPerYear, 6)
  })

  it("keeps DCF / IRR / MOIC stable on a pinned fixture", () => {
    const { model } = fixture()
    expect(model.returnMetrics.unleveredNpv).toMatchInlineSnapshot(`1837071321.9774165`)
    expect(model.returnMetrics.equityNpv).toMatchInlineSnapshot(`2309975801.1075954`)
    expect(model.returnMetrics.moicUnlevered).toMatchInlineSnapshot(`NaN`)
    expect(model.returnMetrics.moicEquity).toMatchInlineSnapshot(`NaN`)
    expect(model.returnMetrics.unleveredIrr).toMatchInlineSnapshot(`null`)
    expect(model.returnMetrics.equityIrr).toMatchInlineSnapshot(`null`)
    const r = model.dcfSupport[0]!.discountFactor
    expect(r).toBeCloseTo(1 / 1.08, 12)
    const sumPv = model.dcfSupport.reduce((s, row) => s + row.pvUnleveredFcf, 0)
    expect(sumPv).toBeCloseTo(model.returnMetrics.unleveredNpv, 2)
  })

  it("exposes DSCR / LLCR / PLCR when debt is drawn", () => {
    const { model } = fixture()
    expect(model.coverage.dscrByPeriod.length).toBe(model.periodCount)
    expect(model.coverage.minDscr).toBeGreaterThan(0)
    expect(model.coverage.avgDscr).toBeGreaterThan(0)
    expect(model.coverage.llcr).toBeGreaterThan(0)
    expect(model.coverage.plcr).toBeGreaterThan(0)
  })

  it("builds Phase 4 analytics packs for corridor and entities", () => {
    const { model } = fixture()
    expect(model.analytics.corridor.payback.projectUndiscounted).not.toBeUndefined()
    expect(model.analytics.corridor.valuation.exitMultiple).toBeGreaterThan(0)
    expect(model.analytics.corridor.reserveSchedule.length).toBe(model.periodCount)
    expect(model.analytics.corridor.distributionWaterfall.length).toBe(model.periodCount)
    expect(model.analytics.corridor.fundingGap.length).toBe(model.periodCount)
    expect(model.analytics.entities.energy.reserveSchedule.length).toBe(model.periodCount)
    expect(model.analytics.entities.platform.valuation.wacc).not.toBeNull()
    expect(model.analytics.entities.fleet.returnMetrics.cashOnCashByPeriod.length).toBe(
      model.periodCount,
    )
  })

  it("matches engine integration: runEngine attaches model when projection ok", async () => {
    const { runEngine } = await import("@/engine/runEngine")
    const { assumptionsToEngineInput } = await import("@/engine/adapter")
    const data = getDefaultEcisDataState()
    const out = runEngine(assumptionsToEngineInput(data))
    expect(out.projection.status).toBe("ok")
    if (out.projection.status === "ok") {
      expect(out.projection.model?.version).toBe(1)
      expect(out.projection.model?.consolidated.length).toBe(
        data.system.modelHorizonYears,
      )
    }
  })
})
