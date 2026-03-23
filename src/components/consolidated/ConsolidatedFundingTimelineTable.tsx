import { cn } from "@/lib/utils"
import type { ConsolidatedFundingTimeline } from "@/selectors/types"

type Props = {
  timeline: ConsolidatedFundingTimeline
}

export function ConsolidatedFundingTimelineTable({ timeline }: Props) {
  if (!timeline.available || timeline.rows.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground"
        data-testid="consolidated-funding-timeline-empty"
      >
        Funding timeline requires model sources & uses.
      </div>
    )
  }

  return (
    <div className="ecis-touch-x overflow-x-auto">
      <table
        className="w-full min-w-[48rem] border-collapse border border-border text-sm"
        data-testid="consolidated-funding-timeline"
      >
        <caption className="caption-top pb-2 text-left text-base font-semibold">
          Consolidated funding timeline
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th scope="col" className="border border-border px-2 py-2 text-left">
              Period
            </th>
            <th scope="col" className="border border-border px-2 py-2 text-right">
              Equity
            </th>
            <th scope="col" className="border border-border px-2 py-2 text-right">
              Debt
            </th>
            <th scope="col" className="border border-border px-2 py-2 text-right">
              Total sources
            </th>
            <th scope="col" className="border border-border px-2 py-2 text-right">
              Total uses
            </th>
            <th scope="col" className="border border-border px-2 py-2 text-right">
              Sum (infra+battery+platform+fleet)
            </th>
            <th scope="col" className="border border-border px-2 py-2 text-center">
              Rollup OK
            </th>
          </tr>
        </thead>
        <tbody>
          {timeline.rows.map((r) => (
            <tr key={r.rowKey} className="border-b border-border/80">
              <th scope="row" className="border border-border px-2 py-1.5 text-left font-normal">
                {r.period}
              </th>
              <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                {r.equity}
              </td>
              <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                {r.debt}
              </td>
              <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                {r.totalSources}
              </td>
              <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                {r.totalUses}
              </td>
              <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                {r.sumCategoryUses}
              </td>
              <td
                className={cn(
                  "border border-border px-2 py-1.5 text-center text-xs font-medium",
                  r.categoriesMatchUses
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-destructive",
                )}
                data-rollup-ok={r.categoriesMatchUses ? "true" : "false"}
              >
                {r.categoriesMatchUses ? "Yes" : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
