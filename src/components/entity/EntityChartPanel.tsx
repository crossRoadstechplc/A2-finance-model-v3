import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import type { EntityChartBlock } from "@/selectors/types"

const STACK: Record<string, string> = {
  e_infra: "hsl(var(--chart-1))",
  e_batt: "hsl(var(--chart-2))",
  plat: "hsl(var(--chart-3))",
  fleet_cx: "hsl(var(--chart-4))",
}

const LINE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-4))"]

type Props = {
  chart: EntityChartBlock
  ctx: SelectorDisplayContext
}

export function EntityChartPanel({ chart, ctx }: Props) {
  if (!chart.available || chart.categories.length === 0) {
    return (
      <div
        className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
        data-testid="entity-chart-empty"
      >
        Chart data requires entity projection periods.
      </div>
    )
  }

  if (chart.chartKind === "stacked_bar") {
    const data = chart.categories.map((cat, rowIdx) => {
      const o: Record<string, string | number> = { category: cat }
      for (const s of chart.series) {
        o[s.seriesKey] = s.values[rowIdx] ?? 0
      }
      return o
    })

    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">{chart.title}</h3>
        <div className="h-[280px] w-full" data-testid="entity-chart-stacked-bar">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
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
              <Legend />
              {chart.series.map((s) => (
                <Bar
                  key={s.seriesKey}
                  dataKey={s.seriesKey}
                  name={s.label}
                  stackId="stack"
                  fill={STACK[s.seriesKey] ?? "hsl(var(--primary))"}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const data = chart.categories.map((cat, i) => {
    const o: Record<string, string | number> = { category: cat }
    for (const s of chart.series) {
      o[s.seriesKey] = Number.isFinite(s.values[i]) ? s.values[i]! : 0
    }
    return o
  })

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">{chart.title}</h3>
      <div className="h-[280px] w-full" data-testid="entity-chart-line">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
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
            <Legend />
            {chart.series.map((s, i) => (
              <Line
                key={s.seriesKey}
                type="monotone"
                dataKey={s.seriesKey}
                name={s.label}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
