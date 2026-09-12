import { AI } from '@/lib/config';

/**
 * AI provider abstraction.
 * - If AI_API_KEY is set, uses any OpenAI-compatible chat endpoint.
 * - Otherwise callers use deterministic local logic (extractive summary etc.),
 *   so the product is fully functional at $0 and demo mode never fabricates LLM output.
 */
export const aiEnabled = (): boolean => Boolean(AI.apiKey);

export interface ChatOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export async function chat(opts: ChatOptions): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const res = await fetch(`${AI.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${AI.apiKey}`,
      },
      body: JSON.stringify({
        model: AI.model,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
        max_tokens: opts.maxTokens ?? 500,
        temperature: opts.temperature ?? 0.2,
      }),
      signal: AbortSignal.timeout(AI.timeoutMs),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null; // graceful degradation to local processing
  }
}

/** Extract a JSON object from an LLM reply (handles code fences). */
export function parseJsonReply(reply: string | null): Record<string, unknown> | null {
  if (!reply) return null;
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : reply).trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
