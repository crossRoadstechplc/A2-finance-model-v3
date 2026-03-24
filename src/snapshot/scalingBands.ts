/**
 * Scaling table: bands selected by exogenous truck (fleet) count.
 * `maxTrucksExclusive` uses [min, max) interval on integer fleet size.
 * Persisted rows use `null` max to mean unbounded (JSON-safe vs Infinity).
 *
 * Base case:
 * - 7 stations fixed across the corridor
 * - 1 additional socket per station for each additional 70 trucks
 * - 1 additional bay per station for each additional 1,435 trucks
 * - battery pool defaults continue to use the editable 3.6 batteries / truck rule
 */
export type ScalingBandDefinition = {
  readonly id: string
  readonly minTrucksInclusive: number
  readonly maxTrucksExclusive: number
  readonly baseStations: number
  readonly baseSockets: number
  readonly baseBays: number
  readonly defaultSocketsPerStation: number
  readonly defaultBaysPerStation: number
  readonly defaultBatteryPool: number
  /** Corridor capex anchor (USD) before per-unit adds. Kept editable for scenarios. */
  readonly baseCapexUsd: number
}

export type ScalingBandRow = {
  id: string
  minTrucksInclusive: number
  maxTrucksExclusive: number | null
  baseStations: number
  baseSockets: number
  baseBays: number
  defaultSocketsPerStation: number
  defaultBaysPerStation: number
  defaultBatteryPool: number
  baseCapexUsd: number
}

const BASE_CASE_STATIONS = 7
const TRUCKS_PER_SOCKET_PER_STATION = 70
const TRUCKS_PER_BAY_PER_STATION = 1_435
const BATTERY_POOL_RATIO = 3.6
const MAX_BASE_CASE_TRUCKS = 10_000

function buildCorridorScalingTable(
  maxTrucks: number,
): readonly Omit<ScalingBandDefinition, "baseCapexUsd">[] {
  const rows: Omit<ScalingBandDefinition, "baseCapexUsd">[] = []
  let minTrucksInclusive = 1

  while (minTrucksInclusive <= maxTrucks) {
    const socketsPerStation = Math.ceil(
      minTrucksInclusive / TRUCKS_PER_SOCKET_PER_STATION,
    )
    const baysPerStation = Math.ceil(
      minTrucksInclusive / TRUCKS_PER_BAY_PER_STATION,
    )

    const maxBySockets =
      socketsPerStation * TRUCKS_PER_SOCKET_PER_STATION
    const maxByBays = baysPerStation * TRUCKS_PER_BAY_PER_STATION
    const maxTrucksInclusive = Math.min(maxTrucks, maxBySockets, maxByBays)

    rows.push({
      id: `${minTrucksInclusive}-${maxTrucksInclusive}`,
      minTrucksInclusive,
      maxTrucksExclusive: maxTrucksInclusive + 1,
      baseStations: BASE_CASE_STATIONS,
      baseSockets: BASE_CASE_STATIONS * socketsPerStation,
      baseBays: BASE_CASE_STATIONS * baysPerStation,
      defaultSocketsPerStation: socketsPerStation,
      defaultBaysPerStation: baysPerStation,
      defaultBatteryPool: Math.ceil(maxTrucksInclusive * BATTERY_POOL_RATIO),
    })

    minTrucksInclusive = maxTrucksInclusive + 1
  }

  return rows
}

const corridorScalingTable = buildCorridorScalingTable(MAX_BASE_CASE_TRUCKS)

export const SCALING_BANDS: readonly ScalingBandDefinition[] = corridorScalingTable.map(
  (row) => ({
    ...row,
    baseCapexUsd: 0,
  }),
)

export function staticScalingBandRows(): ScalingBandRow[] {
  return SCALING_BANDS.map((b) => ({
    id: b.id,
    minTrucksInclusive: b.minTrucksInclusive,
    maxTrucksExclusive: Number.isFinite(b.maxTrucksExclusive)
      ? b.maxTrucksExclusive
      : null,
    baseStations: b.baseStations,
    baseSockets: b.baseSockets,
    baseBays: b.baseBays,
    defaultSocketsPerStation: b.defaultSocketsPerStation,
    defaultBaysPerStation: b.defaultBaysPerStation,
    defaultBatteryPool: b.defaultBatteryPool,
    baseCapexUsd: b.baseCapexUsd,
  }))
}

function rowToComparable(band: ScalingBandRow): ScalingBandDefinition {
  return {
    id: band.id,
    minTrucksInclusive: band.minTrucksInclusive,
    maxTrucksExclusive: band.maxTrucksExclusive ?? Number.POSITIVE_INFINITY,
    baseStations: band.baseStations,
    baseSockets: band.baseSockets,
    baseBays: band.baseBays,
    defaultSocketsPerStation: band.defaultSocketsPerStation,
    defaultBaysPerStation: band.defaultBaysPerStation,
    defaultBatteryPool: band.defaultBatteryPool,
    baseCapexUsd: band.baseCapexUsd,
  }
}

export function selectScalingBandFromRows(
  truckCount: number,
  rows: readonly ScalingBandRow[],
): ScalingBandDefinition {
  const list = rows.length > 0 ? rows.map(rowToComparable) : [...SCALING_BANDS]
  const t = Number.isFinite(truckCount) ? Math.max(0, Math.floor(truckCount)) : 0
  if (list.length > 0 && t < list[0]!.minTrucksInclusive) {
    return list[0]!
  }
  for (const band of list) {
    if (t >= band.minTrucksInclusive && t < band.maxTrucksExclusive) {
      return band
    }
  }
  return list[list.length - 1]!
}

export function selectScalingBand(truckCount: number): ScalingBandDefinition {
  return selectScalingBandFromRows(truckCount, staticScalingBandRows())
}
