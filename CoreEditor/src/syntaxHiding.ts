import { Extension, StateField, RangeSetBuilder } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

// Vi definerer dekorationen én gang for at spare hukommelse
const hideDecoration = Decoration.replace({
  class: 'cm-syntax-marker'
});

const hideSyntaxField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    // Opdater kun hvis dokumentet eller selection (markøren) ændrer sig
    if (!tr.docChanged && !tr.selection) return value.map(tr.changes);

    const builder = new RangeSetBuilder<Decoration>();
    const selection = tr.state.selection.main;
    const cursorLine = tr.state.doc.lineAt(selection.from).number;

    // Vi løber igennem det synlige træ for optimal performance
    syntaxTree(tr.state).iterate({
      enter: (node) => {
        // Vi leder efter "formatting" noder (Markdown syntax-tegn)
        if (node.name.includes('Mark') || node.name.includes('Formatting')) {
          const line = tr.state.doc.lineAt(node.from).number;
          
          // Skjul kun hvis det ikke er den aktive linje
          if (line !== cursorLine) {
            builder.add(node.from, node.to, hideDecoration);
          }
        }
      }
    });

    return builder.finish();
  },
  provide: (f) => EditorView.decorations.from(f)
});

// CSS forbliver stort set det samme
const hideSyntaxTheme = EditorView.baseTheme({
  '.cm-syntax-marker': { display: 'none' }
});

export function syntaxHiding(): Extension {
  return [hideSyntaxField, hideSyntaxTheme];
}
