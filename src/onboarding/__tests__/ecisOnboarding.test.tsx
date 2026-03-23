import { act, render, screen, waitFor } from "@testing-library/react"
import { RouterProvider } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"

import { rememberPasscodeAccess } from "@/auth/passcode"
import { EcisHydrationBoundary } from "@/app/EcisHydrationBoundary"
import { AppProviders } from "@/app/providers"
import { createAppMemoryRouter } from "@/app/router"
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary"
import { ecisOnboarding } from "@/onboarding/ecisOnboarding"
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

function renderRouted(path = "/") {
  const router = createAppMemoryRouter([path])
  const view = render(
    <AppProviders>
      <ErrorBoundary>
        <EcisHydrationBoundary>
          <RouterProvider router={router} />
        </EcisHydrationBoundary>
      </ErrorBoundary>
    </AppProviders>,
  )
  return { router, ...view }
}

describe("ecisOnboarding", () => {
  beforeEach(async () => {
    window.sessionStorage.clear()
    resetEcisStoreForTests()
    await useEcisStore.persist.rehydrate()
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
  })

  it("opens the assumptions panel via the imperative API on the Fleet page", async () => {
    const { router } = renderRouted("/")
    await waitFor(() =>
      expect(screen.queryByTestId("ecis-hydration-loading")).not.toBeInTheDocument(),
    )

    await act(async () => {
      router.navigate("/fleet")
    })
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: /^fleet$/i }),
      ).toBeInTheDocument(),
    )

    ecisOnboarding.openAssumptionsPanel(true)
    await waitFor(() =>
      expect(screen.getByTestId("shell-assumptions-panel")).toBeInTheDocument(),
    )

    ecisOnboarding.openAssumptionsPanel(false)
    await waitFor(() =>
      expect(screen.queryByTestId("shell-assumptions-panel")).not.toBeInTheDocument(),
    )
  })

  it("exposes the same API on window for guided tours", async () => {
    renderRouted("/")
    await waitFor(() =>
      expect(window.__A2_ECIS_ONBOARDING__).toBe(ecisOnboarding),
    )
  })
})
