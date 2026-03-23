import { ChevronLeft, ChevronRight, Menu, PanelsTopLeft } from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import { BrandMark } from "@/components/brand/BrandMark"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui/button"
import { BRANDING } from "@/config/branding"
import { NAV_GROUPS } from "@/config/navigation"
import { pageTitleForPath } from "@/config/routeMeta"
import { AssumptionsEditor } from "@/features/assumptions/AssumptionsEditor"
import { cn } from "@/lib/utils"
import {
  attachEcisOnboardingToWindow,
  registerEcisOnboardingShellApi,
  unregisterEcisOnboardingShellApi,
} from "@/onboarding/ecisOnboarding"
import { useAppStore } from "@/store/useAppStore"

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const setActivePage = useAppStore((s) => s.setActivePage)
  const assumptionsOpen = useAppStore((s) => s.workspace.panels.assumptionsOpen)
  const setPanelOpen = useAppStore((s) => s.setPanelOpen)
  const activeScenarioId = useAppStore((s) => s.workspace.activeScenarioId)
  const scenarios = useAppStore((s) => s.scenarios.named)
  const loadScenario = useAppStore((s) => s.loadScenario)
  const recompute = useAppStore((s) => s.recompute)
  const resultsStatus = useAppStore((s) => s.results.status)

  const pageTitle = useMemo(
    () => pageTitleForPath(location.pathname),
    [location.pathname],
  )

  useEffect(() => {
    setActivePage(location.pathname)
  }, [location.pathname, setActivePage])

  useEffect(() => {
    const id = window.setTimeout(() => setMobileNavOpen(false), 0)
    return () => window.clearTimeout(id)
  }, [location.pathname])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    document.title = `${pageTitle} | ${BRANDING.productName}`
  }, [pageTitle])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "b") {
        e.preventDefault()
        setPanelOpen("assumptionsOpen", !assumptionsOpen)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [assumptionsOpen, setPanelOpen])

  useEffect(() => {
    attachEcisOnboardingToWindow()
    registerEcisOnboardingShellApi({
      openAssumptionsPanel: (open) =>
        setPanelOpen("assumptionsOpen", open !== false),
      navigateTo: (path) => {
        setMobileNavOpen(false)
        navigate(path)
      },
      focusPageSection: (sectionId) => {
        const el = document.querySelector<HTMLElement>(
          `[data-ecis-section="${sectionId}"]`,
        )
        if (!el) return
        el.scrollIntoView({ behavior: "smooth", block: "nearest" })
        el.focus({ preventScroll: true })
      },
    })
    return () => unregisterEcisOnboardingShellApi()
  }, [navigate, setPanelOpen])

  const scenarioRows = useMemo(
    () =>
      Object.values(scenarios)
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [scenarios],
  )

  const skipToMainContent = useCallback((e: ReactMouseEvent<HTMLAnchorElement>) => {
    const mainEl = document.getElementById("main-content")
    if (!mainEl) return
    e.preventDefault()
    mainEl.focus({ preventScroll: false })
    if (typeof mainEl.scrollIntoView === "function") {
      mainEl.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        onClick={skipToMainContent}
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-[45] bg-background/60 backdrop-blur-[1px] lg:hidden"
          data-testid="shell-mobile-nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        id="shell-primary-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          "transition-transform duration-200 ease-out max-lg:shadow-xl",
          "lg:translate-x-0",
          mobileNavOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-3 py-3">
          <BrandMark className="min-w-0 flex-1" />
          <ThemeToggle />
        </div>
        <nav
          className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-3"
          aria-label="Primary navigation"
          data-testid="shell-nav"
        >
          {NAV_GROUPS.map((group) => (
            <section key={group.id} className="space-y-1.5">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-11 items-center rounded-lg border px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar touch-manipulation",
                        isActive
                          ? "border-primary/35 bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(0,212,255,0.08)]"
                          : "border-transparent text-sidebar-foreground/78 hover:border-sidebar-border hover:bg-sidebar-border/50 hover:text-sidebar-foreground",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button
            type="button"
            variant={assumptionsOpen ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-auto w-full justify-between rounded-lg px-3 py-2.5 text-left sm:h-auto",
              assumptionsOpen
                ? "border border-primary/30 bg-primary/15 text-primary hover:bg-primary/20"
                : "border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-border/60",
            )}
            aria-expanded={assumptionsOpen}
            aria-controls="shell-assumptions-panel"
            data-testid="shell-toggle-assumptions"
            onClick={() => {
              setPanelOpen("assumptionsOpen", !assumptionsOpen)
              setMobileNavOpen(false)
            }}
          >
            <span className="flex items-center gap-2">
              <PanelsTopLeft className="size-4" aria-hidden />
              <span className="flex flex-col">
                <span className="text-sm font-medium">
                  {assumptionsOpen ? "Close assumptions" : "Open assumptions"}
                </span>
                <span className="text-[11px] opacity-75">
                  {assumptionsOpen ? "Panel is visible" : "Panel is hidden"}
                </span>
              </span>
            </span>
            {assumptionsOpen ? (
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
            ) : (
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            )}
          </Button>
          <p className="mt-2 px-1 text-[10px] leading-snug text-muted-foreground">
            Shortcut: Alt+B toggles the assumptions panel
          </p>
        </div>
      </aside>

      {assumptionsOpen ? (
        <>
          <button
            type="button"
            aria-label="Close assumptions panel"
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[1px] lg:hidden"
            data-testid="shell-assumptions-backdrop"
            onClick={() => setPanelOpen("assumptionsOpen", false)}
          />
          <section
            id="shell-assumptions-panel"
            className={cn(
              "fixed inset-y-0 z-[42] flex w-[min(100vw,20rem)] max-w-full flex-col border-r border-panel-border bg-panel text-panel-foreground shadow-2xl",
              "left-0 lg:left-60 lg:w-80 lg:max-w-[min(20rem,calc(100vw-15rem))] lg:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_40px_rgba(0,0,0,0.3)]",
            )}
            aria-label="Assumptions"
            data-testid="shell-assumptions-panel"
          >
            <header className="border-b border-panel-border bg-panel/95 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                    Assumptions
                  </h2>
                  <p className="mt-1 text-sm text-panel-foreground/90">
                    Core model inputs. Edits trigger a debounced recompute.
                  </p>
                </div>
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Open
                </span>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 pb-6">
              <AssumptionsEditor layout="panel" />
              <p className="rounded-md border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
                Active scenario{" "}
                <span className="font-mono text-foreground/80">
                  {activeScenarioId ?? "-"}
                </span>
              </p>
            </div>
          </section>
        </>
      ) : null}

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 ease-out",
          "pl-0",
          assumptionsOpen ? "lg:pl-[35rem]" : "lg:pl-60",
        )}
      >
        <header
          className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75"
          data-testid="shell-content-header"
        >
          <div className="flex min-h-14 min-w-0 flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
            <div className="flex min-w-0 items-start gap-2 sm:items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0 lg:hidden touch-manipulation"
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}
                aria-controls="shell-primary-sidebar"
                data-testid="shell-open-mobile-nav"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="size-5" aria-hidden />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                  Current page
                </p>
                <p className="truncate text-lg font-semibold tracking-tight">
                  {pageTitle}
                </p>
              </div>
            </div>
            <div
              className="flex min-w-0 flex-1 touch-pan-x snap-x snap-mandatory items-center justify-start gap-2 overflow-x-auto pb-1 sm:justify-end sm:pb-0"
              role="toolbar"
              aria-label="Scenarios and model run"
              data-testid="shell-scenario-chips"
            >
              <Button
                type="button"
                size="sm"
                variant={resultsStatus === "stale" ? "default" : "secondary"}
                className="shrink-0 snap-start touch-manipulation"
                data-testid="shell-recompute"
                title="Run the engine on current assumptions and refresh dashboard, entities, and exports."
                aria-label={
                  resultsStatus === "stale"
                    ? "Recompute - assumptions changed since last run"
                    : "Recompute - run engine with current assumptions"
                }
                onClick={() => recompute()}
              >
                {resultsStatus === "stale" ? "Recompute (stale)" : "Recompute"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeScenarioId === null ? "default" : "outline"}
                className="shrink-0 snap-start touch-manipulation"
                onClick={() => loadScenario("default")}
              >
                Base case
              </Button>
              {scenarioRows.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  size="sm"
                  variant={activeScenarioId === s.id ? "default" : "outline"}
                  className="max-w-[10rem] shrink-0 snap-start truncate touch-manipulation"
                  title={s.name}
                  onClick={() => loadScenario(s.id)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="min-h-[calc(100dvh-3.5rem)] min-w-0 flex-1 overflow-y-auto bg-background pb-[env(safe-area-inset-bottom,0px)]"
          data-testid="shell-main"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
