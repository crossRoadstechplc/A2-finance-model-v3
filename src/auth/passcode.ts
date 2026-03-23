const PASSCODE_SESSION_KEY = "a2-ecis-passcode"

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
}

export function isPasscodeUnlocked(expectedPasscode: string) {
  if (!canUseSessionStorage()) return false
  return window.sessionStorage.getItem(PASSCODE_SESSION_KEY) === expectedPasscode
}

export function rememberPasscodeAccess(passcode: string) {
  if (!canUseSessionStorage()) return
  window.sessionStorage.setItem(PASSCODE_SESSION_KEY, passcode)
}

export function clearPasscodeAccess() {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(PASSCODE_SESSION_KEY)
}
