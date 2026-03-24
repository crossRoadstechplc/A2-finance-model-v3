import type { ScalingBandRow } from "@/snapshot/scalingBands"

import { cn } from "@/lib/utils"

type Props = {
  rows: ScalingBandRow[]
  onChange: (next: ScalingBandRow[]) => void
  compact?: boolean
}

const bandInputClass =
  "box-border w-full min-h-10 min-w-[3.25rem] rounded border border-input bg-background px-2 py-2 font-mono text-base tabular-nums touch-manipulation sm:min-h-8 sm:px-1 sm:py-1 sm:text-xs"

const MAX_CHARGES_PER_SOCKET_PER_NIGHT = 10
const MAX_SWAPS_PER_BAY_PER_DAY = 205

function syncDerived(row: ScalingBandRow): ScalingBandRow {
  return {
    ...row,
    baseSockets: row.baseStations * row.defaultSocketsPerStation,
    baseBays: row.baseStations * row.defaultBaysPerStation,
  }
}

export function ScalingBandsTable({ rows, onChange, compact }: Props) {
  const patchRow = (index: number, patch: Partial<ScalingBandRow>) => {
    const next = rows.map((r, i) =>
      i === index ? syncDerived({ ...r, ...patch }) : r,
    )
    onChange(next)
  }

  const cell = compact ? "px-1 py-1" : "px-2 py-2 align-middle"

  return (
    <div className="ecis-touch-x overflow-x-auto rounded-md border border-border/80">
      <table className="w-full min-w-[74rem] border-collapse text-left text-xs">
        <thead className="border-b border-border/80 bg-muted/40">
          <tr>
            <th className={cell}>Band</th>
            <th className={cell}>Min trucks</th>
            <th className={cell}>Max trucks (excl.)</th>
            <th className={cell}>Stations</th>
            <th className={cell}>Sockets / station</th>
            <th className={cell}>Bays / station</th>
            <th className={cell}>Total sockets</th>
            <th className={cell}>Total bays</th>
            <th className={cell}>Max nightly charges</th>
            <th className={cell}>Max daily swaps</th>
            <th className={cell}>Battery pool</th>
            <th className={cell}>Capex anchor (USD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className="border-b border-border/40 last:border-0">
              <td className={`${cell} font-mono font-semibold`}>{row.id}</td>
              <td className={cell}>
                <input
                  type="number"
                  data-testid={`scaling-band-${row.id}-min`}
                  className={cn(bandInputClass, "min-w-[4rem]")}
                  value={row.minTrucksInclusive}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    if (Number.isFinite(v)) patchRow(i, { minTrucksInclusive: v })
                  }}
                />
              </td>
              <td className={cell}>
                <input
                  type="number"
                  data-testid={`scaling-band-${row.id}-max`}
                  className={cn(bandInputClass, "min-w-[4rem]")}
                  value={row.maxTrucksExclusive === null ? "" : row.maxTrucksExclusive}
                  placeholder="inf"
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw.trim() === "") {
                      patchRow(i, { maxTrucksExclusive: null })
                      return
                    }
                    const v = e.target.valueAsNumber
                    if (Number.isFinite(v)) patchRow(i, { maxTrucksExclusive: v })
                  }}
                />
              </td>
              <td className={cell}>
                <input
                  type="number"
                  data-testid={`scaling-band-${row.id}-stations`}
                  className={bandInputClass}
                  value={row.baseStations}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    if (Number.isFinite(v)) patchRow(i, { baseStations: v })
                  }}
                />
              </td>
              <td className={cell}>
                <input
                  type="number"
                  data-testid={`scaling-band-${row.id}-sockets`}
                  className={bandInputClass}
                  value={row.defaultSocketsPerStation}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    if (Number.isFinite(v)) {
                      patchRow(i, { defaultSocketsPerStation: v })
                    }
                  }}
                />
              </td>
              <td className={cell}>
                <input
                  type="number"
                  data-testid={`scaling-band-${row.id}-bays`}
                  className={bandInputClass}
                  value={row.defaultBaysPerStation}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    if (Number.isFinite(v)) patchRow(i, { defaultBaysPerStation: v })
                  }}
                />
              </td>
              <td className={`${cell} font-mono text-muted-foreground`}>
                {row.baseSockets}
              </td>
              <td className={`${cell} font-mono text-muted-foreground`}>
                {row.baseBays}
              </td>
              <td className={`${cell} font-mono text-muted-foreground`}>
                {row.baseSockets * MAX_CHARGES_PER_SOCKET_PER_NIGHT}
              </td>
              <td className={`${cell} font-mono text-muted-foreground`}>
                {row.baseBays * MAX_SWAPS_PER_BAY_PER_DAY}
              </td>
              <td className={cell}>
                <input
                  type="number"
                  data-testid={`scaling-band-${row.id}-battery-pool`}
                  className={cn(bandInputClass, "min-w-[5rem]")}
                  value={row.defaultBatteryPool}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    if (Number.isFinite(v)) patchRow(i, { defaultBatteryPool: v })
                  }}
                />
              </td>
              <td className={cell}>
                <input
                  type="number"
                  data-testid={`scaling-band-${row.id}-capex`}
                  className={cn(bandInputClass, "min-w-[5rem]")}
                  value={row.baseCapexUsd}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    if (Number.isFinite(v)) patchRow(i, { baseCapexUsd: v })
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!compact ? (
        <p className="border-t border-border/60 px-2 py-2 text-xs text-muted-foreground">
          Base-case throughput now shows derived nightly charging and daily swap
          capacity for each band. Stations, sockets per station, bays per station,
          battery pool, and capex anchor all remain editable per band.
        </p>
      ) : null}
    </div>
  )
}
