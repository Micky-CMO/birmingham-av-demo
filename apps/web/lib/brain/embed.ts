/**
 * Embedding client — talks to whichever upstream is serving
 * mickai-embed (nomic-embed-text-v1.5, 768-dim).
 *
 * Default wire protocol is Ollama's /api/embeddings, which is the
 * transport Hamzah's on-prem server uses. An OpenAI-compatible
 * /v1/embeddings shape is also supported if BAV_EMBED_SCHEMA=openai.
 *
 * Configured via env vars:
 *   BAV_EMBED_URL     — base URL (e.g. http://brain.internal:11434 or
 *                       https://brain.birmingham-av.com)
 *   BAV_EMBED_MODEL   — default 'mickai-embed:latest'
 *   BAV_EMBED_SCHEMA  — 'ollama' (default) or 'openai'
 *   BAV_BRAIN_TOKEN   — bearer token if the upstream is tunnelled
 */

const DEFAULT_MODEL = 'mickai-embed:latest';
const EMBED_DIM = 768;

export type EmbedConfig = {
  url?: string;
  model?: string;
  schema?: 'ollama' | 'openai';
  token?: string;
};

function config(): Required<Pick<EmbedConfig, 'url' | 'model' | 'schema'>> & { token?: string } {
  return {
    url: process.env.BAV_EMBED_URL ?? 'http://localhost:11434',
    model: process.env.BAV_EMBED_MODEL ?? DEFAULT_MODEL,
    schema: (process.env.BAV_EMBED_SCHEMA as 'openai' | 'ollama' | undefined) ?? 'ollama',
    token: process.env.BAV_BRAIN_TOKEN,
  };
}

export async function embedText(text: string, override?: EmbedConfig): Promise<number[]> {
  const cfg = { ...config(), ...override };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;

  const endpoint = cfg.schema === 'openai' ? '/v1/embeddings' : '/api/embeddings';
  const body =
    cfg.schema === 'openai'
      ? { model: cfg.model, input: text }
      : { model: cfg.model, prompt: text };

  const res = await fetch(`${cfg.url}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`embed upstream ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const json = (await res.json()) as
    | { embedding: number[] } // Ollama
    | { data: Array<{ embedding: number[] }> }; // OpenAI

  const vec =
    'embedding' in json
      ? json.embedding
      : json.data?.[0]?.embedding;

  if (!vec || vec.length !== EMBED_DIM) {
    throw new Error(`embed dim mismatch: got ${vec?.length ?? 0}, expected ${EMBED_DIM}`);
  }
  return vec;
}

export async function embedBatch(texts: string[], override?: EmbedConfig): Promise<number[][]> {
  // Ollama serves embeddings one-at-a-time over HTTP; parallelism is
  // bounded to keep the upstream responsive + not starve other callers.
  const CONCURRENCY = 4;
  const out: number[][] = new Array(texts.length);
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const slice = texts.slice(i, i + CONCURRENCY);
    const results = await Promise.all(slice.map((t) => embedText(t, override)));
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r) out[i + j] = r;
    }
  }
  return out;
}

/**
 * Hash-based deterministic fake embedding for dev + tests when no
 * upstream is available. NEVER use in production — retrieval quality
 * is random. Gate behind explicit BAV_EMBED_MODE=stub so it can't leak.
 */
export function stubEmbed(text: string): number[] {
  const vec = new Array(EMBED_DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    vec[i % EMBED_DIM] = (vec[i % EMBED_DIM] + (c / 128 - 0.5)) / 2;
  }
  // L2-normalise so cosine similarity still behaves.
  const mag = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / mag);
}

export function shouldStub(): boolean {
  return process.env.BAV_EMBED_MODE === 'stub';
}

export { EMBED_DIM };
