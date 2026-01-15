/**
 * Text formatting commands for Markdown.
 */

import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";

/**
 * Toggles bold formatting (**text**).
 */
export function toggleBold(view: EditorView) {
  const { state, dispatch } = view;
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to);

    if (text.startsWith("**") && text.endsWith("**") && text.length >= 4) {
      return {
        changes: { from: range.from, to: range.to, insert: text.slice(2, -2) },
        range: EditorSelection.range(range.from, range.to - 4),
      };
    }
    return {
      changes: { from: range.from, to: range.to, insert: `**${text}**` },
      range: EditorSelection.range(range.from, range.to + 4),
    };
  });
  dispatch(
    state.update(changes, {
      scrollIntoView: true,
      userEvent: "input.format.bold",
    })
  );
  return true;
}

/**
 * Toggles italic formatting (_text_).
 */
export function toggleItalic(view: EditorView) {
  const { state, dispatch } = view;
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to);

    if (text.startsWith("_") && text.endsWith("_") && text.length >= 2) {
      return {
        changes: { from: range.from, to: range.to, insert: text.slice(1, -1) },
        range: EditorSelection.range(range.from, range.to - 2),
      };
    }
    if (text.startsWith("*") && text.endsWith("*") && text.length >= 2) {
      return {
        changes: { from: range.from, to: range.to, insert: text.slice(1, -1) },
        range: EditorSelection.range(range.from, range.to - 2),
      };
    }
    return {
      changes: { from: range.from, to: range.to, insert: `_${text}_` },
      range: EditorSelection.range(range.from, range.to + 2),
    };
  });
  dispatch(
    state.update(changes, {
      scrollIntoView: true,
      userEvent: "input.format.italic",
    })
  );
  return true;
}

/**
 * Toggles a line prefix.
 */
function toggleLinePrefix(view: EditorView, pattern: RegExp, prefix: string) {
  const { state, dispatch } = view;

  const changes = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.head);
    const text = line.text;
    const match = text.match(pattern);

    if (match) {
      const delLen = match[0].length;
      return {
        changes: { from: line.from, to: line.from + delLen, insert: "" },
        range: EditorSelection.cursor(range.head - delLen),
      };
    }
    return {
      changes: { from: line.from, to: line.from, insert: prefix },
      range: EditorSelection.cursor(range.head + prefix.length),
    };
  });

  dispatch(
    state.update(changes, {
      scrollIntoView: true,
      userEvent: "input.format.list",
    })
  );
  return true;
}

/**
 * Toggles bullet list prefix.
 */
export function toggleList(view: EditorView) {
  return toggleLinePrefix(view, /^\s*[-*+]\s+/, "- ");
}

/**
 * Toggles numbered list prefix.
 */
export function toggleOrderedList(view: EditorView) {
  return toggleLinePrefix(view, /^\s*\d+\.\s+/, "1. ");
}

/**
 * Cycles through todo states: Text → [ ] → [x] → Text
 */
export function cycleTodo(view: EditorView) {
  const { state, dispatch } = view;

  const changes = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.head);
    const text = line.text;

    // Completed → Remove
    const completedMatch = text.match(/^\s*-\s*\[x\]\s?/i);
    if (completedMatch) {
      const len = completedMatch[0].length;
      return {
        changes: { from: line.from, to: line.from + len, insert: "" },
        range: EditorSelection.cursor(range.head - len),
      };
    }

    // Uncompleted → Completed
    const todoMatch = text.match(/^\s*-\s*\[ \]\s?/);
    if (todoMatch) {
      const len = todoMatch[0].length;
      const newPrefix = "- [x] ";
      const diff = newPrefix.length - len;
      const textStart = line.from + newPrefix.length;
      const newHead = Math.max(range.head + diff, textStart);
      return {
        changes: { from: line.from, to: line.from + len, insert: newPrefix },
        range: EditorSelection.cursor(newHead),
      };
    }

    // List → Todo
    const listMatch = text.match(/^\s*[-*+]\s+/);
    if (listMatch) {
      const len = listMatch[0].length;
      const newPrefix = "- [ ] ";
      const diff = newPrefix.length - len;
      return {
        changes: { from: line.from, to: line.from + len, insert: newPrefix },
        range: EditorSelection.cursor(range.head + diff),
      };
    }

    // Default → Todo
    const newPrefix = "- [ ] ";
    return {
      changes: { from: line.from, to: line.from, insert: newPrefix },
      range: EditorSelection.cursor(range.head + newPrefix.length),
    };
  });

  dispatch(
    state.update(changes, {
      scrollIntoView: true,
      userEvent: "input.format.todo",
    })
  );
  return true;
}
