/**
 * Debounce window after persisted assumption edits before running the central
 * `recompute` orchestrator. Tuned to batch rapid slider/typing without feeling sluggish.
 */
export const ASSUMPTION_RECOMPUTE_DEBOUNCE_MS = 420
