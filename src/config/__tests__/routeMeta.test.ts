import { describe, expect, it } from "vitest"

import { pageTitleForPath } from "@/config/routeMeta"

describe("pageTitleForPath", () => {
  it("maps known routes to stable titles", () => {
    expect(pageTitleForPath("/")).toBe("Dashboard")
    expect(pageTitleForPath("/fleet")).toBe("Fleet")
    expect(pageTitleForPath("/save-export")).toBe("Save / Export")
  })

  it("falls back for unknown paths", () => {
    expect(pageTitleForPath("/unknown-route")).toBe("A2 ECIS")
  })
})
