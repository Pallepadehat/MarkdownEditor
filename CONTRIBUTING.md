# Contributing

Thanks for contributing to MarkdownEditor.

## Prerequisites

- macOS 14+
- Xcode 15+
- Bun

## Development Setup

1. Clone the repository.
2. Install TypeScript dependencies:

```bash
cd CoreEditor
bun install
```

3. Build the web editor:

```bash
bun run build
```

4. Build and test the Swift package from the repository root:

```bash
swift build
swift test
```

## Pull Requests

- Create a focused branch for each change.
- Keep commits scoped and descriptive.
- Update docs when behavior changes.
- Include manual test notes in the PR description.

## Reporting Issues

Use GitHub Issues for bug reports and feature requests:
`https://github.com/Pallepadehat/MarkdownEditor/issues`
