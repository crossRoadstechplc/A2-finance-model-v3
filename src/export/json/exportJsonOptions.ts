export type ExportJsonOptions = {
  /** Include ephemeral UI snapshot capture metadata (not persisted). */
  includeSnapshotSummary?: boolean
  /** Include a compact summary of last engine output (not full period arrays). */
  includeEphemeralEngineOutput?: boolean
}
