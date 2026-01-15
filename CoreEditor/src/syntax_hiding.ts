/**
 * Obsidian-style syntax hiding for CodeMirror 6
 * Hides markdown syntax on non-active lines for a cleaner editing experience.
 *
 * Uses Decoration.mark with a "hidden" class instead of Decoration.replace
 * to avoid cursor and layout issues ("tile" errors).
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

/**
 * Decoration that visually hides syntax markers.
 * We use a class that sets display: none or font-size: 0
 */
const hideDecoration = Decoration.mark({ class: "cm-syntax-hidden" });

/**
 * Widget for Horizontal Rules replacement.
 * We use Decoration.replace for this specific case as it's a block replacement.
 */
class DividerWidget extends WidgetType {
  toDOM() {
    const div = document.createElement("div");
    div.className = "cm-divider-widget";
    return div;
  }
  ignoreEvent() {
    return false;
  }
}

const dividerDecoration = Decoration.replace({
  widget: new DividerWidget(),
  block: false, // We replace the text '---', not the whole line block structure
});

/**
 * Syntax nodes to target
 */
const HIDEABLE_NODES = new Set([
  "HeaderMark", // #
  "EmphasisMark", // *, **, _, __
  "StrikethroughMark", // ~~
  "QuoteMark", // >
  "LinkMark", // [, ]
  "ImageMark", // !
  // "CodeMark" is handled specially
]);

/**
 * Helpers
 */
function isLineActive(
  state: EditorState,
  lineStart: number,
  lineEnd: number
): boolean {
  // Check if any selection range overlaps with this line
  for (const range of state.selection.ranges) {
    // If selection head is on this line
    if (range.head >= lineStart && range.head <= lineEnd) return true;
    // Or if selection spans across this line (though usually we care about cursor)
    if (range.from <= lineEnd && range.to >= lineStart) return true;
  }
  return false;
}

function buildHidingDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  // We'll traverse the tree and collect decorations
  // Then we must add them in sorted order to the builder

  // To avoid complexity with sorting, we can rely on the tree iteration order
  // which is usually depth-first, but we need strictly position-sorted for RangeSetBuilder.
  // The default tree iteration is usually safe if we process linearly.

  // However, simpler is to just check node by node.

  syntaxTree(state).iterate({
    enter: (node) => {
      // 1. Check if node is hideable
      const isHideable =
        HIDEABLE_NODES.has(node.name) ||
        node.name === "HorizontalRule" ||
        node.name === "CodeMark" ||
        node.name === "URL";

      if (!isHideable) return;

      // 2. Determine the line this node belongs to
      // We protect against out-of-bounds just in case
      let line;
      try {
        line = state.doc.lineAt(node.from);
      } catch (e) {
        return;
      }

      // 3. If line is active, DO NOT hide (unless it's something we always want to style special, but here we want "Live Preview" behavior)
      if (isLineActive(state, line.from, line.to)) {
        return;
      }

      // 4. Apply Decorations

      // Horizontal Rule: Replace '---' with divider
      if (node.name === "HorizontalRule") {
        builder.add(node.from, node.to, dividerDecoration);
        return;
      }

      // Inline Code Backticks (`): Only hide if parent is InlineCode (not FencedCode)
      if (node.name === "CodeMark") {
        const parent = node.node.parent;
        if (parent && parent.name !== "InlineCode") {
          return; // Don't hide fenced code block backticks
        }
        builder.add(node.from, node.to, hideDecoration);
        return;
      }

      // Link/Image URL: Hide the (url) part
      if (node.name === "URL") {
        const parent = node.node.parent;
        // Check if it's strictly a Link or Image structure [text](url)
        if (parent && (parent.name === "Link" || parent.name === "Image")) {
          // The URL node is inside the parens. Markdown parser structure varies.
          // Lezer-markdown: Link(LinkMark "[", LinkText "foo", LinkMark "](", URL "url", LinkMark ")")
          // We want to hide the surrounding LinkMarks for the URL too, or just the whole tail.
          // For simplicity in this iteration, let's just hide the URL node itself.
          // Ideally we hide `](url)` but those are separate nodes.
          // Let's just hide the URL content for now to be safe.
          // BETTER: Hide the characters covering the URL.
          // Actually, let's try to find the Covering range from previous sibling endpoint to next sibling?
          // Too complex for safe iteration. Let's just hide the URL text.
          builder.add(node.from, node.to, hideDecoration);

          // If we want to hide the parens `( )`, we'd need to target the LinkMarks around it.
          // That's harder without looking at siblings.
          return;
        }
        return;
      }

      // Standard Hideable Nodes
      if (HIDEABLE_NODES.has(node.name)) {
        builder.add(node.from, node.to, hideDecoration);
      }
    },
  });

  return builder.finish();
}

/**
 * StateField for decorations
 */
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

/**
 * CSS
 */
const syntaxHidingStyles = EditorView.baseTheme({
  ".cm-syntax-hidden": {
    display: "inline-block", // or inline
    fontSize: "0",
    lineHeight: "0", // collapses height
    width: "0", // collapses width
    opacity: "0",
    overflow: "hidden",
    verticalAlign: "text-top", // Alignment fix
    // Not using display: none because it can mess with cursor positioning sometimes,
    // but font-size: 0 is safer for "mark" decorations.
  },
  ".cm-divider-widget": {
    height: "1px",
    background: "var(--divider-color, #ccc)",
    margin: "12px 0",
    opacity: "0.5",
  },
});

const syntaxVars = EditorView.theme({
  "&": { "--divider-color": "#ccc" },
});

export function createSyntaxHidingExtension(): Extension {
  return [syntaxHidingField, syntaxHidingStyles, syntaxVars];
}
