/**
 * Bridge type definitions for Swift ↔ JavaScript communication.
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
  theme?: "light" | "dark";
  /** Whether to render Mermaid diagrams. */
  renderMermaid?: boolean;
  /** Whether to hide Markdown syntax on inactive lines. */
  hideSyntax?: boolean;
  /** Whether to render images directly in the editor. */
  renderImages?: boolean;
  /** Whether to render math formulas. */
  renderMath?: boolean;
}

/**
 * Public API exposed to Swift via window.editorAPI.
 */
export interface EditorAPI {
  // Content
  getContent: () => string;
  setContent: (content: string) => void;
  insertText: (text: string) => void;

  // Selection
  getSelection: () => { from: number; to: number };
  setSelection: (from: number, to: number) => void;

  // Formatting
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleCode: () => void;
  toggleStrikethrough: () => void;

  // Insertion
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

  // Configuration
  setTheme: (theme: "light" | "dark") => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setFontFamily: (family: string) => void;
  updateConfiguration: (config: EditorConfig) => void;
}

/**
 * Message types sent to Swift.
 */
export type MessageType =
  | "contentChanged"
  | "selectionChanged"
  | "ready"
  | "focus"
  | "blur";

/**
 * Message payload structure.
 */
export interface EditorMessage {
  type: MessageType;
  payload?: unknown;
}
