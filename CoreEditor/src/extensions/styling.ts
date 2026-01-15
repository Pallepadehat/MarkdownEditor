/**
 * Custom styling for the CodeMirror editor.
 */

import { EditorView } from "@codemirror/view";

/**
 * Styling extension for syntax hiding, checkboxes, and cursor.
 */
export const stylingExtension = EditorView.baseTheme({
  // Hidden formatting markers
  ".cm-formatting-hidden": {
    display: "none",
  },

  // Task checkbox styling (badges)
  ".cm-formatting-task": {
    fontFamily: "monospace",
    display: "inline-block",
    backgroundColor: "var(--badge-bg, #eee)",
    color: "var(--badge-color, #333)",
    borderRadius: "4px",
    padding: "0 2px",
    marginRight: "4px",
    fontSize: "0.9em",
    fontWeight: "bold",
    lineHeight: "1.2",
    border: "1px solid var(--badge-border, #ddd)",
    boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
  },

  // Enhanced cursor visibility
  ".cm-cursor": {
    borderLeftColor: "#0c8ce9 !important",
    borderLeftWidth: "2px !important",
    opacity: "1",
  },
});
