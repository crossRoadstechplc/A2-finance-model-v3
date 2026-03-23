import type { PipelineContext } from "@/snapshot/pipelineContext"

const STATION_UNIT_USD = 400_000
const SOCKET_UNIT_USD = 25_000
const BAY_UNIT_USD = 250_000

export function runCapexStage(ctx: PipelineContext): PipelineContext {
  const inf = ctx.infrastructure
  if (!inf) return ctx

  const totalCapexUsd =
    inf.bandBaseCapexUsd +
    inf.stations * STATION_UNIT_USD +
    inf.sockets * SOCKET_UNIT_USD +
    inf.bays * BAY_UNIT_USD

  ctx.capex = {
    totalCapexUsd,
    stationUnitCostUsd: STATION_UNIT_USD,
    socketUnitCostUsd: SOCKET_UNIT_USD,
    bayUnitCostUsd: BAY_UNIT_USD,
  }

  return ctx
}
