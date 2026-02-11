/**
 * Editor initialization and lifecycle.
 */

import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { createMarkdownExtensions } from "../extensions";
import { getThemeExtension } from "../ui/themes";
import { CommandPalette } from "../ui/command-palette";
import {
  createMermaidExtension,
  createMathExtension,
  createImageExtension,
  createSyntaxHidingExtension,
} from "../widgets";
import {
  notifyContentChanged,
  notifySelectionChanged,
  notifyFocus,
} from "../bridge";
import { debounce } from "../utils/debounce";
import {
  themeCompartment,
  styleCompartment,
  lineNumbersCompartment,
  lineWrappingCompartment,
  mermaidCompartment,
  syntaxHidingCompartment,
  imageCompartment,
  mathCompartment,
  updateConfig,
} from "./state";

let editorView: EditorView | null = null;
let commandPalette: CommandPalette | null = null;

// Debounced content change notification
const debouncedContentChange = debounce(
  (content: string) => notifyContentChanged(content),
  100
);

/**
 * Gets the current editor view instance.
 */
export function getEditorView(): EditorView | null {
  return editorView;
}

/**
 * Gets the command palette instance.
 */
export function getCommandPalette(): CommandPalette | null {
  return commandPalette;
}

/**
 * Initializes the CodeMirror editor.
 */
export function initEditor(
  container: HTMLElement,
  initialContent: string = "",
  theme: "light" | "dark" = "light"
): EditorView {
  const config = updateConfig({ theme });

  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      ...createMarkdownExtensions(),

      // Dynamic compartments
      themeCompartment.of(getThemeExtension(theme)),
      styleCompartment.of(
        EditorView.theme({
          "&": {
            fontSize: `${config.fontSize}px`,
            fontFamily: config.fontFamily || "monospace",
          },
          ".cm-line": {
            lineHeight: String(config.lineHeight),
          },
        })
      ),
      lineNumbersCompartment.of(config.showLineNumbers ? lineNumbers() : []),
      lineWrappingCompartment.of(
        config.wrapLines ? EditorView.lineWrapping : []
      ),
      mermaidCompartment.of(
        config.renderMermaid ? createMermaidExtension() : []
      ),
      syntaxHidingCompartment.of(
        config.hideSyntax ? createSyntaxHidingExtension() : []
      ),
      imageCompartment.of(config.renderImages ? createImageExtension() : []),
      mathCompartment.of(config.renderMath ? createMathExtension() : []),

      // Event listeners
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          debouncedContentChange(update.state.doc.toString());
        }
        if (update.selectionSet) {
          const { from, to } = update.state.selection.main;
          notifySelectionChanged(from, to);
        }
        if (update.focusChanged) {
          notifyFocus(update.view.hasFocus);
        }
        commandPalette?.handleUpdate(update);
      }),
    ],
  });

  editorView = new EditorView({
    state,
    parent: container,
  });

  commandPalette = new CommandPalette(editorView);
  commandPalette.setTheme(theme);

  return editorView;
}

/**
 * Destroys the editor instance.
 */
export function destroyEditor(): void {
  commandPalette?.destroy();
  commandPalette = null;

  editorView?.destroy();
  editorView = null;
}
