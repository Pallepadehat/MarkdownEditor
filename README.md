# MarkdownEditor

A **CodeMirror 6-based Markdown editor** for macOS, packaged as a Swift Package. Built with native SwiftUI integration and bidirectional text binding.

[![Swift 6.0](https://img.shields.io/badge/Swift-6.0-orange.svg)](https://swift.org)
[![macOS 14+](https://img.shields.io/badge/macOS-14+-blue.svg)](https://developer.apple.com/macos/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- **Syntax Highlighting** — Headers, bold, italic, links, and code blocks
- **Auto Theme Switching** — Follows system light/dark mode
- **Keyboard Shortcuts** — Cmd+B, Cmd+I, Cmd+K, and more
- **Two-Way Binding** — SwiftUI `@Binding` integration
- **Fast & Lightweight** — CodeMirror 6 under the hood
- **Tested** — Unit tests included

## Installation

Add the package to your project using Swift Package Manager:

```swift
dependencies: [
    .package(path: "../MarkdownEditor")
]
```

Or in Xcode: **File → Add Package Dependencies** → Add local package.

## Quick Start

```swift
import SwiftUI
import MarkdownEditor

struct ContentView: View {
    @State private var markdown = "# Hello, World!"
    
    var body: some View {
        EditorWebView(text: $markdown)
    }
}
```

## API Reference

### EditorWebView

The main SwiftUI view for the editor.

```swift
EditorWebView(
    text: $markdown,                          // Required: Binding<String>
    configuration: .default,                  // Optional: EditorConfiguration
    onReady: { print("Editor ready!") }       // Optional: Callback
)
```

### EditorConfiguration

Customize the editor appearance:

```swift
let config = EditorConfiguration(
    fontSize: 16,
    fontFamily: "Menlo",
    lineHeight: 1.8,
    showLineNumbers: true
)
```

### Formatting Commands

Access the bridge for programmatic formatting:

```swift
// Via EditorBridge
let bridge = EditorBridge()
await bridge.toggleBold()        // **text**
await bridge.toggleItalic()      // *text*
await bridge.toggleCode()        // `text`
await bridge.insertLink(url: "https://example.com", title: "Example")
await bridge.insertHeading(level: 2)
await bridge.undo()
await bridge.redo()
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘B` | Toggle bold |
| `⌘I` | Toggle italic |
| `⌘K` | Insert link |
| `⌘⇧K` | Insert image |
| `⌘`` ` `` | Toggle inline code |
| `⌘Z` | Undo |
| `⌘⇧Z` | Redo |

### Slash Command Palette

Type `/` at the start of a line or after a space to open the command palette. Available commands:

| Command | Description |
|---------|-------------|
| `/bold` | Make text bold (⌘B) |
| `/italic` | Make text italic (⌘I) |
| `/code` | Inline code (⌘`) |
| `/h1`, `/h2`, `/h3` | Headings |
| `/bullet` | Bullet list |
| `/numbered` | Numbered list |
| `/todo` | Task list checkbox |
| `/quote` | Blockquote |
| `/codeblock` | Fenced code block |
| `/link` | Insert link (⌘K) |
| `/image` | Insert image (⌘⇧K) |
| `/table` | Insert 3x3 table |
| `/divider` | Horizontal rule |
| `/javascript`, `/typescript`, `/python`, `/swift`, etc. | Language-specific code blocks |

### Code Intelligence

Inside fenced code blocks, you get language-specific autocompletion:

- **JavaScript/TypeScript**: Keywords, built-in objects, snippets (`fn`, `arrow`, `ifc`, `forc`, etc.)
- **Python**: Keywords, built-in functions, snippets (`defn`, `classc`, `ifc`, etc.)
- **Swift**: Keywords, types, SwiftUI helpers (`func`, `guardc`, `iflet`, `@state`, etc.)
- **HTML/CSS**: Elements, properties, common patterns
- **Bash**: Shell keywords and commands

Press `Tab` to expand snippets with placeholders.


## Development

### Build JavaScript Bundle

```bash
cd CoreEditor
bun install
bun run build
```

### Build Swift Package

```bash
swift build
```

### Run Tests

```bash
swift test
```

## Project Structure

```
MarkdownEditor/
├── Package.swift
├── CoreEditor/                 # TypeScript source
│   ├── src/
│   │   ├── editor.ts           # Main entry point
│   │   ├── bridge.ts           # Swift ↔ JS communication
│   │   ├── themes.ts           # Light/dark themes
│   │   ├── extensions.ts       # Markdown language support
│   │   ├── commands.ts         # Slash command palette
│   │   └── codeIntelligence.ts # Code block autocompletion
│   ├── index.html              # Dev server entry
│   └── package.json
├── Sources/MarkdownEditor/
│   ├── EditorWebView.swift     # NSViewRepresentable wrapper
│   ├── EditorBridge.swift      # WKWebView bridge
│   └── Resources/
│       ├── editor.html
│       └── editor.js           # Bundled output
└── Tests/
    └── MarkdownEditorTests/
```

## Requirements

- macOS 14.0+
- Swift 6.0+
- Xcode 16+

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ using [CodeMirror 6](https://codemirror.net/).
