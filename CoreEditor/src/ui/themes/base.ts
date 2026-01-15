/**
 * Base theme styles shared between light and dark themes.
 */

import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

/**
 * Base theme with shared styles.
 */
export const baseTheme = EditorView.baseTheme({
  "&": {
    height: "100%",
    fontSize: "15px",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily:
      'var(--editor-font-family, -apple-system, BlinkMacSystemFont, "SF Mono", Menlo, Monaco, monospace)',
  },
  ".cm-content": {
    padding: "16px",
    minHeight: "100%",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    paddingRight: "8px",
  },
  ".cm-gutter.cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 16px",
    minWidth: "32px",
    textAlign: "right",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--active-line-bg, rgba(0,0,0,0.03))",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  // Code blocks
  ".cm-line:has(.tok-meta)": {
    backgroundColor: "var(--code-block-bg, rgba(0,0,0,0.03))",
    borderRadius: "4px",
  },
  // Tooltips (glassmorphism)
  ".cm-tooltip": {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(50px) saturate(190%)",
    border: "0.5px solid rgba(0,0,0,0.08)",
    borderRadius: "10px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    overflow: "hidden",
  },
  ".cm-tooltip-autocomplete ul": {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  },
  ".cm-tooltip-autocomplete ul li": {
    padding: "6px 12px",
    borderRadius: "6px",
    margin: "2px 4px",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    background: "rgba(0,0,0,0.05)",
  },
});

/**
 * Markdown highlight styles for headings and other elements.
 */
export const markdownHighlightStyle = HighlightStyle.define([
  // Headings - dynamic sizes
  {
    tag: tags.heading1,
    fontSize: "1.8em",
    fontWeight: "700",
    lineHeight: "1.3",
  },
  {
    tag: tags.heading2,
    fontSize: "1.5em",
    fontWeight: "600",
    lineHeight: "1.35",
  },
  {
    tag: tags.heading3,
    fontSize: "1.3em",
    fontWeight: "600",
    lineHeight: "1.4",
  },
  { tag: tags.heading4, fontSize: "1.15em", fontWeight: "600" },
  { tag: tags.heading5, fontSize: "1.1em", fontWeight: "600" },
  { tag: tags.heading6, fontSize: "1.05em", fontWeight: "600" },

  // Emphasis
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.strikethrough, textDecoration: "line-through", opacity: "0.7" },

  // Code
  { tag: tags.monospace, fontFamily: '"SF Mono", Menlo, Monaco, monospace' },

  // Links
  { tag: tags.link, textDecoration: "underline" },
  { tag: tags.url, opacity: "0.7" },

  // Quote
  { tag: tags.quote, fontStyle: "italic", opacity: "0.85" },
]);

/**
 * Combined markdown syntax highlighting extension.
 */
export const markdownHighlighting = syntaxHighlighting(markdownHighlightStyle);
