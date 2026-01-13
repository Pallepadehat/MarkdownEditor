/**
 * Theme definitions for light and dark modes
 * Uses @uiw/codemirror-theme-xcode for authentic Xcode look and feel
 */

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { xcodeLight, xcodeDark } from '@uiw/codemirror-theme-xcode';

// Base theme settings for layout and typography
const baseTheme = EditorView.baseTheme({
  '&': {
    height: '100%',
    fontSize: '15px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", Menlo, Monaco, monospace'
  },
  '.cm-content': {
    padding: '16px',
    fontFamily: 'inherit'
  },
  '.cm-line': {
    padding: '0 4px',
    lineHeight: '1.8'
  },
  '.cm-codeblock-line': {
    backgroundColor: 'var(--code-block-bg)',
    paddingLeft: '12px' // Add some padding for the code content
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit'
  },
  // Gutter (Line Numbers) Styling
  '.cm-gutters': {
    backgroundColor: 'var(--gutter-bg, transparent)',
    borderRight: 'none',
    color: 'var(--gutter-color, #999)',
    fontFamily: 'inherit',
    lineHeight: '1.8' // Match line height of content
  },
  '.cm-gutterElement': {
    display: 'flex !important',
    alignItems: 'center',
    justifyContent: 'flex-end',
    fontSize: '0.85em',
    opacity: '0.6',
    transition: 'opacity 0.2s, color 0.2s',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent !important',
    color: 'var(--accent-color, #007aff)',
    opacity: '1',
    fontWeight: '600'
  }
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

// Exported theme extensions
export const lightThemeExtension: Extension = [
  baseTheme,
  xcodeLight,
  lightThemeVars
];

export const darkThemeExtension: Extension = [
  baseTheme,
  xcodeDark,
  darkThemeVars
];

export function getThemeExtension(theme: 'light' | 'dark'): Extension {
  return theme === 'dark' ? darkThemeExtension : lightThemeExtension;
}
