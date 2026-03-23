import { cn } from "@/lib/utils"
import { formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import type { DashboardConvergenceBadge, DashboardViewModel } from "@/selectors/types"

type Props = {
  vm: Pick<
    DashboardViewModel,
    | "corridorName"
    | "modelHorizonYears"
    | "vehicleCount"
    | "headline"
    | "convergence"
    | "recomputeRevision"
    | "lastRunAt"
  >
  ctx: SelectorDisplayContext
}

const badgeStyles: Record<
  DashboardConvergenceBadge["status"],
  string
> = {
  idle: "border-border bg-muted/50 text-muted-foreground",
  stale: "border-amber-500/50 bg-amber-500/15 text-amber-950 dark:text-amber-50",
  error: "border-destructive/50 bg-destructive/10 text-destructive",
  projection_only:
    "border-sky-500/50 bg-sky-500/10 text-sky-950 dark:text-sky-50",
  ok: "border-emerald-500/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50",
}

export function DashboardKpiBar({ vm, ctx }: Props) {
  const npvLabel =
    vm.headline.headlineNpv !== null
      ? `${formatDisplayNumber(vm.headline.headlineNpv.display, ctx)} ${ctx.currencyCode}`
      : "—"

  return (
    <div
      className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      data-testid="dashboard-kpi-bar"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {vm.corridorName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Horizon {vm.modelHorizonYears} yr · {vm.vehicleCount} vehicles
          {vm.recomputeRevision !== null ? (
            <>
              {" "}
              · Run #{vm.recomputeRevision}
            </>
          ) : null}
          {vm.lastRunAt !== null ? (
            <>
              {" "}
              · Last run {new Date(vm.lastRunAt).toLocaleString(ctx.locale)}
            </>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div
          className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
          data-testid="dashboard-kpi-npv"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Headline NPV
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{npvLabel}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Viability
          </p>
          <p className="mt-1 text-lg font-medium">
            {vm.headline.viable === null
              ? "—"
              : vm.headline.viable
                ? "Viable"
                : "Not viable"}
          </p>
          {vm.headline.viabilityReasons.length > 0 ? (
            <ul className="mt-2 max-w-xs list-inside list-disc text-xs text-muted-foreground">
              {vm.headline.viabilityReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div
          className={cn(
            "rounded-lg border px-4 py-3 shadow-sm",
            badgeStyles[vm.convergence.status],
          )}
          data-testid="dashboard-convergence-badge"
          data-status={vm.convergence.status}
        >
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
            Convergence
          </p>
          <p className="mt-1 text-lg font-semibold">{vm.convergence.label}</p>
          {vm.convergence.detail ? (
            <p className="mt-1 max-w-xs text-xs opacity-90">
              {vm.convergence.detail}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
