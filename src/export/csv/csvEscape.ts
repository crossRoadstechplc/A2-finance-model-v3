export function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function csvRowsToString(rows: readonly (readonly string[])[]): string {
  return rows.map((r) => r.map((c) => csvEscape(c)).join(",")).join("\n")
}
