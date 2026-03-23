import type { jsPDF } from "jspdf"

export type PdfCursor = {
  doc: jsPDF
  y: number
  readonly margin: number
  readonly lineHeight: number
  readonly pageHeight: number
}

export function createPdfCursor(doc: jsPDF, margin = 14, lineHeight = 6): PdfCursor {
  return {
    doc,
    y: margin,
    margin,
    lineHeight,
    pageHeight: doc.internal.pageSize.getHeight(),
  }
}

export function ensureVerticalSpace(c: PdfCursor, needed: number): void {
  if (c.y + needed > c.pageHeight - c.margin) {
    c.doc.addPage()
    c.y = c.margin
  }
}

export function writeWrappedLine(c: PdfCursor, text: string, fontSize = 10): void {
  c.doc.setFontSize(fontSize)
  const pageW = c.doc.internal.pageSize.getWidth()
  const maxW = pageW - 2 * c.margin
  const lines = c.doc.splitTextToSize(text, maxW) as string[]
  for (const line of lines) {
    ensureVerticalSpace(c, c.lineHeight)
    c.doc.text(line, c.margin, c.y)
    c.y += c.lineHeight
  }
}

export function writeHeading(c: PdfCursor, text: string): void {
  c.doc.setFont("helvetica", "bold")
  writeWrappedLine(c, text, 12)
  c.doc.setFont("helvetica", "normal")
}

export function writeSubheading(c: PdfCursor, text: string): void {
  c.doc.setFont("helvetica", "bold")
  writeWrappedLine(c, text, 10)
  c.doc.setFont("helvetica", "normal")
}

export function skipLine(c: PdfCursor): void {
  c.y += c.lineHeight * 0.5
}
