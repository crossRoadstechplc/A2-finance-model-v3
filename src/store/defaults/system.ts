import type { SystemAssumptions } from "@/store/types"

export const defaultSystem: SystemAssumptions = {
  modelHorizonYears: 10,
  discountRatePercent: 8,
  inflationAssumptionPercent: 0,
  terminalGrowthRatePercent: 2,
  exitMultiple: 8,
  corridorWideDiscountRatePercent: 10,
  dscrMinimum: 1.2,
  dscrLockupThreshold: 1.15,
  dscrDistributionThreshold: 1.3,
  debtServiceReserveMonths: 6,
  maintenanceReservePercentCapex: 2,
  cashSweepTriggerDscr: 1.5,
  contingencyPercentCapex: 5,
  developmentCostPercentCapex: 3,
  notes: "",
}
