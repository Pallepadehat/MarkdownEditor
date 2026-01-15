/**
 * CodeMirror 6 extensions for Markdown editing
 */

import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { GFM } from "@lezer/markdown";
import {
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { Extension, Prec } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
} from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";

import { stylingExtension } from "./styling";
import {
  toggleBold,
  toggleItalic,
  toggleList,
  toggleOrderedList,
  cycleTodo,
} from "./formatting";

/**
 * Create Markdown language support
 */
export function createMarkdownLanguage(): Extension {
  return markdown({
    codeLanguages: languages,
    extensions: [GFM],
  });
}

/**
 * Create formatting keybindings for Markdown
 */
export function createMarkdownKeymap(): Extension {
  const markdownKeys = keymap.of([
    // We'll wire these up to the actual commands via the API
    // We'll wire these up to the actual commands via the API or internal logic
    { key: "Mod-b", run: toggleBold },
    { key: "Mod-i", run: toggleItalic },
    {
      key: "Mod-`",
      run: () => {
        window.editorAPI?.toggleCode();
        return true;
      },
    },
    {
      key: "Mod-k",
      run: () => {
        window.editorAPI?.insertLink("");
        return true;
      },
    },
    {
      key: "Mod-Shift-k",
      run: () => {
        window.editorAPI?.insertImage("");
        return true;
      },
    },

    // New Shortcuts
    { key: "Ctrl-Mod-l", run: toggleList },
    { key: "Ctrl-Mod-o", run: toggleOrderedList },
    { key: "Ctrl-Mod-t", run: cycleTodo },
  ]);

  return Prec.high(markdownKeys);
}

/**
 * Create unified autocompletion with slash commands and code intelligence
 */
export function createAutocompletion(): Extension {
  return autocompletion({
    override: [],
    defaultKeymap: true,
    icons: false,
    closeOnBlur: true,
    optionClass: () => "cm-completion-item",
  });
}

/**
 * Standard editor extensions bundle
 */
export function createBaseExtensions(): Extension[] {
  return [
    // lineNumbers() is now managed dynamically in editor.ts
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
      indentWithTab,
    ]),
  ];
}

/**
 * Combined extensions for Markdown editor
 */
export function createMarkdownExtensions(): Extension[] {
  return [
    ...createBaseExtensions(),
    createMarkdownLanguage(),
    createMarkdownKeymap(),
    createAutocompletion(),
    // Mermaid and Syntax Hiding are now managed dynamically in editor.ts
    // createMermaidExtension(),
    // createSyntaxHidingExtension(),
    stylingExtension,
  ];
}
