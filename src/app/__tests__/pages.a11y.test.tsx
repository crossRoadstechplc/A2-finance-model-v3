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
import { resetEcisStoreForTests, useEcisStore } from "@/store/ecisStore"

function renderAt(path: string) {
  const router = createAppMemoryRouter([path])
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

describe("accessibility smoke - major pages", () => {
  beforeEach(async () => {
    window.sessionStorage.clear()
    resetEcisStoreForTests()
    await useEcisStore.persist.rehydrate()
    rememberPasscodeAccess(useEcisStore.getState().system.sharedPasscode)
  })

  it.each(NAV_ITEMS)("$label route has landmarks and a page heading", async (item) => {
    renderAt(item.to)
    await waitFor(() =>
      expect(screen.queryByTestId("ecis-hydration-loading")).not.toBeInTheDocument(),
    )

    expect(
      screen.getByRole("navigation", { name: /primary navigation/i }),
    ).toBeVisible()
    const main = screen.getByRole("main")
    expect(main).toBeVisible()
    expect(within(main).getByRole("heading", { level: 1 })).toBeVisible()
  })

  it("skip link moves focus to main content", async () => {
    const user = userEvent.setup()
    renderAt("/")
    await waitFor(() =>
      expect(screen.queryByTestId("ecis-hydration-loading")).not.toBeInTheDocument(),
    )

    await user.tab()
    const skip = screen.getByRole("link", { name: /skip to main content/i })
    expect(skip).toHaveFocus()
    await user.click(skip)
    expect(screen.getByRole("main")).toHaveFocus()
  })
})
