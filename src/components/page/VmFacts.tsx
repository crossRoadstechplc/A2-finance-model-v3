import { Fragment, type ReactNode } from "react"

export function VmFacts({ rows }: { rows: readonly { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid max-w-xl grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-sm">
      {rows.map((r) => (
        <Fragment key={r.label}>
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="text-right font-medium tabular-nums">{r.value}</dd>
        </Fragment>
      ))}
    </dl>
  )
}
