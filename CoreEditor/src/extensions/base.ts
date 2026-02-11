/**
 * Base CodeMirror extensions bundle.
 */

import { Extension } from "@codemirror/state";
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
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
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

import { mathCompletion } from "./calc";

/**
 * Creates autocompletion with math expression support.
 */
export function createAutocompletion(): Extension {
  return autocompletion({
    override: [mathCompletion],
    defaultKeymap: true,
    icons: false,
    closeOnBlur: true,
    optionClass: () => "cm-completion-item",
  });
}

/**
 * Creates the standard editor extensions bundle.
 */
export function createBaseExtensions(): Extension[] {
  return [
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
