import type { AssumptionsSnapshot } from "@/store/types"

import { csvEscape } from "@/export/csv/csvEscape"

function flattenRecord(
  rows: string[][],
  slice: string,
  value: unknown,
  prefix = "",
) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      flattenRecord(rows, slice, entry, `${prefix}[${index}]`)
    })
    return
  }

  if (value && typeof value === "object") {
    for (const [key, next] of Object.entries(value as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key
      flattenRecord(rows, slice, next, path)
    }
    return
  }

  rows.push([
    slice,
    prefix,
    csvEscape(value === null || value === undefined ? "" : String(value)),
  ])
}

export function assumptionsToCsvRows(snapshot: AssumptionsSnapshot): string[][] {
  const rows: string[][] = [["slice", "key", "value"]]
  if (snapshot.settings) flattenRecord(rows, "settings", snapshot.settings)
  flattenRecord(rows, "system", snapshot.system)
  flattenRecord(rows, "platform", snapshot.platform)
  flattenRecord(rows, "energy", snapshot.energy)
  flattenRecord(rows, "fleet", snapshot.fleet)
  flattenRecord(rows, "controls", snapshot.controls)
  if (snapshot.snapshotModel) flattenRecord(rows, "snapshotModel", snapshot.snapshotModel)
  if (snapshot.scalingBands?.length) flattenRecord(rows, "scalingBands", snapshot.scalingBands)
  return rows
}

export function countAssumptionCsvRows(snapshot: AssumptionsSnapshot): number {
  return assumptionsToCsvRows(snapshot).length
}
