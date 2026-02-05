import XCTest
@testable import MarkdownEditor

/// Tests for JavaScript utility functions.
final class JavaScriptUtilitiesTests: XCTestCase {
    
    // MARK: - String Escaping Tests
    
    func testEscapeSimpleString() {
        let input = "Hello, World!"
        let escaped = JavaScriptUtilities.escapeJavaScriptString(input)
        XCTAssertEqual(escaped, "Hello, World!", "Simple strings should not be modified")
    }
    
    func testEscapeBackslash() {
        let input = "Path\\to\\file"
        let escaped = JavaScriptUtilities.escapeJavaScriptString(input)
        XCTAssertEqual(escaped, "Path\\\\to\\\\file", "Backslashes should be escaped")
    }
    
    func testEscapeQuotes() {
        let input = "He said \"Hello\""
        let escaped = JavaScriptUtilities.escapeJavaScriptString(input)
        XCTAssertEqual(escaped, "He said \\\"Hello\\\"", "Quotes should be escaped")
    }
    
    func testEscapeNewlines() {
        let input = "Line 1\nLine 2\r\nLine 3"
        let escaped = JavaScriptUtilities.escapeJavaScriptString(input)
        XCTAssertEqual(escaped, "Line 1\\nLine 2\\r\\nLine 3", "Newlines should be escaped")
    }
    
    func testEscapeTabs() {
        let input = "Column1\tColumn2"
        let escaped = JavaScriptUtilities.escapeJavaScriptString(input)
        XCTAssertEqual(escaped, "Column1\\tColumn2", "Tabs should be escaped")
    }
    
    func testEscapeUnicodeSeparators() {
        let input = "Para1\u{2028}Para2\u{2029}Para3"
        let escaped = JavaScriptUtilities.escapeJavaScriptString(input)
        XCTAssertEqual(escaped, "Para1\\u2028Para2\\u2029Para3", "Unicode separators should be escaped")
    }
    
    func testEscapeComplexString() {
        let input = "Path\\to\\\"file\"\n\t with\u{2028}separators"
        let escaped = JavaScriptUtilities.escapeJavaScriptString(input)
        XCTAssertTrue(escaped.contains("\\\\"), "Should escape backslashes")
        XCTAssertTrue(escaped.contains("\\\""), "Should escape quotes")
        XCTAssertTrue(escaped.contains("\\n"), "Should escape newlines")
        XCTAssertTrue(escaped.contains("\\t"), "Should escape tabs")
        XCTAssertTrue(escaped.contains("\\u2028"), "Should escape unicode separators")
    }
    
    func testEscapeEmptyString() {
        let escaped = JavaScriptUtilities.escapeJavaScriptString("")
        XCTAssertEqual(escaped, "", "Empty string should remain empty")
    }
    
    func testEscapeMarkdownContent() {
        let markdown = """
        # Heading
        
        This is **bold** and *italic*.
        
        ```swift
        print("Hello")
        ```
        """
        let escaped = JavaScriptUtilities.escapeJavaScriptString(markdown)
        XCTAssertTrue(escaped.contains("\\n"), "Should escape newlines in markdown")
        XCTAssertTrue(escaped.contains("\\\""), "Should escape quotes in markdown")
    }
    
    // MARK: - JavaScript Call Builder Tests
    
    func testBuildSimpleCall() throws {
        let call = try JavaScriptUtilities.buildJavaScriptCall(
            method: "window.focus"
        )
        XCTAssertEqual(call, "window.focus()")
    }
    
    func testBuildCallWithStringArgument() throws {
        let call = try JavaScriptUtilities.buildJavaScriptCall(
            method: "window.editorAPI.setContent",
            arguments: [.string("# Hello")]
        )
        XCTAssertEqual(call, "window.editorAPI.setContent(\"# Hello\")")
    }
    
    func testBuildCallWithNumberArgument() throws {
        let call = try JavaScriptUtilities.buildJavaScriptCall(
            method: "window.editorAPI.insertHeading",
            arguments: [.number(3)]
        )
        XCTAssertEqual(call, "window.editorAPI.insertHeading(3.0)")
    }
    
    func testBuildCallWithBooleanArgument() throws {
        let call = try JavaScriptUtilities.buildJavaScriptCall(
            method: "window.editorAPI.insertList",
            arguments: [.boolean(true)]
        )
        XCTAssertEqual(call, "window.editorAPI.insertList(true)")
    }
    
    func testBuildCallWithNullArgument() throws {
        let call = try JavaScriptUtilities.buildJavaScriptCall(
            method: "window.editorAPI.insertLink",
            arguments: [.string("https://example.com"), .null]
        )
        XCTAssertEqual(call, "window.editorAPI.insertLink(\"https://example.com\", null)")
    }
    
    func testBuildCallWithRawArgument() throws {
        let call = try JavaScriptUtilities.buildJavaScriptCall(
            method: "window.editorAPI.updateConfig",
            arguments: [.raw("{fontSize: 16}")]
        )
        XCTAssertEqual(call, "window.editorAPI.updateConfig({fontSize: 16})")
    }
    
    func testBuildCallWithMultipleArguments() throws {
        let call = try JavaScriptUtilities.buildJavaScriptCall(
            method: "window.editorAPI.setSelection",
            arguments: [.number(10), .number(20)]
        )
        XCTAssertEqual(call, "window.editorAPI.setSelection(10.0, 20.0)")
    }
    
    func testBuildCallWithEscapedString() throws {
        let call = try JavaScriptUtilities.buildJavaScriptCall(
            method: "window.editorAPI.setContent",
            arguments: [.string("Line 1\nLine 2")]
        )
        XCTAssertTrue(call.contains("\\n"), "Should escape special characters in string arguments")
    }
    
    func testBuildCallWithEmptyMethod() {
        XCTAssertThrowsError(
            try JavaScriptUtilities.buildJavaScriptCall(method: "")
        ) { error in
            guard let bridgeError = error as? EditorBridgeError else {
                XCTFail("Expected EditorBridgeError")
                return
            }
            if case .invalidInput(let param, _) = bridgeError {
                XCTAssertEqual(param, "method")
            } else {
                XCTFail("Expected invalidInput error")
            }
        }
    }
    
    // MARK: - Input Validation Tests
    
    func testValidateNormalInput() throws {
        let text = "This is a normal markdown document."
        let validated = try JavaScriptUtilities.validateInput(text: text)
        XCTAssertEqual(validated, text, "Normal input should pass validation")
    }
    
    func testValidateLargeInput() throws {
        let text = String(repeating: "a", count: 1_000_000)
        let validated = try JavaScriptUtilities.validateInput(text: text)
        XCTAssertEqual(validated.count, 1_000_000, "1MB text should pass validation")
    }
    
    func testValidateExcessivelyLargeInput() {
        let text = String(repeating: "a", count: 11_000_000)
        XCTAssertThrowsError(
            try JavaScriptUtilities.validateInput(text: text)
        ) { error in
            guard let bridgeError = error as? EditorBridgeError else {
                XCTFail("Expected EditorBridgeError")
                return
            }
            if case .invalidInput(let param, let reason) = bridgeError {
                XCTAssertEqual(param, "text")
                XCTAssertTrue(reason.contains("maximum length"), "Reason should mention max length")
            } else {
                XCTFail("Expected invalidInput error")
            }
        }
    }
    
    func testValidateCustomMaxLength() {
        let text = "12345"
        XCTAssertThrowsError(
            try JavaScriptUtilities.validateInput(text: text, maxLength: 3)
        ) { error in
            XCTAssertTrue(error is EditorBridgeError)
        }
    }
    
    func testValidateEmptyInput() throws {
        let validated = try JavaScriptUtilities.validateInput(text: "")
        XCTAssertEqual(validated, "", "Empty string should pass validation")
    }
    
    // MARK: - Heading Level Validation Tests
    
    func testValidateHeadingLevelInRange() throws {
        for level in 1...6 {
            XCTAssertNoThrow(
                try JavaScriptUtilities.validateHeadingLevel(level),
                "Heading level \(level) should be valid"
            )
        }
    }
    
    func testValidateHeadingLevelTooLow() {
        XCTAssertThrowsError(
            try JavaScriptUtilities.validateHeadingLevel(0)
        ) { error in
            guard let bridgeError = error as? EditorBridgeError else {
                XCTFail("Expected EditorBridgeError")
                return
            }
            if case .invalidInput(let param, let reason) = bridgeError {
                XCTAssertEqual(param, "level")
                XCTAssertTrue(reason.contains("1 and 6"))
            } else {
                XCTFail("Expected invalidInput error")
            }
        }
    }
    
    func testValidateHeadingLevelTooHigh() {
        XCTAssertThrowsError(
            try JavaScriptUtilities.validateHeadingLevel(7)
        ) { error in
            XCTAssertTrue(error is EditorBridgeError)
        }
    }
    
    func testValidateHeadingLevelNegative() {
        XCTAssertThrowsError(try JavaScriptUtilities.validateHeadingLevel(-1))
    }
    
    // MARK: - Selection Validation Tests
    
    func testValidateNormalSelection() throws {
        XCTAssertNoThrow(try JavaScriptUtilities.validateSelection(from: 0, to: 10))
        XCTAssertNoThrow(try JavaScriptUtilities.validateSelection(from: 5, to: 100))
    }
    
    func testValidateEmptySelection() throws {
        XCTAssertNoThrow(
            try JavaScriptUtilities.validateSelection(from: 10, to: 10),
            "Empty selection (cursor position) should be valid"
        )
    }
    
    func testValidateNegativeFrom() {
        XCTAssertThrowsError(
            try JavaScriptUtilities.validateSelection(from: -1, to: 10)
        ) { error in
            guard let bridgeError = error as? EditorBridgeError else {
                XCTFail("Expected EditorBridgeError")
                return
            }
            if case .invalidInput(let param, _) = bridgeError {
                XCTAssertEqual(param, "from")
            } else {
                XCTFail("Expected invalidInput error for 'from'")
            }
        }
    }
    
    func testValidateNegativeTo() {
        XCTAssertThrowsError(
            try JavaScriptUtilities.validateSelection(from: 0, to: -1)
        ) { error in
            guard let bridgeError = error as? EditorBridgeError else {
                XCTFail("Expected EditorBridgeError")
                return
            }
            if case .invalidInput(let param, _) = bridgeError {
                XCTAssertEqual(param, "to")
            } else {
                XCTFail("Expected invalidInput error for 'to'")
            }
        }
    }
    
    func testValidateReversedSelection() {
        XCTAssertThrowsError(
            try JavaScriptUtilities.validateSelection(from: 20, to: 10)
        ) { error in
            guard let bridgeError = error as? EditorBridgeError else {
                XCTFail("Expected EditorBridgeError")
                return
            }
            if case .invalidInput(let param, let reason) = bridgeError {
                XCTAssertEqual(param, "from/to")
                XCTAssertTrue(reason.contains("must not be greater than"))
            } else {
                XCTFail("Expected invalidInput error for range")
            }
        }
    }
    
    // MARK: - JavaScriptArgument Tests
    
    func testStringArgumentConversion() {
        let arg = JavaScriptArgument.string("Hello")
        XCTAssertEqual(arg.toJavaScript(), "\"Hello\"")
    }
    
    func testStringArgumentWithEscaping() {
        let arg = JavaScriptArgument.string("Line 1\nLine 2")
        XCTAssertTrue(arg.toJavaScript().contains("\\n"))
    }
    
    func testNumberArgumentConversion() {
        let arg = JavaScriptArgument.number(42.5)
        XCTAssertEqual(arg.toJavaScript(), "42.5")
    }
    
    func testNumberArgumentWithNaN() {
        let arg = JavaScriptArgument.number(.nan)
        XCTAssertEqual(arg.toJavaScript(), "NaN", "NaN should convert to JavaScript 'NaN'")
    }
    
    func testNumberArgumentWithInfinity() {
        let arg = JavaScriptArgument.number(.infinity)
        XCTAssertEqual(arg.toJavaScript(), "Infinity", "Positive infinity should convert to 'Infinity'")
    }
    
    func testNumberArgumentWithNegativeInfinity() {
        let arg = JavaScriptArgument.number(-.infinity)
        XCTAssertEqual(arg.toJavaScript(), "-Infinity", "Negative infinity should convert to '-Infinity'")
    }
    
    func testBooleanTrueConversion() {
        let arg = JavaScriptArgument.boolean(true)
        XCTAssertEqual(arg.toJavaScript(), "true")
    }
    
    func testBooleanFalseConversion() {
        let arg = JavaScriptArgument.boolean(false)
        XCTAssertEqual(arg.toJavaScript(), "false")
    }
    
    func testNullArgumentConversion() {
        let arg = JavaScriptArgument.null
        XCTAssertEqual(arg.toJavaScript(), "null")
    }
    
    func testRawArgumentConversion() {
        let arg = JavaScriptArgument.raw("{key: 'value'}")
        XCTAssertEqual(arg.toJavaScript(), "{key: 'value'}")
    }
}
