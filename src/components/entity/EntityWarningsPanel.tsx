import { cn } from "@/lib/utils"
import type {
  EntityConstraintItem,
  EntityWarningItem,
} from "@/selectors/types"

type Props = {
  entityWarnings: readonly EntityWarningItem[]
  constraintItems: readonly EntityConstraintItem[]
}

export function EntityWarningsPanel({ entityWarnings, constraintItems }: Props) {
  if (entityWarnings.length === 0 && constraintItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="entity-warnings-none">
        No entity-scoped warnings or constraints for this view.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2" data-testid="entity-warnings-panel">
      {entityWarnings.map((w) => (
        (() => {
          const actions = w.actions ?? []
          return (
            <details
              key={`${w.code}-${w.stage}-${w.message.slice(0, 20)}`}
              data-testid="entity-warning-row"
              data-severity={w.severity}
              className={cn(
                "rounded-md border px-3 py-2 text-sm",
                w.severity === "warn"
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-border bg-muted/40",
              )}
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{w.code}</span>
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
      {constraintItems.map((c) => (
        (() => {
          const actions = c.actions ?? []
          return (
            <details
              key={`${c.code}-${c.message.slice(0, 20)}`}
              data-testid="entity-constraint-row"
              data-binding={c.binding ? "true" : "false"}
              className={cn(
                "rounded-md border px-3 py-2 text-sm",
                c.binding
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-border bg-muted/30",
              )}
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{c.code}</span>
                  {c.binding ? (
                    <span className="text-xs font-semibold text-destructive">Binding</span>
                  ) : null}
                  <span className="font-medium text-foreground">{c.title}</span>
                </div>
              </summary>
              <div className="mt-2">
                <p>{c.message}</p>
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
