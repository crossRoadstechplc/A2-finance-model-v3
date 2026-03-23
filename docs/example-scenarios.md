# Example Scenarios For Testing

This file gives you a starter scenario pack for validating the current build.
Each scenario begins from the default assumptions unless stated otherwise.

## Scenario 1: Base Case

Name: `Base case`

Leave defaults unchanged.

Purpose:

- validate that the model runs cleanly
- establish your comparison benchmark
- confirm that all entity tabs and consolidated view populate

What to review:

- Dashboard top-line metrics
- entity equity IRRs
- consolidated funding timeline
- first years where DSCR is weakest

## Scenario 2: High Grid Tariff Stress

Name: `High grid tariff`

Change:

- `A2 Energy > Grid electricity tariff per kWh`: `0.11` -> `0.16`

Purpose:

- test price-stack sensitivity
- see how strongly corridor viability depends on electricity cost

What to expect:

- Energy and Fleet economics weaken
- all-in cost to fleet rises
- diesel parity may improve or worsen depending on fleet assumptions
- DSCR and equity IRR should fall

## Scenario 3: Battery Cost Relief

Name: `Cheaper batteries`

Change:

- `A2 Energy > Battery cost per unit`: `60,000` -> `48,000`

Purpose:

- test whether battery capex is the main bottleneck
- see if the sinking fund burden eases materially

What to expect:

- Energy capex falls
- Energy debt demand falls
- Energy equity IRR should improve
- consolidated capital requirement should drop

## Scenario 4: Aggressive Fleet Growth

Name: `Aggressive ramp`

Change annual truck plan to:

- Year 1: `300`
- Year 2: `600`
- Year 3: `1,000`
- Year 4: `1,500`
- Year 5: `2,000`
- Year 6: `3,000`
- Year 7: `5,000`
- Year 8: `7,500`
- Year 9: `10,000`
- Year 10: `10,000`

Purpose:

- test band transitions
- force major capex expansions
- test whether the model remains physically and financially coherent at scale

What to expect:

- bigger capex jumps by year
- more debt drawdowns
- stronger revenue potential
- more pressure on physical throughput and funding timeline

## Scenario 5: Low Freight Market

Name: `Low freight rate`

Change:

- `Fleet > Freight rate per ton-km`: `0.12` -> `0.09`

Purpose:

- test fleet-side commercial weakness
- see whether the corridor remains investable if trucking rates soften

What to expect:

- Fleet revenue falls sharply
- Fleet margins compress
- Fleet viability indicators deteriorate first
- consolidated value may still look acceptable even when Fleet becomes strained

## Scenario 6: Better Financing Terms

Name: `Cheaper debt`

Change:

- `A2 Platform > Cost of debt`: `9` -> `7`
- `A2 Energy > Cost of debt`: `10` -> `8`
- `Fleet > Cost of debt`: `11` -> `8.5`

Purpose:

- test the effect of concessional or DFI-backed financing
- see whether the corridor becomes materially more bankable

What to expect:

- interest expense falls
- DSCR improves
- equity IRR may improve or flatten depending on leverage
- NPV should rise

## Scenario 7: Lower Utilization Downside

Name: `Low utilization`

Change:

- `Fleet > Utilization percent`: `65` -> `50`

Purpose:

- test a demand-underperformance case without changing installed corridor scale

What to expect:

- Fleet economics weaken
- corridor assets look underutilized
- fixed-cost absorption becomes worse
- debt coverage may tighten early

## Scenario 8: Stronger Technical Efficiency

Name: `Efficient trucks`

Change:

- `A2 Energy > kWh consumption per km`: `1.35` -> `1.15`

Purpose:

- test the payoff from better truck efficiency or driving discipline

What to expect:

- fleet energy cost per km drops
- parity vs diesel improves
- Fleet IRR and NPV improve
- battery and power intensity per transport unit improves

## Scenario 9: Corridor Capex Overrun

Name: `Platform capex overrun`

Change:

- `A2 Platform > Capex per station`: `2,500,000` -> `3,250,000`
- `A2 Platform > Capex per swap bay`: `350,000` -> `450,000`
- `A2 Platform > Capex per charging socket`: `65,000` -> `85,000`

Purpose:

- test construction and procurement downside

What to expect:

- Platform payback stretches
- Platform debt and equity requirement rise
- consolidated funding timeline worsens

## Scenario 10: Full Downside Case

Name: `Downside integrated`

Change:

- `Fleet > Freight rate per ton-km`: `0.12` -> `0.10`
- `A2 Energy > Grid electricity tariff per kWh`: `0.11` -> `0.15`
- `A2 Energy > Battery cost per unit`: `60,000` -> `66,000`
- `A2 Platform > Cost of debt`: `9` -> `10`
- `A2 Energy > Cost of debt`: `10` -> `11`
- `Fleet > Cost of debt`: `11` -> `12`
- `Fleet > Utilization percent`: `65` -> `55`

Purpose:

- produce an investment-committee downside case
- test whether any entity becomes the corridor bottleneck

What to expect:

- lower returns across all entities
- higher capital requirement
- tighter coverage ratios
- clearer view of which assumption family hurts the corridor most

## Suggested Testing Sequence

Run these in order:

1. `Base case`
2. `High grid tariff`
3. `Cheaper batteries`
4. `Low freight rate`
5. `Cheaper debt`
6. `Aggressive ramp`
7. `Downside integrated`

This sequence helps you isolate:

- operating-cost sensitivity
- capex sensitivity
- market sensitivity
- financing sensitivity
- scale sensitivity
- combined downside

## What A Good Validation Session Looks Like

For each scenario:

1. Save it with the exact scenario name.
2. Recompute if results are stale.
3. Review all three entity tabs.
4. Review consolidated funding timeline.
5. Review scenario comparison deltas versus base case.
6. Export the case if it is likely to be reused.

If a scenario looks surprising, first check:

- annual truck plan
- battery cost
- grid tariff
- freight rate
- debt share and cost of debt
- utilization
