import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import type {
  ConsolidatedDieselParity,
  DashboardPriceStack,
} from "@/selectors/types"

const STACK_COLORS: Record<string, string> = {
  grid: "hsl(var(--chart-1))",
  a2_energy: "hsl(var(--chart-2))",
  a2_platform: "hsl(var(--chart-3))",
}

type Props = {
  priceStack: DashboardPriceStack
  dieselParity: ConsolidatedDieselParity
  ctx: SelectorDisplayContext
}

export function ConsolidatedPriceStackChart({
  priceStack,
  dieselParity,
  ctx,
}: Props) {
  if (!priceStack.available || priceStack.segments.length === 0) {
    return (
      <div
        className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
        data-testid="consolidated-price-stack-empty"
      >
        Price stack requires a successful scenario projection.
      </div>
    )
  }

  const row: Record<string, string | number> = { name: "Retail $/kWh" }
  for (const s of priceStack.segments) {
    row[s.key] = Number.isFinite(s.displayPerKwh) ? s.displayPerKwh : 0
  }
  const data = [row]

  const dieselX = dieselParity.benchmarkDisplayPerKwh
  const showDiesel =
    dieselParity.available && Number.isFinite(dieselX) && dieselX > 0

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-sm font-semibold">Corridor retail price stack</h3>
        <p className="text-xs text-muted-foreground" data-testid="consolidated-price-total">
          A2 total{" "}
          <span className="font-mono font-medium text-foreground">
            {formatDisplayNumber(priceStack.totalDisplayPerKwh, ctx)}{" "}
            {ctx.currencyCode}/kWh
          </span>
        </p>
      </div>
      {showDiesel ? (
        <p className="mb-2 text-xs text-muted-foreground" data-testid="diesel-parity-summary">
          {dieselParity.summaryLine} (benchmark{" "}
          {formatDisplayNumber(dieselX, ctx)} {ctx.currencyCode}/kWh)
        </p>
      ) : null}
      <div className="h-[220px] w-full" data-testid="consolidated-price-stack-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatDisplayNumber(Number(v), ctx)}
            />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
            {showDiesel ? (
              <ReferenceLine
                x={dieselX}
                stroke="hsl(var(--destructive))"
                strokeDasharray="4 4"
                label={{
                  value: "Diesel parity",
                  position: "top",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
              />
            ) : null}
            <Tooltip
              formatter={(value) => {
                const v = typeof value === "number" ? value : Number(value)
                if (!Number.isFinite(v)) return String(value)
                return `${formatDisplayNumber(v, ctx)} ${ctx.currencyCode}/kWh`
              }}
            />
            <Legend />
            {priceStack.segments.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="stack"
                fill={STACK_COLORS[s.key] ?? "hsl(var(--primary))"}
                radius={[0, 4, 4, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
