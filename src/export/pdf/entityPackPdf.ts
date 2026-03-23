import { jsPDF } from "jspdf"

import type { EntityPageViewModel } from "@/selectors/types"

import { entityPackDocumentTables } from "@/export/csv/entityPackCsv"
import { appendEntityDocumentTablePdf } from "@/export/pdf/documentTablePdf"
import {
  createPdfCursor,
  skipLine,
  writeHeading,
  writeWrappedLine,
} from "@/export/pdf/pdfCursor"

export function buildEntityPackPdfBlob(vm: EntityPageViewModel): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const c = createPdfCursor(doc)
  writeHeading(c, `${vm.title} — entity pack`)
  writeWrappedLine(c, `Corridor: ${vm.corridorName}`)
  skipLine(c)

  for (const k of vm.kpis) {
    writeWrappedLine(c, `${k.label}: ${k.value}`, 9)
  }
  skipLine(c)

  if (vm.corridorMetrics.available && vm.corridorMetrics.lines.length > 0) {
    writeHeading(c, vm.corridorMetrics.title)
    for (const ln of vm.corridorMetrics.lines) {
      writeWrappedLine(c, `${ln.label}: ${ln.value}`, 9)
    }
    skipLine(c)
  }

  for (const t of entityPackDocumentTables(vm)) {
    appendEntityDocumentTablePdf(c, t)
  }

  return doc.output("blob")
}
