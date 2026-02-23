# Changelog

All notable changes to `markdownlm-mcp` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] — 2026-02-23

### Purpose of MarkdownLM MCP Server
This server acts as the persistent memory and governance layer between your team and AI coding agents (like Cursor, Claude, or Copilot). It bridges AI directly to your private knowledge base, ensuring agents validate code against documented patterns and architectural rules *before* proposing changes.

### Added
- **`query_knowledge_base` tool**: Query the team's documented rules, architectural decisions, and stack constraints before writing code.
- **`validate_code` tool**: Validate an entire code snippet against your team's rules, returning violations and fix suggestions.
- **`resolve_gap` tool**: Automatically logs unknown or undocumented decisions to MarkdownLM so the team can review and formally document them.
- Client-side rate limiter (100 calls / 60 s sliding window)
- Structured JSON logging to stderr for all tool calls

### Questions or Support?
For any questions, enterprise deployments, or bug reports, email us at: contact@markdownlm.com
