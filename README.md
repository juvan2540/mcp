# <img src="assets/logo.png" width="48" height="48" style="vertical-align: middle; margin-right: 8px;"> MarkdownLM MCP Server

**MarkdownLM is the persistent memory and governance layer** between your team and your AI coding agents. Define your rules once. Enforced everywhere. Every session.

> **Note:**
>
> The MarkdownLM knowledge base supports the following categories for all rules, patterns, and decisions:
>
> - `architecture`: Layering, boundaries, system design
> - `stack`: Frameworks, libraries, versions
> - `testing`: Test frameworks, coverage, patterns
> - `deployment`: CI/CD, platforms, scripts
> - `security`: Auth, validation, secrets
> - `style`: Naming, formatting, organization
> - `dependencies`: Approved/banned packages
> - `error_handling`: Exceptions, logging, monitoring
> - `business_logic`: Domain rules, workflow constraints, business invariants, pricing logic, subscription rules, permission models
> - `general`: Anything else
>
> When using this MCP server, always specify a category. `category` is a required field on `query_knowledge_base`.

## How it works

1. Your team documents architecture rules, stack decisions, and patterns in MarkdownLM.
2. This MCP server gives AI coding agents three focused tools to query and validate against that knowledge.
3. Agents validate code against your rules **before** suggesting changes — violations never reach PRs.

## Setup

### 1. Get your API key

1. Log in to [MarkdownLM](https://markdownlm.com)
2. Go to **Settings → API & MCP**
3. Generate an API key

### 2. Configure your AI tool

Pick your tool below. All use the **same npm package** — one codebase, every platform.

---

#### Claude Code (CLI)

```bash
claude mcp add markdownlm -e MARKDOWNLM_API_KEY=mdlm_your_key_here -- npx -y markdownlm-mcp
```

Or manually edit `~/.claude/claude_code_config.json`:

```json
{
  "mcpServers": {
    "markdownlm": {
      "command": "npx",
      "args": ["-y", "markdownlm-mcp"],
      "env": {
        "MARKDOWNLM_API_KEY": "mdlm_your_key_here"
      }
    }
  }
}
```

---

#### Cursor

`.cursor/mcp.json` in your project root (project-scoped) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "markdownlm": {
      "command": "npx",
      "args": ["-y", "markdownlm-mcp"],
      "env": {
        "MARKDOWNLM_API_KEY": "mdlm_your_key_here"
      }
    }
  }
}
```

---

#### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "markdownlm": {
      "command": "npx",
      "args": ["-y", "markdownlm-mcp"],
      "env": {
        "MARKDOWNLM_API_KEY": "mdlm_your_key_here"
      }
    }
  }
}
```

---

#### VS Code

`.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "markdownlm": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "markdownlm-mcp"],
      "env": {
        "MARKDOWNLM_API_KEY": "mdlm_your_key_here"
      }
    }
  }
}
```

---

## Tools

### `query_knowledge_base`

Query your team's documented rules before writing code. Returns relevant rules with sources and automatically logs gaps for undocumented decisions.

**Inputs**

| Field | Required | Description |
|---|---|---|
| `query` | ✓ | Natural language question (e.g. "How should I handle auth?") |
| `category` | ✓ | Category of the query: `architecture`, `stack`, `testing`, `deployment`, `security`, `style`, `dependencies`, `error_handling`, `business_logic`, `general` |

**Response** — `answer`, `sources[]`, `gap_detected`, optional `gap_resolution`

---

### `validate_code`

Validate a code snippet against all documented rules. Returns pass/fail with violation details and fix suggestions.

**Inputs**

| Field | Required | Description |
|---|---|---|
| `code` | ✓ | Code snippet to check |
| `task` | ✓ | What the code is supposed to do |
| `category` | ✓ | The knowledge base category relevant to this code |

**Response** — `status` (`pass`/`fail`), `violations[]` (rule, message, fix_suggestion), `fix_suggestion`

---

### `resolve_gap`

Log a knowledge gap for an undocumented decision. Returns how to handle it based on your preferences: `markdownlm` (AI resolves), `ask_user` (wait for human), `agent_decide` (proceed independently).

**Inputs**

| Field | Required | Description |
|---|---|---|
| `question` | ✓ | The undocumented decision or question |
| `category` | ✓ | Category hint |

**Response** — `gap_detected`, `resolution_mode`, optional `resolution`, `gap_id`

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MARKDOWNLM_API_KEY` | ✓ | — | API key from Settings → API & MCP |
| `MARKDOWNLM_API_URL` | — | `https://markdownlm.com` | Override for self-hosted or staging |

## Rate limiting

100 tool calls per 60 seconds per user.

## Logging

All tool calls are logged to **stderr** as newline-delimited JSON (timestamp, tool name, inputs, outcome). This is safe for stdio MCP transport and can be piped to any log aggregator.

## Contributing & Security

This repository is strictly the **bridge** (the client), not the **brain**. To protect our intellectual property, infrastructure details, and customer data, please carefully review our [Contributing Guidelines](CONTRIBUTING.md) and [Security Policy](SECURITY.md) before making any modifications.

## License

Copyright (c) 2026 MarkdownLM. All Rights Reserved.