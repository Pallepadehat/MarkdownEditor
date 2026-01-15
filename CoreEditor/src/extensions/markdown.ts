/**
 * Markdown language support for CodeMirror 6.
 */

import { Extension } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { GFM } from "@lezer/markdown";

/**
 * Creates the Markdown language extension with GFM support.
 */
export function createMarkdownLanguage(): Extension {
  return markdown({
    codeLanguages: languages,
    extensions: [GFM],
  });
}
