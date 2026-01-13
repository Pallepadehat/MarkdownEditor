/**
 * Slash Command Palette for Markdown Editor
 * Triggered by typing "/" at the start of a line or after whitespace
 */

import { 
  Completion,
  CompletionContext,
  CompletionResult,
  startCompletion
} from '@codemirror/autocomplete';
import { Extension, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

/**
 * Definition of a slash command.
 */
interface SlashCommand {
  /** Label displayed in the completion list. */
  label: string;
  /** Description or preview of the command. */
  detail: string;
  /** Optional keyboard shortcut to display. */
  shortcut?: string;
  /** Optional additional info (right-aligned). */
  info?: string;
  /** Section header for grouping. */
  section: string;
  /** Function to execute when the command is selected. */
  apply: (view: EditorView, completion: Completion, from: number, to: number) => void;
}

// All available slash commands
const slashCommands: SlashCommand[] = [
  // -- Text Formatting --
  {
    label: 'bold',
    detail: 'Make text bold',
    shortcut: '⌘B',
    section: 'Formatting',
    apply: (view, _, from, to) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      window.editorAPI?.toggleBold();
    }
  },
  {
    label: 'italic',
    detail: 'Make text italic',
    shortcut: '⌘I',
    section: 'Formatting',
    apply: (view, _, from, to) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      window.editorAPI?.toggleItalic();
    }
  },
  {
    label: 'strikethrough',
    detail: 'Strikethrough text',
    section: 'Formatting',
    apply: (view, _, from, to) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      window.editorAPI?.toggleStrikethrough();
    }
  },
  {
    label: 'code',
    detail: 'Inline code',
    shortcut: '⌘`',
    section: 'Formatting',
    apply: (view, _, from, to) => {
      view.dispatch({ changes: { from, to, insert: '' } });
      window.editorAPI?.toggleCode();
    }
  },

  // Headings
  {
    label: 'h1',
    detail: 'Heading 1',
    info: 'Large heading',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '# ' }
      });
    }
  },
  {
    label: 'h2',
    detail: 'Heading 2',
    info: 'Medium heading',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '## ' }
      });
    }
  },
  {
    label: 'h3',
    detail: 'Heading 3',
    info: 'Small heading',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '### ' }
      });
    }
  },
  {
    label: 'h4',
    detail: 'Heading 4',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '#### ' }
      });
    }
  },
  {
    label: 'h5',
    detail: 'Heading 5',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '##### ' }
      });
    }
  },
  {
    label: 'h6',
    detail: 'Heading 6',
    section: 'Headings',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '###### ' }
      });
    }
  },

  // Lists
  {
    label: 'bullet',
    detail: 'Bullet list',
    info: 'Unordered list item',
    section: 'Lists',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '- ' }
      });
    }
  },
  {
    label: 'numbered',
    detail: 'Numbered list',
    info: 'Ordered list item',
    section: 'Lists',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '1. ' }
      });
    }
  },
  {
    label: 'todo',
    detail: 'Task list',
    info: 'Checkbox item',
    section: 'Lists',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '- [ ] ' }
      });
    }
  },

  // Blocks
  {
    label: 'quote',
    detail: 'Blockquote',
    info: 'Quote text',
    section: 'Blocks',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '> ' }
      });
    }
  },
  {
    label: 'codeblock',
    detail: 'Code block',
    info: 'Fenced code block',
    section: 'Blocks',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '```\n\n```' },
        selection: { anchor: line.from + 4 }
      });
    }
  },
  {
    label: 'divider',
    detail: 'Horizontal rule',
    info: 'Separator line',
    section: 'Blocks',
    apply: (view, _, from, to) => {
      const line = view.state.doc.lineAt(from);
      view.dispatch({ 
        changes: { from: line.from, to, insert: '---\n' }
      });
    }
  },

  // Media & Links
  {
    label: 'link',
    detail: 'Insert link',
    shortcut: '⌘K',
    section: 'Media',
    apply: (view, _, from, to) => {
      view.dispatch({ 
        changes: { from, to, insert: '[](url)' },
        selection: { anchor: from + 1 }
      });
    }
  },
  {
    label: 'image',
    detail: 'Insert image',
    shortcut: '⌘⇧K',
    section: 'Media',
    apply: (view, _, from, to) => {
      view.dispatch({ 
        changes: { from, to, insert: '![alt text](url)' },
        selection: { anchor: from + 2, head: from + 10 }
      });
    }
  },
];

// Convert slash commands to completion items
function createCompletionItems(): Completion[] {
  return slashCommands.map(cmd => ({
    label: cmd.label,
    detail: cmd.shortcut ? `${cmd.detail}  ${cmd.shortcut}` : cmd.detail,
    info: cmd.info,
    section: cmd.section,
    type: 'keyword',
    apply: cmd.apply
  }));
}

/**
 * CodeMirror completion source for slash commands.
 * Triggered by typing "/" at the start of a line or after whitespace.
 */
export function slashCommandCompletion(context: CompletionContext): CompletionResult | null {
  // Look for "/" at the start of a line or after whitespace
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = context.state.sliceDoc(line.from, context.pos);
  
  // Check if we're in a slash command context
  const slashMatch = textBefore.match(/(?:^|\s)\/(\w*)$/);
  if (!slashMatch) return null;
  
  const matchStart = line.from + textBefore.lastIndexOf('/');
  const query = slashMatch[1].toLowerCase();
  
  // Filter commands based on query
  const items = createCompletionItems();
  const filtered = query 
    ? items.filter(item => item.label.toLowerCase().includes(query))
    : items;
  
  return {
    from: matchStart,
    to: context.pos,
    options: filtered,
    filter: false // We already filtered
  };
}

// Custom styling for the command palette
const commandPaletteTheme = EditorView.baseTheme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    border: '0.5px solid var(--border-color)', // Reverting to thinner border for elegance
    borderRadius: '12px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25), 0 0 0 0.5px rgba(255,255,255,0.1)', // Richer shadow
    backgroundColor: 'var(--tooltip-bg)',
    color: 'var(--text-color)',
    backdropFilter: 'blur(50px) saturate(190%)', // Maximum premium blur
    '-webkit-backdrop-filter': 'blur(50px) saturate(190%)',
    padding: '6px',
    maxHeight: '400px', // Allow it to be taller
    minWidth: '320px',
    animation: 'cm-tooltip-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1)', // Apple-style spring
    transform: 'translateY(6px)'
  },
  '@keyframes cm-tooltip-fade': {
    '0%': { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
    '100%': { opacity: '1', transform: 'translateY(6px) scale(1)' }
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
    fontSize: '13.5px', // Slightly larger font
    fontWeight: '400',
    maxHeight: '388px',
    gap: '2px',
    display: 'flex',
    flexDirection: 'column',
    listStyle: 'none',
    margin: '0',
    padding: '0'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '0 12px', // Horizontal padding
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'none',
    margin: '0',
    lineHeight: '36px', // Fixed height centering
    minHeight: '36px', // Taller, more premium touch target
    cursor: 'default'
  },
  '.cm-completionLabel': {
    fontWeight: '400',
    fontSize: '13.5px',
    flex: '0 0 auto',
    letterSpacing: '0.01em',
    lineHeight: '1' // clear line-height inheritance
  },
  '.cm-completionDetail': {
    color: 'var(--detail-color)',
    fontSize: '12px',
    marginLeft: '12px',
    flex: '1 1 auto',
    textAlign: 'right',
    opacity: '0.6',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: '400',
    letterSpacing: '0',
    lineHeight: '1'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionDetail': {
    color: 'rgba(255,255,255,0.85)',
    opacity: '1'
  },
  '.cm-completionMatchedText': {
    textDecoration: 'none',
    fontWeight: '600',
    color: 'var(--accent-color)' // Use accent color for matches in unselected items
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionMatchedText': {
    color: 'inherit' // White in selection
  },
  // Section headers
  '.cm-completionSection': {
    padding: '8px 4px 4px 4px', // Flush left (Minimal gap)
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--section-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginTop: '6px',
    marginBottom: '2px',
    borderTop: '1px solid var(--divider-color)',
    opacity: '0.8'
  },
  '.cm-completionSection:first-child': {
    marginTop: '0px',
    borderTop: 'none',
    paddingTop: '6px'
  },
  // Scrollbar styling
  '.cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar': {
    width: '10px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar-track': {
    background: 'transparent'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--scrollbar-thumb)',
    borderRadius: '10px',
    border: '3px solid transparent',
    backgroundClip: 'content-box'
  }
});

// Dark theme overrides
const commandPaletteDarkTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '--tooltip-bg': 'rgba(35, 35, 40, 0.72)',
    '--border-color': 'rgba(255,255,255,0.1)',
    '--text-color': '#ffffff',
    '--selection-bg': 'rgba(255, 255, 255, 0.1)', // Secondary/Neutral (Minimalist)
    '--selection-text': '#ffffff',
    '--detail-color': 'rgba(255, 255, 255, 0.55)',
    '--section-color': 'rgba(255, 255, 255, 0.5)',
    '--divider-color': 'rgba(84, 84, 88, 0.4)',
    '--accent-color': '#ffffff',
    '--scrollbar-thumb': 'rgba(255, 255, 255, 0.2)'
  }
}, { dark: true });


// Light theme overrides
const commandPaletteLightTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '--tooltip-bg': 'rgba(255, 255, 255, 0.72)',
    '--border-color': 'rgba(0,0,0,0.08)',
    '--text-color': '#000000',
    '--selection-bg': 'rgba(0, 0, 0, 0.05)', // Secondary/Neutral (Minimalist)
    '--selection-text': '#000000',
    '--detail-color': 'rgba(60, 60, 67, 0.55)',
    '--section-color': 'rgba(60, 60, 67, 0.5)',
    '--divider-color': 'rgba(60, 60, 67, 0.1)',
    '--accent-color': '#000000',
    '--scrollbar-thumb': 'rgba(0, 0, 0, 0.15)'
  }
}, { dark: false });

/**
 * Returns the themes for the command palette
 */
export function commandPaletteThemes(): Extension[] {
  return [
    commandPaletteTheme,
    commandPaletteLightTheme,
    commandPaletteDarkTheme
  ];
}

/**
 * Returns the keymap to trigger the command palette
 */
export function slashCommandKeymap(): Extension {
  return Prec.high(keymap.of([
    {
      key: '/',
      run: (view) => {
        const { from, to } = view.state.selection.main;
        if (from !== to) return false; // Don't trigger on selection replacement

        const line = view.state.doc.lineAt(from);
        const textBefore = view.state.sliceDoc(line.from, from);
        
        // Only trigger if at start of line or after whitespace
        if (textBefore.length === 0 || /\s$/.test(textBefore)) {
          // Insert the "/" and EXPLICITLY set selection to be after it
          view.dispatch({
            changes: { from, to: from, insert: '/' },
            selection: { anchor: from + 1 }, // Ensure cursor moves forward
            scrollIntoView: true
          });
          // Start completion after a small delay to let the "/" be inserted and rendered
          setTimeout(() => startCompletion(view), 20);
          return true;
        }
        return false;
      }
    }
  ]));
}

export { slashCommands };

