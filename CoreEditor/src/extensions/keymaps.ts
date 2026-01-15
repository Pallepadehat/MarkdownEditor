/**
 * Keyboard shortcuts for the Markdown editor.
 */

import { Extension, Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import {
  toggleBold,
  toggleItalic,
  toggleList,
  toggleOrderedList,
  cycleTodo,
} from "./formatting";

/**
 * Creates keybindings for Markdown formatting.
 */
export function createMarkdownKeymap(): Extension {
  const markdownKeys = keymap.of([
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
    { key: "Ctrl-Mod-l", run: toggleList },
    { key: "Ctrl-Mod-o", run: toggleOrderedList },
    { key: "Ctrl-Mod-t", run: cycleTodo },
  ]);

  return Prec.high(markdownKeys);
}
