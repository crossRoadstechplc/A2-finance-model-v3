import { ConsolidatedEconomicsBlock } from "@/components/consolidated/ConsolidatedEconomicsBlock"
import { ConsolidatedFundingTimelineTable } from "@/components/consolidated/ConsolidatedFundingTimelineTable"
import { ConsolidatedPriceStackChart } from "@/components/consolidated/ConsolidatedPriceStackChart"
import { ConsolidatedStatusPanels } from "@/components/consolidated/ConsolidatedStatusPanels"
import { EntityExportTable } from "@/components/entity/EntityExportTable"
import type { SelectorDisplayContext } from "@/selectors/context"
import type { ConsolidatedPageViewModel } from "@/selectors/types"

type Props = {
  vm: ConsolidatedPageViewModel
  ctx: SelectorDisplayContext
}

export function ConsolidatedCorridorView({ vm, ctx }: Props) {
  return (
    <div className="space-y-8" data-testid="consolidated-corridor-view">
      <ConsolidatedPriceStackChart
        priceStack={vm.priceStack}
        dieselParity={vm.dieselParity}
        ctx={ctx}
      />

      <ConsolidatedStatusPanels
        circular={vm.circularConvergence}
        viability={vm.businessViability}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConsolidatedEconomicsBlock economics={vm.economicsSummary} />
        <EntityExportTable table={vm.investmentSummary} />
      </div>

      <EntityExportTable table={vm.sourcesUses} />

      <ConsolidatedFundingTimelineTable timeline={vm.fundingTimeline} />
    </div>
  )
}
