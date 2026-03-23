import { BRANDING } from "@/config/branding"
import { NAV_ITEMS } from "@/config/navigation"

/** Page title for the sticky shell header (stable labels for tests). */
export function pageTitleForPath(pathname: string): string {
  const normalized = pathname === "" ? "/" : pathname
  for (const item of NAV_ITEMS) {
    if (item.end) {
      if (normalized === "/" || normalized === item.to) {
        return item.label
      }
      continue
    }
    if (normalized === item.to) {
      return item.label
    }
  }
  return BRANDING.shortName
}
