/**
 * MarkdownEditor - CodeMirror 6 Entry Point
 *
 * This is the main entry point for the Markdown editor.
 * It initializes the editor and exposes the API to Swift.
 */

import { initEditor, getEditorView, getCommandPalette } from "./core/editor";
import { createEditorAPI } from "./core/api";
import { notifyReady } from "./bridge";

/**
 * Initialize the editor when the DOM is ready.
 */
function init(): void {
  const container = document.getElementById("editor");
  if (!container) {
    console.error("Editor container not found");
    return;
  }

  const initialContent = container.dataset.content || "";
  const initialTheme = (container.dataset.theme as "light" | "dark") || "light";

  // Initialize editor
  initEditor(container, initialContent, initialTheme);

  // Create and expose the API
  const editorAPI = createEditorAPI(getEditorView, getCommandPalette);
  window.editorAPI = editorAPI;

  // Notify Swift that the editor is ready
  notifyReady();
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
