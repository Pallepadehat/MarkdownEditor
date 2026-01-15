/**
 * Editor API implementation.
 *
 * Provides the public API exposed to Swift via window.editorAPI.
 */

import { EditorView, lineNumbers } from "@codemirror/view";
import { undo, redo } from "@codemirror/commands";
import type { EditorAPI, EditorConfig } from "../bridge";
import { getThemeExtension } from "../ui/themes";
import {
  createMermaidExtension,
  createMathExtension,
  createImageExtension,
  createSyntaxHidingExtension,
  setMermaidTheme,
  setMathTheme,
} from "../widgets";
import { CommandPalette } from "../ui/command-palette";
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

/**
 * Creates the editor API implementation.
 */
export function createEditorAPI(
  getView: () => EditorView | null,
  getPalette: () => CommandPalette | null
): EditorAPI {
  /**
   * Wraps selection with markers.
   */
  function wrapSelection(prefix: string, suffix: string = prefix): void {
    const view = getView();
    if (!view) return;

    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);

    const beforeStart = Math.max(0, from - prefix.length);
    const afterEnd = Math.min(view.state.doc.length, to + suffix.length);
    const textBefore = view.state.sliceDoc(beforeStart, from);
    const textAfter = view.state.sliceDoc(to, afterEnd);

    if (textBefore === prefix && textAfter === suffix) {
      view.dispatch({
        changes: [
          { from: beforeStart, to: from, insert: "" },
          { from: to, to: afterEnd, insert: "" },
        ],
        selection: {
          anchor: beforeStart,
          head: beforeStart + selectedText.length,
        },
      });
    } else {
      const newText = prefix + selectedText + suffix;
      view.dispatch({
        changes: { from, to, insert: newText },
        selection: {
          anchor: from + prefix.length,
          head: from + prefix.length + selectedText.length,
        },
      });
    }
  }

  /**
   * Inserts text at cursor.
   */
  function insertText(text: string): void {
    const view = getView();
    if (!view) return;

    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
  }

  /**
   * Inserts text at line start.
   */
  function insertAtLineStart(prefix: string): void {
    const view = getView();
    if (!view) return;

    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);

    view.dispatch({
      changes: { from: line.from, to: line.from, insert: prefix },
      selection: { anchor: from + prefix.length },
    });
  }

  return {
    getContent(): string {
      return getView()?.state.doc.toString() ?? "";
    },

    setContent(content: string): void {
      const view = getView();
      if (!view) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    },

    insertText(text: string): void {
      insertText(text);
    },

    getSelection(): { from: number; to: number } {
      const view = getView();
      if (!view) return { from: 0, to: 0 };
      const { from, to } = view.state.selection.main;
      return { from, to };
    },

    setSelection(from: number, to: number): void {
      getView()?.dispatch({ selection: { anchor: from, head: to } });
    },

    toggleBold(): void {
      wrapSelection("**");
    },

    toggleItalic(): void {
      wrapSelection("*");
    },

    toggleCode(): void {
      wrapSelection("`");
    },

    toggleStrikethrough(): void {
      wrapSelection("~~");
    },

    insertLink(url: string, title?: string): void {
      const view = getView();
      if (!view) return;

      const { from, to } = view.state.selection.main;
      const selectedText = view.state.sliceDoc(from, to);
      const linkText = selectedText || title || "link text";
      const linkUrl = url || "https://";

      view.dispatch({
        changes: { from, to, insert: `[${linkText}](${linkUrl})` },
      });
    },

    insertImage(url: string, alt?: string): void {
      const view = getView();
      if (!view) return;

      const { from, to } = view.state.selection.main;
      const altText = alt || "image";
      const imageUrl = url || "";
      const text = `![${altText}](${imageUrl})`;

      const newPos = url ? from + text.length : from + 2 + altText.length + 2;

      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: newPos, head: newPos },
      });
    },

    insertHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
      insertAtLineStart("#".repeat(level) + " ");
    },

    insertBlockquote(): void {
      insertAtLineStart("> ");
    },

    insertCodeBlock(language?: string): void {
      const lang = language || "";
      insertText(`\`\`\`${lang}\n\n\`\`\``);
      const view = getView();
      if (view) {
        const { from } = view.state.selection.main;
        view.dispatch({ selection: { anchor: from - 4 } });
      }
    },

    insertList(ordered: boolean): void {
      insertAtLineStart(ordered ? "1. " : "- ");
    },

    insertHorizontalRule(): void {
      insertText("\n---\n");
    },

    focus(): void {
      getView()?.focus();
    },

    blur(): void {
      getView()?.contentDOM.blur();
    },

    undo(): void {
      const view = getView();
      if (view) undo(view);
    },

    redo(): void {
      const view = getView();
      if (view) redo(view);
    },

    updateConfiguration(config: EditorConfig): void {
      const view = getView();
      if (!view) return;

      const currentConfig = updateConfig(config);
      const effects = [];

      if (config.theme) {
        effects.push(
          themeCompartment.reconfigure(getThemeExtension(config.theme))
        );
        getPalette()?.setTheme(config.theme);
        setMermaidTheme(config.theme);
        setMathTheme(config.theme);
      }

      if (config.fontSize || config.fontFamily || config.lineHeight) {
        effects.push(
          styleCompartment.reconfigure(
            EditorView.theme({
              "&": {
                fontSize: `${currentConfig.fontSize}px`,
                fontFamily: currentConfig.fontFamily || "monospace",
              },
              ".cm-line": {
                lineHeight: String(currentConfig.lineHeight),
              },
            })
          )
        );
      }

      if (config.showLineNumbers !== undefined) {
        effects.push(
          lineNumbersCompartment.reconfigure(
            config.showLineNumbers ? lineNumbers() : []
          )
        );
      }

      if (config.wrapLines !== undefined) {
        effects.push(
          lineWrappingCompartment.reconfigure(
            config.wrapLines ? EditorView.lineWrapping : []
          )
        );
      }

      if (config.renderMermaid !== undefined) {
        effects.push(
          mermaidCompartment.reconfigure(
            config.renderMermaid ? createMermaidExtension() : []
          )
        );
      }

      if (config.hideSyntax !== undefined) {
        effects.push(
          syntaxHidingCompartment.reconfigure(
            config.hideSyntax ? createSyntaxHidingExtension() : []
          )
        );
      }

      if (config.renderImages !== undefined) {
        effects.push(
          imageCompartment.reconfigure(
            config.renderImages ? createImageExtension() : []
          )
        );
      }

      if (config.renderMath !== undefined) {
        effects.push(
          mathCompartment.reconfigure(
            config.renderMath ? createMathExtension() : []
          )
        );
      }

      if (effects.length > 0) {
        view.dispatch({ effects });
      }
    },

    setTheme(theme: "light" | "dark"): void {
      this.updateConfiguration({ theme });
    },

    setFontSize(size: number): void {
      this.updateConfiguration({ fontSize: size });
    },

    setLineHeight(height: number): void {
      this.updateConfiguration({ lineHeight: height });
    },

    setFontFamily(family: string): void {
      this.updateConfiguration({ fontFamily: family });
    },
  };
}
