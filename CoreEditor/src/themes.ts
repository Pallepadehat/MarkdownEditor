/**
 * Theme definitions for light and dark modes
 * Uses CodeMirror 6 theming system with macOS system colors
 */

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Base theme settings shared between light and dark
const baseTheme = EditorView.baseTheme({
  '&': {
    height: '100%',
    fontSize: '15px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", Menlo, Monaco, monospace'
  },
  '.cm-content': {
    padding: '16px',
    caretColor: 'var(--caret-color)',
    fontFamily: 'inherit'
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--caret-color)',
    borderLeftWidth: '2px'
  },
  '.cm-line': {
    padding: '0 4px',
    lineHeight: '1.6'
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--selection-bg) !important'
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--selection-bg-focused) !important'
  },
  '.cm-gutters': {
    backgroundColor: 'var(--gutter-bg)',
    borderRight: '1px solid var(--border-color)',
    color: 'var(--gutter-color)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--active-line-gutter-bg)'
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--active-line-bg)'
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit'
  }
});

// Light theme highlight style
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: '700', fontSize: '1.6em', color: '#1a1a2e' },
  { tag: tags.heading2, fontWeight: '600', fontSize: '1.4em', color: '#1a1a2e' },
  { tag: tags.heading3, fontWeight: '600', fontSize: '1.2em', color: '#1a1a2e' },
  { tag: tags.heading4, fontWeight: '600', fontSize: '1.1em', color: '#1a1a2e' },
  { tag: tags.heading5, fontWeight: '600', color: '#1a1a2e' },
  { tag: tags.heading6, fontWeight: '600', color: '#4a4a5a' },
  { tag: tags.strong, fontWeight: '600', color: '#1a1a2e' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#2d3748' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#718096' },
  { tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
  { tag: tags.url, color: '#2563eb' },
  { tag: tags.monospace, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '3px', padding: '1px 4px', fontFamily: '"SF Mono", Menlo, monospace' },
  { tag: tags.quote, color: '#64748b', fontStyle: 'italic', borderLeft: '3px solid #e2e8f0', paddingLeft: '12px' },
  { tag: tags.list, color: '#6366f1' },
  { tag: tags.meta, color: '#94a3b8' },
  { tag: tags.processingInstruction, color: '#8b5cf6' },
  { tag: tags.comment, color: '#94a3b8', fontStyle: 'italic' }
]);

// Dark theme highlight style
const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: '700', fontSize: '1.6em', color: '#f1f5f9' },
  { tag: tags.heading2, fontWeight: '600', fontSize: '1.4em', color: '#f1f5f9' },
  { tag: tags.heading3, fontWeight: '600', fontSize: '1.2em', color: '#f1f5f9' },
  { tag: tags.heading4, fontWeight: '600', fontSize: '1.1em', color: '#f1f5f9' },
  { tag: tags.heading5, fontWeight: '600', color: '#f1f5f9' },
  { tag: tags.heading6, fontWeight: '600', color: '#cbd5e1' },
  { tag: tags.strong, fontWeight: '600', color: '#f8fafc' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#e2e8f0' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#64748b' },
  { tag: tags.link, color: '#60a5fa', textDecoration: 'underline' },
  { tag: tags.url, color: '#60a5fa' },
  { tag: tags.monospace, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', padding: '1px 4px', fontFamily: '"SF Mono", Menlo, monospace' },
  { tag: tags.quote, color: '#94a3b8', fontStyle: 'italic', borderLeft: '3px solid #334155', paddingLeft: '12px' },
  { tag: tags.list, color: '#818cf8' },
  { tag: tags.meta, color: '#64748b' },
  { tag: tags.processingInstruction, color: '#a78bfa' },
  { tag: tags.comment, color: '#64748b', fontStyle: 'italic' }
]);

// Light theme colors (CSS variables)
const lightTheme = EditorView.theme({
  '&': {
    '--caret-color': '#1a1a2e',
    '--selection-bg': 'rgba(59, 130, 246, 0.2)',
    '--selection-bg-focused': 'rgba(59, 130, 246, 0.3)',
    '--gutter-bg': '#fafafa',
    '--gutter-color': '#94a3b8',
    '--border-color': '#e2e8f0',
    '--active-line-bg': 'rgba(0, 0, 0, 0.03)',
    '--active-line-gutter-bg': 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#ffffff',
    color: '#1a1a2e'
  }
}, { dark: false });

// Dark theme colors (CSS variables)
const darkTheme = EditorView.theme({
  '&': {
    '--caret-color': '#f1f5f9',
    '--selection-bg': 'rgba(99, 102, 241, 0.3)',
    '--selection-bg-focused': 'rgba(99, 102, 241, 0.4)',
    '--gutter-bg': '#0f172a',
    '--gutter-color': '#475569',
    '--border-color': '#1e293b',
    '--active-line-bg': 'rgba(255, 255, 255, 0.03)',
    '--active-line-gutter-bg': 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#0f172a',
    color: '#e2e8f0'
  }
}, { dark: true });

// Exported theme extensions
export const lightThemeExtension: Extension = [
  baseTheme,
  lightTheme,
  syntaxHighlighting(lightHighlightStyle)
];

export const darkThemeExtension: Extension = [
  baseTheme,
  darkTheme,
  syntaxHighlighting(darkHighlightStyle)
];

export function getThemeExtension(theme: 'light' | 'dark'): Extension {
  return theme === 'dark' ? darkThemeExtension : lightThemeExtension;
}
