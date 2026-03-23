import { Navigate, Outlet, useLocation } from "react-router-dom"

import { isPasscodeUnlocked } from "@/auth/passcode"
import { useAppStore } from "@/store/useAppStore"

export function RequirePasscode() {
  const location = useLocation()
  const sharedPasscode = useAppStore((s) => s.system.sharedPasscode)

  if (!isPasscodeUnlocked(sharedPasscode)) {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/passcode" replace state={{ from: redirect }} />
  }

  return <Outlet />
}
