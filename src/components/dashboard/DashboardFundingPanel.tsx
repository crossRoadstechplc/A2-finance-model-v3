import { formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import type { DashboardFundingCapacity } from "@/selectors/types"

type Props = {
  funding: DashboardFundingCapacity
  ctx: SelectorDisplayContext
}

export function DashboardFundingPanel({ funding, ctx }: Props) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      data-testid="dashboard-funding-capacity"
    >
      <h3 className="text-sm font-semibold">Funding & capacity</h3>
      {!funding.available ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Coverage metrics (DSCR / LLCR / PLCR) require the consolidated model. Capex
          anchor may still reflect the scenario when projection is available.
        </p>
      ) : null}
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Min DSCR</dt>
          <dd className="text-sm font-medium tabular-nums">
            {funding.minDscr !== null && Number.isFinite(funding.minDscr)
              ? new Intl.NumberFormat(ctx.locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 3,
                }).format(funding.minDscr)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">LLCR</dt>
          <dd className="text-sm font-medium tabular-nums">
            {funding.llcr !== null && Number.isFinite(funding.llcr)
              ? new Intl.NumberFormat(ctx.locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 3,
                }).format(funding.llcr)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">PLCR</dt>
          <dd className="text-sm font-medium tabular-nums">
            {funding.plcr !== null && Number.isFinite(funding.plcr)
              ? new Intl.NumberFormat(ctx.locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 3,
                }).format(funding.plcr)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Charging headroom</dt>
          <dd className="text-sm font-medium tabular-nums">
            {funding.chargingHeadroomKwh !== null
              ? `${formatDisplayNumber(funding.chargingHeadroomKwh, ctx)} kWh/day`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Swap headroom</dt>
          <dd className="text-sm font-medium tabular-nums">
            {funding.swapHeadroom !== null
              ? `${formatDisplayNumber(funding.swapHeadroom, ctx)} /day`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Total capex (scenario)</dt>
          <dd className="text-sm font-medium tabular-nums">
            {funding.totalCapex
              ? `${formatDisplayNumber(funding.totalCapex.display, ctx)} ${ctx.currencyCode}`
              : "—"}
          </dd>
        </div>
      </dl>
    </div>
  )
}
