import { cn } from "@/lib/utils"
import type { EntityDocumentTable } from "@/selectors/types"

type Props = {
  table: EntityDocumentTable
  className?: string
}

export function EntityExportTable({ table, className }: Props) {
  if (table.columns.length === 0 && table.rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground",
          className,
        )}
        data-testid={`entity-table-empty-${table.id}`}
      >
        <p className="font-medium text-foreground/80">{table.title}</p>
        <p className="mt-1">No rows — run recompute with a full model projection.</p>
      </div>
    )
  }

  return (
    <div className={cn("ecis-touch-x overflow-x-auto", className)}>
      <table
        className="w-full min-w-[32rem] border-collapse border border-border text-sm"
        data-testid={`entity-table-${table.id}`}
      >
        <caption className="caption-top pb-2 text-left text-base font-semibold text-foreground">
          {table.title}
          {table.caption ? (
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {table.caption}
            </span>
          ) : null}
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th scope="col" className="border border-border px-2 py-2 text-left font-medium">
              Line item
            </th>
            {table.columns.map((c) => (
              <th
                key={c}
                scope="col"
                className="border border-border px-2 py-2 text-right font-medium tabular-nums"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r) => (
            <tr
              key={r.rowKey}
              data-row-key={r.rowKey}
              data-row-kind={r.rowKind ?? "normal"}
              className={cn(
                "border-b border-border/80",
                r.rowKind === "memo" && "bg-muted/30",
                r.rowKind === "subtotal" && "font-medium",
              )}
            >
              <th
                scope="row"
                className="border border-border px-2 py-1.5 text-left font-normal"
              >
                {r.label}
              </th>
              {r.values.map((v, i) => (
                <td
                  key={i}
                  className="border border-border px-2 py-1.5 text-right tabular-nums"
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
