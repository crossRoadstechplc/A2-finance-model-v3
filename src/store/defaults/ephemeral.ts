import type {
  RecomputeMeta,
  ResultsState,
  SensitivityRunState,
  SnapshotState,
} from "@/store/types"

export const defaultResults: ResultsState = {
  status: "idle",
  lastError: null,
  engineOutput: null,
}

export function staleResultsState(): ResultsState {
  return {
    status: "stale",
    lastError: null,
    engineOutput: null,
  }
}

export const defaultSnapshot: SnapshotState = null

export const defaultRecomputeMeta: RecomputeMeta = {
  lastRunAt: null,
  revision: 0,
}

export const defaultSensitivityRun: SensitivityRunState = {
  phase: "idle",
  updatedAt: null,
  basedOnRecomputeRevision: null,
  tornadoBars: [],
  twoWay: null,
  breakevenLines: [],
  warnings: [],
}
