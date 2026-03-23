import { EmptyState } from "@/components/page/EmptyState"
import { PageStub } from "@/components/page/PageStub"
import { Button } from "@/components/ui/button"
import { useSensitivitiesPageViewModel } from "@/selectors/hooks"
import { useAppStore } from "@/store/useAppStore"

export function SensitivitiesPage() {
  const vm = useSensitivitiesPageViewModel()
  const runSensitivityAnalysis = useAppStore((s) => s.runSensitivityAnalysis)

  return (
    <PageStub
      title="Sensitivity analysis"
      mainSectionId="sensitivities"
      description="Tornado chart (equity NPV), two-way equity NPV grid, and breakeven scans. Each case re-runs the full engine on cloned assumptions — your saved dashboard results stay untouched until you Recompute."
    >
      <div className="space-y-6 p-0 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => runSensitivityAnalysis()}
            disabled={vm.runPhase === "running"}
            data-testid="sensitivity-run-button"
          >
            {vm.runPhase === "running" ? "Running…" : "Run sensitivity sweep"}
          </Button>
          <p className="text-xs text-muted-foreground">{vm.enginePathNote}</p>
        </div>

        {vm.staleVersusRecompute ? (
          <EmptyState
            variant="warning"
            className="px-3 py-2 text-left text-xs"
            data-testid="sensitivity-stale-hint"
          >
            Assumptions changed since this sweep (recompute revision differs). Re-run
            the sweep for alignment.
          </EmptyState>
        ) : null}

        {vm.warnings.length > 0 ? (
          <ul
            className="list-disc space-y-1 pl-5 text-xs text-amber-800 dark:text-amber-200"
            data-testid="sensitivity-warnings"
          >
            {vm.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}

        <section className="space-y-2" aria-labelledby="tornado-heading">
          <h2 id="tornado-heading" className="text-base font-semibold">
            Tornado (equity NPV impact)
          </h2>
          <p className="text-xs text-muted-foreground">
            Bars sorted by largest swing vs base (low/high perturbation per driver).
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table
              className="w-full min-w-[520px] border-collapse text-left text-sm"
              data-testid="sensitivity-tornado-table"
            >
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 font-medium">Driver</th>
                  <th className="px-3 py-2 font-medium">Impact (max |Δ|)</th>
                  <th className="px-3 py-2 font-medium">Base</th>
                  <th className="px-3 py-2 font-medium">Low case</th>
                  <th className="px-3 py-2 font-medium">High case</th>
                </tr>
              </thead>
              <tbody>
                {vm.tornado.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-muted-foreground"
                    >
                      No tornado data — run a sweep.
                    </td>
                  </tr>
                ) : (
                  vm.tornado.map((r) => (
                    <tr
                      key={r.driverId}
                      className="border-b border-border/80"
                      data-tornado-row={r.driverId}
                    >
                      <td className="px-3 py-2">{r.label}</td>
                      <td className="px-3 py-2 tabular-nums">{r.impactDisplay}</td>
                      <td className="px-3 py-2 tabular-nums">{r.baseDisplay}</td>
                      <td className="px-3 py-2 tabular-nums">{r.lowDisplay}</td>
                      <td className="px-3 py-2 tabular-nums">{r.highDisplay}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2" aria-labelledby="twoway-heading">
          <h2 id="twoway-heading" className="text-base font-semibold">
            Two-way matrix (equity NPV)
          </h2>
          {vm.twoWay ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table
                className="w-full min-w-[480px] border-collapse text-left text-sm"
                data-testid="sensitivity-twoway-table"
              >
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-2 py-2 font-medium">
                      {vm.twoWay.rowAxisLabel} / {vm.twoWay.colAxisLabel}
                    </th>
                    {vm.twoWay.colHeaders.map((h) => (
                      <th key={h} className="px-2 py-2 font-medium tabular-nums">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vm.twoWay.rows.map((row) => (
                    <tr key={row.rowLabel} className="border-b border-border/80">
                      <th
                        scope="row"
                        className="px-2 py-2 font-normal text-muted-foreground tabular-nums"
                      >
                        {row.rowLabel}
                      </th>
                      {row.cells.map((c, i) => (
                        <td key={i} className="px-2 py-2 tabular-nums">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Run a sweep to populate the grid.</p>
          )}
        </section>

        <section className="space-y-2" aria-labelledby="breakeven-heading">
          <h2 id="breakeven-heading" className="text-base font-semibold">
            Breakeven & policy checks
          </h2>
          <ul className="space-y-3" data-testid="sensitivity-breakeven-list">
            {vm.breakeven.length === 0 ? (
              <li className="text-muted-foreground">Run a sweep to populate.</li>
            ) : (
              vm.breakeven.map((b) => (
                <li
                  key={b.label}
                  className="rounded-md border border-border bg-card p-3 shadow-sm"
                >
                  <p className="font-medium">{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.statusLabel}</p>
                  <p className="mt-1 text-sm">{b.summary}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <p className="text-xs text-muted-foreground">{vm.summary}</p>
      </div>
    </PageStub>
  )
}
