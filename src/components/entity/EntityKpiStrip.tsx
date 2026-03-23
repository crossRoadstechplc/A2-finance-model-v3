import type { EntityKpiItem } from "@/selectors/types"

type Props = {
  items: readonly EntityKpiItem[]
}

export function EntityKpiStrip({ items }: Props) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      data-testid="entity-kpi-strip"
    >
      {items.map((k) => (
        <div
          key={k.id}
          className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
          data-testid={`entity-kpi-${k.id}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {k.label}
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {k.value}
          </p>
        </div>
      ))}
    </div>
  )
}
