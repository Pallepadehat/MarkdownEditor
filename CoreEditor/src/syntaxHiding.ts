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

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) { super() }
  
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-checkbox " + (this.checked ? "cm-checkbox-checked" : "");
    span.innerHTML = this.checked ? 
      '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" fill="currentColor"/></svg>' 
      : '';
    return span;
  }
}

class HorizontalRuleWidget extends WidgetType {
  toDOM() {
    const div = document.createElement("div");
    div.className = "cm-hr";
    return div;
  }
}

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.textContent = "•";
    span.className = "cm-bullet";
    return span;
  }
}

// Decorations
const hideDecoration = Decoration.replace({
  class: 'cm-syntax-marker'
});

const codeBlockTopDecoration = Decoration.line({ class: 'cm-codeblock-line cm-codeblock-top' });
const codeBlockBottomDecoration = Decoration.line({ class: 'cm-codeblock-line cm-codeblock-bottom' });
const codeBlockMiddleDecoration = Decoration.line({ class: 'cm-codeblock-line cm-codeblock-middle' });
const codeBlockSingleDecoration = Decoration.line({ class: 'cm-codeblock-line cm-codeblock-single' });

const headingDecorations = [
  Decoration.line({ class: 'cm-line-h1' }),
  Decoration.line({ class: 'cm-line-h2' }),
  Decoration.line({ class: 'cm-line-h3' }),
  Decoration.line({ class: 'cm-line-h4' }),
  Decoration.line({ class: 'cm-line-h5' }),
  Decoration.line({ class: 'cm-line-h6' }),
];

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
          const isSingleLine = startLine === endLine;

          for (let i = startLine; i <= endLine; i++) {
             const l = tr.state.doc.line(i);
             let value = codeBlockMiddleDecoration;
             if (isSingleLine) value = codeBlockSingleDecoration;
             else if (i === startLine) value = codeBlockTopDecoration;
             else if (i === endLine) value = codeBlockBottomDecoration;

             // Decoration.line ranges are length 0 at start of line
             decos.push({ from: l.from, to: l.from, value });
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
        } else if (node.name === 'TaskMarker') {
          // Rounded Checkboxes
          if (nodeLine !== cursorLine) {
            const text = tr.state.sliceDoc(node.from, node.to);
            const checked = text.includes('x') || text.includes('X');
            decos.push({
              from: node.from,
              to: node.to,
              value: Decoration.replace({ widget: new CheckboxWidget(checked) })
            });
          }
        } else if (node.name === 'HorizontalRule') {
          // Styled HR
          if (nodeLine !== cursorLine) {
            decos.push({
               from: node.from,
               to: node.to,
               value: Decoration.replace({ widget: new HorizontalRuleWidget() })
            });
          }
        } else if (node.name === 'ListMark') {
          // List Markers: Don't hide numbers! Replace bullets with nice dots.
          if (nodeLine !== cursorLine) {
            const text = tr.state.sliceDoc(node.from, node.to);
            if (/^\d+[.)]/.test(text)) {
               // It's a number, don't hide it!
            } else if (['-', '*', '+'].includes(text.trim())) {
               // It's a bullet, replace with nice bullet
               decos.push({
                 from: node.from,
                 to: node.to,
                 value: Decoration.replace({ widget: new BulletWidget() })
               });
            } else {
               // Some other marker? Hide it.
               decos.push({ from: node.from, to: node.to, value: hideDecoration });
            }
          }
        } else if (node.name === 'HeaderMark') {
           // Headers: Hide hash symbols
           if (nodeLine !== cursorLine) {
             decos.push({ from: node.from, to: node.to, value: hideDecoration });
           }
        } else if (node.name.includes('ATXHeading') || node.name.includes('SetextHeading')) {
           // Heading Line Styling
           const level = parseInt(node.name.slice(-1));
           if (!isNaN(level) && level >= 1 && level <= 6) {
             const startLine = tr.state.doc.lineAt(node.from).number;
             const endLine = tr.state.doc.lineAt(node.to).number;
             for (let i = startLine; i <= endLine; i++) {
               const l = tr.state.doc.line(i);
               decos.push({ from: l.from, to: l.from, value: headingDecorations[level - 1] });
             }
           }
        } else if (['QuoteMark', 'EmphasisMark', 'StrongEmphasisMark', 'LinkMark'].includes(node.name)) {
          // Other syntax: Hide
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
    margin: '6px 4px 0 0',
    fontFamily: '"SF Mono", Menlo, Monaco, monospace',
    fontWeight: '600',
    backgroundColor: 'var(--badge-bg, transparent)',
    zIndex: '2',
    position: 'relative'
  },
  '.cm-codeblock-line': {
    paddingLeft: '6px',
    paddingRight: '6px'
  },
  '.cm-codeblock-top': {
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    marginTop: '8px',
    paddingTop: '6px'
  },
  '.cm-codeblock-bottom': {
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    marginBottom: '8px',
    paddingBottom: '6px'
  },
  '.cm-codeblock-single': {
    borderRadius: '8px',
    marginTop: '8px',
    marginBottom: '8px',
    paddingTop: '6px',
    paddingBottom: '6px'
  },
  '.cm-checkbox': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '1px solid var(--badge-border, #d1d1d6)',
    marginRight: '8px',
    verticalAlign: 'middle',
    cursor: 'pointer',
    backgroundColor: 'var(--badge-bg, transparent)'
  },
  '.cm-checkbox-checked': {
    backgroundColor: 'var(--accent-color, #007aff)',
    borderColor: 'var(--accent-color, #007aff)',
    color: '#ffffff'
  },
  '.cm-hr': {
    height: '1px',
    backgroundColor: 'var(--badge-border, #d1d1d6)',
    margin: '16px 0',
    width: '100%',
    opacity: '0.6'
  },
  '.cm-bullet': {
    color: 'var(--badge-color, #8e8e93)',
    fontWeight: 'bold',
    marginRight: '4px'
  },
  '.cm-line-h1': { fontSize: '2em', fontWeight: 'bold', lineHeight: '1.4', marginTop: '0.5em', marginBottom: '0.25em' },
  '.cm-line-h2': { fontSize: '1.5em', fontWeight: 'bold', lineHeight: '1.4', marginTop: '0.4em' },
  '.cm-line-h3': { fontSize: '1.25em', fontWeight: 'bold', lineHeight: '1.4' },
  '.cm-line-h4': { fontSize: '1.1em', fontWeight: 'bold', lineHeight: '1.4' },
  '.cm-line-h5': { fontSize: '1em', fontWeight: 'bold', color: 'var(--badge-color, #8e8e93)' },
  '.cm-line-h6': { fontSize: '0.9em', fontWeight: 'bold', color: 'var(--badge-color, #8e8e93)', textTransform: 'uppercase' }
});

export function syntaxHiding(): Extension {
  return [hideSyntaxField, hideSyntaxTheme];
}
