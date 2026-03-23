import { EntityChartPanel } from "@/components/entity/EntityChartPanel"
import { EntityCorridorMetricsCard } from "@/components/entity/EntityCorridorMetricsCard"
import { EntityExportTable } from "@/components/entity/EntityExportTable"
import { EntityKpiStrip } from "@/components/entity/EntityKpiStrip"
import { EntityWarningsPanel } from "@/components/entity/EntityWarningsPanel"
import type { SelectorDisplayContext } from "@/selectors/context"
import type { EntityPageViewModel } from "@/selectors/types"

type Props = {
  vm: EntityPageViewModel
  ctx: SelectorDisplayContext
}

export function EntityDetailView({ vm, ctx }: Props) {
  return (
    <div className="min-w-0 space-y-8" data-testid={`entity-detail-${vm.entityId}`}>
      <EntityKpiStrip items={vm.kpis} />

      <section
        className="space-y-2"
        aria-labelledby={`entity-${vm.entityId}-alerts-heading`}
      >
        <h2
          id={`entity-${vm.entityId}-alerts-heading`}
          className="text-sm font-semibold text-foreground"
        >
          Entity-scoped alerts
        </h2>
        <EntityWarningsPanel
          entityWarnings={vm.entityWarnings}
          constraintItems={vm.constraintItems}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Financial statements</h2>
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
          <EntityExportTable table={vm.incomeStatement} />
          <EntityExportTable table={vm.balanceSheet} />
          <EntityExportTable table={vm.cashFlowStatement} />
          <EntityExportTable table={vm.equityStatement} />
        </div>
      </section>

      <section
        className="space-y-4"
        aria-labelledby={`entity-${vm.entityId}-schedules-heading`}
      >
        <h2
          id={`entity-${vm.entityId}-schedules-heading`}
          className="text-sm font-semibold text-foreground"
        >
          Schedules
        </h2>
        <EntityExportTable table={vm.debtSchedule} />
        <EntityExportTable table={vm.capexSchedule} />
        <EntityExportTable table={vm.sourcesUsesSchedule} />
      </section>

      <EntityCorridorMetricsCard block={vm.corridorMetrics} />

      <EntityChartPanel chart={vm.primaryChart} ctx={ctx} />
    </div>
  )
}
