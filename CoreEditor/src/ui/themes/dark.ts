/**
 * Dark theme for the editor.
 */

import { EditorView } from "@codemirror/view";
import { xcodeDark } from "@uiw/codemirror-theme-xcode";

/**
 * Dark theme CSS variables.
 */
export const darkThemeVars = EditorView.theme(
  {
    "&": {
      "--active-line-bg": "rgba(255, 255, 255, 0.03)",
      "--code-block-bg": "rgba(255, 255, 255, 0.05)",
      "--badge-bg": "#3a3a3c",
      "--badge-color": "#fff",
      "--badge-border": "#48484a",
    },
    ".cm-gutters": {
      color: "#636366",
    },
    ".cm-tooltip": {
      background: "rgba(40, 40, 45, 0.92) !important",
      backdropFilter: "blur(50px) saturate(190%)",
      border: "0.5px solid rgba(255, 255, 255, 0.15) !important",
      borderRadius: "10px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      color: "#f5f5f7",
    },
    ".cm-tooltip-autocomplete": {
      background: "rgba(40, 40, 45, 0.92) !important",
    },
    ".cm-tooltip-autocomplete ul": {
      background: "transparent",
    },
    ".cm-tooltip-autocomplete ul li": {
      color: "#f5f5f7",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      background: "rgba(255, 255, 255, 0.12) !important",
      color: "#f5f5f7",
    },
    ".cm-completionLabel": {
      color: "#f5f5f7",
    },
    ".cm-completionDetail": {
      color: "#98989d",
    },
  },
  { dark: true }
);

/**
 * Combined dark theme extension.
 */
export const darkTheme = [xcodeDark, darkThemeVars];
