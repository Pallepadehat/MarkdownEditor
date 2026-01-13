/**
 * Bridge module for Swift ↔ JavaScript communication
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

/**
 * Configuration options for the editor.
 */
export interface EditorConfig {
  /** Font size in pixels. */
  fontSize?: number;
  /** CSS font family string. */
  fontFamily?: string;
  /** Line height multiplier (e.g., 1.5). */
  lineHeight?: number;
  /** Whether to show line numbers in the gutter. */
  showLineNumbers?: boolean;
  /** Whether to wrap long lines. */
  wrapLines?: boolean;
  /** Color theme to use. */
  theme?: 'light' | 'dark';
}

/**
 * public API exposed to Swift.
 */
export interface EditorAPI {
  /** Get current Markdown content. */
  getContent: () => string;
  /** Set Markdown content. */
  setContent: (content: string) => void;
  
  /** Get current selection range. */
  getSelection: () => { from: number; to: number };
  /** Set selection range. */
  setSelection: (from: number, to: number) => void;
  
  /** Toggle bold formatting. */
  toggleBold: () => void;
  /** Toggle italic formatting. */
  toggleItalic: () => void;
  /** Toggle inline code formatting. */
  toggleCode: () => void;
  /** Toggle strikethrough formatting. */
  toggleStrikethrough: () => void;
  
  /** Insert a link at the cursor or wrapping selection. */
  insertLink: (url: string, title?: string) => void;
  /** Insert an image at the cursor. */
  insertImage: (url: string, alt?: string) => void;
  /** Insert a heading at the current line. */
  insertHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  /** Insert a blockquote at the current line. */
  insertBlockquote: () => void;
  /** Insert a code block. */
  insertCodeBlock: (language?: string) => void;
  /** Insert a list item (bullet or numbered). */
  insertList: (ordered: boolean) => void;
  /** Insert a horizontal rule. */
  insertHorizontalRule: () => void;
  
  /** Focus the editor. */
  focus: () => void;
  /** Blur the editor. */
  blur: () => void;
  /** Undo last change. */
  undo: () => void;
  /** Redo last undone change. */
  redo: () => void;
  
  /** Set the editor theme. */
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Configuration
  /** Set the font size. */
  setFontSize: (size: number) => void;
  /** Set the line height. */
  setLineHeight: (height: number) => void;
  /** Set the font family. */
  setFontFamily: (family: string) => void;
  /** Update multiple configuration options. */
  updateConfiguration: (config: EditorConfig) => void;
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

// Send message to Swift
/**
 * Send message to Swift via WebKit message handler.
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
 * Notify Swift that content has changed.
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
