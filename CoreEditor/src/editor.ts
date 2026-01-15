/**
 * Main editor entry point
 * Initializes CodeMirror 6 and exposes API to Swift
 */

import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { undo, redo } from "@codemirror/commands";
import { createMarkdownExtensions } from "./extensions";
import { getThemeExtension } from "./themes";
import {
  EditorAPI,
  notifyContentChanged,
  notifySelectionChanged,
  notifyReady,
  notifyFocus,
} from "./bridge";
import { CommandPalette } from "./command_palette";
import { setMermaidTheme } from "./mermaid";

// Compartments for dynamic reconfiguration
const themeCompartment = new Compartment();
const styleCompartment = new Compartment();
const lineNumbersCompartment = new Compartment();
const lineWrappingCompartment = new Compartment();

let editorView: EditorView | null = null;

// Debounce content change notifications to avoid flooding the bridge
let contentChangeTimeout: ReturnType<typeof setTimeout> | null = null;

function debounceContentChange(content: string): void {
  if (contentChangeTimeout) {
    clearTimeout(contentChangeTimeout);
  }
  contentChangeTimeout = setTimeout(() => {
    notifyContentChanged(content);
    contentChangeTimeout = null;
  }, 100);
}

/** Global Command Palette instance */
let commandPalette: CommandPalette | null = null;

/**
 * Initialize the editor
 */
let currentConfig: import("./bridge").EditorConfig = {
  theme: "light",
  fontSize: 15,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Mono", Menlo, Monaco, monospace',
  lineHeight: 1.8,
  showLineNumbers: true,
  wrapLines: true,
};

/**
 * Initialize the editor.
 *
 * @param container - The DOM element to append the editor to.
 * @param initialContent - The initial Markdown content (default: empty).
 * @param theme - The initial color theme ('light' or 'dark').
 * @returns The created EditorView instance.
 */
function initEditor(
  container: HTMLElement,
  initialContent: string = "",
  theme: "light" | "dark" = "light"
): EditorView {
  currentConfig.theme = theme;

  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      ...createMarkdownExtensions(),
      themeCompartment.of(getThemeExtension(theme)),
      styleCompartment.of(
        EditorView.theme({
          "&": {
            fontSize: `${currentConfig.fontSize}px`,
            fontFamily: currentConfig.fontFamily || "monospace",
          },
          ".cm-line": {
            lineHeight: String(currentConfig.lineHeight),
          },
        })
      ),
      lineNumbersCompartment.of(
        currentConfig.showLineNumbers ? lineNumbers() : []
      ),
      lineWrappingCompartment.of(
        currentConfig.wrapLines ? EditorView.lineWrapping : []
      ),

      // Content change listener
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          debounceContentChange(update.state.doc.toString());
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
 * Wrap selection with markers (e.g., **bold**, *italic*).
 * If the selection is already wrapped, unwraps it.
 *
 * @param prefix - The starting marker.
 * @param suffix - The ending marker (defaults to prefix).
 */
function wrapSelection(prefix: string, suffix: string = prefix): void {
  if (!editorView) return;

  const { from, to } = editorView.state.selection.main;
  const selectedText = editorView.state.sliceDoc(from, to);

  // Check if already wrapped - if so, unwrap
  const beforeStart = Math.max(0, from - prefix.length);
  const afterEnd = Math.min(editorView.state.doc.length, to + suffix.length);
  const textBefore = editorView.state.sliceDoc(beforeStart, from);
  const textAfter = editorView.state.sliceDoc(to, afterEnd);

  if (textBefore === prefix && textAfter === suffix) {
    // Unwrap
    editorView.dispatch({
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
    // Wrap
    const newText = prefix + selectedText + suffix;
    editorView.dispatch({
      changes: { from, to, insert: newText },
      selection: {
        anchor: from + prefix.length,
        head: from + prefix.length + selectedText.length,
      },
    });
  }
}

/**
 * Insert text at cursor or replace selection.
 *
 * @param text - The text to insert.
 */
function insertText(text: string): void {
  if (!editorView) return;

  const { from, to } = editorView.state.selection.main;
  editorView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
}

/**
 * Insert text at the start of the current line (e.g., for lists or blockquotes).
 *
 * @param prefix - The text to insert at the beginning of the line.
 */
function insertAtLineStart(prefix: string): void {
  if (!editorView) return;

  const { from } = editorView.state.selection.main;
  const line = editorView.state.doc.lineAt(from);

  editorView.dispatch({
    changes: { from: line.from, to: line.from, insert: prefix },
    selection: { anchor: from + prefix.length },
  });
}

/**
 * Editor API exposed to Swift
 */
const editorAPI: EditorAPI = {
  getContent(): string {
    return editorView?.state.doc.toString() ?? "";
  },

  setContent(content: string): void {
    if (!editorView) return;

    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: content },
    });
  },

  getSelection(): { from: number; to: number } {
    if (!editorView) return { from: 0, to: 0 };
    const { from, to } = editorView.state.selection.main;
    return { from, to };
  },

  setSelection(from: number, to: number): void {
    if (!editorView) return;
    editorView.dispatch({ selection: { anchor: from, head: to } });
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
    if (!editorView) return;

    const { from, to } = editorView.state.selection.main;
    const selectedText = editorView.state.sliceDoc(from, to);
    const linkText = selectedText || title || "link text";
    const linkUrl = url || "https://";

    editorView.dispatch({
      changes: { from, to, insert: `[${linkText}](${linkUrl})` },
    });
  },

  insertImage(url: string, alt?: string): void {
    if (!editorView) return;

    const { from, to } = editorView.state.selection.main;
    const altText = alt || "image";
    const imageUrl = url || "https://";

    editorView.dispatch({
      changes: { from, to, insert: `![${altText}](${imageUrl})` },
    });
  },

  insertHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
    const prefix = "#".repeat(level) + " ";
    insertAtLineStart(prefix);
  },

  insertBlockquote(): void {
    insertAtLineStart("> ");
  },

  insertCodeBlock(language?: string): void {
    const lang = language || "";
    insertText(`\`\`\`${lang}\n\n\`\`\``);
    // Move cursor into the code block
    if (editorView) {
      const { from } = editorView.state.selection.main;
      editorView.dispatch({
        selection: { anchor: from - 4 },
      });
    }
  },

  insertList(ordered: boolean): void {
    insertAtLineStart(ordered ? "1. " : "- ");
  },

  insertHorizontalRule(): void {
    insertText("\n---\n");
  },

  focus(): void {
    editorView?.focus();
  },

  blur(): void {
    editorView?.contentDOM.blur();
  },

  undo(): void {
    if (editorView) undo(editorView);
  },

  redo(): void {
    if (editorView) redo(editorView);
  },

  updateConfiguration(config: import("./bridge").EditorConfig): void {
    if (!editorView) return;

    // Merge config
    currentConfig = { ...currentConfig, ...config };

    const effects = [];

    // Theme
    if (config.theme) {
      effects.push(
        themeCompartment.reconfigure(getThemeExtension(config.theme))
      );
      commandPalette?.setTheme(config.theme);
      setMermaidTheme(config.theme);
    }

    // Styles (Font size, family, line height)
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

    // Line Numbers
    if (config.showLineNumbers !== undefined) {
      effects.push(
        lineNumbersCompartment.reconfigure(
          config.showLineNumbers ? lineNumbers() : []
        )
      );
    }

    // Line Wrapping
    if (config.wrapLines !== undefined) {
      effects.push(
        lineWrappingCompartment.reconfigure(
          config.wrapLines ? EditorView.lineWrapping : []
        )
      );
    }

    if (effects.length > 0) {
      editorView.dispatch({ effects });
    }
  },

  // Legacy support - map to updateConfiguration
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

// Expose API globally
window.editorAPI = editorAPI;

// Initialize when DOM is ready
function init(): void {
  const container = document.getElementById("editor");
  if (!container) {
    console.error("Editor container not found");
    return;
  }

  // Get initial config from data attributes
  const initialContent = container.dataset.content || "";
  const initialTheme = (container.dataset.theme as "light" | "dark") || "light";

  initEditor(container, initialContent, initialTheme);
  notifyReady();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
