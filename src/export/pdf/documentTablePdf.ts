import type {
  ConsolidatedFundingTimeline,
  EntityDocumentTable,
} from "@/selectors/types"

import {
  skipLine,
  writeSubheading,
  writeWrappedLine,
  type PdfCursor,
} from "@/export/pdf/pdfCursor"

function isOptionalTableEmpty(table: EntityDocumentTable): boolean {
  return table.columns.length === 0 && table.rows.length === 0
}

export function appendEntityDocumentTablePdf(
  c: PdfCursor,
  table: EntityDocumentTable,
): void {
  writeSubheading(c, table.title)
  if (table.caption) {
    writeWrappedLine(c, table.caption, 8)
  }
  if (isOptionalTableEmpty(table) || table.rows.length === 0) {
    writeWrappedLine(
      c,
      "(Optional section — no tabular data exported for this block.)",
      9,
    )
    skipLine(c)
    return
  }

  c.doc.setFontSize(7)
  const pageW = c.doc.internal.pageSize.getWidth()
  const usable = pageW - 2 * c.margin
  const colCount = 1 + table.columns.length
  const colW = Math.max(18, usable / colCount)
  let yTable = c.y

  const drawRow = (cells: string[], bold = false) => {
    if (yTable > c.pageHeight - c.margin - c.lineHeight) {
      c.doc.addPage()
      yTable = c.margin
      c.y = c.margin
    }
    c.doc.setFont("helvetica", bold ? "bold" : "normal")
    let x = c.margin
    for (const cell of cells) {
      const clipped =
        cell.length > 42 && colW < 30 ? `${cell.slice(0, 39)}…` : cell
      const chunk = c.doc.splitTextToSize(clipped, colW - 1) as string[]
      c.doc.text(chunk[0] ?? "", x, yTable)
      x += colW
    }
    yTable += c.lineHeight * 0.85
  }

  drawRow(["Line item", ...table.columns], true)
  for (const r of table.rows) {
    drawRow([r.label, ...r.values], r.rowKind === "subtotal")
  }
  c.doc.setFont("helvetica", "normal")
  c.y = yTable
  skipLine(c)
}

export function appendFundingTimelinePdf(
  c: PdfCursor,
  ft: ConsolidatedFundingTimeline,
): void {
  writeSubheading(c, "Funding timeline")
  if (!ft.available || ft.rows.length === 0) {
    writeWrappedLine(
      c,
      "(Optional section — no funding timeline rows available.)",
      9,
    )
    skipLine(c)
    return
  }

  c.doc.setFontSize(7)
  let yTable = c.y
  const headers = [
    "Period",
    "Equity",
    "Debt",
    "Sources",
    "Uses",
    "Σ uses",
    "Match",
  ]
  const pageW = c.doc.internal.pageSize.getWidth()
  const usable = pageW - 2 * c.margin
  const colW = usable / headers.length

  const row = (cells: string[], bold = false) => {
    if (yTable > c.pageHeight - c.margin - c.lineHeight) {
      c.doc.addPage()
      yTable = c.margin
      c.y = c.margin
    }
    c.doc.setFont("helvetica", bold ? "bold" : "normal")
    let x = c.margin
    for (const cell of cells) {
      const chunk = c.doc.splitTextToSize(cell, colW - 1) as string[]
      c.doc.text(chunk[0] ?? "", x, yTable)
      x += colW
    }
    yTable += c.lineHeight * 0.85
  }

  row(headers, true)
  for (const r of ft.rows) {
    row(
      [
        r.period,
        r.equity,
        r.debt,
        r.totalSources,
        r.totalUses,
        r.sumCategoryUses,
        r.categoriesMatchUses ? "yes" : "no",
      ],
      false,
    )
  }
  c.doc.setFont("helvetica", "normal")
  c.y = yTable
  skipLine(c)
}

export function appendEconomicsLinesPdf(
  c: PdfCursor,
  lines: readonly { label: string; value: string; note?: string }[],
): void {
  writeSubheading(c, "Economics summary")
  if (lines.length === 0) {
    writeWrappedLine(c, "(Optional section — no economics lines.)", 9)
    skipLine(c)
    return
  }
  for (const ln of lines) {
    const note = ln.note ? ` — ${ln.note}` : ""
    writeWrappedLine(c, `${ln.label}: ${ln.value}${note}`, 9)
  }
  skipLine(c)
}
