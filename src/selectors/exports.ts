import type { SelectorDisplayContext } from "@/selectors/context"
import type { EcisSelectorInput } from "@/selectors/input"
import type { ExportsPageViewModel } from "@/selectors/types"
import { PAGE_VM_VERSION } from "@/selectors/types"
import { countAssumptionCsvRows } from "@/export/csv/assumptionsCsv"
import type { AssumptionsSnapshot } from "@/store/types"
import { ECIS_STORAGE_VERSION } from "@/store/persistence/constants"

export function selectExportsPageViewModel(
  input: EcisSelectorInput,
  ctx: SelectorDisplayContext,
  snapshot: AssumptionsSnapshot,
): ExportsPageViewModel {
  const engine = input.results.engineOutput
  const model =
    engine?.projection.status === "ok" ? engine.projection.model : undefined
  const availableEntityPackCount = model
    ? (["energy", "platform", "fleet"] as const).filter(
        (id) => model.entities[id].incomeStatement.length > 0,
      ).length
    : 0
  return {
    version: PAGE_VM_VERSION,
    currencyCode: ctx.currencyCode,
    usedUsdFallback: ctx.usedUsdFallback,
    assumptionCsvRowCount: countAssumptionCsvRows(snapshot),
    namedScenarioCount: Object.keys(input.scenarios.named).length,
    hasReadyResults: input.results.status === "ready",
    hasModelAnalytics: model !== undefined,
    availableEntityPackCount,
    consolidatedPeriodCount: model?.periodCount ?? null,
    exportJsonVersion: ECIS_STORAGE_VERSION,
  }
}
