import type { PipelineContext } from "@/snapshot/pipelineContext"

export function runViabilityStage(ctx: PipelineContext): PipelineContext {
  const reasons: string[] = []
  const binding = ctx.constraints.some((c) => c.binding)
  if (binding) {
    reasons.push("Binding infrastructure throughput constraints detected")
  }

  if ((ctx.infrastructure?.batteryPoolSize ?? 0) <= 0) {
    reasons.push("Battery pool is not sized for corridor operations")
  }

  const net = ctx.entityFinancials?.annualNetCashUsd ?? 0
  if (net < 0) {
    reasons.push("Negative annual net cash after simplified OPEX")
  }

  ctx.viability = {
    viable: !binding && net >= 0,
    reasons,
  }

  return ctx
}
