/*
 * ICMGP 2026 — EASY VISUAL SETTINGS
 * ==================================
 *
 * THIS is the file to edit when you want to change the overall look.
 *
* IMPORTANT:
* 1. Keep USE_CUSTOM_VISUAL_SETTINGS = false to use the current website
 *    exactly as defined by the active CSS files.
* 2. Change it to true only when you want the values below to override
*    the current defaults.
 * 3. The values below are the active visual settings.
*
* You do NOT need to understand CSS for normal edits here.
*/

export const USE_CUSTOM_VISUAL_SETTINGS = true;

export const VISUAL_SETTINGS = {
  /* =========================================================
     1. FONTS
     ========================================================= */
  fonts: {
    // Font used for normal text, buttons and programme entries.
    main: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    // Font used for headings and the main conference title.
    headings: '"Manrope", "Inter", sans-serif',
  },

  /* =========================================================
     2. TEXT SIZES
     ========================================================= */
  textSizes: {
    // Normal overall text size on desktop/laptop.
    desktopBase: "18px",

    // Normal overall text size on phones/tablets.
    mobileBase: "16px",

    // "ICMGP 2026" text in the top header.
    headerTitle: "20px",

    // Small line below the top header title.
    headerSubtitle: "13px",

    // Main heading on a page, for example "Programme".
    pageTitle: "30px",

    // Description below a page heading.
    pageDescription: "14px",

    // Blue programme table column headings.
    programmeHeader: "13px",

    // Session/event text inside programme cells.
    programmeText: "13px",

    // Text labels in the fixed navigation bar at the bottom.
    bottomNavigation: "11px",
  },

  /* =========================================================
     3. COLORS
     ========================================================= */
  colors: {
    // Normal text used across the app.
    mainText: "#26384d",

    // Main conference blue: header title, active buttons, table headings.
    primaryBlue: "#174f91",

    // Large page-heading blue.
    pageTitle: "#173f72",

    // Grey-blue used for subtitles and secondary information.
    mutedText: "#718096",

    // Text inside normal programme cells.
    programmeText: "#405a73",

    // Page background gradient: top and bottom colors.
    pageBackgroundTop: "#f7fbff",
    pageBackgroundBottom: "#eef4f9",

    // Normal white cards/cells.
    surface: "#ffffff",

    // Common light border around sections.
    border: "#e1e6ec",
  },

  /* =========================================================
     4. PAGE SIZE / SPACING
     ========================================================= */
  layout: {
    // Maximum width of the main website content.
    maximumContentWidth: "1100px",

    // Height of the fixed navigation bar at the bottom.
    bottomNavigationHeight: "68px",

    // Common rounded corners for buttons and controls.
    commonCornerRadius: "10px",
  },
};
