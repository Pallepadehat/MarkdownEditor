/**
 * CodeMirror 6 extensions for Markdown editing
 * Includes language support, keybindings, and line wrapping
 */

import { markdown } from '@codemirror/lang-markdown';
import { 
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap
} from '@codemirror/language';
import { Extension, Prec } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';

/**
 * Create Markdown language support
 */
export function createMarkdownLanguage(): Extension {
  return markdown();
}

/**
 * Create formatting keybindings for Markdown
 */
export function createMarkdownKeymap(): Extension {
  const markdownKeys = keymap.of([
    // We'll wire these up to the actual commands via the API
    { key: 'Mod-b', run: () => { window.editorAPI?.toggleBold(); return true; } },
    { key: 'Mod-i', run: () => { window.editorAPI?.toggleItalic(); return true; } },
    { key: 'Mod-`', run: () => { window.editorAPI?.toggleCode(); return true; } },
    { key: 'Mod-k', run: () => { window.editorAPI?.insertLink(''); return true; } },
    { key: 'Mod-Shift-k', run: () => { window.editorAPI?.insertImage(''); return true; } }
  ]);
  
  return Prec.high(markdownKeys);
}

/**
 * Standard editor extensions bundle
 */
export function createBaseExtensions(): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    rectangularSelection(),
    crosshairCursor(),
    highlightSelectionMatches(),
    EditorView.lineWrapping,
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      indentWithTab
    ])
  ];
}

/**
 * Combined extensions for Markdown editor
 */
export function createMarkdownExtensions(): Extension[] {
  return [
    ...createBaseExtensions(),
    createMarkdownLanguage(),
    createMarkdownKeymap()
  ];
}
