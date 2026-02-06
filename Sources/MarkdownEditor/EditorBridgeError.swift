import Foundation

// MARK: - EditorBridgeError

/// Errors that can occur when interacting with the editor bridge.
///
/// These errors provide detailed information about failures in the
/// Swift ↔ JavaScript communication layer.
public enum EditorBridgeError: LocalizedError, Sendable {
    /// The editor has not finished loading and is not ready for interaction.
    ///
    /// Wait for the `editorDidBecomeReady()` delegate callback before
    /// calling editor methods.
    case editorNotReady
    
    /// JavaScript evaluation failed.
    ///
    /// - Parameters:
    ///   - command: The JavaScript command that failed.
    ///   - underlyingError: The underlying error from WebKit.
    case javaScriptEvaluationFailed(command: String, underlyingError: Error?)
    
    /// Invalid input was provided to an editor method.
    ///
    /// - Parameters:
    ///   - parameter: The name of the invalid parameter.
    ///   - reason: A description of why the input is invalid.
    case invalidInput(parameter: String, reason: String)
    
    /// The bridge has been disconnected or cleaned up.
    ///
    /// This typically occurs when the WebView has been deallocated.
    case bridgeDisconnected
    
    /// Failed to encode or decode data for bridge communication.
    ///
    /// - Parameter reason: A description of the encoding/decoding failure.
    case encodingFailed(reason: String)
    
    // MARK: - LocalizedError
    
    public var errorDescription: String? {
        switch self {
        case .editorNotReady:
            return "The editor is not ready. Wait for editorDidBecomeReady() callback."
            
        case .javaScriptEvaluationFailed(let command, let underlyingError):
            if let error = underlyingError {
                return "JavaScript evaluation failed for '\(command)': \(error.localizedDescription)"
            }
            return "JavaScript evaluation failed for '\(command)'."
            
        case .invalidInput(let parameter, let reason):
            return "Invalid input for parameter '\(parameter)': \(reason)"
            
        case .bridgeDisconnected:
            return "The editor bridge has been disconnected."
            
        case .encodingFailed(let reason):
            return "Failed to encode/decode data: \(reason)"
        }
    }
    
    public var recoverySuggestion: String? {
        switch self {
        case .editorNotReady:
            return "Set a delegate and wait for the editorDidBecomeReady() callback before interacting with the editor."
            
        case .javaScriptEvaluationFailed:
            return "Check the JavaScript console for errors and ensure the editor is properly initialized."
            
        case .invalidInput:
            return "Verify that all parameters are within valid ranges and formats."
            
        case .bridgeDisconnected:
            return "Create a new editor instance if you need to continue editing."
            
        case .encodingFailed:
            return "Ensure the data can be properly serialized to JSON."
        }
    }
}
