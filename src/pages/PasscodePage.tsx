import { Eye, EyeOff } from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { isPasscodeUnlocked, rememberPasscodeAccess } from "@/auth/passcode"
import { BrandMark } from "@/components/brand/BrandMark"
import { Button } from "@/components/ui/button"
import { BRANDING } from "@/config/branding"
import { getConfiguredPasscode } from "@/config/passcode"

function resolveRedirectTarget(from: unknown) {
  if (typeof from !== "string" || from.trim() === "") return "/"
  if (!from.startsWith("/")) return "/"
  return from
}

export function PasscodePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const sharedPasscode = getConfiguredPasscode()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showPasscode, setShowPasscode] = useState(false)

  const redirectTo = useMemo(
    () => resolveRedirectTarget(location.state?.from),
    [location.state],
  )

  useEffect(() => {
    document.title = `Passcode | ${BRANDING.productName}`
  }, [])

  if (isPasscodeUnlocked(sharedPasscode)) {
    return <Navigate to={redirectTo} replace />
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (value.trim() !== sharedPasscode.trim()) {
      setError("Incorrect passcode. Try again or update the configured shared passcode.")
      return
    }

    rememberPasscodeAccess(sharedPasscode)
    setError(null)
    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-sm">
          <BrandMark className="mb-6" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Enter shared passcode</h1>
            <p className="text-sm text-muted-foreground">
              Access to the simulator is protected with a single shared passcode set
              in the app configuration. Unlocking lasts for this browser tab only.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor="shared-passcode"
              >
                Passcode
              </label>
              <div className="relative">
                <input
                  id="shared-passcode"
                  type={showPasscode ? "text" : "password"}
                  autoComplete="current-password"
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value)
                    if (error) setError(null)
                  }}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 pr-12 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  placeholder="Enter corridor passcode"
                />
                <button
                  type="button"
                  aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                  onClick={() => setShowPasscode((prev) => !prev)}
                >
                  {showPasscode ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button type="submit" className="min-w-32">
                Unlock simulator
              </Button>
              <p className="text-xs text-muted-foreground">
                Current configured value in this build: {sharedPasscode}
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
