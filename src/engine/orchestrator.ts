import type { EcisDataState } from "@/store/types"
import type { RecomputeMeta, ResultsState, SnapshotState } from "@/store/types"

import { assumptionsToEngineInput } from "@/engine/adapter"
import { runEngine } from "@/engine/runEngine"
import type { EngineOutput, RunEngineFn } from "@/engine/types"

export type RecomputePatch = {
  results: ResultsState
  snapshot: SnapshotState
  recomputeMeta: RecomputeMeta
}

function buildResultsState(output: EngineOutput | null, catastrophicError: string | null): ResultsState {
  if (catastrophicError) {
    return {
      status: "ready",
      lastError: catastrophicError,
      engineOutput: null,
    }
  }
  if (!output) {
    return {
      status: "ready",
      lastError: "Engine produced no output",
      engineOutput: null,
    }
  }

  const errors: string[] = []
  if (output.projection.status === "failed") {
    errors.push(`projection: ${output.projection.error}`)
  }
  if (output.engineSnapshot.status === "failed") {
    errors.push(`snapshot: ${output.engineSnapshot.error}`)
  }

  return {
    status: "ready",
    lastError: errors.length ? errors.join("; ") : null,
    engineOutput: output,
  }
}

function buildSnapshotState(output: EngineOutput | null): SnapshotState {
  if (!output) return null

  if (output.engineSnapshot.status === "ok") {
    return {
      capturedAt: output.engineSnapshot.capturedAt,
      label: output.engineSnapshot.label,
      status: "ok",
    }
  }

  return {
    capturedAt: output.computedAt,
    label: "Engine snapshot",
    status: "failed",
    error: output.engineSnapshot.error,
  }
}

export type OrchestrateRecomputeOptions = {
  runEngineImpl?: RunEngineFn
}

/**
 * Central recompute orchestrator: adapter → engine → ephemeral store patch only.
 * Catches adapter/engine throws and degrades to lastError without mutating assumptions.
 */
export function orchestrateRecompute(
  data: EcisDataState,
  options?: OrchestrateRecomputeOptions,
): RecomputePatch {
  const runner = options?.runEngineImpl ?? runEngine
  const nextMeta: RecomputeMeta = {
    revision: data.recomputeMeta.revision + 1,
    lastRunAt: Date.now(),
  }

  try {
    const input = assumptionsToEngineInput(data)
    const output = runner(input)
    return {
      recomputeMeta: nextMeta,
      results: buildResultsState(output, null),
      snapshot: buildSnapshotState(output),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      recomputeMeta: nextMeta,
      results: buildResultsState(null, msg),
      snapshot: null,
    }
  }
}
