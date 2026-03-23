import { jsPDF } from "jspdf"

import type { ConsolidatedPageViewModel, EntityPageViewModel } from "@/selectors/types"

import { entityPackDocumentTables } from "@/export/csv/entityPackCsv"
import {
  appendEconomicsLinesPdf,
  appendEntityDocumentTablePdf,
  appendFundingTimelinePdf,
} from "@/export/pdf/documentTablePdf"
import {
  createPdfCursor,
  skipLine,
  writeHeading,
  writeWrappedLine,
} from "@/export/pdf/pdfCursor"

export type FullModelPackInput = {
  corridorName: string
  consolidated: ConsolidatedPageViewModel
  entities: readonly EntityPageViewModel[]
}

export function buildFullModelPackPdfBlob(input: FullModelPackInput): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const c = createPdfCursor(doc)
  writeHeading(c, "E-Corridor — full model pack")
  writeWrappedLine(c, `Corridor: ${input.corridorName}`)
  skipLine(c)

  const cons = input.consolidated
  appendEconomicsLinesPdf(c, cons.economicsSummary.lines)
  appendEntityDocumentTablePdf(c, cons.investmentSummary)
  appendEntityDocumentTablePdf(c, cons.sourcesUses)
  appendFundingTimelinePdf(c, cons.fundingTimeline)

  writeHeading(c, "Consolidated model snapshot")
  if (cons.model.available) {
    writeWrappedLine(c, `Periods: ${cons.model.periodCount ?? "—"}`, 9)
    const m = cons.model.lastYear
    writeWrappedLine(
      c,
      `Last year revenue (display): ${m.revenue?.display ?? "—"}; net income: ${m.netIncome?.display ?? "—"}`,
      8,
    )
  } else {
    writeWrappedLine(
      c,
      "(Optional section — consolidated model metrics unavailable.)",
      9,
    )
  }
  skipLine(c)

  for (const vm of input.entities) {
    writeHeading(c, vm.title)
    for (const k of vm.kpis) {
      writeWrappedLine(c, `${k.label}: ${k.value}`, 8)
    }
    skipLine(c)
    for (const t of entityPackDocumentTables(vm)) {
      appendEntityDocumentTablePdf(c, t)
    }
  }

  return doc.output("blob")
}
