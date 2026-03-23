import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import type { DashboardPriceStack, DashboardViewModel } from "@/selectors/types"

const STACK_COLORS: Record<string, string> = {
  grid: "hsl(var(--chart-1))",
  a2_energy: "hsl(var(--chart-2))",
  a2_platform: "hsl(var(--chart-3))",
}

type PriceStackProps = {
  priceStack: DashboardPriceStack
  ctx: SelectorDisplayContext
}

export function DashboardPriceStackChart({ priceStack, ctx }: PriceStackProps) {
  if (!priceStack.available || priceStack.segments.length === 0) {
    return (
      <div
        className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
        data-testid="dashboard-price-stack-empty"
      >
        Price stack appears after a successful scenario projection.
      </div>
    )
  }

  const row: Record<string, string | number> = { name: "Retail $/kWh" }
  for (const s of priceStack.segments) {
    row[s.key] = Number.isFinite(s.displayPerKwh) ? s.displayPerKwh : 0
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Retail price stack</h3>
        <p className="text-xs text-muted-foreground" data-testid="price-stack-total">
          Total{" "}
          <span className="font-mono font-medium text-foreground">
            {formatDisplayNumber(priceStack.totalDisplayPerKwh, ctx)}{" "}
            {ctx.currencyCode}/kWh
          </span>
        </p>
      </div>
      <div className="h-[200px] w-full" data-testid="dashboard-price-stack-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={[row]}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatDisplayNumber(Number(v), ctx)}
            />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value, name) => {
                const v = typeof value === "number" ? value : Number(value)
                const label = String(name)
                if (!Number.isFinite(v)) return [String(value), label]
                const seg = priceStack.segments.find((s) => s.label === label)
                const usd = seg?.usdPerKwh
                const usdPart =
                  usd !== undefined && Number.isFinite(usd)
                    ? ` (${usd.toFixed(4)} USD/kWh)`
                    : ""
                return [
                  `${formatDisplayNumber(v, ctx)} ${ctx.currencyCode}/kWh${usdPart}`,
                  label,
                ]
              }}
            />
            {priceStack.segments.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="stack"
                fill={STACK_COLORS[s.key] ?? "hsl(var(--chart-4))"}
                radius={[0, 4, 4, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

type CashChartProps = {
  chart: DashboardViewModel["chart"]
  ctx: SelectorDisplayContext
}

export function DashboardCashChart({ chart, ctx }: CashChartProps) {
  if (!chart.available || chart.periods.length === 0) {
    return (
      <div
        className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
        data-testid="dashboard-cash-chart-empty"
      >
        Period cash series appears when projection periods are available.
      </div>
    )
  }

  const data = chart.periods.map((p) => ({
    period: p.periodIndex,
    cash: p.placeholderNetCash.display,
  }))

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Placeholder net cash (by period)</h3>
      <div className="h-[220px] w-full" data-testid="dashboard-cash-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatDisplayNumber(Number(v), ctx)}
            />
            <Tooltip
              formatter={(value) => {
                const v = typeof value === "number" ? value : Number(value)
                if (!Number.isFinite(v)) return String(value)
                return `${formatDisplayNumber(v, ctx)} ${ctx.currencyCode}`
              }}
            />
            <Line
              type="monotone"
              dataKey="cash"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
