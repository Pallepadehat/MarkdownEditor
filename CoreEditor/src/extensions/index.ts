/**
 * Extensions module for the Markdown editor.
 */

import { Extension } from "@codemirror/state";
import { createMarkdownLanguage } from "./markdown";
import { createMarkdownKeymap } from "./keymaps";
import { createAutocompletion, createBaseExtensions } from "./base";
import { stylingExtension } from "./styling";

export {
  toggleBold,
  toggleItalic,
  toggleList,
  toggleOrderedList,
  cycleTodo,
} from "./formatting";
export { mathCompletion } from "./calc";

/**
 * Creates the complete Markdown editor extensions bundle.
 *
 * Note: Widgets (mermaid, math, images, syntax hiding) are managed
 * dynamically via compartments in core/editor.ts.
 */
export function createMarkdownExtensions(): Extension[] {
  return [
    ...createBaseExtensions(),
    createMarkdownLanguage(),
    createMarkdownKeymap(),
    createAutocompletion(),
    stylingExtension,
  ];
}
