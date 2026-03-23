export const ASSUMPTION_SECTION_IDS = [
  "currency",
  "market-fleet",
  "technical-operating",
  "platform-economics",
  "energy-economics",
  "fleet-economics",
] as const

export type AssumptionSectionId = (typeof ASSUMPTION_SECTION_IDS)[number]
