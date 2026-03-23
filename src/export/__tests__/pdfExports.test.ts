import { describe, expect, it } from "vitest"

import { buildEntityPackPdfBlob } from "@/export/pdf/entityPackPdf"
import { buildFullModelPackPdfBlob } from "@/export/pdf/fullModelPackPdf"
import { PAGE_VM_VERSION } from "@/selectors/types"
import type {
  ConsolidatedPageViewModel,
  EntityPageViewModel,
} from "@/selectors/types"

function emptyTable(id: string, title: string) {
  return {
    id,
    title,
    columns: [] as string[],
    rows: [] as { rowKey: string; label: string; values: string[] }[],
  }
}

function minimalEntityVm(entityId: "energy" | "platform" | "fleet"): EntityPageViewModel {
  return {
    version: PAGE_VM_VERSION,
    entityId,
    title: entityId,
    corridorName: "Test",
    scenario: {
      available: false,
      dailyEnergyDemandKwh: null,
      dailySwapDemand: null,
      totalRetailUsdPerKwh: null,
      annualRevenueUsd: null,
      annualNetCashUsd: null,
    },
    projection: {
      available: false,
      lastYearNetIncome: null,
      lastYearRevenue: null,
    },
    warningsCount: 0,
    constraintsBindingCount: 0,
    dataAvailable: false,
    kpis: [],
    incomeStatement: emptyTable("is", "Income"),
    balanceSheet: emptyTable("bs", "Balance"),
    cashFlowStatement: emptyTable("cf", "Cash flow"),
    equityStatement: emptyTable("eq", "Equity"),
    debtSchedule: emptyTable("debt", "Debt"),
    capexSchedule: emptyTable("capex", "Capex"),
    sourcesUsesSchedule: emptyTable("su", "Sources & uses"),
    corridorMetrics: {
      available: false,
      title: "Corridor",
      lines: [],
    },
    primaryChart: {
      available: false,
      chartKind: "line",
      title: "Chart",
      categories: [],
      series: [],
    },
    entityWarnings: [],
    constraintItems: [],
  }
}

function minimalConsolidated(): ConsolidatedPageViewModel {
  return {
    version: PAGE_VM_VERSION,
    corridorName: "Test",
    model: {
      available: false,
      periodCount: null,
      lastYear: {
        revenue: null,
        netIncome: null,
        totalAssets: null,
      },
      returnMetrics: {
        unleveredNpv: null,
        equityNpv: null,
        unleveredIrr: null,
        equityIrr: null,
        moicUnlevered: null,
        moicEquity: null,
      },
      coverage: {
        minDscr: null,
        llcr: null,
        plcr: null,
      },
      eliminationsPerYear: null,
    },
    priceStack: {
      available: false,
      totalDisplayPerKwh: 0,
      segments: [],
    },
    dieselParity: {
      available: false,
      benchmarkUsdPerKwh: 0,
      benchmarkLabel: "",
      a2RetailUsdPerKwh: null,
      a2RetailDisplayPerKwh: null,
      benchmarkDisplayPerKwh: 0,
      crossover: "unknown",
      summaryLine: "",
    },
    economicsSummary: { lines: [] },
    circularConvergence: {
      status: "not_applicable",
      label: "",
      detail: null,
      checks: [],
    },
    businessViability: { available: false, viable: null, reasons: [] },
    investmentSummary: emptyTable("inv", "Investment"),
    sourcesUses: emptyTable("su", "Sources"),
    fundingTimeline: { available: false, rows: [] },
  }
}

describe("pdf export", () => {
  it("builds entity pack PDF when optional tables are empty", () => {
    const blob = buildEntityPackPdfBlob(minimalEntityVm("energy"))
    expect(blob.size).toBeGreaterThan(500)
    expect(blob.type).toBe("application/pdf")
  })

  it("builds full model pack PDF when consolidated and entity sections are sparse", () => {
    const blob = buildFullModelPackPdfBlob({
      corridorName: "Test",
      consolidated: minimalConsolidated(),
      entities: [
        minimalEntityVm("energy"),
        minimalEntityVm("platform"),
        minimalEntityVm("fleet"),
      ],
    })
    expect(blob.size).toBeGreaterThan(1000)
    expect(blob.type).toBe("application/pdf")
  })
})
