/**
 * Bridge module for Swift ↔ JavaScript communication
 * Uses WKWebView's webkit.messageHandlers for sending messages to Swift
 */

declare global {
  interface Window {
    webkit?: {
      messageHandlers: {
        editor: {
          postMessage: (message: unknown) => void;
        };
      };
    };
    // Exposed API for Swift to call
    editorAPI: EditorAPI;
  }
}

export interface EditorAPI {
  // Content management
  getContent: () => string;
  setContent: (content: string) => void;
  
  // Selection
  getSelection: () => { from: number; to: number };
  setSelection: (from: number, to: number) => void;
  
  // Formatting commands
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleCode: () => void;
  toggleStrikethrough: () => void;
  insertLink: (url: string, title?: string) => void;
  insertImage: (url: string, alt?: string) => void;
  insertHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  insertBlockquote: () => void;
  insertCodeBlock: (language?: string) => void;
  insertList: (ordered: boolean) => void;
  insertHorizontalRule: () => void;
  
  // Editor state
  focus: () => void;
  blur: () => void;
  undo: () => void;
  redo: () => void;
  
  // Theme
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Configuration
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setFontFamily: (family: string) => void;
}

export type MessageType = 
  | 'contentChanged'
  | 'selectionChanged'
  | 'ready'
  | 'focus'
  | 'blur';

export interface EditorMessage {
  type: MessageType;
  payload?: unknown;
}

/**
 * Send a message to Swift via WKWebView bridge
 */
export function postMessage(message: EditorMessage): void {
  if (window.webkit?.messageHandlers?.editor) {
    window.webkit.messageHandlers.editor.postMessage(message);
  } else {
    // Development fallback - log to console
    console.log('[Bridge]', message);
  }
}

/**
 * Notify Swift that content has changed
 */
export function notifyContentChanged(content: string): void {
  postMessage({
    type: 'contentChanged',
    payload: { content }
  });
}

/**
 * Notify Swift that selection has changed
 */
export function notifySelectionChanged(from: number, to: number): void {
  postMessage({
    type: 'selectionChanged',
    payload: { from, to }
  });
}

/**
 * Notify Swift that editor is ready
 */
export function notifyReady(): void {
  postMessage({ type: 'ready' });
}

/**
 * Notify Swift of focus change
 */
export function notifyFocus(focused: boolean): void {
  postMessage({ type: focused ? 'focus' : 'blur' });
}
