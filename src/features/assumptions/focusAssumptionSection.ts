import type { AssumptionSectionId } from "@/features/assumptions/assumptionSections"

/**
 * Moves focus to the first tabbable control inside a section (for keyboard / deep-link flows).
 * Returns whether a control was focused.
 */
export function focusAssumptionSectionFirstControl(
  sectionId: AssumptionSectionId,
): boolean {
  const root = document.querySelector(`[data-assumption-section="${sectionId}"]`)
  if (!root) return false
  const el = root.querySelector<HTMLElement>(
    'input:not([type="hidden"]), select, textarea, button:not([disabled])',
  )
  if (!el) return false
  el.focus()
  return true
}
