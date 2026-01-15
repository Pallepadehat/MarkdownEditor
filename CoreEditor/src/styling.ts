import { EditorView } from "@codemirror/view";

/**
 * CSS for the hidden markers
 * We use opacity: 0 or display: none depending on preference.
 * Opacity 0 maintains character width (preventing layout shifts),
 * font-size: 0 collapses it. MarkEdit/Obsidian usually collapse.
 */
export const stylingExtension = EditorView.baseTheme({
  ".cm-formatting-hidden": {
    display: "none", // Attempt to collapse completely
    // OR:
    // fontSize: '0.1px', opacity: 0, letterSpacing: '-1ch'
  },
  // If display: none causes issues with cursor navigation, we might need a Widget replacement logic instead.
  // For now, let's try a subtle approach that collapses visual space.

  // Specific fix for "TaskMarker" to ensure [ ] is visible?
  // User wants styling of checkboxes, not hiding them necessarily.
  // We should be careful NOT to hide 'TaskMarker' if we want to style it as a checkbox,
  // UNLESS we are replacing it with a Widget.
  // Checkbox Styling
  ".cm-formatting-task": {
    fontFamily: "monospace",
    display: "inline-block",
    backgroundColor: "var(--badge-bg, #eee)",
    color: "var(--badge-color, #333)", // Text color for the [ ] or [x]
    borderRadius: "4px",
    padding: "0 2px",
    marginRight: "4px",
    fontSize: "0.9em",
    fontWeight: "bold",
    lineHeight: "1.2",
    border: "1px solid var(--badge-border, #ddd)",
    boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
  },
  // Enhanced Cursor Visibility
  ".cm-cursor": {
    borderLeftColor: "#0c8ce9 !important", // Vibrant Blue
    borderLeftWidth: "2px !important", // Thicker than default (usually 1px)
    opacity: "1",
  },
});
