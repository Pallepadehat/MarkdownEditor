import Foundation
import WebKit

// MARK: - EditorMessageType

/// Message types received from the JavaScript editor.
///
/// These correspond to events that the CodeMirror editor sends
/// to Swift via the WebKit bridge.
public enum EditorMessageType: String, Codable, Sendable {
    /// The editor content has changed.
    case contentChanged
    /// The selection/cursor position has changed.
    case selectionChanged
    /// The editor has finished loading and is ready for interaction.
    case ready
    /// The editor gained focus.
    case focus
    /// The editor lost focus.
    case blur
}

// MARK: - EditorSelection

/// Represents a selection range in the editor.
///
/// A selection is defined by a `from` position (start) and a `to` position (end).
/// When `from` equals `to`, the selection represents a cursor position.
///
/// ## Example
/// ```swift
/// let selection = try await bridge.getSelection()
/// if selection.isEmpty {
///     print("Cursor at position: \(selection.from)")
/// } else {
///     print("Selected \(selection.length) characters")
/// }
/// ```
public struct EditorSelection: Sendable, Equatable {
    /// The start position of the selection (0-indexed).
    public let from: Int
    /// The end position of the selection (0-indexed).
    public let to: Int
    
    /// Whether the selection is empty (cursor only, no text selected).
    public var isEmpty: Bool { from == to }
    
    /// The number of characters in the selection.
    public var length: Int { to - from }
    
    /// Creates a new editor selection.
    /// - Parameters:
    ///   - from: The start position.
    ///   - to: The end position.
    public init(from: Int, to: Int) {
        self.from = from
        self.to = to
    }
}

// MARK: - EditorBridgeDelegate

/// Delegate protocol for receiving editor events.
///
/// Implement this protocol to respond to content changes, selection changes,
/// and focus events from the Markdown editor.
///
/// ## Example
/// ```swift
/// class MyCoordinator: EditorBridgeDelegate {
///     func editorDidChangeContent(_ content: String) {
///         // Handle content change
///     }
/// }
/// ```
@MainActor
public protocol EditorBridgeDelegate: AnyObject {
    /// Called when the editor content changes.
    /// - Parameter content: The new content of the editor.
    func editorDidChangeContent(_ content: String)
    
    /// Called when the selection or cursor position changes.
    /// - Parameter selection: The new selection range.
    func editorDidChangeSelection(_ selection: EditorSelection)
    
    /// Called when the editor has finished loading and is ready.
    func editorDidBecomeReady()
    
    /// Called when the editor gains focus.
    func editorDidFocus()
    
    /// Called when the editor loses focus.
    func editorDidBlur()
}

/// Default implementations for optional delegate methods.
public extension EditorBridgeDelegate {
    func editorDidChangeSelection(_ selection: EditorSelection) {}
    func editorDidBecomeReady() {}
    func editorDidFocus() {}
    func editorDidBlur() {}
}

// MARK: - EditorBridge

/// Bridge for communication between Swift and the JavaScript editor.
///
/// `EditorBridge` handles all communication with the CodeMirror 6 editor
/// running in a WKWebView. It provides methods for:
/// - Getting and setting editor content
/// - Managing text selection
/// - Applying formatting (bold, italic, etc.)
/// - Controlling editor state (undo, redo, focus)
/// - Theming and configuration
///
/// ## Usage
/// ```swift
/// let bridge = EditorBridge()
/// bridge.configure(with: webView)
/// bridge.delegate = self
///
/// // After editor is ready:
/// await bridge.setContent("# Hello, World!")
/// await bridge.toggleBold()
/// ```
///
/// - Important: Always call ``cleanup()`` when the bridge is no longer needed
///   to prevent memory leaks.
@MainActor
public final class EditorBridge: NSObject {
    
    // MARK: - Properties
    
    /// The delegate to receive editor events.
    public weak var delegate: EditorBridgeDelegate?
    
    private weak var webView: WKWebView?
    
    /// Whether the editor has finished loading and is ready for interaction.
    ///
    /// Wait for this to become `true` before calling editor commands.
    public private(set) var isReady = false
    
    /// Current content of the editor (cached for performance).
    private var cachedContent: String = ""
    
    /// Flag to prevent feedback loops when setting content from Swift.
    private var isUpdatingFromSwift = false
    
    // MARK: - Initialization
    
    /// Creates a new editor bridge.
    public override init() {
        super.init()
    }
    
    /// Configures the bridge with a WKWebView.
    ///
    /// This sets up the message handlers needed for Swift ↔ JavaScript
    /// communication. Must be called before using the bridge.
    ///
    /// - Parameter webView: The WKWebView containing the editor.
    public func configure(with webView: WKWebView) {
        self.webView = webView
        
        webView.configuration.userContentController.add(
            LeakAvoider(delegate: self),
            name: "editor"
        )
    }
    
    /// Cleans up the bridge and removes message handlers.
    ///
    /// Call this when the editor is being destroyed to prevent memory leaks.
    public func cleanup() {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "editor")
    }
    
    // MARK: - Content Management
    
    /// Gets the current editor content.
    ///
    /// - Returns: The Markdown content as a string.
    /// - Throws: An error if JavaScript evaluation fails.
    public func getContent() async throws -> String {
        guard let webView, isReady else { return cachedContent }
        
        let result = try await webView.evaluateJavaScript("window.editorAPI.getContent()")
        return result as? String ?? ""
    }
    
    /// Sets the editor content.
    ///
    /// - Parameter content: The Markdown content to set.
    public func setContent(_ content: String) async {
        guard let webView, isReady else {
            cachedContent = content
            return
        }
        
        isUpdatingFromSwift = true
        defer { isUpdatingFromSwift = false }
        
        let escaped = content
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
            .replacingOccurrences(of: "\t", with: "\\t")
        
        do {
            _ = try await webView.evaluateJavaScript("window.editorAPI.setContent(\"\(escaped)\")")
            cachedContent = content
        } catch {
            print("[EditorBridge] Failed to set content: \(error)")
        }
    }
    
    // MARK: - Selection
    
    /// Gets the current selection range.
    ///
    /// - Returns: The current selection.
    /// - Throws: An error if JavaScript evaluation fails.
    public func getSelection() async throws -> EditorSelection {
        guard let webView, isReady else { return EditorSelection(from: 0, to: 0) }
        
        let result = try await webView.evaluateJavaScript("window.editorAPI.getSelection()")
        if let dict = result as? [String: Any],
           let from = dict["from"] as? Int,
           let to = dict["to"] as? Int {
            return EditorSelection(from: from, to: to)
        }
        return EditorSelection(from: 0, to: 0)
    }
    
    /// Sets the selection range.
    ///
    /// - Parameters:
    ///   - from: The start position.
    ///   - to: The end position.
    public func setSelection(from: Int, to: Int) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setSelection(\(from), \(to))")
    }
    
    // MARK: - Formatting Commands
    
    /// Toggles bold formatting on the selection.
    ///
    /// Wraps the selected text with `**` markers, or removes them if already present.
    public func toggleBold() async {
        await executeCommand("toggleBold")
    }
    
    /// Toggles italic formatting on the selection.
    ///
    /// Wraps the selected text with `*` markers, or removes them if already present.
    public func toggleItalic() async {
        await executeCommand("toggleItalic")
    }
    
    /// Toggles inline code formatting on the selection.
    ///
    /// Wraps the selected text with backtick markers, or removes them if already present.
    public func toggleCode() async {
        await executeCommand("toggleCode")
    }
    
    /// Toggles strikethrough formatting on the selection.
    ///
    /// Wraps the selected text with `~~` markers, or removes them if already present.
    public func toggleStrikethrough() async {
        await executeCommand("toggleStrikethrough")
    }
    
    /// Inserts a Markdown link.
    ///
    /// - Parameters:
    ///   - url: The URL for the link.
    ///   - title: Optional link text. If nil, uses the selected text or "link text".
    public func insertLink(url: String, title: String? = nil) async {
        guard let webView, isReady else { return }
        let titleArg = title.map { ", \"\($0)\"" } ?? ""
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertLink(\"\(url)\"\(titleArg))")
    }
    
    /// Inserts a Markdown image.
    ///
    /// - Parameters:
    ///   - url: The URL for the image.
    ///   - alt: Optional alt text for the image.
    public func insertImage(url: String, alt: String? = nil) async {
        guard let webView, isReady else { return }
        let altArg = alt.map { ", \"\($0)\"" } ?? ""
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertImage(\"\(url)\"\(altArg))")
    }
    
    /// Inserts a heading at the current line.
    ///
    /// - Parameter level: The heading level (1-6).
    public func insertHeading(level: Int) async {
        guard let webView, isReady, (1...6).contains(level) else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertHeading(\(level))")
    }
    
    /// Inserts a blockquote marker at the current line.
    public func insertBlockquote() async {
        await executeCommand("insertBlockquote")
    }
    
    /// Inserts a fenced code block.
    ///
    /// - Parameter language: Optional language identifier for syntax highlighting.
    public func insertCodeBlock(language: String? = nil) async {
        guard let webView, isReady else { return }
        let langArg = language.map { "\"\($0)\"" } ?? ""
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertCodeBlock(\(langArg))")
    }
    
    /// Inserts a list item at the current line.
    ///
    /// - Parameter ordered: If true, creates a numbered list. If false, creates a bullet list.
    public func insertList(ordered: Bool) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.insertList(\(ordered))")
    }
    
    /// Inserts a horizontal rule.
    public func insertHorizontalRule() async {
        await executeCommand("insertHorizontalRule")
    }
    
    // MARK: - Editor State
    
    /// Focuses the editor.
    public func focus() async {
        await executeCommand("focus")
    }
    
    /// Removes focus from the editor.
    public func blur() async {
        await executeCommand("blur")
    }
    
    /// Undoes the last edit.
    public func undo() async {
        await executeCommand("undo")
    }
    
    /// Redoes the last undone edit.
    public func redo() async {
        await executeCommand("redo")
    }
    
    // MARK: - Theme
    
    /// Sets the editor color theme.
    ///
    /// - Parameter theme: The theme to apply (`.light` or `.dark`).
    public func setTheme(_ theme: EditorTheme) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setTheme(\"\(theme.rawValue)\")")
    }
    
    // MARK: - Configuration
    
    /// Sets the editor font size.
    ///
    /// - Parameter size: The font size in points.
    public func setFontSize(_ size: CGFloat) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setFontSize(\(size))")
    }
    
    /// Sets the line height.
    ///
    /// - Parameter height: The line height multiplier (e.g., 1.5 for 150%).
    public func setLineHeight(_ height: CGFloat) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setLineHeight(\(height))")
    }
    
    /// Sets the font family.
    ///
    /// - Parameter family: A CSS font-family string.
    public func setFontFamily(_ family: String) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.setFontFamily(\"\(family)\")")
    }
    
    // MARK: - Private Helpers
    
    private func executeCommand(_ command: String) async {
        guard let webView, isReady else { return }
        _ = try? await webView.evaluateJavaScript("window.editorAPI.\(command)()")
    }
}

// MARK: - WKScriptMessageHandler

extension EditorBridge: WKScriptMessageHandler {
    
    nonisolated public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        Task { @MainActor in
            guard message.name == "editor",
                  let body = message.body as? [String: Any],
                  let typeString = body["type"] as? String,
                  let type = EditorMessageType(rawValue: typeString)
            else { return }
            
            handleMessage(type: type, payload: body["payload"])
        }
    }
    
    @MainActor
    private func handleMessage(type: EditorMessageType, payload: Any?) {
        switch type {
        case .contentChanged:
            guard !isUpdatingFromSwift,
                  let dict = payload as? [String: Any],
                  let content = dict["content"] as? String
            else { return }
            
            cachedContent = content
            delegate?.editorDidChangeContent(content)
            
        case .selectionChanged:
            if let dict = payload as? [String: Any],
               let from = dict["from"] as? Int,
               let to = dict["to"] as? Int {
                delegate?.editorDidChangeSelection(EditorSelection(from: from, to: to))
            }
            
        case .ready:
            isReady = true
            if !cachedContent.isEmpty {
                Task {
                    await setContent(cachedContent)
                }
            }
            delegate?.editorDidBecomeReady()
            
        case .focus:
            delegate?.editorDidFocus()
            
        case .blur:
            delegate?.editorDidBlur()
        }
    }
}

// MARK: - LeakAvoider

/// Prevents retain cycle between WKWebView and message handler.
private final class LeakAvoider: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?
    
    init(delegate: WKScriptMessageHandler) {
        self.delegate = delegate
    }
    
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        delegate?.userContentController(userContentController, didReceive: message)
    }
}

// MARK: - EditorTheme

/// The color scheme for the editor.
///
/// The editor automatically follows the system appearance when used
/// with `EditorWebView`, but you can also set the theme manually.
public enum EditorTheme: String, Sendable {
    /// Light color scheme with a white background.
    case light
    /// Dark color scheme with a dark background.
    case dark
}
