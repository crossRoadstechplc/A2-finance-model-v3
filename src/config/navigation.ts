export type NavItem = {
  to: string
  label: string
  end?: boolean
}

export type NavGroup = {
  id: string
  label: string
  items: readonly NavItem[]
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "core",
    label: "Core",
    items: [
      { to: "/", label: "Dashboard", end: true },
    ],
  },
  {
    id: "entities",
    label: "Entities",
    items: [
      { to: "/a2-platform", label: "A2 Platform" },
      { to: "/a2-energy", label: "A2 Energy" },
      { to: "/fleet", label: "Fleet" },
    ],
  },
  {
    id: "analysis",
    label: "Analysis",
    items: [
      { to: "/consolidated", label: "Consolidated" },
      { to: "/sensitivities", label: "Sensitivities" },
      { to: "/scenarios", label: "Scenarios" },
    ],
  },
  {
    id: "output",
    label: "Output",
    items: [{ to: "/save-export", label: "Save / Export" }],
  },
] as const

export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((group) => group.items)
