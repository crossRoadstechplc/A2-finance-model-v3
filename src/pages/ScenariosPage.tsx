import { useState } from "react"

import { ScenarioComparisonTable } from "@/components/scenarios/ScenarioComparisonTable"
import { PageStub } from "@/components/page/PageStub"
import { VmFacts } from "@/components/page/VmFacts"
import { Button } from "@/components/ui/button"
import {
  useScenarioComparisonViewModel,
  useScenariosPageViewModel,
} from "@/selectors/hooks"
import { useAppStore } from "@/store/useAppStore"

const MAX_COMPARE = 4

export function ScenariosPage() {
  const vm = useScenariosPageViewModel()
  const cmp = useScenarioComparisonViewModel()
  const [name, setName] = useState("")

  const saveNamedScenario = useAppStore((s) => s.saveNamedScenario)
  const loadScenario = useAppStore((s) => s.loadScenario)
  const deleteNamedScenario = useAppStore((s) => s.deleteNamedScenario)
  const toggleComparisonScenario = useAppStore((s) => s.toggleComparisonScenario)

  return (
    <PageStub
      title="Scenarios"
      mainSectionId="scenarios"
      description="Save assumption sets as named scenarios, reload them, and compare outputs side-by-side. Named scenarios persist locally in this browser."
    >
      <div className="space-y-8 text-sm">
        <section className="space-y-3" aria-labelledby="scenarios-save-heading">
          <h2 id="scenarios-save-heading" className="text-base font-semibold">
            Save current assumptions
          </h2>
          <div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Scenario name
              </span>
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. High fleet / downside grid"
                data-testid="scenarios-save-name-input"
              />
            </label>
            <Button
              type="button"
              onClick={() => {
                saveNamedScenario(name)
                setName("")
              }}
              data-testid="scenarios-save-button"
            >
              Save as named scenario
            </Button>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="scenarios-list-heading">
          <h2 id="scenarios-list-heading" className="text-base font-semibold">
            Named scenarios
          </h2>
          <VmFacts
            rows={[
              { label: "Count", value: vm.rows.length },
              { label: "Active id", value: vm.activeScenarioId ?? "—" },
              {
                label: "In comparison",
                value: vm.comparisonScenarioIds.length,
              },
            ]}
          />
          {vm.rows.length === 0 ? (
            <p className="text-muted-foreground">
              No saved scenarios yet — save one above.
            </p>
          ) : (
            <ul
              className="divide-y divide-border rounded-lg border border-border"
              data-testid="scenarios-named-list"
            >
              {vm.rows.map((r) => {
                const compared = vm.comparisonScenarioIds.includes(r.id)
                const atLimit =
                  !compared && vm.comparisonScenarioIds.length >= MAX_COMPARE
                return (
                  <li
                    key={r.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    data-testid={`scenario-row-${r.id}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {r.name}
                        {r.isActive ? (
                          <span className="ml-2 text-xs uppercase text-primary">
                            active
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saved {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={compared}
                          disabled={atLimit}
                          onChange={() => toggleComparisonScenario(r.id)}
                          data-testid={`scenario-compare-${r.id}`}
                        />
                        Compare
                        {atLimit ? (
                          <span className="text-muted-foreground">(max {MAX_COMPARE})</span>
                        ) : null}
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => loadScenario(r.id)}
                        data-testid={`scenario-load-${r.id}`}
                      >
                        Load
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => deleteNamedScenario(r.id)}
                        data-testid={`scenario-delete-${r.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3" aria-labelledby="scenarios-compare-heading">
          <h2 id="scenarios-compare-heading" className="text-base font-semibold">
            Comparison
          </h2>
          <ScenarioComparisonTable vm={cmp} />
        </section>
      </div>
    </PageStub>
  )
}
