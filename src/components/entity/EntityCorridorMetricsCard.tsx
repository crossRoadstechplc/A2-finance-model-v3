import type { EntityCorridorMetricsBlock } from "@/selectors/types"

type Props = {
  block: EntityCorridorMetricsBlock
}

export function EntityCorridorMetricsCard({ block }: Props) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      data-testid="entity-corridor-metrics"
    >
      <h3 className="text-sm font-semibold">{block.title}</h3>
      {!block.available ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Corridor return and coverage metrics appear when the consolidated model is
          attached to the projection.
        </p>
      ) : (
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {block.lines.map((line) => (
            <div key={line.label}>
              <dt className="text-xs text-muted-foreground">{line.label}</dt>
              <dd className="text-sm font-medium tabular-nums">{line.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
