import { EntityDetailView } from "@/components/entity/EntityDetailView"
import { PageStub } from "@/components/page/PageStub"
import type { ModelEntityId } from "@/model/types"
import {
  useEntityPageViewModel,
  useSelectorDisplayContext,
} from "@/selectors/hooks"

const ENTITY_PAGE_META: Record<
  ModelEntityId,
  { title: string; mainSectionId: string; description: string }
> = {
  energy: {
    title: "A2 Energy",
    mainSectionId: "a2-energy",
    description:
      "Energy entity statements, corridor schedules, return metrics, and scenario-scoped warnings (selector-driven).",
  },
  platform: {
    title: "A2 Platform",
    mainSectionId: "a2-platform",
    description:
      "Platform entity statements, corridor schedules, return metrics, and scenario-scoped warnings (selector-driven).",
  },
  fleet: {
    title: "Fleet",
    mainSectionId: "fleet",
    description:
      "Fleet operating statements, corridor funding schedules, and fleet-focused charts.",
  },
}

export function EntityRoutePage({ entityId }: { entityId: ModelEntityId }) {
  const vm = useEntityPageViewModel(entityId)
  const ctx = useSelectorDisplayContext()
  const meta = ENTITY_PAGE_META[entityId]

  return (
    <PageStub
      title={meta.title}
      mainSectionId={meta.mainSectionId}
      description={meta.description}
    >
      <EntityDetailView vm={vm} ctx={ctx} />
    </PageStub>
  )
}
