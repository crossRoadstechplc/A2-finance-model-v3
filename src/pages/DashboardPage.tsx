import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts"
import {
  DashboardCashChart,
  DashboardPriceStackChart,
} from "@/components/dashboard/DashboardCharts"
import { DashboardEntityCards } from "@/components/dashboard/DashboardEntityCards"
import { DashboardFundingPanel } from "@/components/dashboard/DashboardFundingPanel"
import { DashboardKpiBar } from "@/components/dashboard/DashboardKpiBar"
import { DashboardSummaryGrid } from "@/components/dashboard/DashboardSummaryGrid"
import { EmptyState } from "@/components/page/EmptyState"
import { PageStub } from "@/components/page/PageStub"
import {
  useDashboardViewModel,
  useSelectorDisplayContext,
} from "@/selectors/hooks"

export function DashboardPage() {
  const vm = useDashboardViewModel()
  const ctx = useSelectorDisplayContext()

  return (
    <PageStub
      title="Dashboard"
      mainSectionId="dashboard"
      description="Corridor KPIs, scenario warnings, price build-up, and model highlights — all from selector view-models."
    >
      <div className="min-w-0 space-y-6">
        <DashboardAlerts
          alerts={vm.alerts}
          warningBanners={vm.warningBanners}
          constraintBanners={vm.constraintBanners}
        />

        <DashboardKpiBar
          vm={{
            corridorName: vm.corridorName,
            modelHorizonYears: vm.modelHorizonYears,
            vehicleCount: vm.vehicleCount,
            headline: vm.headline,
            convergence: vm.convergence,
            recomputeRevision: vm.recomputeRevision,
            lastRunAt: vm.lastRunAt,
          }}
          ctx={ctx}
        />

        {vm.resultsStatus === "idle" ? (
          <EmptyState data-testid="dashboard-empty-idle" id="dashboard-empty-idle">
            No engine results yet. Tap <strong>Recompute</strong> in the header (next to
            scenarios) to populate charts and statement exports. Assumption edits also
            trigger a debounced run. Keyboard:{" "}
            <kbd className="rounded border px-1">Alt+B</kbd> opens assumptions.
          </EmptyState>
        ) : null}

        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardPriceStackChart priceStack={vm.priceStack} ctx={ctx} />
          <DashboardCashChart chart={vm.chart} ctx={ctx} />
        </div>

        <DashboardSummaryGrid
          model={vm.model}
          corridorSummaryCards={vm.corridorSummaryCards}
          ctx={ctx}
        />

        <DashboardEntityCards summaries={vm.entityQuickSummaries} />

        <DashboardFundingPanel funding={vm.fundingCapacity} ctx={ctx} />

        <p className="text-xs text-muted-foreground">
          Snapshot capture: {vm.snapshotLabel ?? "—"} ({vm.snapshotStatus})
        </p>
      </div>
    </PageStub>
  )
}
