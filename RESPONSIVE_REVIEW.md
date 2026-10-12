# Responsive layout review — 22 September 2026

Branch: `ICGMP_20260922`

## Preserved design

The home page retains the supplied Hyderabad background, original image assets, gradient conference title, Welcome text, supporting organisations, Gold Sponsors, and five-item bottom navigation. The ICMGP logo remains the dominant brand mark and is larger than the previous visible rendering. Original programme data and session logic are unchanged.

## Adjustments

- A single home component adapts to desktop and portrait compositions. Grid rows reserve space for the logos, heading, welcome and sponsors, replacing viewport-dependent upward translations.
- The desktop poster fits the actual available area below the header. Portrait phones and tablets use the full content width. Short windows scroll at a readable size instead of clipping content.
- Narrow windows retain the phone composition when their available height shrinks.
- Logo cards constrain wide artwork to their columns; decorative glows cannot create horizontal scrolling.
- The header has one width-based breakpoint for its search row, including landscape devices. The search field uses 16px text to avoid focus zoom on iOS.
- A shared navigation-height variable includes the device safe area and keeps content clear of the fixed navigation. Visual settings now supply responsive sizing variables instead of overriding responsive header and navigation rules.
- Detail panels allow long text to wrap and their bodies to scroll, with safe-area-aware maximum heights on phones. Keyboard focus indicators are visible.
- Removed existing merge-conflict markers from `.gitignore`.

## Verification

Build and lint pass. The build retains the existing large-bundle warning; asset optimisation and programme code splitting are outside this layout change.

Browser checks used Microsoft Edge (Chromium), with emulated viewport sizes. These are viewport tests, not physical-device or Safari/Firefox certification.

Home layout checked for row intersections, clipped sections, image loading, overflowing logo cards, horizontal scrolling, header intersections, title overflow, navigation-label clipping, and navigation covering content:

- Phones: 320×568, 360×640, 360×740, 375×667, 390×780, 390×844, 412×915, 430×932.
- Tablets and intermediate widths: 540×720, 600×800, 768×1024, 800×1100, 820×1180, 900×1200, 901×1200, 1024×1366.
- Landscape: 568×320, 667×375, 844×390, 915×412, 1024×768.
- Desktop: 1280×628, 1366×768, 1440×900, 1920×917, 2560×1440.
- Additional production-build boundary checks: 280×653, 320×320, 390×300, 360×500, 600×600, 900×600, 901×600, 1100×1400, 1101×1400. No clipped sections, intersecting rows, horizontal overflow or clipped navigation labels.

Announcements, Info, Map, Programme, My Schedule, Sponsors & Exhibitors, and Special Issues were checked at 320×568, 390×844, 800×1100, 844×390 and 1366×768: all 35 page checks pass. The timetable intentionally scrolls horizontally within its own container on smaller screens.

Functional checks passed for programme search, opening workshop results, opening abstract 280, scrolling long workshop details, landscape presentation details, saving a workshop, persistence after reloading, and removing the saved workshop. The final production home loaded with no browser console errors.

## Production previews

The final alignment refinement centres Welcome, Telangana Tourism and Gold Sponsors on the statue's image axis, accounting for background cover scaling on every screen shape. Society shares MoEFCC's vertical axis. The smaller tablet LiFE logo and existing composition are preserved. Alignment and overflow checks pass at 14 viewport sizes from 320×568 to 2560×1440; desktop, laptop, tablet and mobile previews were refreshed.

- [Desktop — 1920×917](screenshots/responsive-home-desktop.png)
- [Laptop — 1366×768](screenshots/responsive-home-laptop.png)
- [Mobile — 390×780](screenshots/responsive-home-mobile.png)
- [Tablet — 800×1100](screenshots/responsive-home-tablet.png)
