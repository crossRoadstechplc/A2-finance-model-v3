import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AssumptionsEditor } from "@/features/assumptions/AssumptionsEditor"
import { focusAssumptionSectionFirstControl } from "@/features/assumptions/focusAssumptionSection"
import {
  defaultSystem,
  getDefaultEcisDataState,
} from "@/store/defaults"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

describe("AssumptionsEditor", () => {
  beforeEach(() => {
    vi.useRealTimers()
    resetEcisStoreForTests()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("routes text edits to the correct store group", async () => {
    const user = userEvent.setup({ delay: null })
    render(<AssumptionsEditor layout="page" />)
    const notes = screen.getByTestId("assumption-system-notes")
    await user.clear(notes)
    await user.type(notes, "phase-9")
    expect(useEcisStore.getState().system.notes).toBe("phase-9")
  })

  it("debounces recompute through the central store action after assumption changes", () => {
    vi.useFakeTimers()
    const recomputeSpy = vi.spyOn(useEcisStore.getState(), "recompute")

    render(<AssumptionsEditor layout="page" />)
    expect(recomputeSpy).not.toHaveBeenCalled()

    act(() => {
      useEcisStore.getState().updateFleet({ vehicleCount: 77 })
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(recomputeSpy).toHaveBeenCalledTimes(1)
  })

  it("reset to defaults restores baseline assumptions from the UI", async () => {
    const user = userEvent.setup({ delay: null })
    render(<AssumptionsEditor layout="page" />)
    await user.clear(screen.getByTestId("assumption-system-notes"))
    await user.type(screen.getByTestId("assumption-system-notes"), "dirty")

    await user.click(screen.getByTestId("assumptions-reset-defaults"))

    expect(useEcisStore.getState().system.notes).toBe(defaultSystem.notes)
  })

  it("keeps scaling table edits in the store", async () => {
    render(<AssumptionsEditor layout="page" />)
    const firstBandId = getDefaultEcisDataState().scalingBands[0]!.id
    const minS = screen.getByTestId(`scaling-band-${firstBandId}-min`)
    fireEvent.change(minS, { target: { value: "3" } })
    expect(useEcisStore.getState().scalingBands[0].minTrucksInclusive).toBe(3)
  })

  it("toggles accordion open state from the summary control", async () => {
    const user = userEvent.setup({ delay: null })
    render(<AssumptionsEditor layout="panel" />)
    const details = screen.getByTestId(
      "assumption-accordion-market-fleet",
    ) as HTMLDetailsElement
    expect(details.open).toBe(false)

    const summary = within(details).getByText("Market & fleet")
    await user.click(summary)
    expect(details.open).toBe(true)
  })

  it("focus helper targets the first control inside a section", async () => {
    const user = userEvent.setup({ delay: null })
    render(<AssumptionsEditor layout="page" />)
    await user.click(screen.getByTestId("assumption-settings-currency"))
    await user.tab()
    expect(document.activeElement).not.toBe(
      screen.getByTestId("assumption-settings-currency"),
    )

    act(() => {
      focusAssumptionSectionFirstControl("currency")
    })

    expect(document.activeElement).toBe(
      screen.getByTestId("assumption-settings-currency"),
    )
  })

  it("updates platform slice from corridor name field", async () => {
    const user = userEvent.setup({ delay: null })
    render(<AssumptionsEditor layout="page" />)
    const corridor = screen.getByLabelText("Corridor name")
    await user.clear(corridor)
    await user.type(corridor, "North Sea")
    expect(useEcisStore.getState().platform.corridorName).toBe("North Sea")
  })

  it("updates platform bay and socket capex fields", () => {
    render(<AssumptionsEditor layout="page" />)
    fireEvent.change(screen.getByTestId("assumption-platform-socket-capex"), {
      target: { value: "12500" },
    })
    fireEvent.change(screen.getByTestId("assumption-platform-bay-capex"), {
      target: { value: "85000" },
    })
    expect(useEcisStore.getState().platform.chargingSocketCapexUsd).toBeCloseTo(
      12500,
      5,
    )
    expect(useEcisStore.getState().platform.swapBayCapexUsd).toBeCloseTo(85000, 5)
  })

  it("updates snapshot model from A2 energy field", async () => {
    render(<AssumptionsEditor layout="page" />)
    const field = screen.getByTestId("assumption-a2-energy-kwh")
    fireEvent.change(field, { target: { value: "0.07" } })
    expect(useEcisStore.getState().snapshotModel.a2EnergyUsdPerKwh).toBeCloseTo(
      0.07,
      5,
    )
  })

  it("updates controls from Monte Carlo field", async () => {
    const user = userEvent.setup({ delay: null })
    render(<AssumptionsEditor layout="page" />)
    const field = screen.getByTestId("assumption-controls-monte")
    await user.clear(field)
    await user.type(field, "250")
    expect(useEcisStore.getState().controls.monteCarloIterations).toBe(250)
  })

  it("updates settings from display FX field", async () => {
    render(<AssumptionsEditor layout="page" />)
    const field = screen.getByTestId("assumption-settings-fx")
    fireEvent.change(field, { target: { value: "1.08" } })
    expect(useEcisStore.getState().settings.displayFxUsdPerUnit).toBeCloseTo(
      1.08,
      5,
    )
  })

  it("reset restores default scaling bands", async () => {
    const user = userEvent.setup({ delay: null })
    render(<AssumptionsEditor layout="page" />)
    const firstBandId = getDefaultEcisDataState().scalingBands[0]!.id
    await user.clear(screen.getByTestId(`scaling-band-${firstBandId}-min`))
    await user.type(screen.getByTestId(`scaling-band-${firstBandId}-min`), "9")
    await user.click(screen.getByTestId("assumptions-reset-defaults"))
    const expected = getDefaultEcisDataState().scalingBands[0].minTrucksInclusive
    expect(useEcisStore.getState().scalingBands[0].minTrucksInclusive).toBe(
      expected,
    )
  })
})
