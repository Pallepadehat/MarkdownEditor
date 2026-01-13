/**
 * Theme definitions for light and dark modes
 * Uses @uiw/codemirror-theme-xcode for authentic Xcode look and feel
 */

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { xcodeLight, xcodeDark } from '@uiw/codemirror-theme-xcode';

// Base theme settings for layout and typography
const baseTheme = EditorView.baseTheme({
  '&': {
    height: '100%',
    fontSize: '15px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Mono", Menlo, monospace',
    width: '100%',
    margin: '0 auto'  // Center the container
  },
  '.cm-content': {
    padding: '24px 16px', // More breathing room
    fontFamily: 'inherit'
  },
  '.cm-line': {
    padding: '0 4px',
    lineHeight: '1.8'
  },
  '.cm-codeblock-line': {
    backgroundColor: 'var(--code-block-bg)',
    paddingLeft: '12px',
    borderRadius: '4px'
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit'
  },
  // Gutter (Line Numbers) Styling - Clean & Minimal
  '.cm-gutters': {
    backgroundColor: 'transparent', // Transparent gutter
    borderRight: 'none',
    color: 'var(--gutter-color, #999)',
    fontFamily: 'inherit',
    lineHeight: '1.8'
  },
  '.cm-gutterElement': {
    display: 'flex !important',
    alignItems: 'center',
    justifyContent: 'flex-end',
    fontSize: '0.85em',
    opacity: '0.4', // Fainter
    transition: 'opacity 0.2s',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent !important',
    color: 'var(--accent-color, #007aff)',
    opacity: '1',
    fontWeight: '500'
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent', // Remove active line highlight for "writer" feel
    borderRadius: '4px'
  },
 
});

// Theme variables for specific components (code blocks, badges)
const lightThemeVars = EditorView.theme({
  "&": {
    "--code-block-bg": "#f5f5f7",
    "--badge-color": "#8e8e93",
    "--badge-border": "#d1d1d6",
    "--badge-bg": "#ffffff"
  }
}, { dark: false });

const darkThemeVars = EditorView.theme({
  "&": {
    "--code-block-bg": "#1e1e24", 
    "--badge-color": "#a1a1aa",
    "--badge-border": "#3f3f46",
    "--badge-bg": "#27272a"
  }
}, { dark: true });

// Custom Syntax Highlighting (MarkEdit Style)
const markdownHighlightStyle = HighlightStyle.define([
  // Dynamic Header Sizes
  { tag: t.heading1, fontSize: '1.6em', fontWeight: '700' },
  { tag: t.heading2, fontSize: '1.4em', fontWeight: '700' },
  { tag: t.heading3, fontSize: '1.2em', fontWeight: '700' },
  { tag: t.heading4, fontSize: '1.1em', fontWeight: '700' },
  
  // Restore necessary MarkEdit/Prose styles that `xcode` theme might miss
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, textDecoration: 'underline' }
]);

const markdownStyling = syntaxHighlighting(markdownHighlightStyle);

// Exported theme extensions
export const lightThemeExtension: Extension = [
  xcodeLight,
  baseTheme,
  lightThemeVars,
  markdownStyling
];

export const darkThemeExtension: Extension = [
  xcodeDark,
  baseTheme,
  darkThemeVars,
  markdownStyling
];

export function getThemeExtension(theme: 'light' | 'dark'): Extension {
  return theme === 'dark' ? darkThemeExtension : lightThemeExtension;
}
