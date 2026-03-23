import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { AppProviders } from "@/app/providers"
import { ScenariosPage } from "@/pages/ScenariosPage"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

describe("ScenariosPage", () => {
  beforeEach(() => {
    resetEcisStoreForTests()
  })

  it("saves, lists, toggles compare, and deletes named scenarios", () => {
    render(
      <AppProviders>
        <ScenariosPage />
      </AppProviders>,
    )

    fireEvent.change(screen.getByTestId("scenarios-save-name-input"), {
      target: { value: "Phase 13 case" },
    })
    fireEvent.click(screen.getByTestId("scenarios-save-button"))

    const id = useEcisStore.getState().workspace.activeScenarioId
    expect(id).toBeTruthy()
    expect(screen.getByTestId(`scenario-row-${id}`)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(`scenario-compare-${id}`))
    expect(useEcisStore.getState().workspace.comparisonScenarioIds).toContain(id)

    fireEvent.click(screen.getByTestId(`scenario-delete-${id}`))
    expect(useEcisStore.getState().scenarios.named[id!]).toBeUndefined()
    expect(screen.queryByTestId(`scenario-row-${id}`)).toBeNull()
  })
})
