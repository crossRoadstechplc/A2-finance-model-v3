import { ChevronDown } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useShallow } from "zustand/shallow"

import { Button } from "@/components/ui/button"
import {
  ASSUMPTION_SECTION_IDS,
  type AssumptionSectionId,
} from "@/features/assumptions/assumptionSections"
import {
  CheckboxField,
  NumberField,
  OptionalNumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/features/assumptions/assumptionInputs"
import { ScalingBandsTable } from "@/features/assumptions/ScalingBandsTable"
import { useDebouncedAssumptionRecompute } from "@/features/assumptions/useDebouncedAssumptionRecompute"
import { cn } from "@/lib/utils"
import { useEcisStore } from "@/store/ecisStore"

function defaultAccordionOpen(
  layout: "panel" | "page",
): Record<AssumptionSectionId, boolean> {
  if (layout === "page") {
    return Object.fromEntries(
      ASSUMPTION_SECTION_IDS.map((id) => [id, true]),
    ) as Record<AssumptionSectionId, boolean>
  }
  return {
    currency: true,
    "market-fleet": false,
    "technical-operating": false,
    "platform-economics": false,
    "energy-economics": false,
    "fleet-economics": false,
  }
}

function AssumptionAccordion({
  sectionId,
  title,
  subtitle,
  open,
  onOpenChange,
  children,
}: {
  sectionId: AssumptionSectionId
  title: string
  subtitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <details
      className="rounded-lg border border-border/80 bg-card/30 open:border-primary/25 open:bg-card/45 open:shadow-sm"
      data-assumption-section={sectionId}
      data-testid={`assumption-accordion-${sectionId}`}
      open={open}
      onToggle={(e) => onOpenChange((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold tracking-tight text-foreground marker:hidden touch-manipulation [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <span className="select-none">{title}</span>
          {subtitle ? (
            <p className="mt-0.5 pr-4 text-xs font-normal leading-snug text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/50 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 border-primary/30 bg-primary/10 text-primary",
          )}
        >
          <ChevronDown className="size-4" aria-hidden />
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-border/50 px-3 py-3">
        {children}
      </div>
    </details>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
}

export function AssumptionsEditor({ layout }: { layout: "panel" | "page" }) {
  useDebouncedAssumptionRecompute()
  const [accordionOpen, setAccordionOpen] = useState(() =>
    defaultAccordionOpen(layout),
  )
  const data = useEcisStore(
    useShallow((s) => ({
      settings: s.settings,
      system: s.system,
      platform: s.platform,
      energy: s.energy,
      fleet: s.fleet,
      controls: s.controls,
      snapshotModel: s.snapshotModel,
      scalingBands: s.scalingBands,
    })),
  )

  const setOpen = (id: AssumptionSectionId, next: boolean) => {
    setAccordionOpen((prev) => ({ ...prev, [id]: next }))
  }

  const rootClass =
    layout === "panel"
      ? "flex flex-col gap-2 text-sm"
      : "mx-auto flex max-w-5xl flex-col gap-4 px-3 py-4 text-sm sm:px-4 md:text-base"

  return (
    <div className={rootClass}>
      <div
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
          layout === "panel" && "sticky top-0 z-10 bg-panel pb-2 pt-0",
        )}
      >
        <p className="text-xs text-muted-foreground">
          Core inputs for the live corridor model.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          data-testid="assumptions-reset-defaults"
          onClick={() => {
            useEcisStore.getState().resetToDefaults()
            useEcisStore.getState().recompute()
          }}
        >
          Reset to defaults
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <AssumptionAccordion
          sectionId="currency"
          title="Currency & exchange rates"
          subtitle="Reporting currency, FX display, and diagnostics."
          open={accordionOpen.currency}
          onOpenChange={(o) => setOpen("currency", o)}
        >
          <Grid>
            <TextField
              id="settings-currency"
              label="Reporting currency (ISO code)"
              value={data.settings.currency}
              onValueChange={(currency) =>
                useEcisStore.getState().updateSettings({ currency })
              }
              data-testid="assumption-settings-currency"
            />
            <NumberField
              id="settings-fx"
              label="Display FX (USD per reporting unit)"
              value={data.settings.displayFxUsdPerUnit}
              min={0}
              step="any"
              onValueChange={(displayFxUsdPerUnit) =>
                useEcisStore.getState().updateSettings({ displayFxUsdPerUnit })
              }
              data-testid="assumption-settings-fx"
            />
            <NumberField
              id="settings-rate-etb"
              label="ETB per 1 USD"
              value={data.settings.exchangeRateEtbPerUsd}
              min={0}
              step="any"
              onValueChange={(exchangeRateEtbPerUsd) =>
                useEcisStore.getState().updateSettings({ exchangeRateEtbPerUsd })
              }
            />
            <NumberField
              id="settings-rate-cny"
              label="CNY per 1 USD"
              value={data.settings.exchangeRateCnyPerUsd}
              min={0}
              step="any"
              onValueChange={(exchangeRateCnyPerUsd) =>
                useEcisStore.getState().updateSettings({ exchangeRateCnyPerUsd })
              }
            />
            <CheckboxField
              id="settings-diagnostics"
              label="Show diagnostics surfaces"
              checked={data.settings.showDiagnostics}
              onCheckedChange={(showDiagnostics) =>
                useEcisStore.getState().updateSettings({ showDiagnostics })
              }
            />
          </Grid>
        </AssumptionAccordion>

        <AssumptionAccordion
          sectionId="market-fleet"
          title="Market & fleet"
          subtitle="Demand, freight, diesel benchmark, and base fleet."
          open={accordionOpen["market-fleet"]}
          onOpenChange={(o) => setOpen("market-fleet", o)}
        >
          <Grid>
            <TextField
              id="platform-corridor"
              label="Corridor name"
              value={data.platform.corridorName}
              onValueChange={(corridorName) =>
                useEcisStore.getState().updatePlatform({ corridorName })
              }
            />
            <NumberField
              id="platform-corridor-distance"
              label="Corridor distance (km)"
              value={data.platform.corridorDistanceKm}
              min={0}
              step="any"
              onValueChange={(corridorDistanceKm) =>
                useEcisStore.getState().updatePlatform({ corridorDistanceKm })
              }
            />
            <NumberField
              id="fleet-vehicles"
              label="Fleet vehicles"
              value={data.fleet.vehicleCount}
              min={0}
              step={1}
              onValueChange={(vehicleCount) =>
                useEcisStore.getState().updateFleet({
                  vehicleCount: Math.max(0, Math.round(vehicleCount)),
                })
              }
              data-testid="assumption-fleet-vehicles"
            />
            <NumberField
              id="fleet-freight-rate"
              label="Freight rate (USD / ton-km)"
              value={data.fleet.freightRatePerTonKmUsd}
              min={0}
              step="any"
              onValueChange={(freightRatePerTonKmUsd) =>
                useEcisStore.getState().updateFleet({ freightRatePerTonKmUsd })
              }
            />
            <NumberField
              id="fleet-payload"
              label="Average payload (tons)"
              value={data.fleet.averagePayloadTons}
              min={0}
              step="any"
              onValueChange={(averagePayloadTons) =>
                useEcisStore.getState().updateFleet({ averagePayloadTons })
              }
            />
            <NumberField
              id="fleet-diesel-price"
              label="Diesel benchmark price (USD / liter)"
              value={data.fleet.dieselBenchmarkPricePerLiterUsd}
              min={0}
              step="any"
              onValueChange={(dieselBenchmarkPricePerLiterUsd) =>
                useEcisStore.getState().updateFleet({
                  dieselBenchmarkPricePerLiterUsd,
                })
              }
            />
          </Grid>
        </AssumptionAccordion>

        <AssumptionAccordion
          sectionId="technical-operating"
          title="Technical & operating"
          subtitle="Core physics, efficiency, horizon, and operating overrides."
          open={accordionOpen["technical-operating"]}
          onOpenChange={(o) => setOpen("technical-operating", o)}
        >
          <Grid>
            <NumberField
              id="system-horizon"
              label="Model horizon (years)"
              value={data.system.modelHorizonYears}
              min={1}
              max={200}
              step={1}
              onValueChange={(modelHorizonYears) =>
                useEcisStore.getState().updateSystem({
                  modelHorizonYears: Math.max(1, Math.trunc(modelHorizonYears)),
                })
              }
            />
            <NumberField
              id="system-discount"
              label="Discount rate (%)"
              value={data.system.discountRatePercent}
              min={0}
              step="any"
              onValueChange={(discountRatePercent) =>
                useEcisStore.getState().updateSystem({ discountRatePercent })
              }
            />
            <NumberField
              id="energy-battery-cost"
              label="Battery cost per unit (USD)"
              value={data.energy.batteryCostPerUnitUsd}
              min={0}
              step="any"
              onValueChange={(batteryCostPerUnitUsd) =>
                useEcisStore.getState().updateEnergy({ batteryCostPerUnitUsd })
              }
            />
            <NumberField
              id="energy-battery-capacity"
              label="Battery capacity (kWh)"
              value={data.energy.batteryCapacityKwh}
              min={0}
              step="any"
              onValueChange={(batteryCapacityKwh) =>
                useEcisStore.getState().updateEnergy({ batteryCapacityKwh })
              }
            />
            <NumberField
              id="energy-charge-time"
              label="Charge time (minutes)"
              value={data.energy.chargeTimeMinutes}
              min={0}
              step="any"
              onValueChange={(chargeTimeMinutes) =>
                useEcisStore.getState().updateEnergy({ chargeTimeMinutes })
              }
            />
            <NumberField
              id="energy-swap-time"
              label="Swap time (minutes)"
              value={data.energy.swapTimeMinutes}
              min={0}
              step="any"
              onValueChange={(swapTimeMinutes) =>
                useEcisStore.getState().updateEnergy({ swapTimeMinutes })
              }
            />
            <NumberField
              id="energy-kwh-per-km"
              label="Truck consumption (kWh / km)"
              value={data.energy.kwhConsumptionPerKm}
              min={0}
              step="any"
              onValueChange={(kwhConsumptionPerKm) =>
                useEcisStore.getState().updateEnergy({ kwhConsumptionPerKm })
              }
            />
            <NumberField
              id="energy-grid-tariff"
              label="Grid electricity tariff (USD / kWh)"
              value={data.energy.gridElectricityTariffUsdPerKwh}
              min={0}
              step="any"
              onValueChange={(gridElectricityTariffUsdPerKwh) =>
                useEcisStore.getState().updateEnergy({
                  gridElectricityTariffUsdPerKwh,
                })
              }
            />
            <NumberField
              id="sm-charging-window"
              label="Charging window (hours / day)"
              value={data.snapshotModel.chargingWindowHoursPerDay}
              min={0}
              max={24}
              step="any"
              onValueChange={(chargingWindowHoursPerDay) =>
                useEcisStore.getState().updateSnapshotModel({
                  chargingWindowHoursPerDay,
                })
              }
            />
            <NumberField
              id="controls-monte"
              label="Monte Carlo runs"
              value={data.controls.monteCarloIterations}
              min={0}
              step={1}
              onValueChange={(monteCarloIterations) =>
                useEcisStore.getState().updateControls({
                  monteCarloIterations: Math.max(0, Math.round(monteCarloIterations)),
                })
              }
              data-testid="assumption-controls-monte"
            />
          </Grid>
          <TextAreaField
            id="system-notes"
            label="Notes"
            value={data.system.notes}
            onValueChange={(notes) => useEcisStore.getState().updateSystem({ notes })}
            data-testid="assumption-system-notes"
          />
          <div className="rounded-md border border-border/60 bg-card/20 p-3">
            <div className="mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Overrides
              </h3>
              <p className="text-xs text-muted-foreground">
                Use only when you want to override the scaling table.
              </p>
            </div>
            <Grid>
            <OptionalNumberField
              id="ov-stations"
              label="Stations override"
              value={data.snapshotModel.infrastructureOverrides.stations}
              onValueChange={(stations) => {
                const ov = useEcisStore.getState().snapshotModel.infrastructureOverrides
                useEcisStore.getState().updateSnapshotModel({
                  infrastructureOverrides: { ...ov, stations },
                })
              }}
            />
            <OptionalNumberField
              id="ov-sockets"
              label="Sockets override"
              value={data.snapshotModel.infrastructureOverrides.sockets}
              onValueChange={(sockets) => {
                const ov = useEcisStore.getState().snapshotModel.infrastructureOverrides
                useEcisStore.getState().updateSnapshotModel({
                  infrastructureOverrides: { ...ov, sockets },
                })
              }}
            />
            <OptionalNumberField
              id="ov-bays"
              label="Swap bays override"
              value={data.snapshotModel.infrastructureOverrides.bays}
              onValueChange={(bays) => {
                const ov = useEcisStore.getState().snapshotModel.infrastructureOverrides
                useEcisStore.getState().updateSnapshotModel({
                  infrastructureOverrides: { ...ov, bays },
                })
              }}
            />
            <SelectField
              id="controls-sensitivity"
              label="Sensitivity mode"
              value={data.controls.sensitivityMode}
              onValueChange={(sensitivityMode) =>
                useEcisStore.getState().updateControls({ sensitivityMode })
              }
              options={[
                { value: "off", label: "Off" },
                { value: "local", label: "Local" },
                { value: "global", label: "Global" },
              ]}
            />
            </Grid>
          </div>
        </AssumptionAccordion>

        <AssumptionAccordion
          sectionId="platform-economics"
          title="A2 Platform economics"
          subtitle="Platform capex, pricing, and return targets."
          open={accordionOpen["platform-economics"]}
          onOpenChange={(o) => setOpen("platform-economics", o)}
        >
          <Grid>
            <NumberField
              id="platform-station-capex"
              label="Capex per station (USD)"
              value={data.platform.stationCapexUsd}
              min={0}
              step="any"
              onValueChange={(stationCapexUsd) =>
                useEcisStore.getState().updatePlatform({ stationCapexUsd })
              }
            />
            <NumberField
              id="platform-software-dev"
              label="Software development cost (USD)"
              value={data.platform.softwareDevelopmentCostUsd}
              min={0}
              step="any"
              onValueChange={(softwareDevelopmentCostUsd) =>
                useEcisStore.getState().updatePlatform({
                  softwareDevelopmentCostUsd,
                })
              }
            />
            <NumberField
              id="sm-a2-platform"
              label="Platform fee (USD / kWh)"
              value={data.snapshotModel.a2PlatformUsdPerKwh}
              min={0}
              step="any"
              onValueChange={(a2PlatformUsdPerKwh) =>
                useEcisStore.getState().updateSnapshotModel({ a2PlatformUsdPerKwh })
              }
              data-testid="assumption-a2-platform-kwh"
            />
            <NumberField
              id="platform-target-return"
              label="Target equity return (%)"
              value={data.platform.targetEquityReturnPercent}
              min={0}
              step="any"
              onValueChange={(targetEquityReturnPercent) =>
                useEcisStore.getState().updatePlatform({
                  targetEquityReturnPercent,
                })
              }
            />
          </Grid>
        </AssumptionAccordion>

        <AssumptionAccordion
          sectionId="energy-economics"
          title="A2 Energy economics"
          subtitle="Battery-owner pricing, margin, and sinking fund."
          open={accordionOpen["energy-economics"]}
          onOpenChange={(o) => setOpen("energy-economics", o)}
        >
          <Grid>
            <NumberField
              id="sm-grid"
              label="Grid passthrough (USD / kWh)"
              value={data.snapshotModel.gridPassThroughUsdPerKwh}
              min={0}
              step="any"
              onValueChange={(gridPassThroughUsdPerKwh) =>
                useEcisStore.getState().updateSnapshotModel({ gridPassThroughUsdPerKwh })
              }
            />
            <NumberField
              id="sm-a2-energy"
              label="Energy fee (USD / kWh)"
              value={data.snapshotModel.a2EnergyUsdPerKwh}
              min={0}
              step="any"
              onValueChange={(a2EnergyUsdPerKwh) =>
                useEcisStore.getState().updateSnapshotModel({ a2EnergyUsdPerKwh })
              }
              data-testid="assumption-a2-energy-kwh"
            />
            <NumberField
              id="energy-margin-cycle"
              label="Target margin per cycle (USD)"
              value={data.energy.targetMarginPerCycleUsd}
              min={0}
              step="any"
              onValueChange={(targetMarginPerCycleUsd) =>
                useEcisStore.getState().updateEnergy({ targetMarginPerCycleUsd })
              }
            />
            <NumberField
              id="energy-sinking-cycle"
              label="Sinking fund contribution per cycle (USD)"
              value={data.energy.sinkingFundContributionPerCycleUsd}
              min={0}
              step="any"
              onValueChange={(sinkingFundContributionPerCycleUsd) =>
                useEcisStore.getState().updateEnergy({
                  sinkingFundContributionPerCycleUsd,
                })
              }
            />
          </Grid>
        </AssumptionAccordion>

        <AssumptionAccordion
          sectionId="fleet-economics"
          title="Fleet economics"
          subtitle="Truck economics plus the corridor scaling table."
          open={accordionOpen["fleet-economics"]}
          onOpenChange={(o) => setOpen("fleet-economics", o)}
        >
          <Grid>
            <NumberField
              id="fleet-truck-cost"
              label="Truck purchase cost (USD)"
              value={data.fleet.truckPurchaseCostUsd}
              min={0}
              step="any"
              onValueChange={(truckPurchaseCostUsd) =>
                useEcisStore.getState().updateFleet({ truckPurchaseCostUsd })
              }
            />
            <NumberField
              id="fleet-driver-cost"
              label="Driver cost per truck per year (USD)"
              value={data.fleet.driverCostPerTruckPerYearUsd}
              min={0}
              step="any"
              onValueChange={(driverCostPerTruckPerYearUsd) =>
                useEcisStore.getState().updateFleet({
                  driverCostPerTruckPerYearUsd,
                })
              }
            />
            <NumberField
              id="fleet-cost-of-debt"
              label="Cost of debt (%)"
              value={data.fleet.costOfDebtPercent}
              min={0}
              step="any"
              onValueChange={(costOfDebtPercent) =>
                useEcisStore.getState().updateFleet({ costOfDebtPercent })
              }
            />
            <NumberField
              id="fleet-target-return"
              label="Target equity return (%)"
              value={data.fleet.targetEquityReturnPercent}
              min={0}
              step="any"
              onValueChange={(targetEquityReturnPercent) =>
                useEcisStore.getState().updateFleet({
                  targetEquityReturnPercent,
                })
              }
            />
          </Grid>
          <ScalingBandsTable
            rows={data.scalingBands}
            onChange={(bands) => useEcisStore.getState().updateScalingBands(bands)}
            compact={layout === "panel"}
          />
        </AssumptionAccordion>
      </div>
    </div>
  )
}
