/**
 * Theme exports for the editor.
 */

import type { Extension } from "@codemirror/state";
import { baseTheme, markdownHighlighting } from "./base";
import { lightTheme } from "./light";
import { darkTheme } from "./dark";

export { baseTheme, markdownHighlighting } from "./base";
export { lightTheme } from "./light";
export { darkTheme } from "./dark";

/**
 * Gets the complete theme extension for the given theme.
 */
export function getThemeExtension(theme: "light" | "dark"): Extension {
  return [
    baseTheme,
    markdownHighlighting,
    theme === "dark" ? darkTheme : lightTheme,
  ];
}
