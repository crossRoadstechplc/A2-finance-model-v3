import type {
  ConsolidatedFundingTimeline,
  EntityDocumentTable,
} from "@/selectors/types"

import { csvRowsToString } from "@/export/csv/csvEscape"

/** Matches on-screen `EntityExportTable`: first column is "Line item". */
export function documentTableToCsvRows(table: EntityDocumentTable): string[][] {
  const header = ["Line item", ...table.columns]
  const body = table.rows.map((r) => [r.label, ...r.values])
  return [header, ...body]
}

export function documentTableToCsvString(table: EntityDocumentTable): string {
  return csvRowsToString(documentTableToCsvRows(table))
}

function padValues(values: readonly string[], len: number): string[] {
  const next = [...values]
  while (next.length < len) next.push("")
  return next
}

/**
 * Stacks several document tables into one CSV file. Columns are padded to the
 * widest table so rows stay rectangular. Leading columns identify the table.
 */
export function stackedDocumentTablesToCsv(
  tables: readonly EntityDocumentTable[],
): string {
  if (tables.length === 0) {
    return csvRowsToString([
      ["tableId", "tableTitle", "rowKey", "lineItem", "value_1"],
    ])
  }

  const maxValueCols = Math.max(
    ...tables.map((t) =>
      Math.max(
        t.columns.length,
        ...t.rows.map((r) => r.values.length),
      ),
    ),
  )

  const dynHeaders = Array.from({ length: maxValueCols }, (_, i) => {
    const labels = tables
      .map((t) => t.columns[i])
      .filter((x): x is string => x !== undefined && x !== "")
    const uniq = [...new Set(labels)]
    if (uniq.length === 1) return uniq[0]!
    return `column_${i + 1}`
  })

  const header = [
    "tableId",
    "tableTitle",
    "rowKey",
    "lineItem",
    ...dynHeaders,
  ]

  const rows: string[][] = [header]
  for (const t of tables) {
    for (const r of t.rows) {
      rows.push([
        t.id,
        t.title,
        r.rowKey,
        r.label,
        ...padValues(r.values, maxValueCols),
      ])
    }
    rows.push([])
  }
  if (rows[rows.length - 1]?.length === 0) rows.pop()
  return csvRowsToString(rows)
}

export function fundingTimelineToCsvRows(
  ft: ConsolidatedFundingTimeline,
): string[][] {
  const header = [
    "rowKey",
    "period",
    "equity",
    "debt",
    "totalSources",
    "totalUses",
    "sumCategoryUses",
    "categoriesMatchUses",
  ]
  if (!ft.available || ft.rows.length === 0) {
    return [header]
  }
  const body = ft.rows.map((r) => [
    r.rowKey,
    r.period,
    r.equity,
    r.debt,
    r.totalSources,
    r.totalUses,
    r.sumCategoryUses,
    String(r.categoriesMatchUses),
  ])
  return [header, ...body]
}

export function fundingTimelineToCsvString(ft: ConsolidatedFundingTimeline): string {
  return csvRowsToString(fundingTimelineToCsvRows(ft))
}
