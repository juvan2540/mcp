// ============================================================
// Types
// ============================================================

export interface QueryKnowledgeResult {
  answer: string
  gap_detected: boolean
  gap_resolution?: { id: string; status: string; resolution_mode: string }
}

export interface QueryKnowledgeInput {
  query: string
  category: string
}

export interface ValidateCodeInput {
  code: string
  task: string
  category: string
}

export interface ResolveGapInput {
  question: string
  category: string
}

export interface ResolveGapResult {
  gap_detected: boolean
  resolution_mode: 'markdownlm' | 'ask_user' | 'agent_decide' | 'none'
  resolution?: string
  gap_id?: string
}

export interface Violation {
  rule: string
  message: string
  fix_suggestion?: string
}

export interface ValidateCodeResult {
  status: 'pass' | 'fail'
  violations: Violation[]
  fix_suggestion: string
}

// ============================================================
// Rate limiter — 100 calls per 60 s sliding window (in-process)
// ============================================================
class RateLimiter {
  private timestamps: number[] = []
  private readonly limit: number
  private readonly windowMs: number

  constructor(limit = 100, windowMs = 60_000) {
    this.limit = limit
    this.windowMs = windowMs
  }

  check(): void {
    const now = Date.now()
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs)
    if (this.timestamps.length >= this.limit) {
      throw new Error(
        `Rate limit exceeded: ${this.limit} requests per ${this.windowMs / 1000}s. Try again later.`
      )
    }
    this.timestamps.push(now)
  }
}

// ============================================================
// Client
// ============================================================
export class MarkdownLMClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly rateLimiter = new RateLimiter(100, 60_000)

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private async request<T>(path: string, body?: unknown): Promise<T> {
    this.rateLimiter.check()

    const response = await fetch(`${this.baseUrl}/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let message: string
      const text = await response.text()
      try {
        message = JSON.parse(text).error ?? text
      } catch {
        message = text || `HTTP ${response.status}`
      }
      throw new Error(`MarkdownLM API error (${response.status}): ${message}`)
    }

    return response.json() as Promise<T>
  }

  async queryKnowledgeBase(input: QueryKnowledgeInput): Promise<QueryKnowledgeResult> {
    return this.request<QueryKnowledgeResult>('/validation/query', {
      query: input.query,
      category: input.category,
    })
  }

  async validateCode(input: ValidateCodeInput): Promise<ValidateCodeResult> {
    return this.request<ValidateCodeResult>('/validation/validate', {
      code: input.code,
      task: input.task,
      category: input.category,
    })
  }

  async resolveGap(input: ResolveGapInput): Promise<ResolveGapResult> {
    return this.request<ResolveGapResult>('/gaps/detect', {
      query: input.question,
      ...(input.category ? { category: input.category } : {}),
    })
  }
}
