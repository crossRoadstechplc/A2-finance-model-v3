/** Product copy and static asset paths: single source for shell, HTML meta, and errors. */
export const BRANDING = {
  /** Full name for `<title>`, exports, and document titles. */
  productName: "A2 E-Corridor Investment Simulator",
  /** Short label for navigation chrome and compact UI. */
  shortName: "A2 ECIS",
  /** Tagline under the logo in the sidebar. */
  shellTagline: "Investment simulator",
  /** Public URL paths (served from `/public`). */
  logoSrc: "/logo.png",
  favicon32: "/favicon-32x32.png",
  favicon16: "/favicon-16x16.png",
  appleTouchIcon: "/apple-touch-icon.png",
} as const
