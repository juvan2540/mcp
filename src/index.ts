#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { MarkdownLMClient } from './lib/api-client.js'

const API_KEY = process.env.MARKDOWNLM_API_KEY
const API_URL = process.env.MARKDOWNLM_API_URL || 'https://markdownlm.com'

if (!API_KEY) {
  console.error('[markdownlm] MARKDOWNLM_API_KEY environment variable is required')
  process.exit(1)
}

const client = new MarkdownLMClient(API_URL, API_KEY)

function log(tool: string, input: unknown, outcome: 'ok' | 'error', detail?: string) {
  process.stderr.write(JSON.stringify({
    ts: new Date().toISOString(),
    tool,
    input,
    outcome,
    ...(detail ? { detail } : {}),
  }) + '\n')
}

const server = new Server(
  { name: 'markdownlm', version: '3.0.0' },
  { capabilities: { tools: {} } }
)

// ── Tool list ─────────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'query_knowledge_base',
      description:
        "MANDATORY: Call this tool before writing any code, proposing any pattern, or making any architectural or dependency decision. " +
        "It queries this team's private knowledge base of documented rules, stack decisions, and architectural constraints. " +
        "Do NOT rely on general knowledge — your team's rules override defaults. " +
        "Returns the matching documented rules with their sources. " +
        "If no documentation exists for the topic, a gap is automatically logged for the developer to review, and you MUST call resolve_gap next. " +
        "The 'category' field is required — pick the single best-fit value from the allowed enum that describes the domain of your query.",
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description:
              'Natural language question about how to implement something or what rule applies. ' +
              'Be specific to the task at hand. Examples: ' +
              '"What authentication library should I use?", ' +
              '"How should errors be handled in API routes?", ' +
              '"What is the approved ORM for this project?"',
          },
          category: {
            type: 'string',
            enum: [
              'architecture',
              'stack',
              'testing',
              'deployment',
              'security',
              'style',
              'dependencies',
              'error_handling',
              'business_logic',
              'general',
            ],
            description:
              'The knowledge base category that best matches your query domain. Required. ' +
              'Use "architecture" for system design, layering, module boundaries, or component relationships. ' +
              'Use "stack" for framework, library, or language version choices. ' +
              'Use "testing" for test frameworks, coverage requirements, or testing patterns. ' +
              'Use "deployment" for CI/CD pipelines, hosting platforms, or release processes. ' +
              'Use "security" for auth, authorisation, secrets management, or input validation. ' +
              'Use "style" for naming conventions, formatting rules, or code organisation. ' +
              'Use "dependencies" for approved or banned packages and version policies. ' +
              'Use "error_handling" for exception strategies, logging formats, or monitoring. ' +
              'Use "business_logic" for domain rules, workflow constraints, business invariants, pricing logic, subscription rules, or permission models. ' +
              'Use "general" only when no other category fits.',
          },
        },
        required: ['query', 'category'],
      },
    },
    {
      name: 'validate_code',
      description:
        "Call this after writing or editing any non-trivial function, module, or API endpoint. " +
        "Checks the code snippet against this team's documented rules for the given category. " +
        "Returns a pass/fail verdict plus a list of violations — each with the rule violated, the problematic location, and a concrete fix suggestion. " +
        "Fix all violations before presenting the code to the developer. " +
        "Do NOT skip this step even if query_knowledge_base returned no results — the validation engine runs a broader rule check.",
      inputSchema: {
        type: 'object' as const,
        properties: {
          code: {
            type: 'string',
            description: 'The full code snippet to validate. Prefer complete functions or modules over partial fragments for accurate results.',
          },
          task: {
            type: 'string',
            description: 'One-sentence description of what the code is supposed to do. Example: "Creates a JWT-authenticated POST /users endpoint that persists a new user to PostgreSQL."',
          },
          category: {
            type: 'string',
            enum: [
              'architecture',
              'stack',
              'testing',
              'deployment',
              'security',
              'style',
              'dependencies',
              'error_handling',
              'business_logic',
              'general',
            ],
            description:
              'The category whose rules should be applied during validation. Match this to the primary concern of the code. ' +
              'Example: use "security" for auth middleware, "architecture" for a new service layer, "error_handling" for a try/catch wrapper, "business_logic" for domain rules or workflow invariants.',
          },
        },
        required: ['code', 'task', 'category'],
      },
    },
    {
      name: 'resolve_gap',
      description:
        "Call this when query_knowledge_base returned no documented guidance for a decision you need to make. " +
        "Logs the undocumented decision as a knowledge gap so the developer can review and document it. " +
        "Returns how you should proceed based on the team's configured gap policy: " +
        '"ask_user" = stop and ask the developer for a decision before continuing; ' +
        '"infer" = MarkdownLM has auto-resolved the gap, use the returned resolution value; ' +
        '"agent_decide" = proceed with your best judgement and document your reasoning. ' +
        'Do NOT call this if query_knowledge_base returned matching rules — it is only for genuinely undocumented decisions.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          question: {
            type: 'string',
            description:
              'The specific undocumented decision you need to make, phrased as a question. ' +
              'Be precise so the developer understands exactly what is missing from the knowledge base. ' +
              'Example: "Which HTTP client library should I use for server-side requests — axios, got, or native fetch?"',
          },
          category: {
            type: 'string',
            enum: [
              'architecture',
              'stack',
              'testing',
              'deployment',
              'security',
              'style',
              'dependencies',
              'error_handling',
              'business_logic',
              'general',
            ],
            description: 'Category that best describes the gap. Helps the developer triage and document the missing rule.',
          },
        },
        required: ['question', 'category'],
      },
    },
  ],
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
const ok = (data: unknown) => ({
  content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
})

const err = (msg: string) => ({
  content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }],
  isError: true,
})

function requireString(args: Record<string, unknown> | undefined, key: string): string | null {
  const v = args?.[key]
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

// ── Tool execution ────────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name: toolName, arguments: args } = request.params
  const safeArgs = (args ?? {}) as Record<string, unknown>

  try {
    switch (toolName) {
      case 'query_knowledge_base': {
        const query = requireString(safeArgs, 'query')
        if (!query) { log(toolName, safeArgs, 'error', 'missing query'); return err('query is required') }
        const category = requireString(safeArgs, 'category')
        if (!category) { log(toolName, safeArgs, 'error', 'missing category'); return err('category is required') }
        const result = await client.queryKnowledgeBase({ query, category })
        log(toolName, { query, category }, 'ok')
        return ok(result)
      }

      case 'validate_code': {
        const code = requireString(safeArgs, 'code')
        if (!code) { log(toolName, safeArgs, 'error', 'missing code'); return err('code is required') }
        const task = requireString(safeArgs, 'task')
        if (!task) { log(toolName, safeArgs, 'error', 'missing task'); return err('task is required') }
        const category = requireString(safeArgs, 'category')
        if (!category) { log(toolName, safeArgs, 'error', 'missing category'); return err('category is required') }
        const result = await client.validateCode({ code, task, category })
        log(toolName, { category, code_len: code.length, task }, 'ok')
        return ok(result)
      }

      case 'resolve_gap': {
        const question = requireString(safeArgs, 'question')
        if (!question) { log(toolName, safeArgs, 'error', 'missing question'); return err('question is required') }
        const category = requireString(safeArgs, 'category')
        if (!category) { log(toolName, safeArgs, 'error', 'missing category'); return err('category is required') }
        const result = await client.resolveGap({ question, category })
        log(toolName, { question, category }, 'ok')
        return ok(result)
      }

      default:
        log(toolName, safeArgs, 'error', 'unknown tool')
        return err(`Unknown tool: ${toolName}`)
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    log(toolName, safeArgs, 'error', message)
    return err(message)
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('[markdownlm] MCP server v3.0.0 ready\n')
}

main().catch((error) => {
  console.error('[markdownlm] Fatal error:', error)
  process.exit(1)
})
