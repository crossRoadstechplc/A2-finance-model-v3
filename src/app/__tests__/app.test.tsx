import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RouterProvider } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"

import { rememberPasscodeAccess } from "@/auth/passcode"
import { EcisHydrationBoundary } from "@/app/EcisHydrationBoundary"
import { AppProviders } from "@/app/providers"
import { createAppMemoryRouter } from "@/app/router"
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary"
import { NAV_ITEMS } from "@/config/navigation"
import { partializeEcisState } from "@/store/persistence/partialize"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

function ThrowingChild(): never {
  throw new Error("boom")
}

function renderApp(initialPath = "/") {
  const router = createAppMemoryRouter([initialPath])
  return render(
    <AppProviders>
      <ErrorBoundary>
        <EcisHydrationBoundary>
          <RouterProvider router={router} />
        </EcisHydrationBoundary>
      </ErrorBoundary>
    </AppProviders>,
  )
}

describe("A2 ECIS shell", () => {
  beforeEach(async () => {
    window.sessionStorage.clear()
    resetEcisStoreForTests()
    await useEcisStore.persist.rehydrate()
  })

  it(
    "redirects locked users to the passcode screen",
    () => {
      renderApp()
      expect(
        screen.getByRole("heading", { level: 1, name: /enter shared passcode/i }),
      ).toBeInTheDocument()
    },
    15_000,
  )

  it("renders shell navigation links", () => {
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
    renderApp()
    const nav = screen.getByTestId("shell-nav")
    expect(nav).toBeInTheDocument()
    for (const item of NAV_ITEMS) {
      expect(
        screen.getByRole("link", { name: new RegExp(`^${item.label}$`, "i") }),
      ).toBeInTheDocument()
    }
  })

  it("renders the default dashboard page", () => {
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
    renderApp("/")
    const main = screen.getByTestId("shell-main")
    expect(
      within(main).getByRole("heading", { level: 1, name: /dashboard/i }),
    ).toBeInTheDocument()
  })

  it("updates visible content when switching pages via navigation", async () => {
    const user = userEvent.setup()
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
    renderApp("/")
    const main = screen.getByTestId("shell-main")
    await user.click(
      screen.getByRole("link", { name: /^fleet$/i }),
    )
    expect(
      within(main).getByRole("heading", { level: 1, name: /fleet/i }),
    ).toBeInTheDocument()
    expect(useEcisStore.getState().workspace.activePage).toBe("/fleet")
  })

  it("toggles the assumptions panel and persists workspace state", async () => {
    const user = userEvent.setup()
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
    renderApp("/")
    expect(screen.getByTestId("shell-assumptions-panel")).toBeInTheDocument()
    await user.keyboard("{Alt>}b{/Alt}")
    expect(screen.queryByTestId("shell-assumptions-panel")).toBeNull()
    expect(useEcisStore.getState().workspace.panels.assumptionsOpen).toBe(
      false,
    )
    const partial = partializeEcisState(useEcisStore.getState())
    expect(partial.workspace.panels.assumptionsOpen).toBe(false)
    await user.keyboard("{Alt>}b{/Alt}")
    expect(screen.getByTestId("shell-assumptions-panel")).toBeInTheDocument()
  })

  it("keeps the sticky content header mounted while navigating", async () => {
    const user = userEvent.setup()
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
    renderApp("/")
    const header = screen.getByTestId("shell-content-header")
    expect(header).toBeInTheDocument()
    await user.click(screen.getByRole("link", { name: /^scenarios$/i }))
    expect(screen.getByTestId("shell-content-header")).toBe(header)
    expect(within(header).getByText(/scenarios/i)).toBeInTheDocument()
  })

  it("toggles assumptions with Alt+B (keyboard)", async () => {
    const user = userEvent.setup()
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
    renderApp("/")
    expect(screen.getByTestId("shell-assumptions-panel")).toBeInTheDocument()
    await user.keyboard("{Alt>}b{/Alt}")
    expect(screen.queryByTestId("shell-assumptions-panel")).toBeNull()
  })

  it("loads a named scenario from header chips", async () => {
    const user = userEvent.setup()
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
    renderApp("/")
    const id = useEcisStore.getState().saveNamedScenario("Chip scenario")
    const chip = await waitFor(() =>
      screen.getByRole("button", { name: /chip scenario/i }),
    )
    await user.click(chip)
    expect(useEcisStore.getState().workspace.activeScenarioId).toBe(id)
  })

  it("remains usable at laptop-class viewport widths", () => {
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    })
    window.dispatchEvent(new Event("resize"))
    const { container } = renderApp("/")
    const root = container.firstElementChild as HTMLElement
    root.style.width = "1280px"
    expect(screen.getByTestId("shell-nav")).toBeVisible()
    expect(screen.getByTestId("shell-content-header")).toBeVisible()
    expect(screen.getByTestId("shell-main")).toBeVisible()
  })

  it("unlocks the simulator and returns to the requested route", async () => {
    const user = userEvent.setup()
    const sharedPasscode = useEcisStore.getState().system.sharedPasscode
    renderApp("/fleet")
    await user.type(screen.getByLabelText(/passcode/i), sharedPasscode)
    await user.click(screen.getByRole("button", { name: /unlock simulator/i }))
    expect(
      await screen.findByRole("heading", { level: 1, name: /fleet/i }),
    ).toBeInTheDocument()
    expect(useEcisStore.getState().workspace.activePage).toBe("/fleet")
  })

  it("shows the error boundary fallback when a child throws", () => {
    render(
      <AppProviders>
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      </AppProviders>,
    )
    expect(screen.getByTestId("error-boundary-fallback")).toBeInTheDocument()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
