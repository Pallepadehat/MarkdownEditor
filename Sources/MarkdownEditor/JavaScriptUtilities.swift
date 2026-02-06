import Foundation

// MARK: - JavaScriptUtilities

/// Utilities for safe JavaScript bridge communication.
///
/// These utilities provide type-safe, validated methods for constructing
/// JavaScript calls and escaping strings for use in JavaScript contexts.
enum JavaScriptUtilities {
    
    // MARK: - String Escaping
    
    /// Escapes a string for safe use in JavaScript.
    ///
    /// This function handles all special characters that need escaping
    /// when embedding strings in JavaScript code, including:
    /// - Backslashes
    /// - Quotes
    /// - Newlines and control characters
    /// - Unicode line/paragraph separators
    ///
    /// ## Example
    /// ```swift
    /// let escaped = JavaScriptUtilities.escapeJavaScriptString("Hello\n\"World\"")
    /// // Returns: "Hello\\n\\\"World\\\""
    /// ```
    ///
    /// - Parameter string: The string to escape.
    /// - Returns: The escaped string, safe for use in JavaScript.
    static func escapeJavaScriptString(_ string: String) -> String {
        string
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
            .replacingOccurrences(of: "\t", with: "\\t")
            .replacingOccurrences(of: "\u{2028}", with: "\\u2028") // Line separator
            .replacingOccurrences(of: "\u{2029}", with: "\\u2029") // Paragraph separator
    }
    
    // MARK: - JavaScript Call Builder
    
    /// Builds a JavaScript function call with properly escaped arguments.
    ///
    /// This method constructs type-safe JavaScript calls by:
    /// 1. Validating the method name
    /// 2. Properly escaping string arguments
    /// 3. Handling various argument types
    ///
    /// ## Example
    /// ```swift
    /// let call = try JavaScriptUtilities.buildJavaScriptCall(
    ///     method: "window.editorAPI.setContent",
    ///     arguments: [.string("# Hello")]
    /// )
    /// // Returns: "window.editorAPI.setContent(\"# Hello\")"
    /// ```
    ///
    /// - Parameters:
    ///   - method: The JavaScript method to call (e.g., "window.editorAPI.focus").
    ///   - arguments: The arguments to pass to the method.
    /// - Returns: A complete JavaScript function call string.
    /// - Throws: `EditorBridgeError.invalidInput` if inputs are invalid.
    static func buildJavaScriptCall(
        method: String,
        arguments: [JavaScriptArgument] = []
    ) throws -> String {
        guard !method.isEmpty else {
            throw EditorBridgeError.invalidInput(
                parameter: "method",
                reason: "Method name cannot be empty"
            )
        }
        
        let args = arguments.map { $0.toJavaScript() }.joined(separator: ", ")
        return "\(method)(\(args))"
    }
    
    // MARK: - Input Validation
    
    /// Validates and sanitizes text input.
    ///
    /// This method ensures that input text is within reasonable bounds
    /// and doesn't contain problematic characters.
    ///
    /// - Parameters:
    ///   - text: The text to validate.
    ///   - maxLength: Maximum allowed length (default: 10MB worth of characters).
    /// - Returns: The validated text.
    /// - Throws: `EditorBridgeError.invalidInput` if validation fails.
    static func validateInput(
        text: String,
        maxLength: Int = 10_000_000
    ) throws -> String {
        guard text.count <= maxLength else {
            throw EditorBridgeError.invalidInput(
                parameter: "text",
                reason: "Text exceeds maximum length of \(maxLength) characters"
            )
        }
        return text
    }
    
    /// Validates a heading level.
    ///
    /// - Parameter level: The heading level to validate (must be 1-6).
    /// - Throws: `EditorBridgeError.invalidInput` if level is out of range.
    static func validateHeadingLevel(_ level: Int) throws {
        guard (1...6).contains(level) else {
            throw EditorBridgeError.invalidInput(
                parameter: "level",
                reason: "Heading level must be between 1 and 6, got \(level)"
            )
        }
    }
    
    /// Validates a selection range.
    ///
    /// - Parameters:
    ///   - from: The start position.
    ///   - to: The end position.
    /// - Throws: `EditorBridgeError.invalidInput` if range is invalid.
    static func validateSelection(from: Int, to: Int) throws {
        guard from >= 0 else {
            throw EditorBridgeError.invalidInput(
                parameter: "from",
                reason: "Selection start must be non-negative, got \(from)"
            )
        }
        guard to >= 0 else {
            throw EditorBridgeError.invalidInput(
                parameter: "to",
                reason: "Selection end must be non-negative, got \(to)"
            )
        }
        guard from <= to else {
            throw EditorBridgeError.invalidInput(
                parameter: "from/to",
                reason: "Selection start (\(from)) must not be greater than end (\(to))"
            )
        }
    }
}

// MARK: - JavaScriptArgument

/// Represents a JavaScript function argument.
///
/// This type ensures type-safe conversion of Swift values to JavaScript.
enum JavaScriptArgument {
    /// A string argument.
    case string(String)
    /// A numeric argument (Int, Double, CGFloat, etc.).
    case number(Double)
    /// A boolean argument.
    case boolean(Bool)
    /// A null/nil argument.
    case null
    /// A raw JavaScript expression (use with caution).
    case raw(String)
    
    /// Converts the argument to its JavaScript representation.
    ///
    /// - Returns: A JavaScript-compatible string representation.
    func toJavaScript() -> String {
        switch self {
        case .string(let value):
            return "\"\(JavaScriptUtilities.escapeJavaScriptString(value))\""
        case .number(let value):
            // Handle special Double values with proper JavaScript literals
            if value.isNaN {
                return "NaN"
            } else if value.isInfinite {
                return value.sign == .minus ? "-Infinity" : "Infinity"
            } else {
                return String(value)
            }
        case .boolean(let value):
            return value ? "true" : "false"
        case .null:
            return "null"
        case .raw(let value):
            return value
        }
    }
}
