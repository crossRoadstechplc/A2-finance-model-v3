import { useCallback, useMemo, useState } from "react"

import { VmFacts } from "@/components/page/VmFacts"
import { PageStub } from "@/components/page/PageStub"
import { Button } from "@/components/ui/button"
import { entityPackTablesCsv } from "@/export/csv/entityPackCsv"
import {
  fundingTimelineToCsvString,
  stackedDocumentTablesToCsv,
} from "@/export/csv/documentTableCsv"
import { triggerBlobDownload, triggerUtf8Download } from "@/export/download"
import { buildEntityPackPdfBlob } from "@/export/pdf/entityPackPdf"
import { buildFullModelPackPdfBlob } from "@/export/pdf/fullModelPackPdf"
import {
  useConsolidatedPageViewModel,
  useEntityPageViewModel,
  useExportsPageViewModel,
} from "@/selectors/hooks"
import type { ModelEntityId } from "@/model/types"
import { useEcisStore } from "@/store/ecisStore"

const ENTITY_IDS: readonly ModelEntityId[] = ["energy", "platform", "fleet"]

function slugCorridor(name: string) {
  return name.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "") || "corridor"
}

export function SaveExportPage() {
  const vm = useExportsPageViewModel()
  const consolidated = useConsolidatedPageViewModel()
  const energyVm = useEntityPageViewModel("energy")
  const platformVm = useEntityPageViewModel("platform")
  const fleetVm = useEntityPageViewModel("fleet")

  const exportJson = useEcisStore((s) => s.exportJson)
  const exportCsv = useEcisStore((s) => s.exportCsv)

  const [includeSnapshotSummary, setIncludeSnapshotSummary] = useState(false)
  const [includeEngineSummary, setIncludeEngineSummary] = useState(false)

  const corridorSlug = useMemo(
    () => slugCorridor(consolidated.corridorName),
    [consolidated.corridorName],
  )

  const entityVms = useMemo(
    () => [energyVm, platformVm, fleetVm],
    [energyVm, platformVm, fleetVm],
  )

  const onAssumptionsCsv = useCallback(() => {
    triggerUtf8Download(
      exportCsv(),
      `ecis-${corridorSlug}-assumptions.csv`,
      "text/csv;charset=utf-8",
    )
  }, [corridorSlug, exportCsv])

  const onConsolidatedTablesCsv = useCallback(() => {
    const body = stackedDocumentTablesToCsv([
      consolidated.investmentSummary,
      consolidated.sourcesUses,
    ])
    triggerUtf8Download(
      body,
      `ecis-${corridorSlug}-consolidated-tables.csv`,
      "text/csv;charset=utf-8",
    )
  }, [consolidated.investmentSummary, consolidated.sourcesUses, corridorSlug])

  const onFundingTimelineCsv = useCallback(() => {
    triggerUtf8Download(
      fundingTimelineToCsvString(consolidated.fundingTimeline),
      `ecis-${corridorSlug}-funding-timeline.csv`,
      "text/csv;charset=utf-8",
    )
  }, [consolidated.fundingTimeline, corridorSlug])

  const onEntityTablesCsv = useCallback(
    (id: ModelEntityId) => {
      const ev = entityVms.find((e) => e.entityId === id)
      if (!ev) return
      triggerUtf8Download(
        entityPackTablesCsv(ev),
        `ecis-${corridorSlug}-entity-${id}-tables.csv`,
        "text/csv;charset=utf-8",
      )
    },
    [corridorSlug, entityVms],
  )

  const onJson = useCallback(() => {
    triggerUtf8Download(
      exportJson({
        includeSnapshotSummary,
        includeEphemeralEngineOutput: includeEngineSummary,
      }),
      `ecis-${corridorSlug}-model.json`,
      "application/json;charset=utf-8",
    )
  }, [
    corridorSlug,
    exportJson,
    includeEngineSummary,
    includeSnapshotSummary,
  ])

  const onEntityPdf = useCallback(
    (id: ModelEntityId) => {
      const ev = entityVms.find((e) => e.entityId === id)
      if (!ev) return
      const blob = buildEntityPackPdfBlob(ev)
      triggerBlobDownload(blob, `ecis-${corridorSlug}-entity-${id}-pack.pdf`)
    },
    [corridorSlug, entityVms],
  )

  const onFullPdf = useCallback(() => {
    const blob = buildFullModelPackPdfBlob({
      corridorName: consolidated.corridorName,
      consolidated,
      entities: entityVms,
    })
    triggerBlobDownload(blob, `ecis-${corridorSlug}-full-model-pack.pdf`)
  }, [consolidated, corridorSlug, entityVms])

  return (
    <PageStub
      title="Save / Export"
      mainSectionId="save-export"
      description="Download assumptions, financial tables, JSON, and PDF packs - all generated in the browser."
    >
      <VmFacts
        rows={[
          { label: "Display currency", value: vm.currencyCode },
          { label: "FX fallback (USD)", value: vm.usedUsdFallback ? "Yes" : "No" },
          { label: "Assumption CSV rows", value: vm.assumptionCsvRowCount },
          { label: "Named scenarios", value: vm.namedScenarioCount },
          { label: "Results ready", value: vm.hasReadyResults ? "Yes" : "No" },
          { label: "Model analytics", value: vm.hasModelAnalytics ? "Yes" : "No" },
          { label: "Entity packs ready", value: vm.availableEntityPackCount },
          { label: "Projection periods", value: vm.consolidatedPeriodCount ?? "N/A" },
          { label: "JSON export version", value: vm.exportJsonVersion },
        ]}
      />

      <div className="max-w-3xl space-y-8">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">CSV</h2>
          <p className="text-sm text-muted-foreground">
            Assumptions use slice/key/value rows. Statement tables include a header row
            with &quot;Line item&quot; plus period columns, or a stacked layout with
            table metadata when exporting packs. Consolidated exports reflect the full
            corridor sources &amp; uses schedule.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onAssumptionsCsv}>
              Assumptions CSV
            </Button>
            <Button type="button" variant="secondary" onClick={onConsolidatedTablesCsv}>
              Consolidated tables CSV
            </Button>
            <Button type="button" variant="secondary" onClick={onFundingTimelineCsv}>
              Funding timeline CSV
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ENTITY_IDS.map((id) => (
              <Button
                key={id}
                type="button"
                variant="outline"
                onClick={() => onEntityTablesCsv(id)}
              >
                {id} tables CSV
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">JSON</h2>
          <p className="text-sm text-muted-foreground">
            The file always includes the persistable assumption payload. Ephemeral engine
            or snapshot fields are omitted unless you opt in below.
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeSnapshotSummary}
              onChange={(e) => setIncludeSnapshotSummary(e.target.checked)}
            />
            Include snapshot summary (capture metadata)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeEngineSummary}
              onChange={(e) => setIncludeEngineSummary(e.target.checked)}
            />
            Include engine output summary (compact, not full period arrays)
          </label>
          <div>
            <Button type="button" onClick={onJson}>
              Download JSON
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">PDF</h2>
          <p className="text-sm text-muted-foreground">
            Entity packs contain KPIs, statements, and schedules. The full model pack
            adds consolidated economics, investment summary, sources &amp; uses, and the
            funding timeline before each entity section. Missing optional sections render
            a short notice instead of failing.
          </p>
          <div className="flex flex-wrap gap-2">
            {ENTITY_IDS.map((id) => (
              <Button
                key={id}
                type="button"
                variant="secondary"
                onClick={() => onEntityPdf(id)}
              >
                {id} pack PDF
              </Button>
            ))}
            <Button type="button" onClick={onFullPdf}>
              Full model pack PDF
            </Button>
          </div>
        </section>
      </div>
    </PageStub>
  )
}
