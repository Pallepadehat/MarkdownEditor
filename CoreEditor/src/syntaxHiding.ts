import { Extension, StateField, RangeSetBuilder } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

// Widget for showing language name (Premium Badge)
class LanguageBadge extends WidgetType {
  constructor(readonly label: string) { super() }
  
  toDOM() {
    const span = document.createElement("span");
    span.textContent = this.label || 'TEXT';
    span.className = "cm-language-badge";
    return span;
  }
}

// Decorations
const hideDecoration = Decoration.replace({
  class: 'cm-syntax-marker'
});

const codeBlockLineDecoration = Decoration.line({
  class: 'cm-codeblock-line'
});

const hideSyntaxField = StateField.define<DecorationSet>({
  create(_state) {
    return Decoration.none;
  },
  update(value, tr) {
    if (!tr.docChanged && !tr.selection) return value.map(tr.changes);

    const builder = new RangeSetBuilder<Decoration>();
    const selection = tr.state.selection.main;
    const cursorLine = tr.state.doc.lineAt(selection.from).number;
    
    // Collect and sort decorations to satisfy RangeSetBuilder requirements
    interface DecoSpec {
      from: number;
      to: number;
      value: Decoration;
    }
    const decos: DecoSpec[] = [];

    syntaxTree(tr.state).iterate({
      enter: (node) => {
        const nodeLine = tr.state.doc.lineAt(node.from).number;

        // 1. Handle Code Blocks (FencedCode)
        if (node.name === "FencedCode") {
          // Color background for all lines in the block
          const startLine = tr.state.doc.lineAt(node.from).number;
          const endLine = tr.state.doc.lineAt(node.to).number;
          
          for (let i = startLine; i <= endLine; i++) {
             const l = tr.state.doc.line(i);
             // Decoration.line ranges are length 0 at start of line
             decos.push({ from: l.from, to: l.from, value: codeBlockLineDecoration });
          }
        }

        // 2. Handle Code Markers (The ``` fence line)
        if (node.name === "CodeMark") {
          if (nodeLine !== cursorLine) {
             const lineText = tr.state.doc.line(nodeLine).text;
             if (lineText.trim().startsWith('```') || lineText.trim().startsWith('~~~')) {
                // Determine language label
                const lang = lineText.replace(/[`~]/g, '').trim();
                
                if (lang) {
                  decos.push({
                    from: node.from, 
                    to: node.to, 
                    value: Decoration.replace({ widget: new LanguageBadge(lang.toUpperCase()) })
                  });
                } else {
                   // Just hide pure closing/opening marks without content
                   decos.push({ from: node.from, to: node.to, value: hideDecoration });
                }
             }
          }
        } else if (node.name.includes('Formatting') || (node.name.includes('Mark') && node.name !== "CodeMark")) {
          // 3. Handle other Markdown syntax (Headers, lists, etc.)
           if (nodeLine !== cursorLine) {
             decos.push({ from: node.from, to: node.to, value: hideDecoration });
           }
        }
      }
    });

    // Sort to satisfy RangeSetBuilder requirements
    decos.sort((a, b) => a.from - b.from || a.to - b.to);
    
    for (const d of decos) {
      builder.add(d.from, d.to, d.value);
    }

    return builder.finish();
  },
  provide: (f) => EditorView.decorations.from(f)
});

// Structural CSS for badges
const hideSyntaxTheme = EditorView.baseTheme({
  '.cm-syntax-marker': { display: 'none' },
  '.cm-language-badge': {
    float: 'right',
    fontSize: '10px',
    color: 'var(--badge-color, #8e8e93)',
    textTransform: 'uppercase',
    padding: '2px 6px',
    border: '1px solid var(--badge-border, #d1d1d6)',
    borderRadius: '4px',
    margin: '4px',
    fontFamily: '-apple-system, system-ui, sans-serif',
    fontWeight: '600',
    backgroundColor: 'var(--badge-bg, transparent)'
  }
});

export function syntaxHiding(): Extension {
  return [hideSyntaxField, hideSyntaxTheme];
}
