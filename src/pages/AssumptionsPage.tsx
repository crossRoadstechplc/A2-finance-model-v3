import { AssumptionsEditor } from "@/features/assumptions/AssumptionsEditor"
import { PageStub } from "@/components/page/PageStub"

export function AssumptionsPage() {
  return (
    <PageStub
      title="Assumptions"
      mainSectionId="assumptions"
      description="Edit corridor, fleet, technical, economic, and scaling inputs. Values persist and drive the engine through the shared store."
    >
      <AssumptionsEditor layout="page" />
    </PageStub>
  )
}
