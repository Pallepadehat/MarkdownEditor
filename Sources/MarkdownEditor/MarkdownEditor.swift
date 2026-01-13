// MarkdownEditor
// A CodeMirror 6-based Markdown editor for macOS
//
// Copyright (c) 2026 Patrick Jakobsen. MIT License.

/// # MarkdownEditor
///
/// A Swift Package that provides a CodeMirror 6-based Markdown editor
/// for macOS applications.
///
/// ## Overview
///
/// MarkdownEditor wraps a CodeMirror 6 editor in a WKWebView, providing:
/// - Live Markdown syntax highlighting
/// - Automatic light/dark theme switching
/// - Keyboard shortcuts for formatting
/// - Two-way SwiftUI binding
///
/// ## Quick Start
///
/// ```swift
/// import MarkdownEditor
///
/// struct ContentView: View {
///     @State private var markdown = "# Hello"
///
///     var body: some View {
///         EditorWebView(text: $markdown)
///     }
/// }
/// ```
///
/// ## Topics
///
/// ### Views
/// - ``EditorWebView``
/// - ``EditorConfiguration``
///
/// ### Bridge
/// - ``EditorBridge``
/// - ``EditorBridgeDelegate``
///
/// ### Types
/// - ``EditorSelection``
/// - ``EditorTheme``
/// - ``EditorMessageType``

@_exported import struct SwiftUI.Binding

/// Convenience type alias for the main editor view.
public typealias MarkdownEditorView = EditorWebView
