/**
 * Bridge module for Swift ↔ JavaScript communication.
 */

export type {
  EditorConfig,
  EditorAPI,
  MessageType,
  EditorMessage,
} from "./types";
export {
  postMessage,
  notifyContentChanged,
  notifySelectionChanged,
  notifyReady,
  notifyFocus,
} from "./messaging";
