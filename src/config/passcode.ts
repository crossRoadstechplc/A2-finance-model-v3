const FALLBACK_PASSCODE = "A2"

export function getConfiguredPasscode() {
  const configured = import.meta.env.VITE_PASSCODE
  if (typeof configured !== "string") return FALLBACK_PASSCODE
  const trimmed = configured.trim()
  return trimmed.length > 0 ? trimmed : FALLBACK_PASSCODE
}
