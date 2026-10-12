import { useEffect } from "react";
import {
  USE_CUSTOM_VISUAL_SETTINGS,
  VISUAL_SETTINGS,
} from "./visualSettings";

function css(settings) {
  const { fonts, textSizes, colors, layout } = settings;

  return `
:root {
  --header-title-size: ${textSizes.headerTitle};
  --header-subtitle-size: ${textSizes.headerSubtitle};
  --bottom-navigation-size: ${textSizes.bottomNavigation};
  --bottom-navigation-height: ${layout.bottomNavigationHeight};
}
html {
  font-size: ${textSizes.desktopBase} !important;
}
body {
  font-family: ${fonts.main} !important;
  color: ${colors.mainText} !important;
  background:
    radial-gradient(circle at 12% 8%, rgba(35, 116, 181, 0.09), transparent 28%),
    radial-gradient(circle at 88% 22%, rgba(77, 166, 205, 0.07), transparent 30%),
    linear-gradient(180deg, ${colors.pageBackgroundTop} 0%, ${colors.pageBackgroundBottom} 100%) !important;
}
.header-inner,
.app-content:not(.app-content-home) {
  max-width: ${layout.maximumContentWidth} !important;
}
.header-main-title {
  font-family: ${fonts.headings} !important;
  color: ${colors.primaryBlue} !important;
}
.header-subtitle {
  color: ${colors.mutedText} !important;
}
.page-heading h2 {
  font-family: ${fonts.headings} !important;
  font-size: ${textSizes.pageTitle} !important;
  color: ${colors.pageTitle} !important;
}
.page-heading p {
  font-size: ${textSizes.pageDescription} !important;
  color: ${colors.mutedText} !important;
}
.programme-header {
  font-size: ${textSizes.programmeHeader} !important;
  background: ${colors.primaryBlue} !important;
}
.programme-item-title {
  font-size: ${textSizes.programmeText} !important;
  color: ${colors.programmeText} !important;
}
.programme-cell {
  background: ${colors.surface} !important;
}
.nav-button {
  border-radius: ${layout.commonCornerRadius} !important;
}
.date-button,
.header-action {
  border-radius: ${layout.commonCornerRadius} !important;
}
@media (max-width: 1024px) {
  html {
    font-size: ${textSizes.mobileBase} !important;
  }
}
`;
}

export function useVisualSettings() {
  useEffect(() => {
    const id = "icmgp-custom-visual-settings";
    document.getElementById(id)?.remove();

    if (!USE_CUSTOM_VISUAL_SETTINGS) return undefined;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = css(VISUAL_SETTINGS);
    document.head.appendChild(style);

    return () => style.remove();
  }, []);
}
