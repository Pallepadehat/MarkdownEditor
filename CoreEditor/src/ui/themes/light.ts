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
  },
  { dark: false }
);

/**
 * Combined light theme extension.
 */
export const lightTheme = [xcodeLight, lightThemeVars];
