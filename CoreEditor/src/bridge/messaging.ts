/**
 * Swift messaging functions for editor events.
 */

import type { EditorMessage } from "./types";

/**
 * Sends a message to Swift via WebKit message handler.
 * Falls back to console logging in development.
 */
export function postMessage(message: EditorMessage): void {
  if (window.webkit?.messageHandlers?.editor) {
    window.webkit.messageHandlers.editor.postMessage(message);
  } else {
    // Development fallback
    console.log("[Bridge]", message);
  }
}

/**
 * Notifies Swift that content has changed.
 */
export function notifyContentChanged(content: string): void {
  postMessage({
    type: "contentChanged",
    payload: { content },
  });
}

/**
 * Notifies Swift that selection has changed.
 */
export function notifySelectionChanged(from: number, to: number): void {
  postMessage({
    type: "selectionChanged",
    payload: { from, to },
  });
}

/**
 * Notifies Swift that the editor is ready.
 */
export function notifyReady(): void {
  postMessage({ type: "ready" });
}

/**
 * Notifies Swift of focus state change.
 */
export function notifyFocus(focused: boolean): void {
  postMessage({ type: focused ? "focus" : "blur" });
}
