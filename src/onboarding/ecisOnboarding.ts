import type { AssumptionSectionId } from "@/features/assumptions/assumptionSections"
import { focusAssumptionSectionFirstControl } from "@/features/assumptions/focusAssumptionSection"

/** Actions wired from `AppShell` (router + panel state). */
export type EcisOnboardingShellApi = {
  openAssumptionsPanel: (open?: boolean) => void
  navigateTo: (path: string) => void
  focusPageSection: (sectionId: string) => void
}

export type EcisOnboardingApi = EcisOnboardingShellApi & {
  focusAssumptionSection: (sectionId: AssumptionSectionId) => boolean
}

const noopShell: EcisOnboardingShellApi = {
  openAssumptionsPanel: () => {},
  navigateTo: () => {},
  focusPageSection: () => {},
}

let shell: EcisOnboardingShellApi = noopShell

export function registerEcisOnboardingShellApi(api: EcisOnboardingShellApi): void {
  shell = api
}

export function unregisterEcisOnboardingShellApi(): void {
  shell = noopShell
}

/**
 * Imperative onboarding API: assumptions panel, navigation, page sections, and
 * assumption accordion focus (no shell wiring required for the last).
 */
export const ecisOnboarding: EcisOnboardingApi = {
  openAssumptionsPanel: (open) => shell.openAssumptionsPanel(open),
  navigateTo: (path) => shell.navigateTo(path),
  focusPageSection: (sectionId) => shell.focusPageSection(sectionId),
  focusAssumptionSection: (sectionId) =>
    focusAssumptionSectionFirstControl(sectionId),
}

declare global {
  interface Window {
    __A2_ECIS_ONBOARDING__?: EcisOnboardingApi
  }
}

export function attachEcisOnboardingToWindow(): void {
  if (typeof window === "undefined") return
  window.__A2_ECIS_ONBOARDING__ = ecisOnboarding
}
