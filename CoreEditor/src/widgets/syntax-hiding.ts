/**
 * Obsidian-style syntax hiding for CodeMirror 6
 *
 * Hides Markdown syntax markers on inactive lines for a cleaner editing experience.
 * Uses mark decorations with CSS hiding to avoid cursor issues.
 */

import { Extension, RangeSetBuilder, StateField } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import { createElement } from "../utils/dom";

/** Decoration that visually hides markers via CSS. */
const hideDecoration = Decoration.mark({ class: "cm-syntax-hidden" });

/** Widget for horizontal rule dividers. */
class DividerWidget extends WidgetType {
  toDOM() {
    const div = createElement("div");
    div.className = "cm-divider-widget";
    return div;
  }
  ignoreEvent() {
    return false;
  }
}

const dividerDecoration = Decoration.replace({
  widget: new DividerWidget(),
  block: false,
});

/** Node types to hide on inactive lines. */
const HIDEABLE_NODES = new Set([
  "HeaderMark",
  "EmphasisMark",
  "StrikethroughMark",
  "QuoteMark",
  "LinkMark",
  "ImageMark",
]);

/** Cache for active line checks. */
let activeLineCache: { state: EditorState; lines: Set<number> } | null = null;

/**
 * Gets the set of active line numbers, with caching.
 */
function getActiveLines(state: EditorState): Set<number> {
  if (activeLineCache && activeLineCache.state === state) {
    return activeLineCache.lines;
  }

  const lines = new Set<number>();
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let i = startLine; i <= endLine; i++) {
      lines.add(i);
    }
  }

  activeLineCache = { state, lines };
  return lines;
}

/**
 * Checks if a position is on an active line.
 */
function isPositionActive(state: EditorState, pos: number): boolean {
  const lineNumber = state.doc.lineAt(pos).number;
  return getActiveLines(state).has(lineNumber);
}

/**
 * Builds hiding decorations for inactive lines.
 */
function buildHidingDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  syntaxTree(state).iterate({
    enter: (node) => {
      const isHideable =
        HIDEABLE_NODES.has(node.name) ||
        node.name === "HorizontalRule" ||
        node.name === "CodeMark" ||
        node.name === "URL";

      if (!isHideable) return;

      // Skip active lines
      if (isPositionActive(state, node.from)) return;

      // Horizontal rules → divider widget
      if (node.name === "HorizontalRule") {
        builder.add(node.from, node.to, dividerDecoration);
        return;
      }

      // Only hide inline code backticks
      if (node.name === "CodeMark") {
        const parent = node.node.parent;
        if (parent && parent.name !== "InlineCode") return;
        builder.add(node.from, node.to, hideDecoration);
        return;
      }

      // Hide URL in links/images
      if (node.name === "URL") {
        const parent = node.node.parent;
        if (parent && (parent.name === "Link" || parent.name === "Image")) {
          builder.add(node.from, node.to, hideDecoration);
        }
        return;
      }

      // Standard hideable nodes
      if (HIDEABLE_NODES.has(node.name)) {
        builder.add(node.from, node.to, hideDecoration);
      }
    },
  });

  return builder.finish();
}

const syntaxHidingField = StateField.define<DecorationSet>({
  create(state) {
    return buildHidingDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildHidingDecorations(tr.state);
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const syntaxHidingStyles = EditorView.baseTheme({
  ".cm-syntax-hidden": {
    display: "inline-block",
    fontSize: "0",
    lineHeight: "0",
    width: "0",
    opacity: "0",
    overflow: "hidden",
    verticalAlign: "text-top",
  },
  ".cm-divider-widget": {
    height: "2px",
    background: "var(--divider-color, rgba(0,0,0,0.1))",
    margin: "1.5em 0",
    borderRadius: "1px",
    opacity: "0.8",
  },
});

const syntaxVarsLight = EditorView.theme(
  { "&": { "--divider-color": "rgba(0,0,0,0.1)" } },
  { dark: false }
);

const syntaxVarsDark = EditorView.theme(
  { "&": { "--divider-color": "rgba(255,255,255,0.15)" } },
  { dark: true }
);

/**
 * Creates the syntax hiding extension.
 */
export function createSyntaxHidingExtension(): Extension {
  return [
    syntaxHidingField,
    syntaxHidingStyles,
    syntaxVarsLight,
    syntaxVarsDark,
  ];
}
