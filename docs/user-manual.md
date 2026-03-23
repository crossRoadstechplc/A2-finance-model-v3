# A2 E-Corridor Investment Simulator User Manual

This guide explains how to use the current build of the A2 E-Corridor
Investment Simulator, what each tab is for, and how the system works.

## 1. What This Model Does

The simulator models a battery-swap truck corridor as three linked businesses:

- `A2 Platform`: owns stations, bays, sockets, warehouses, and software.
- `A2 Energy`: owns the battery fleet and sinking fund.
- `Fleet`: owns and operates the electric trucks hauling freight.

The model takes a fleet growth plan, sizes the corridor infrastructure to serve
that fleet, projects capex and financing by entity, and produces financial
statements, returns, and corridor-level investment analytics.

All calculations run client-side in the browser.

## 2. Logging In

- Open the app.
- Enter the shared passcode on the passcode screen.
- Default passcode in this build: `A2`
- The passcode is read from `VITE_PASSCODE` in your env configuration.
- Unlocking lasts for the current browser tab session.

If you want to change the passcode, update your env file and restart or redeploy
the app.

## 3. Core Model Logic

The simulator works in this order:

1. You define fleet demand, especially the annual truck growth plan.
2. The model picks the relevant scaling band and sizes stations, sockets, bays,
   and the battery pool.
3. The model applies the corridor's physical constraints:
   - charging window
   - charge time
   - swap time
   - battery capacity
   - socket throughput
4. The model calculates entity-level capex, opex, debt, taxes, depreciation,
   and cash flow.
5. The model builds:
   - income statement
   - balance sheet
   - cash flow statement
   - statement of equity
6. The model calculates investment analytics:
   - project IRR
   - equity IRR
   - NPV
   - MOIC
   - payback
   - DSCR
   - LLCR / PLCR
   - WACC
   - DCF support
7. The consolidated pages compare the three entities and show corridor-level
   viability.

Important: fleet size is treated as an input, not something the model optimizes.
If the required economics make the fleet unattractive, the model flags
viability pressure, but still shows the numbers.

## 4. Recommended User Workflow

Use the model in this sequence:

1. Unlock the app.
2. Open `Assumptions`.
3. Review currencies and fleet plan.
4. Check technical assumptions:
   - battery cost
   - cycle life
   - battery capacity
   - charging window
   - charge time
   - swap time
   - grid tariff
5. Review the economics for each entity:
   - Platform
   - Energy
   - Fleet
6. Click `Recompute` if results are marked stale.
7. Review:
   - `Dashboard`
   - entity tabs
   - `Consolidated`
8. Save an assumption set as a named scenario.
9. Compare scenarios in the `Scenarios` tab.
10. Export CSV / JSON / PDF packs from `Save / Export`.

## 5. Tab Guide

## Dashboard

Purpose:

- corridor overview
- quick status check
- high-level economics
- model freshness / run status

Use it for:

- checking whether the latest assumptions have been recomputed
- scanning top-line metrics before moving into detailed tabs

## Assumptions

Purpose:

- edit the model inputs that drive the whole corridor

Main groups:

- Currency and exchange rates
- Market and fleet
- Technical and operating
- A2 Platform economics
- A2 Energy economics
- Fleet economics

Use it for:

- changing fleet growth
- testing capex assumptions
- changing cost of debt and return targets
- reviewing display currency and FX setup

## A2 Platform

Purpose:

- view Platform-only economics and financing

Contains:

- four statements
- capex schedule
- sources and uses
- debt schedule
- KPIs
- return and coverage metrics

Use it for:

- station economics
- platform revenue sufficiency
- debt capacity and payback

## A2 Energy

Purpose:

- view battery ownership economics

Contains:

- four statements
- battery investment schedules
- sinking fund impact
- debt schedule
- KPIs
- return and coverage metrics

Use it for:

- battery replacement funding
- battery fleet sizing
- sinking fund adequacy
- battery-owner returns

## Fleet

Purpose:

- view truck operating economics

Contains:

- four statements
- truck capex schedule
- fleet debt schedule
- KPIs
- return and coverage metrics

Use it for:

- freight revenue performance
- energy cost burden
- diesel parity pressure
- truck-level profitability

## Consolidated

Purpose:

- corridor-level view across all three entities

Contains:

- price stack
- corridor investment summary
- sources and uses
- capital timeline
- viability / coverage indicators

Use it for:

- investor conversations
- checking combined capital demand
- understanding total corridor economics

## Sensitivities

Purpose:

- stress the model and compare upside / downside movement

Use it for:

- identifying the most important drivers
- testing resilience to changes in key assumptions

## Scenarios

Purpose:

- save, reload, and compare named cases

Use it for:

- investment committee versions
- base / downside / upside testing
- comparing financing structures

## Save / Export

Purpose:

- export current assumptions and results

Use it for:

- CSV extracts
- JSON model state backup
- PDF-ready reporting workflow

## 6. How To Read The Outputs

## Financial statements

Use the four statements together:

- Income statement shows profitability.
- Balance sheet shows assets, debt, cash, and equity.
- Cash flow statement shows real funding pressure.
- Statement of equity shows whether value is compounding for investors.

## Debt and coverage

Focus on:

- `DSCR`: debt service coverage in each year
- `LLCR`: coverage over remaining loan life
- `PLCR`: coverage over remaining project life

If these fall below your thresholds, the capital structure is too aggressive.

## Returns

Focus on:

- `Project IRR`: return on total invested capital
- `Equity IRR`: return on equity after leverage
- `NPV`: value creation at the chosen discount rate
- `MOIC`: absolute equity multiple
- `Payback`: how long it takes to recover capital

## Viability

A corridor can be:

- physically constrained
- financially unattractive
- both

Typical reasons:

- too many trucks for the charging window
- battery fleet too expensive
- freight rate too low
- grid tariff too high
- debt too expensive

## 7. Good Testing Habits

When testing, change one family of assumptions at a time:

- demand only
- capex only
- financing only
- technical efficiency only

Then compare the resulting scenario against base case.

Always review both:

- entity tabs
- consolidated view

This avoids missing a case where one entity improves but the corridor gets
worse overall.

## 8. Common Questions

## Why do results change across all tabs after one edit?

Because the three businesses are linked. A battery or grid change affects the
price to fleet, which changes fleet economics, which changes corridor
investment performance.

## Why does the model show numbers even when economics look bad?

Because the model is designed to expose non-viable cases instead of hiding
them.

## What should I treat as the primary demand driver?

The annual fleet growth plan.

## What should I adjust first if the corridor is not viable?

Usually:

- freight rate
- truck utilization
- battery cost
- grid tariff
- capex per station
- cost of debt
- target equity return

## 9. Important Current-Build Notes

- Unlock is frontend-only and session-based.
- Calculations are internally in USD.
- Display currency can be changed for presentation.
- Scenario comparison is best used after a clean recompute.
- Results marked `stale` should be recomputed before interpretation.
