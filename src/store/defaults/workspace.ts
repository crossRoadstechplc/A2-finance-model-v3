import type { WorkspaceState } from "@/store/types"

export const defaultWorkspace: WorkspaceState = {
  activePage: "/",
  panels: {
    assumptionsOpen: true,
    diagnosticsOpen: false,
  },
  activeScenarioId: null,
  comparisonScenarioIds: [],
}
