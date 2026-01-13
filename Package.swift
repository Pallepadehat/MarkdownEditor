// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "MarkdownEditor",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "MarkdownEditor",
            targets: ["MarkdownEditor"]
        ),
    ],
    targets: [
        .target(
            name: "MarkdownEditor",
            resources: [
                .copy("Resources/editor.html")
            ]
        ),
        .testTarget(
            name: "MarkdownEditorTests",
            dependencies: ["MarkdownEditor"]
        ),
    ]
)
