/**
 * Light theme for the editor.
 */

import { EditorView } from "@codemirror/view";
import { xcodeLight } from "@uiw/codemirror-theme-xcode";

/**
 * Light theme CSS variables.
 */
export const lightThemeVars = EditorView.theme(
  {
    "&": {
      "--active-line-bg": "rgba(0, 0, 0, 0.03)",
      "--code-block-bg": "rgba(0, 0, 0, 0.03)",
      "--badge-bg": "#e8e8e8",
      "--badge-color": "#333",
      "--badge-border": "#ddd",
    },
    ".cm-gutters": {
      color: "#8e8e93",
    },
    ".cm-tooltip": {
      background: "rgba(255, 255, 255, 0.92) !important",
      backdropFilter: "blur(50px) saturate(190%)",
      border: "0.5px solid rgba(0, 0, 0, 0.1) !important",
      borderRadius: "10px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      color: "#1d1d1f",
    },
    ".cm-tooltip-autocomplete": {
      background: "rgba(255, 255, 255, 0.92) !important",
    },
    ".cm-tooltip-autocomplete ul": {
      background: "transparent",
    },
    ".cm-tooltip-autocomplete ul li": {
      color: "#1d1d1f",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      background: "rgba(0, 0, 0, 0.08) !important",
      color: "#1d1d1f",
    },
    ".cm-completionLabel": {
      color: "#1d1d1f",
    },
    ".cm-completionDetail": {
      color: "#636366",
    },
  },
  { dark: false }
);

/**
 * Combined light theme extension.
 */
export const lightTheme = [xcodeLight, lightThemeVars];
