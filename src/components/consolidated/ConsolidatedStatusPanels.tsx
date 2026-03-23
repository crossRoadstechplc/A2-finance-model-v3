import { cn } from "@/lib/utils"
import type {
  ConsolidatedBusinessViability,
  ConsolidatedCircularConvergence,
} from "@/selectors/types"

type Props = {
  circular: ConsolidatedCircularConvergence
  viability: ConsolidatedBusinessViability
}

export function ConsolidatedStatusPanels({ circular, viability }: Props) {
  const ringClass =
    circular.status === "ok"
      ? "border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-50"
      : circular.status === "not_applicable"
        ? "border-border bg-muted/40 text-muted-foreground"
        : "border-amber-500 bg-amber-500/15 text-amber-950 dark:text-amber-50"

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div
        className="flex gap-4 rounded-lg border border-border bg-card p-4 shadow-sm"
        data-testid="consolidated-circular-panel"
      >
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full border-4 text-xs font-bold leading-tight",
            ringClass,
          )}
          aria-label={circular.label}
          data-status={circular.status}
          data-testid="consolidated-convergence-ring"
        >
          {circular.status === "ok" ? "OK" : circular.status === "not_applicable" ? "—" : "!"}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Circular convergence</h3>
          <p className="mt-1 text-sm text-muted-foreground">{circular.label}</p>
          {circular.detail ? (
            <p className="mt-1 text-xs text-muted-foreground">{circular.detail}</p>
          ) : null}
          {circular.checks.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {circular.checks.map((c) => (
                <li
                  key={c.id}
                  data-check-id={c.id}
                  data-check-ok={c.ok ? "true" : "false"}
                  className={cn(
                    "flex items-center gap-2",
                    c.ok ? "text-emerald-700 dark:text-emerald-300" : "text-destructive",
                  )}
                >
                  <span className="font-mono">{c.ok ? "✓" : "✗"}</span>
                  {c.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border p-4 shadow-sm",
          viability.available && viability.viable === false
            ? "border-destructive/50 bg-destructive/5"
            : viability.available && viability.viable === true
              ? "border-border bg-card"
              : "border-border bg-muted/20",
        )}
        data-testid="consolidated-viability-panel"
      >
        <h3 className="text-sm font-semibold">Business viability</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Snapshot pipeline viability (operations / economics) — separate from consolidation
          algebra.
        </p>
        {!viability.available ? (
          <p className="mt-3 text-sm text-muted-foreground">No scenario pipeline loaded.</p>
        ) : (
          <>
            <p
              className="mt-3 text-sm font-medium"
              data-viable={viability.viable === true ? "true" : viability.viable === false ? "false" : "unknown"}
            >
              {viability.viable === null
                ? "Unknown"
                : viability.viable
                  ? "Viable"
                  : "Not viable"}
            </p>
            {viability.reasons.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                {viability.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
