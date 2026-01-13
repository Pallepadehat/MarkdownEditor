# MarkdownEditor

A premium, native-feeling Markdown editor component for iOS and macOS, powered by CodeMirror 6 and SwiftUI.

## Features

- **Native Aesthetics**: Designed to look and feel like a first-party tool, featuring an Xcode-inspired theme (`@uiw/codemirror-theme-xcode`).
- **Linear Syntax Hiding**: Markdown markers (like `**`, `#`) are hidden on inactive lines for a clean reading experience but reappear instantly when editing.
- **Premium Code Blocks**: Code blocks are styled with language badges and distinct backgrounds, supporting syntax highlighting for dozens of languages (Swift, TypeScript, PHP, etc.).
- **Typesafe Configuration**: Fully configurable from Swift via a typesafe API (fonts, line numbers, wrapping, themes).
- **Lightweight**: heavy code intelligence features have been removed to focus on a fast, distraction-free writing environment.

## Installation

### Swift Package Manager

Add `MarkdownEditor` to your project via Xcode or `Package.swift`.

## Usage

```swift
import MarkdownEditor
import SwiftUI

struct ContentView: View {
    @State private var text = "# Hello World"

    var body: some View {
        MarkdownEditor(text: $text)
            .fontSize(16)
            .theme(.light)
            .onAppear {
                // Editor ready
            }
    }
}
```

## Contributing

We welcome contributions! This project uses `bun` for the JavaScript core.

### Prerequisites

- [Bun](https://bun.sh)
- Xcode 15+

### Development

1.  Navigate to the core editor:
    ```bash
    cd CoreEditor
    ```
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  Build the editor bundle:
    ```bash
    bun run build
    ```
    The output is generated in `../Sources/MarkdownEditor/Resources/editor.js`.

## License

MIT
