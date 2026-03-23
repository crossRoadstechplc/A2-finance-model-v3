/**
 * Scaling table: bands selected by exogenous truck (fleet) count.
 * `maxTrucksExclusive` uses [min, max) interval on integer fleet size.
 * Persisted rows use `null` max to mean unbounded (JSON-safe vs Infinity).
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
  /** Corridor capex anchor (USD) before per-unit adds. Phase 1 keeps this visible and editable. */
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

const corridorScalingTable: readonly Omit<
  ScalingBandDefinition,
  "baseCapexUsd"
>[] = [
  {
    id: "1-75",
    minTrucksInclusive: 1,
    maxTrucksExclusive: 76,
    baseStations: 6,
    defaultSocketsPerStation: 1,
    defaultBaysPerStation: 1,
    baseSockets: 6,
    baseBays: 6,
    defaultBatteryPool: 270,
  },
  {
    id: "76-150",
    minTrucksInclusive: 76,
    maxTrucksExclusive: 151,
    baseStations: 6,
    defaultSocketsPerStation: 2,
    defaultBaysPerStation: 1,
    baseSockets: 12,
    baseBays: 6,
    defaultBatteryPool: 540,
  },
  {
    id: "151-225",
    minTrucksInclusive: 151,
    maxTrucksExclusive: 226,
    baseStations: 6,
    defaultSocketsPerStation: 3,
    defaultBaysPerStation: 1,
    baseSockets: 18,
    baseBays: 6,
    defaultBatteryPool: 810,
  },
  {
    id: "226-300",
    minTrucksInclusive: 226,
    maxTrucksExclusive: 301,
    baseStations: 6,
    defaultSocketsPerStation: 4,
    defaultBaysPerStation: 1,
    baseSockets: 24,
    baseBays: 6,
    defaultBatteryPool: 1080,
  },
  {
    id: "301-375",
    minTrucksInclusive: 301,
    maxTrucksExclusive: 376,
    baseStations: 6,
    defaultSocketsPerStation: 5,
    defaultBaysPerStation: 1,
    baseSockets: 30,
    baseBays: 6,
    defaultBatteryPool: 1350,
  },
  {
    id: "376-450",
    minTrucksInclusive: 376,
    maxTrucksExclusive: 451,
    baseStations: 6,
    defaultSocketsPerStation: 6,
    defaultBaysPerStation: 1,
    baseSockets: 36,
    baseBays: 6,
    defaultBatteryPool: 1620,
  },
  {
    id: "451-525",
    minTrucksInclusive: 451,
    maxTrucksExclusive: 526,
    baseStations: 6,
    defaultSocketsPerStation: 7,
    defaultBaysPerStation: 1,
    baseSockets: 42,
    baseBays: 6,
    defaultBatteryPool: 1890,
  },
  {
    id: "526-600",
    minTrucksInclusive: 526,
    maxTrucksExclusive: 601,
    baseStations: 6,
    defaultSocketsPerStation: 8,
    defaultBaysPerStation: 1,
    baseSockets: 48,
    baseBays: 6,
    defaultBatteryPool: 2160,
  },
  {
    id: "601-750",
    minTrucksInclusive: 601,
    maxTrucksExclusive: 751,
    baseStations: 6,
    defaultSocketsPerStation: 10,
    defaultBaysPerStation: 1,
    baseSockets: 60,
    baseBays: 6,
    defaultBatteryPool: 2700,
  },
  {
    id: "751-1000",
    minTrucksInclusive: 751,
    maxTrucksExclusive: 1001,
    baseStations: 6,
    defaultSocketsPerStation: 14,
    defaultBaysPerStation: 1,
    baseSockets: 84,
    baseBays: 6,
    defaultBatteryPool: 3600,
  },
  {
    id: "1001-1500",
    minTrucksInclusive: 1001,
    maxTrucksExclusive: 1501,
    baseStations: 6,
    defaultSocketsPerStation: 20,
    defaultBaysPerStation: 2,
    baseSockets: 120,
    baseBays: 12,
    defaultBatteryPool: 5400,
  },
  {
    id: "1501-2000",
    minTrucksInclusive: 1501,
    maxTrucksExclusive: 2001,
    baseStations: 6,
    defaultSocketsPerStation: 27,
    defaultBaysPerStation: 2,
    baseSockets: 162,
    baseBays: 12,
    defaultBatteryPool: 7200,
  },
  {
    id: "2001-3000",
    minTrucksInclusive: 2001,
    maxTrucksExclusive: 3001,
    baseStations: 6,
    defaultSocketsPerStation: 40,
    defaultBaysPerStation: 3,
    baseSockets: 240,
    baseBays: 18,
    defaultBatteryPool: 10800,
  },
  {
    id: "3001-5000",
    minTrucksInclusive: 3001,
    maxTrucksExclusive: 5001,
    baseStations: 6,
    defaultSocketsPerStation: 67,
    defaultBaysPerStation: 5,
    baseSockets: 402,
    baseBays: 30,
    defaultBatteryPool: 18000,
  },
  {
    id: "5001-7500",
    minTrucksInclusive: 5001,
    maxTrucksExclusive: 7501,
    baseStations: 6,
    defaultSocketsPerStation: 100,
    defaultBaysPerStation: 7,
    baseSockets: 600,
    baseBays: 42,
    defaultBatteryPool: 27000,
  },
  {
    id: "7501-10000",
    minTrucksInclusive: 7501,
    maxTrucksExclusive: 10001,
    baseStations: 6,
    defaultSocketsPerStation: 134,
    defaultBaysPerStation: 9,
    baseSockets: 804,
    baseBays: 54,
    defaultBatteryPool: 36000,
  },
] as const

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
