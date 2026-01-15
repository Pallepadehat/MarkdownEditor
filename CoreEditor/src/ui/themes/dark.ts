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
      background: "rgba(35, 35, 40, 0.72)",
      borderColor: "rgba(255,255,255,0.1)",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      background: "rgba(255,255,255,0.1)",
    },
  },
  { dark: true }
);

/**
 * Combined dark theme extension.
 */
export const darkTheme = [xcodeDark, darkThemeVars];
