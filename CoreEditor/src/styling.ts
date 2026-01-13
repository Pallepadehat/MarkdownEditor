
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

// Define the class used to hide markers
const hiddenMarkClass = Decoration.mark({ class: 'cm-formatting-hidden' });
// Define the class used for checkboxes
const checkboxMarkClass = Decoration.mark({ class: 'cm-formatting-task' });

/**
 * Extension to hide Markdown markers (like **, #, etc) when the line is not active.
 * Utilizes the syntax tree to identify standard formatting tags.
 */
export const hideMarksExtension = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.computeDecorations(view);
  }

  update(update: ViewUpdate) {
    // Recompute decorations on doc change or selection change (for active line handling)
    if (update.docChanged || update.selectionSet || update.viewportChanged) {
      this.decorations = this.computeDecorations(update.view);
    }
  }

  computeDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const { state } = view;
    const selection = state.selection.main;
    
    // Identify the currently active line(s) to EXCLUDE them from hiding
    // If the selection is a range, we might have multiple active lines.
    // Simplifying: if cursor is on the line, we show markers.
    const activeLines = new Set<number>();
    
    // If we have a single cursor
    if (selection.empty) {
      activeLines.add(state.doc.lineAt(selection.head).number);
    } else {
      // Range selection: mark all lines in range as active
      const startLine = state.doc.lineAt(selection.from).number;
      const endLine = state.doc.lineAt(selection.to).number;
      for (let i = startLine; i <= endLine; i++) {
        activeLines.add(i);
      }
    }

    for (const { from, to } of view.visibleRanges) {
      syntaxTree(state).iterate({
        from, to,
        enter: (node) => {
          // Identify nodes that are formatting markers.
          // Lezer-markdown emits specific tags for markers.
          // We look for 'formatting' prop or specific node names.
          // Common marker nodes: HeaderMark, QuoteMark, ListMark, EmphasisMark, etc.
          // Or nodes with names typically associated with markers.
          
          if (
            node.name === 'HeaderMark' ||
            node.name === 'QuoteMark' ||
            node.name === 'ListMark' ||
            node.name === 'EmphasisMark' ||
            node.name === 'TaskMarker' || 
            node.name === 'CodeMark' ||
            node.name === 'LinkMark'
          ) {
            const line = state.doc.lineAt(node.from);
            
            // If the line is NOT active, hide the marker
            if (!activeLines.has(line.number)) {
              if (node.name === 'TaskMarker') {
                 // For TaskMarker, we might want to style it differently instead of hiding it
                 // But per strict requirements: "hiding markers".
                 // However, the screenshot shows checkboxes being VISIBLE but styled.
                 // So we should NOT hide TaskMarker, but DECORATE it.
                 // We add a different decoration for TaskMarker to enable "Badge" styling.
                 builder.add(node.from, node.to, checkboxMarkClass);
              } else {
                 builder.add(node.from, node.to, hiddenMarkClass);
              }
            } else {
               // Even on active lines, we might want to style checkboxes?
               // MarkEdit likely keeps the text but styles it.
               if (node.name === 'TaskMarker') {
                 builder.add(node.from, node.to, checkboxMarkClass);
               }
            }
          }
        }
      });
    }

    return builder.finish();
  }
}, {
  decorations: v => v.decorations
});

/**
 * CSS for the hidden markers
 * We use opacity: 0 or display: none depending on preference.
 * Opacity 0 maintains character width (preventing layout shifts),
 * font-size: 0 collapses it. MarkEdit/Obsidian usually collapse.
 */
export const stylingExtension = EditorView.baseTheme({
  '.cm-formatting-hidden': {
    display: 'none' // Attempt to collapse completely
    // OR:
    // fontSize: '0.1px', opacity: 0, letterSpacing: '-1ch'
  },
  // If display: none causes issues with cursor navigation, we might need a Widget replacement logic instead.
  // For now, let's try a subtle approach that collapses visual space.
  
  // Specific fix for "TaskMarker" to ensure [ ] is visible? 
  // User wants styling of checkboxes, not hiding them necessarily.
  // We should be careful NOT to hide 'TaskMarker' if we want to style it as a checkbox,
  // UNLESS we are replacing it with a Widget.
  // Checkbox Styling
  '.cm-formatting-task': {
     fontFamily: 'monospace',
     display: 'inline-block',
     backgroundColor: 'var(--badge-bg, #eee)',
     color: 'var(--badge-color, #333)', // Text color for the [ ] or [x]
     borderRadius: '4px',
     padding: '0 2px',
     marginRight: '4px',
     fontSize: '0.9em',
     fontWeight: 'bold',
     lineHeight: '1.2',
     border: '1px solid var(--badge-border, #ddd)',
     boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
  }
});
