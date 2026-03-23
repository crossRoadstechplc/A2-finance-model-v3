import { cn } from "@/lib/utils"
import type { ScenarioComparisonViewModel } from "@/selectors/types"

type Props = {
  vm: ScenarioComparisonViewModel
}

export function ScenarioComparisonTable({ vm }: Props) {
  return (
    <div className="space-y-2" data-testid="scenario-comparison-table">
      <p className="text-xs text-muted-foreground">{vm.enginePathNote}</p>
      {vm.emptyComparisonHint ? (
        <p className="text-sm text-muted-foreground">{vm.emptyComparisonHint}</p>
      ) : null}
      <div className="ecis-touch-x overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2 font-medium">Metric</th>
              {vm.columns.map((c) => (
                <th key={c.id} className="px-3 py-2 font-medium" scope="col">
                  <span className={cn(c.kind === "live" && "text-primary")}>
                    {c.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vm.rows.map((row) => (
              <tr
                key={row.metricId}
                className="border-b border-border/80 last:border-0"
                data-metric-row={row.metricId}
              >
                <th
                  scope="row"
                  className="px-3 py-2 align-top font-normal text-muted-foreground"
                >
                  {row.metricLabel}
                </th>
                {row.cells.map((cell, i) => (
                  <td
                    key={vm.columns[i]!.id}
                    className={cn(
                      "px-3 py-2 align-top",
                      cell.highlight === "best" &&
                        "bg-emerald-500/10 font-medium text-emerald-950 dark:text-emerald-100",
                    )}
                    data-cell-col={vm.columns[i]!.id}
                    data-highlight={cell.highlight}
                  >
                    <div>{cell.value}</div>
                    {cell.deltaAbsolute || cell.deltaPercent ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {cell.deltaAbsolute ? (
                          <span className="mr-2 tabular-nums">
                            Δ {cell.deltaAbsolute}
                          </span>
                        ) : null}
                        {cell.deltaPercent ? (
                          <span className="tabular-nums">{cell.deltaPercent}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
