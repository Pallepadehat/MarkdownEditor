/**
 * KaTeX math rendering extension for CodeMirror 6
 *
 * Renders inline ($...$) and block ($$...$$) math formulas.
 * Features:
 * - Lazy loading of KaTeX library (~600KB)
 * - Widget caching
 * - Adjacent block formula grouping
 * - Shows source when cursor is within formula
 */

import { Extension, RangeSetBuilder, StateField } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import { createElement } from "../utils/dom";
import { getCachedWidget } from "./base";

// Lazy-loaded KaTeX
let katexPromise: Promise<typeof import("katex")> | null = null;
let katexInstance: typeof import("katex").default | null = null;
let currentTheme: "light" | "dark" = "light";

/**
 * Lazily loads KaTeX and its CSS.
 */
async function getKatex() {
  if (katexInstance) return katexInstance;

  if (!katexPromise) {
    katexPromise = import("katex");
  }

  const module = await katexPromise;
  katexInstance = module.default;
  return katexInstance;
}

/**
 * Updates the math rendering theme.
 */
export function setMathTheme(theme: "light" | "dark"): void {
  currentTheme = theme;
}

/**
 * Widget that renders math formulas.
 */
class MathWidget extends WidgetType {
  constructor(readonly codes: string[], readonly displayMode: boolean) {
    super();
  }

  eq(other: MathWidget) {
    return (
      JSON.stringify(this.codes) === JSON.stringify(other.codes) &&
      this.displayMode === other.displayMode
    );
  }

  toDOM() {
    const renderNode = (code: string) => {
      const span = createElement("span");
      span.className = "cm-math-widget";
      if (this.displayMode) {
        span.classList.add("cm-math-display");
      }
      // Apply theme class
      span.classList.add(
        currentTheme === "dark" ? "cm-math-dark" : "cm-math-light"
      );

      // Async render with KaTeX
      getKatex()
        .then((katex) => {
          try {
            katex.render(code, span, {
              displayMode: this.displayMode,
              throwOnError: false,
              output: "html",
            });
          } catch (e) {
            console.warn("KaTeX error:", e);
            span.textContent = code;
            span.classList.add("cm-math-error");
          }
        })
        .catch(() => {
          span.textContent = code;
        });

      return span;
    };

    // Block mode: resizable container
    if (this.displayMode) {
      const container = createElement("div");
      container.className = "cm-math-resize-container cm-widget-container";

      this.codes.forEach((code) => {
        container.appendChild(renderNode(code));
      });

      const resizeHandle = createElement("div");
      resizeHandle.className = "cm-math-resize-handle";
      resizeHandle.innerHTML = "⤡";
      container.appendChild(resizeHandle);

      // Horizontal resize only
      let startX = 0,
        startWidth = 0;

      const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        container.style.width = `${Math.max(100, startWidth + dx)}px`;
        container.style.maxWidth = "none";
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "default";
        container.classList.remove("resizing");
      };

      resizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startWidth = container.getBoundingClientRect().width;

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "ew-resize";
        container.classList.add("resizing");
      });

      (container as any)._cleanup = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      return container;
    }

    // Inline mode
    return renderNode(this.codes[0]);
  }

  destroy(dom: HTMLElement) {
    const cleanup = (dom as any)._cleanup;
    if (cleanup) cleanup();
  }

  ignoreEvent(event: Event) {
    return !!(event.target as HTMLElement).closest(".cm-math-resize-handle");
  }
}

/**
 * Creates a cached MathWidget.
 */
function createMathWidget(codes: string[], displayMode: boolean): MathWidget {
  const cacheKey = `math:${displayMode}:${codes.join("|||")}`;
  return getCachedWidget(cacheKey, () => new MathWidget(codes, displayMode));
}

/**
 * Checks if any selection overlaps with the given range.
 */
function isRangeSelected(
  selection: { from: number; to: number }[],
  from: number,
  to: number
): boolean {
  for (const range of selection) {
    if (range.from <= to && range.to >= from) {
      return true;
    }
  }
  return false;
}

const mathField = StateField.define<DecorationSet>({
  create(state) {
    return buildMathDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildMathDecorations(tr.state);
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

function buildMathDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const text = state.doc.toString();
  const selectionRanges = state.selection.ranges.map((r) => ({
    from: r.from,
    to: r.to,
  }));

  // Match block ($$...$$) and inline ($...$)
  const regex = /(\$\$[\s\S]*?\$\$)|(\$[^$\n]+?\$)/g;

  const matches: {
    from: number;
    to: number;
    code: string;
    isBlock: boolean;
  }[] = [];

  let match;
  while ((match = regex.exec(text))) {
    const fullMatch = match[0];
    const isBlock = fullMatch.startsWith("$$");
    const code = isBlock ? fullMatch.slice(2, -2) : fullMatch.slice(1, -1);
    matches.push({
      from: match.index,
      to: match.index + fullMatch.length,
      code,
      isBlock,
    });
  }

  // Group adjacent block formulas
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const codes = [current.code];
    let endTo = current.to;
    let nextIndex = i + 1;

    if (current.isBlock) {
      while (nextIndex < matches.length) {
        const next = matches[nextIndex];
        if (!next.isBlock) break;

        const textBetween = text.slice(endTo, next.from);
        if (!/^\s*$/.test(textBetween)) break;

        codes.push(next.code);
        endTo = next.to;
        nextIndex++;
      }
    }

    i = nextIndex - 1;

    if (isRangeSelected(selectionRanges, current.from, endTo)) {
      continue;
    }

    const widget = Decoration.replace({
      widget: createMathWidget(codes, current.isBlock),
      block: false,
    });

    builder.add(current.from, endTo, widget);
  }

  return builder.finish();
}

const mathStyles = EditorView.baseTheme({
  ".cm-math-widget": {
    cursor: "pointer",
    verticalAlign: "middle",
  },
  ".cm-math-resize-container": {
    position: "relative",
    display: "inline-block",
    width: "fit-content",
    minWidth: "150px",
    margin: "1em 1em 1em 0",
    verticalAlign: "top",
    padding: "0",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    background: "var(--code-block-bg)",
    boxSizing: "border-box",
  },
  ".cm-math-display": {
    display: "block",
    textAlign: "left",
    padding: "16px 24px",
    width: "100%",
    background: "transparent",
    margin: "0",
    boxShadow: "none",
    borderRadius: "0",
  },
  ".cm-math-resize-handle": {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    width: "16px",
    height: "16px",
    cursor: "ew-resize",
    color: "var(--mermaid-handle-color, #888)",
    opacity: "0",
    transition: "opacity 0.2s",
    borderRadius: "4px",
    fontSize: "12px",
    lineHeight: "16px",
    textAlign: "center",
    userSelect: "none",
    background: "rgba(0,0,0,0.05)",
  },
  ".cm-math-resize-container:hover .cm-math-resize-handle": {
    opacity: "1",
    background: "rgba(0,0,0,0.1)",
  },
  ".cm-math-error": {
    color: "red",
    border: "1px solid red",
  },
});

/**
 * Creates the math rendering extension.
 */
export function createMathExtension(): Extension {
  return [mathField, mathStyles];
}
