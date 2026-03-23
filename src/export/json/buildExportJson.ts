import type { EngineOutput } from "@/engine/types"
import type { ExportJsonOptions } from "@/export/json/exportJsonOptions"
import { ECIS_STORAGE_VERSION } from "@/store/persistence/constants"
import { partializeEcisState } from "@/store/persistence/partialize"
import type { EcisStore, SnapshotState } from "@/store/types"

export type { ExportJsonOptions } from "@/export/json/exportJsonOptions"

export function snapshotStateToSummary(snapshot: SnapshotState) {
  if (!snapshot) return null
  return {
    capturedAt: snapshot.capturedAt,
    label: snapshot.label ?? null,
    status: snapshot.status ?? null,
    error: snapshot.error ?? null,
  }
}

export function summarizeEngineOutputForExport(
  output: EngineOutput | null,
): Record<string, unknown> | null {
  if (!output) return null
  const proj = output.projection
  if (proj.status === "failed") {
    return {
      version: output.version,
      computedAt: output.computedAt,
      engineSnapshot: output.engineSnapshot,
      projection: { status: "failed" as const, error: proj.error },
    }
  }
  return {
    version: output.version,
    computedAt: output.computedAt,
    engineSnapshot: output.engineSnapshot,
    projection: {
      status: "ok" as const,
      headlineNpvUsd: proj.headlineNpv,
      periodCount: proj.periods.length,
      hasModelRun: proj.model !== undefined,
    },
  }
}

export function buildExportJsonObject(
  state: EcisStore,
  options?: ExportJsonOptions,
): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    version: ECIS_STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    payload: partializeEcisState(state),
  }
  if (options?.includeSnapshotSummary) {
    doc.snapshotSummary = snapshotStateToSummary(state.snapshot)
  }
  if (options?.includeEphemeralEngineOutput) {
    doc.engineOutputSummary = summarizeEngineOutputForExport(
      state.results.engineOutput,
    )
  }
  return doc
}

export function buildExportJsonString(
  state: EcisStore,
  options?: ExportJsonOptions,
): string {
  return JSON.stringify(buildExportJsonObject(state, options), null, 2)
}
