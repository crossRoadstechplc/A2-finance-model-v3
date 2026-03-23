import { describe, expect, it } from "vitest"

import {
  documentTableToCsvRows,
  stackedDocumentTablesToCsv,
} from "@/export/csv/documentTableCsv"
import type { EntityDocumentTable } from "@/selectors/types"

describe("documentTableCsv", () => {
  it("uses Line item header and aligned value columns", () => {
    const table: EntityDocumentTable = {
      id: "income",
      title: "Income statement",
      columns: ["Y1", "Y2"],
      rows: [
        { rowKey: "rev", label: "Revenue", values: ["1", "2"] },
        { rowKey: "ni", label: "Net income", values: ["3", "4"] },
      ],
    }
    const rows = documentTableToCsvRows(table)
    expect(rows[0]).toEqual(["Line item", "Y1", "Y2"])
    expect(rows[1]).toEqual(["Revenue", "1", "2"])
    expect(rows[2]).toEqual(["Net income", "3", "4"])
  })

  it("stacks tables with stable metadata columns and padded values", () => {
    const a: EntityDocumentTable = {
      id: "a",
      title: "A",
      columns: ["c1"],
      rows: [{ rowKey: "r1", label: "L1", values: ["x"] }],
    }
    const b: EntityDocumentTable = {
      id: "b",
      title: "B",
      columns: ["c1", "c2"],
      rows: [{ rowKey: "r2", label: "L2", values: ["y", "z"] }],
    }
    const csv = stackedDocumentTablesToCsv([a, b])
    const lines = csv.split("\n")
    expect(lines[0]).toBe("tableId,tableTitle,rowKey,lineItem,c1,c2")
    expect(lines[1]).toBe("a,A,r1,L1,x,")
    expect(lines[2]).toBe("")
    expect(lines[3]).toBe("b,B,r2,L2,y,z")
  })
})
