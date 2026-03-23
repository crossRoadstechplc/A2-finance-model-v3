import { formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import type { DashboardViewModel } from "@/selectors/types"

type Props = {
  model: DashboardViewModel["model"]
  corridorSummaryCards: DashboardViewModel["corridorSummaryCards"]
  ctx: SelectorDisplayContext
}

export function DashboardSummaryGrid({ model, corridorSummaryCards, ctx }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {corridorSummaryCards.map((card) => (
        <div
          key={card.id}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
          data-testid={`dashboard-summary-card-${card.id}`}
        >
          <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
          <dl className="mt-3 space-y-2">
            {card.lines.map((line) => (
              <div
                key={line.label}
                className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2"
              >
                <dt className="text-xs text-muted-foreground">{line.label}</dt>
                <dd className="text-sm font-medium tabular-nums text-foreground">
                  {line.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <div
        className="rounded-lg border border-border bg-card p-4 shadow-sm lg:col-span-2 xl:col-span-4"
        data-testid="dashboard-model-highlights"
      >
        <h3 className="text-sm font-semibold">Model highlights</h3>
        {!model.available ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Consolidated model metrics appear when the financial model attaches to the
            projection.
          </p>
        ) : (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Periods</dt>
              <dd className="text-sm font-medium tabular-nums">
                {model.periodCount ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Unlevered NPV</dt>
              <dd className="text-sm font-medium tabular-nums">
                {model.unleveredNpv
                  ? `${formatDisplayNumber(model.unleveredNpv.display, ctx)} ${ctx.currencyCode}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Equity NPV</dt>
              <dd className="text-sm font-medium tabular-nums">
                {model.equityNpv
                  ? `${formatDisplayNumber(model.equityNpv.display, ctx)} ${ctx.currencyCode}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last year net income</dt>
              <dd className="text-sm font-medium tabular-nums">
                {model.consolidatedLastNetIncome
                  ? `${formatDisplayNumber(model.consolidatedLastNetIncome.display, ctx)} ${ctx.currencyCode}`
                  : "—"}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  )
}
