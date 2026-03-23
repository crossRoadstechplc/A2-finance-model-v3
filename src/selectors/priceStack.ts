import { convertUsdForDisplay } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import type {
  DashboardPriceStack,
  DashboardPriceStackSegment,
} from "@/selectors/types"
import type { ScenarioPipelineOutputs } from "@/snapshot/types"

export function selectPriceStackFromPipeline(
  ctx: SelectorDisplayContext,
  pipeline: ScenarioPipelineOutputs | undefined,
): DashboardPriceStack {
  if (!pipeline) {
    return { available: false, totalDisplayPerKwh: 0, segments: [] }
  }
  const pr = pipeline.pricing
  const grid = convertUsdForDisplay(pr.gridPassThroughUsdPerKwh, ctx)
  const a2e = convertUsdForDisplay(pr.a2EnergyUsdPerKwh, ctx)
  const a2p = convertUsdForDisplay(pr.a2PlatformUsdPerKwh, ctx)
  const segments: DashboardPriceStackSegment[] = [
    {
      key: "grid",
      label: "Grid passthrough",
      displayPerKwh: grid.display,
      usdPerKwh: pr.gridPassThroughUsdPerKwh,
    },
    {
      key: "a2_energy",
      label: "A2 energy",
      displayPerKwh: a2e.display,
      usdPerKwh: pr.a2EnergyUsdPerKwh,
    },
    {
      key: "a2_platform",
      label: "A2 platform",
      displayPerKwh: a2p.display,
      usdPerKwh: pr.a2PlatformUsdPerKwh,
    },
  ]
  const totalDisplay =
    (Number.isFinite(grid.display) ? grid.display : 0) +
    (Number.isFinite(a2e.display) ? a2e.display : 0) +
    (Number.isFinite(a2p.display) ? a2p.display : 0)
  const totalUsd = pr.totalRetailUsdPerKwh
  const totalDisplayFromUsd = convertUsdForDisplay(totalUsd, ctx).display
  return {
    available: true,
    totalDisplayPerKwh: Number.isFinite(totalDisplayFromUsd)
      ? totalDisplayFromUsd
      : totalDisplay,
    segments,
  }
}
