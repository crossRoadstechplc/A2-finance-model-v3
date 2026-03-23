import type { ConsolidatedPageViewModel } from "@/selectors/types"

type Props = {
  economics: ConsolidatedPageViewModel["economicsSummary"]
}

export function ConsolidatedEconomicsBlock({ economics }: Props) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      data-testid="consolidated-economics-summary"
    >
      <h3 className="text-sm font-semibold">Corridor economics summary</h3>
      <dl className="mt-3 space-y-3">
        {economics.lines.map((line) => (
          <div key={line.label}>
            <dt className="text-xs text-muted-foreground">{line.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{line.value}</dd>
            {line.note ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{line.note}</p>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  )
}
