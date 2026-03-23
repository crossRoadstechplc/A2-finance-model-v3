import { cn } from "@/lib/utils"
import type { DashboardEntityQuickSummary } from "@/selectors/types"

type Props = {
  summaries: readonly DashboardEntityQuickSummary[]
}

export function DashboardEntityCards({ summaries }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Quick entity summaries</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {summaries.map((s) => (
          <div
            key={s.entityId}
            data-testid={`dashboard-entity-${s.entityId}`}
            className={cn(
              "rounded-lg border p-4 shadow-sm",
              s.highlight
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-border bg-card",
            )}
          >
            <h4 className="text-sm font-semibold">{s.title}</h4>
            <dl className="mt-2 space-y-1.5">
              {s.lines.map((line) => (
                <div
                  key={line.label}
                  className="flex justify-between gap-2 text-xs sm:text-sm"
                >
                  <dt className="text-muted-foreground">{line.label}</dt>
                  <dd className="text-right font-medium tabular-nums text-foreground">
                    {line.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}
