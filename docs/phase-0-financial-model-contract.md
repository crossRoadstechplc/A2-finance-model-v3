# A2 E-Corridor Financial Model Contract

This document is the Phase 0 build contract for the A2 E-Corridor Investment
Simulator. It exists to keep implementation, UI labels, and exported outputs
aligned with the project brief.

## Build Principles

- Fleet size is exogenous.
- The model solves for required corridor economics, not elastic demand.
- All calculations run internally in USD.
- UI display may be switched to configured currencies.
- Each entity owns its own statements, schedules, KPIs, and investor analytics.
- Consolidated reporting must distinguish entity-level outputs from corridor-level
  outputs.

## Required Tabs

- `Dashboard`: corridor overview, price stack, status, viability, and high-level
  corridor metrics.
- `Assumptions`: editable model inputs grouped into six sections.
- `A2 Platform`: entity-specific statements, schedules, KPIs, investor analytics.
- `A2 Energy`: entity-specific statements, schedules, KPIs, investor analytics.
- `Fleet`: entity-specific statements, schedules, KPIs, investor analytics.
- `Consolidated`: corridor-wide price stack, parity, investment summary, sources
  and uses, capital timeline, convergence status.
- `Sensitivities`: tornado, two-way matrix, breakeven checks.
- `Scenarios`: save, reload, compare named assumption sets.
- `Save / Export`: CSV, JSON, PDF packs.
- `Passcode`: frontend-only shared passcode gate.

## Assumptions Sections

### 1. Currency & Exchange Rates

- Base calculation currency: USD
- Reporting / display currency
- ETB, DJF, EUR, CNY, and one custom currency slot
- Shared passcode configuration

### 2. Market & Fleet

- Corridor name
- Corridor distance
- Active fleet count
- Year-by-year fleet growth plan
- Freight rate per ton-km
- Average payload
- Trips per truck per day
- Diesel benchmark price
- Diesel truck fuel consumption

### 3. Technical & Operating

- Projection horizon
- Discount / DCF assumptions
- Debt covenant defaults
- Battery cost, capacity, cycle life
- Charge time, swap time
- Charging window
- Truck consumption per km
- Grid tariff
- Battery pool ratio
- Staff and warehouse assumptions
- Compatibility overrides for the current prototype engine

### 4. A2 Platform Economics

- Capex per station, bay, socket, warehouse
- Software build and maintenance
- Maintenance and insurance assumptions
- Platform fee target
- Useful lives
- Tax, debt share, cost of debt, target return

### 5. A2 Energy Economics

- Grid pass-through
- Energy fee target
- Target cycle margin
- Sinking fund contribution and buffer
- Residual value
- Insurance and monitoring per battery
- Tax, debt share, cost of debt, target return

### 6. Fleet Economics

- Truck purchase cost
- Driver, maintenance, insurance, tyres, permits
- Tax, debt share, cost of debt, target return
- Corridor scaling table with stations, sockets/station, bays/station, battery pool

## Phase Acceptance Gates

### Phase 1

- Store schema can persist the full brief
- Defaults exist for all new assumption groups
- Assumptions export includes the new assumption fields
- Assumptions screen exposes the critical Phase 1 fields without breaking the app

### Phase 2

- Scaling logic matches the corridor brief
- Physical constraints enforce charging and swap throughput
- Battery pool defaults are available by band

### Phase 3

- Each entity has its own 4 statements and schedules
- Entity tabs no longer show corridor schedules as entity schedules

### Phase 4

- IRR, NPV, MOIC, payback, DSCR, LLCR, PLCR, WACC, FCFF, FCFE, and DCF are
  backed by model outputs

### Phase 5

- Consolidated, scenarios, sensitivities, and exports all reflect the rebuilt
  engine accurately

### Phase 6

- Passcode gate is real
- Labels and encoding are clean
- End-to-end verification passes
