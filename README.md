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
│   │   └── extensions.ts       # Markdown language support
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
