# Security Policy

## Supported Versions

We only apply security updates to the latest published version.

## Reporting a Vulnerability

If you discover a security vulnerability within the MarkdownLM MCP server or any of its dependencies, please send an e-mail to `contact@markdownlm.com`. All security vulnerabilities will be promptly addressed.

## General Information Security and IP Policy

Because this is the public-facing bridge connecting AI agents to the MarkdownLM platform, contributors and maintainers must strictly adhere to the following IP rules:

1. **NO Hard-coded Secrets:** Do not commit API keys, database passwords, tokens, or staging credentials. Only use `process.env`.
2. **NO Proprietary Logic:** The actual AI validation and storage logic is considered highly proprietary and must remain entirely on the MarkdownLM backend. This server is strictly a thin client.
3. **NO Private Infrastructure:** Do not commit names of internal servers, staging IPs, internal network diagrams, or specific cloud infrastructure configurations.
4. **NO Customer Data:** Under no circumstance is real user data, mock PII, real application logs, or customer database schemas permitted in tests, documentation, or code examples.

Any pull requests violating these rules will be rejected, and commits will be purged.
