import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EntityDetailView } from "@/components/entity/EntityDetailView"
import { assumptionsToEngineInput } from "@/engine/adapter"
import { runEngine } from "@/engine/runEngine"
import { buildSelectorDisplayContext } from "@/selectors/context"
import { selectEntityPageViewModel } from "@/selectors/entityPages"
import type { EcisSelectorInput } from "@/selectors/input"
import { getDefaultEcisDataState } from "@/store/defaults"

function baseInput(over?: Partial<EcisSelectorInput>): EcisSelectorInput {
  const s = getDefaultEcisDataState()
  return {
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
    ...over,
  }
}

describe("EntityDetailView", () => {
  it("renders selector-driven tables for energy when projection has a model", () => {
    const data = getDefaultEcisDataState()
    const engine = runEngine(assumptionsToEngineInput(data))
    const input = baseInput({
      results: { status: "ready", lastError: null, engineOutput: engine },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const vm = selectEntityPageViewModel("energy", input, ctx)
    render(<EntityDetailView vm={vm} ctx={ctx} />)
    expect(screen.getByTestId("entity-detail-energy")).toBeInTheDocument()
    if (vm.dataAvailable) {
      expect(screen.getByTestId("entity-table-income")).toBeInTheDocument()
      expect(screen.getByText("Sinking fund asset (reserve)")).toBeInTheDocument()
      expect(screen.getByText("Sinking fund contribution (memo)")).toBeInTheDocument()
    }
  })

  it("renders empty chart placeholder without crashing when no data", () => {
    const input = baseInput({
      results: { status: "idle", lastError: null, engineOutput: null },
    })
    const ctx = buildSelectorDisplayContext(input.settings)
    const vm = selectEntityPageViewModel("fleet", input, ctx)
    render(<EntityDetailView vm={vm} ctx={ctx} />)
    expect(screen.getByTestId("entity-chart-empty")).toBeInTheDocument()
    expect(screen.getByTestId("entity-table-empty-is")).toBeInTheDocument()
  })
})
