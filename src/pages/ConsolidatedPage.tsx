import { ConsolidatedCorridorView } from "@/components/consolidated/ConsolidatedCorridorView"
import { PageStub } from "@/components/page/PageStub"
import {
  useConsolidatedPageViewModel,
  useSelectorDisplayContext,
} from "@/selectors/hooks"

export function ConsolidatedPage() {
  const vm = useConsolidatedPageViewModel()
  const ctx = useSelectorDisplayContext()

  return (
    <PageStub
      title="Consolidated corridor"
      mainSectionId="consolidated"
      description="Elimination-adjusted consolidated economics, price parity, consolidation checks, and funding — all from consolidated selectors."
    >
      <ConsolidatedCorridorView vm={vm} ctx={ctx} />
    </PageStub>
  )
}
