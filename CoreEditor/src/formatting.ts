import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

/**
 * Toggles bold formatting for the current selection.
 * Surrounds with ** or removes if already present.
 */
export function toggleBold(view: EditorView) {
  const { state, dispatch } = view;
  const changes = state.changeByRange(range => {
    const text = state.sliceDoc(range.from, range.to);
    // simplistic check: if it starts and ends with **, remove them
    // rigorous check: unwrap if fully wrapped, wrap otherwise
    if (text.startsWith('**') && text.endsWith('**') && text.length >= 4) {
      return {
        changes: { from: range.from, to: range.to, insert: text.slice(2, -2) },
        range: EditorSelection.range(range.from, range.to - 4)
      };
    }
    return {
      changes: { from: range.from, to: range.to, insert: `**${text}**` },
      range: EditorSelection.range(range.from, range.to + 4)
    };
  });
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input.format.bold' }));
  return true;
}

/**
 * Toggles italic formatting for the current selection.
 * Surrounds with _ or removes if already present.
 */
export function toggleItalic(view: EditorView) {
  const { state, dispatch } = view;
  const changes = state.changeByRange(range => {
    const text = state.sliceDoc(range.from, range.to);
    if (text.startsWith('_') && text.endsWith('_') && text.length >= 2) {
      return {
        changes: { from: range.from, to: range.to, insert: text.slice(1, -1) },
        range: EditorSelection.range(range.from, range.to - 2)
      };
    }
    // Check for * as well
    if (text.startsWith('*') && text.endsWith('*') && text.length >= 2) {
       return {
        changes: { from: range.from, to: range.to, insert: text.slice(1, -1) },
        range: EditorSelection.range(range.from, range.to - 2)
      };
    }

    return {
      changes: { from: range.from, to: range.to, insert: `_${text}_` },
      range: EditorSelection.range(range.from, range.to + 2)
    };
  });
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input.format.italic' }));
  return true;
}

/**
 * Toggles a line prefix (Bullet -, Numbered 1., Todo - [ ])
 * This logic handles applying the prefix or removing it.
 *
 * It is smarter than simple replacement:
 * - If you select multiple lines, it applies to all.
 * - If line already has that prefix, it removes it.
 */
/**
 * Common logic to toggle a line prefix across all selected lines.
 * Uses changeByRange to properly update selections.
 */
function toggleLinePrefix(view: EditorView, pattern: RegExp, prefix: string) {
  const { state, dispatch } = view;
  
  const changes = state.changeByRange(range => {
      // Typically operate on the line of the head
      const line = state.doc.lineAt(range.head);
      const text = line.text;
      const match = text.match(pattern);
      
      if (match) {
          // Remove prefix
          const delLen = match[0].length;
          return {
              changes: { from: line.from, to: line.from + delLen, insert: '' },
              range: EditorSelection.cursor(range.head - delLen)
          };
      } else {
          // Add prefix
          return {
              changes: { from: line.from, to: line.from, insert: prefix },
              range: EditorSelection.cursor(range.head + prefix.length)
          };
      }
  });

  dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input.format.list' }));
  return true;
}

export function toggleList(view: EditorView) {
    return toggleLinePrefix(view, /^\s*[-*+]\s+/, '- ');
}

export function toggleOrderedList(view: EditorView) {
    return toggleLinePrefix(view, /^\s*\d+\.\s+/, '1. ');
}

/**
 * Cycle Todo: Text -> - [ ] -> - [x] -> Text
 */
export function cycleTodo(view: EditorView) {
    const { state, dispatch } = view;
    
    const changes = state.changeByRange(range => {
        const line = state.doc.lineAt(range.head);
        const text = line.text;
        
        // 1. Completed -> Remove
        const completedMatch = text.match(/^\s*-\s*\[x\]\s?/i);
        if (completedMatch) {
            const len = completedMatch[0].length;
            return {
                changes: { from: line.from, to: line.from + len, insert: '' },
                range: EditorSelection.cursor(range.head - len)
            };
        }

        // 2. Uncompleted -> Completed
        const todoMatch = text.match(/^\s*-\s*\[ \]\s?/);
        if (todoMatch) {
            const len = todoMatch[0].length;
            // Replace [ ] with [x] (keeping exact length assumption or detecting strictly)
            // match is "- [ ] " (6 chars) usually
            // We want "- [x] "
            // Ideally we check if we are *inside* the bracket.
            // But per request "ready to type", we should put cursor AFTER the bracket?
            // "Cursor is in front of it" -> [x] | Text
            // If my cursor was at `line.from + 6` (start of text), it stays there.
            // If my cursor was at `line.from + 3` (inside), we should move it to `line.from + 6`?
            
            // Let's replace the whole prefix to be safe
            const newPrefix = '- [x] ';
            
            // Calculate length difference
            const diff = newPrefix.length - len;
            
            // If cursor is BEFORE text start, move it to text start.
            // Text start is at `line.from + newPrefix.length`
            const textStart = line.from + newPrefix.length;
            const newHead = Math.max(range.head + diff, textStart); 
            
            return {
                changes: { from: line.from, to: line.from + len, insert: newPrefix },
                range: EditorSelection.cursor(newHead)
            };
        }

        // 3. List -> Todo
        const listMatch = text.match(/^\s*[-*+]\s+/);
        if (listMatch) {
             const len = listMatch[0].length;
             const newPrefix = '- [ ] ';
             // List usually "- ". Todo "- [ ] ". Length diff 4.
             // Cursor should shift by (new - old)
             const diff = newPrefix.length - len;
             return {
                 changes: { from: line.from, to: line.from + len, insert: newPrefix },
                 range: EditorSelection.cursor(range.head + diff)
             };
        }

        // 4. Default -> Todo
        const newPrefix = '- [ ] ';
        return {
            changes: { from: line.from, to: line.from, insert: newPrefix },
            range: EditorSelection.cursor(range.head + newPrefix.length)
        };
    });

    dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input.format.todo' }));
    return true;
}
