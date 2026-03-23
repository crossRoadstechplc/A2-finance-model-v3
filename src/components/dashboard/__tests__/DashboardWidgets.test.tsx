import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts"
import {
  DashboardCashChart,
  DashboardPriceStackChart,
} from "@/components/dashboard/DashboardCharts"
import { buildSelectorDisplayContext } from "@/selectors/context"
import { assumptionsToEngineInput } from "@/engine/adapter"
import { runEngine } from "@/engine/runEngine"
import { selectDashboardViewModel } from "@/selectors/dashboard"
import { DashboardPage } from "@/pages/DashboardPage"
import { getDefaultEcisDataState } from "@/store/defaults"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"
import type { EcisSelectorInput } from "@/selectors/input"

function baseInput(over?: Partial<EcisSelectorInput>): EcisSelectorInput {
  const s = getDefaultEcisDataState()
  return {
    settings: s.settings,
    system: s.system,
    platform: s.platform,
    energy: s.energy,
    fleet: s.fleet,
    controls: s.controls,
    snapshotModel: s.snapshotModel,
    scalingBands: s.scalingBands,
    results: s.results,
    snapshot: s.snapshot,
    recomputeMeta: s.recomputeMeta,
    sensitivityRun: s.sensitivityRun,
    scenarios: s.scenarios,
    workspace: s.workspace,
    ...over,
  }
}

function vmFromEngine() {
  const data = getDefaultEcisDataState()
  const engine = runEngine(assumptionsToEngineInput(data))
  const input = baseInput({
    results: { status: "ready", lastError: null, engineOutput: engine },
  })
  const ctx = buildSelectorDisplayContext(input.settings)
  return { vm: selectDashboardViewModel(input, ctx), ctx }
}

describe("Dashboard presentational widgets", () => {
  it("renders warning and binding constraint banners from fixture vm", () => {
    const { vm } = vmFromEngine()
    const withBanners = {
      ...vm,
      warningBanners: [
        {
          severity: "warn" as const,
          code: "TEST_WARN",
          stage: "pricing",
          message: "Fixture warning copy",
        },
      ],
      constraintBanners: [
        {
          binding: true,
          code: "TEST_BIND",
          message: "Fixture binding constraint",
        },
      ],
    }
    render(
      <DashboardAlerts
        alerts={withBanners.alerts}
        warningBanners={withBanners.warningBanners}
        constraintBanners={withBanners.constraintBanners}
      />,
    )
    expect(screen.getByText(/Fixture warning copy/)).toBeInTheDocument()
    expect(screen.getByTestId("dashboard-warning-banner")).toHaveAttribute(
      "data-severity",
      "warn",
    )
    expect(screen.getByText(/Fixture binding constraint/)).toBeInTheDocument()
    expect(screen.getByTestId("dashboard-constraint-banner")).toHaveAttribute(
      "data-binding",
      "true",
    )
  })

  it("renders price stack chart with correct bar data keys from fixture", () => {
    const { vm, ctx } = vmFromEngine()
    render(<DashboardPriceStackChart priceStack={vm.priceStack} ctx={ctx} />)
    expect(screen.getByTestId("dashboard-price-stack-chart")).toBeInTheDocument()
    expect(screen.getByTestId("price-stack-total")).toHaveTextContent(/Total/)
  })

  it("shows empty state for price stack when unavailable", () => {
    const ctx = buildSelectorDisplayContext(getDefaultEcisDataState().settings)
    render(
      <DashboardPriceStackChart
        priceStack={{ available: false, totalDisplayPerKwh: 0, segments: [] }}
        ctx={ctx}
      />,
    )
    expect(screen.getByTestId("dashboard-price-stack-empty")).toBeInTheDocument()
  })

  it("renders cash chart from fixture periods or empty when missing", () => {
    const { vm, ctx } = vmFromEngine()
    const { rerender } = render(<DashboardCashChart chart={vm.chart} ctx={ctx} />)
    if (vm.chart.available) {
      expect(screen.getByTestId("dashboard-cash-chart")).toBeInTheDocument()
    }
    rerender(
      <DashboardCashChart
        chart={{ available: false, periods: [] }}
        ctx={ctx}
      />,
    )
    expect(screen.getByTestId("dashboard-cash-chart-empty")).toBeInTheDocument()
  })

  it("DashboardPage renders from store and shows idle guidance when results are idle", () => {
    resetEcisStoreForTests()
    useEcisStore.setState({
      results: {
        status: "idle",
        lastError: null,
        engineOutput: null,
      },
    })
    render(<DashboardPage />)
    expect(screen.getByTestId("dashboard-empty-idle")).toBeInTheDocument()
    expect(screen.getByTestId("dashboard-kpi-bar")).toBeInTheDocument()
  })

  it("DashboardPage renders KPI bar and charts after recompute fixture state", () => {
    resetEcisStoreForTests()
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    useEcisStore.setState({
      results: {
        status: "ready",
        lastError: null,
        engineOutput: engine,
      },
      recomputeMeta: { revision: 1, lastRunAt: Date.now() },
    })
    render(<DashboardPage />)
    expect(screen.queryByTestId("dashboard-empty-idle")).not.toBeInTheDocument()
    expect(screen.getByTestId("dashboard-price-stack-chart")).toBeInTheDocument()
    expect(screen.getByTestId("dashboard-cash-chart")).toBeInTheDocument()
  })
})
