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
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit'
  }
});

// Exported theme extensions
export const lightThemeExtension: Extension = [
  baseTheme,
  xcodeLight
];

export const darkThemeExtension: Extension = [
  baseTheme,
  xcodeDark
];

export function getThemeExtension(theme: 'light' | 'dark'): Extension {
  return theme === 'dark' ? darkThemeExtension : lightThemeExtension;
}
