import { cn } from "@/lib/utils"
import type {
  DashboardAlertStrip,
  DashboardConstraintBanner,
  DashboardWarningBanner,
} from "@/selectors/types"

type Props = {
  alerts: DashboardAlertStrip
  warningBanners: readonly DashboardWarningBanner[]
  constraintBanners: readonly DashboardConstraintBanner[]
}

export function DashboardAlerts({
  alerts,
  warningBanners,
  constraintBanners,
}: Props) {
  const strips: { key: string; className: string; body: string }[] = []

  if (alerts.showStaleHint) {
    strips.push({
      key: "stale",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
      body: "Results are stale - run recompute to refresh the dashboard.",
    })
  }
  if (alerts.resultsError) {
    strips.push({
      key: "results",
      className: "border-destructive/40 bg-destructive/10 text-destructive",
      body: alerts.resultsError,
    })
  }
  if (alerts.projectionError) {
    strips.push({
      key: "projection",
      className: "border-destructive/40 bg-destructive/10 text-destructive",
      body: alerts.projectionError,
    })
  }

  return (
    <div className="flex flex-col gap-2" data-testid="dashboard-alerts">
      {strips.map((s) => (
        <div
          key={s.key}
          role="status"
          className={cn(
            "rounded-md border px-3 py-2 text-sm leading-snug",
            s.className,
          )}
        >
          {s.body}
        </div>
      ))}
      {warningBanners.map((w) => (
        (() => {
          const actions = w.actions ?? []
          return (
            <details
              key={`${w.code}-${w.stage}-${w.message.slice(0, 24)}`}
              role="note"
              data-severity={w.severity}
              data-testid="dashboard-warning-banner"
              className={cn(
                "rounded-md border px-3 py-2 text-sm leading-snug",
                w.severity === "warn"
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-border bg-muted/40",
              )}
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{w.code}</span>
                  <span className="text-muted-foreground">({w.stage})</span>
                  <span className="font-medium text-foreground">{w.title}</span>
                </div>
              </summary>
              <div className="mt-2">
                <p>{w.message}</p>
                {w.explanation ? (
                  <p className="mt-2 text-xs text-muted-foreground">{w.explanation}</p>
                ) : null}
                {actions.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>
          )
        })()
      ))}
      {constraintBanners.map((c) => (
        (() => {
          const actions = c.actions ?? []
          return (
            <details
              key={`${c.code}-${c.message.slice(0, 24)}`}
              role="note"
              data-binding={c.binding ? "true" : "false"}
              data-testid="dashboard-constraint-banner"
              className={cn(
                "rounded-md border px-3 py-2 text-sm leading-snug",
                c.binding
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-border bg-muted/30",
              )}
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{c.code}</span>
                  {c.binding ? (
                    <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-xs font-medium text-destructive">
                      Binding
                    </span>
                  ) : null}
                  <span className="font-medium text-foreground">{c.title}</span>
                </div>
              </summary>
              <div className="mt-2">
                <p>{c.message}</p>
                {c.shortfall !== undefined && Number.isFinite(c.shortfall) ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Shortfall: {c.shortfall}
                  </span>
                ) : null}
                {c.explanation ? (
                  <p className="mt-2 text-xs text-muted-foreground">{c.explanation}</p>
                ) : null}
                {actions.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>
          )
        })()
      ))}
    </div>
  )
}
