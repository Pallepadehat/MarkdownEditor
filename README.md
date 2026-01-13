# MarkdownEditor

MarkdownEditor is a native-feeling Markdown editing component for macOS, built with SwiftUI and CodeMirror 6. It provides a premium editing experience with syntax highlighting, live formatting updates, and a comprehensive Swift API.

## Features

- **Native Aesthetics**: Designed to match the look and feel of macOS tools (Xcode-inspired theme).
- **Premium Code Blocks**: Code blocks feature language badges and distinct backgrounds with syntax highlighting for multiple languages.
- **Typesafe Configuration**: Configure fonts, line numbers, wrapping, and themes using a strictly typed Swift API.
- **Two-Way Binding**: Seamless integration with SwiftUI via `Binding<String>`.

## Installation

### Swift Package Manager

Add MarkdownEditor to your project by adding the package dependency in your `Package.swift` file or via Xcode settings.

```swift
dependencies: [
    .package(url: "https://github.com/your-username/MarkdownEditor.git", from: "1.0.0")
]
```

## Usage

### Basic Implementation

Import the module and use the `EditorWebView` in your SwiftUI view hierarchy.

```swift
import SwiftUI
import MarkdownEditor

struct ContentView: View {
    @State private var content = "# Hello World"

    var body: some View {
        EditorWebView(text: $content)
            .frame(minWidth: 400, minHeight: 300)
    }
}
```

### Configuration

You can customize the editor's appearance by passing an `EditorConfiguration` instance.

```swift
let config = EditorConfiguration(
    fontSize: 14,
    fontFamily: "Menlo",
    lineHeight: 1.5,
    showLineNumbers: true,
    wrapLines: true
)

EditorWebView(
    text: $content,
    configuration: config,
    onReady: {
        print("Editor is ready")
    }
)
```

### Programmatic Control

To interact with the editor programmatically (e.g., to insert text or change formatting), use the `EditorBridge` through the `EditorWebView.Coordinator`. However, looking at the current API, `EditorWebView` manages the bridge internally.

*Note: Future updates will expose the bridge more directly for advanced use cases.*

## Contributing

This project uses a hybrid architecture:
- **Core**: TypeScript used with CodeMirror 6.
- **Wrapper**: Swift used for the macOS/iOS integration.

### Prerequisites

- **Bun**: Used for managing JavaScript dependencies and building the core bundle.
  Install via `curl -fsSL https://bun.sh/install | bash`
- **Xcode 15+**: Required for Swift development.

### Development Workflow

1.  **Install JavaScript Dependencies**
    Navigate to the `CoreEditor` directory and install dependencies.
    ```bash
    cd CoreEditor
    bun install
    ```

2.  **Build Core Editor**
    Bundle the TypeScript code into a single JavaScript file.
    ```bash
    bun run build
    ```
    This command generates `Sources/MarkdownEditor/Resources/editor.js`.

3.  **Run Xcode**
    Open the project in Xcode to build and run the Swift package/tests.

### Project Structure

- `CoreEditor/`: TypeScript source code for the CodeMirror editor.
- `Sources/MarkdownEditor/`: Swift source code for the wrapper.
- `Sources/MarkdownEditor/Resources/`: Contains the compiled `editor.js` and `editor.html` template.

## License

This project is licensed under the MIT License.
