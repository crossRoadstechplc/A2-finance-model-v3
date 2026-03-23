import { Navigate, Outlet, useLocation } from "react-router-dom"

import { isPasscodeUnlocked } from "@/auth/passcode"
import { getConfiguredPasscode } from "@/config/passcode"

export function RequirePasscode() {
  const location = useLocation()
  const sharedPasscode = getConfiguredPasscode()

  if (!isPasscodeUnlocked(sharedPasscode)) {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/passcode" replace state={{ from: redirect }} />
  }

  return <Outlet />
}
