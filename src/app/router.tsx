import {
  createBrowserRouter,
  createMemoryRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom"

import { RequirePasscode } from "@/app/RequirePasscode"
import { AppShell } from "@/components/layout/AppShell"
import { AssumptionsPage } from "@/pages/AssumptionsPage"
import { ConsolidatedPage } from "@/pages/ConsolidatedPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { EntityRoutePage } from "@/pages/EntityRoutePage"
import { PasscodePage } from "@/pages/PasscodePage"
import { SaveExportPage } from "@/pages/SaveExportPage"
import { ScenariosPage } from "@/pages/ScenariosPage"
import { SensitivitiesPage } from "@/pages/SensitivitiesPage"

export const appRoutes: RouteObject[] = [
  {
    path: "/passcode",
    element: <PasscodePage />,
  },
  {
    element: <RequirePasscode />,
    children: [
      {
        path: "/",
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "assumptions", element: <AssumptionsPage /> },
          { path: "a2-platform", element: <EntityRoutePage entityId="platform" /> },
          { path: "a2-energy", element: <EntityRoutePage entityId="energy" /> },
          { path: "fleet", element: <EntityRoutePage entityId="fleet" /> },
          { path: "consolidated", element: <ConsolidatedPage /> },
          { path: "sensitivities", element: <SensitivitiesPage /> },
          { path: "scenarios", element: <ScenariosPage /> },
          { path: "save-export", element: <SaveExportPage /> },
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/passcode" replace /> },
]

export const router = createBrowserRouter(appRoutes)

export function createAppMemoryRouter(initialEntries: string[] = ["/"]) {
  return createMemoryRouter(appRoutes, { initialEntries })
}
