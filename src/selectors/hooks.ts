import { useMemo } from "react"
import { useShallow } from "zustand/shallow"

import { buildAssumptionsSnapshot } from "@/store/defaults"
import { selectPersistedAssumptionPick } from "@/store/persistedAssumptionPick"
import { useEcisStore } from "@/store/ecisStore"
import { buildSelectorDisplayContext } from "@/selectors/context"
import { selectConsolidatedPageViewModel } from "@/selectors/consolidated"
import { selectDashboardViewModel } from "@/selectors/dashboard"
import { selectEntityPageViewModel } from "@/selectors/entityPages"
import { selectExportsPageViewModel } from "@/selectors/exports"
import type { EcisSelectorInput } from "@/selectors/input"
import { selectScenarioComparisonViewModel } from "@/selectors/scenarioComparison"
import { selectScenariosPageViewModel } from "@/selectors/scenarios"
import { selectSensitivitiesPageViewModel } from "@/selectors/sensitivities"
import type { ModelEntityId } from "@/model/types"

function useEcisSelectorInput(): EcisSelectorInput {
  return useEcisStore(
    useShallow((s) => ({
      settings: s.settings,
      system: s.system,
      platform: s.platform,
      energy: s.energy,
      fleet: s.fleet,
      controls: s.controls,
      snapshotModel: s.snapshotModel,
      scalingBands: s.scalingBands,
      results: s.results,
      snapshot: s.snapshot,
      recomputeMeta: s.recomputeMeta,
      sensitivityRun: s.sensitivityRun,
      scenarios: s.scenarios,
      workspace: s.workspace,
    })),
  )
}

export function useSelectorDisplayContext() {
  const settings = useEcisStore((s) => s.settings)
  return useMemo(() => buildSelectorDisplayContext(settings), [settings])
}

export function useDashboardViewModel() {
  const input = useEcisSelectorInput()
  const ctx = useSelectorDisplayContext()
  return useMemo(() => selectDashboardViewModel(input, ctx), [input, ctx])
}

export function useEntityPageViewModel(entityId: ModelEntityId) {
  const input = useEcisSelectorInput()
  const ctx = useSelectorDisplayContext()
  return useMemo(
    () => selectEntityPageViewModel(entityId, input, ctx),
    [entityId, input, ctx],
  )
}

export function useConsolidatedPageViewModel() {
  const input = useEcisSelectorInput()
  const ctx = useSelectorDisplayContext()
  return useMemo(() => selectConsolidatedPageViewModel(input, ctx), [input, ctx])
}

export function useScenariosPageViewModel() {
  const input = useEcisSelectorInput()
  return useMemo(() => selectScenariosPageViewModel(input), [input])
}

export function useScenarioComparisonViewModel() {
  const input = useEcisSelectorInput()
  const ctx = useSelectorDisplayContext()
  return useMemo(
    () => selectScenarioComparisonViewModel(input, ctx),
    [input, ctx],
  )
}

export function useExportsPageViewModel() {
  const input = useEcisSelectorInput()
  const ctx = useSelectorDisplayContext()
  const assumptionSlice = useEcisStore(useShallow(selectPersistedAssumptionPick))
  const snapshot = useMemo(
    () => buildAssumptionsSnapshot(assumptionSlice),
    [assumptionSlice],
  )
  return useMemo(
    () => selectExportsPageViewModel(input, ctx, snapshot),
    [input, ctx, snapshot],
  )
}

export function useSensitivitiesPageViewModel() {
  const input = useEcisSelectorInput()
  const ctx = useSelectorDisplayContext()
  return useMemo(
    () => selectSensitivitiesPageViewModel(input, ctx),
    [input, ctx],
  )
}
