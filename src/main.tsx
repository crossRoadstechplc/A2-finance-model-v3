import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import { EcisHydrationBoundary } from "@/app/EcisHydrationBoundary"
import { AppProviders } from "@/app/providers"
import { router } from "@/app/router"
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary"
import "@/index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <ErrorBoundary>
        <EcisHydrationBoundary>
          <RouterProvider router={router} />
        </EcisHydrationBoundary>
      </ErrorBoundary>
    </AppProviders>
  </StrictMode>,
)
