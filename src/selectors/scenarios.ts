import type { EcisSelectorInput } from "@/selectors/input"
import type { ScenariosPageViewModel } from "@/selectors/types"
import { PAGE_VM_VERSION } from "@/selectors/types"

export function selectScenariosPageViewModel(
  input: EcisSelectorInput,
): ScenariosPageViewModel {
  const active = input.workspace.activeScenarioId
  const rows = Object.values(input.scenarios.named)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      isActive: s.id === active,
    }))

  return {
    version: PAGE_VM_VERSION,
    activeScenarioId: active,
    comparisonScenarioIds: input.workspace.comparisonScenarioIds,
    rows,
  }
}
