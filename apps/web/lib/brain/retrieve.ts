/**
 * In-memory cosine-similarity retrieval over the pre-built KB index.
 *
 * Scale: 18 files × ~30 chunks each ≈ 500 chunks, 768-dim each.
 * That's ~1.5 MB of floats; fits comfortably in a Node process's memory.
 * Cosine over 500 vectors takes under 20ms on a cold start of the
 * lambda, well inside a streaming-response first-byte budget.
 *
 * Index format on disk (content/kb-index.json):
 * {
 *   version: 1,
 *   built_at: ISO string,
 *   embed_model: 'mickai-embed:latest',
 *   embed_dim: 768,
 *   chunks: [{ id, file, category, tags[], headingPath[], text, tokens, embedding: number[] }]
 * }
 */

import fs from 'node:fs';
import path from 'node:path';
import type { KbChunk } from './chunker';

type IndexedChunk = KbChunk & { embedding: number[] };

export type KbIndex = {
  version: number;
  built_at: string;
  embed_model: string;
  embed_dim: number;
  chunks: IndexedChunk[];
};

export type Retrieval = {
  chunk: IndexedChunk;
  score: number;
};

let cached: KbIndex | null = null;

function indexPath(): string {
  return path.join(process.cwd(), 'content', 'kb-index.json');
}

export function loadIndex(): KbIndex | null {
  if (cached) return cached;
  const p = indexPath();
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    cached = JSON.parse(raw) as KbIndex;
    return cached;
  } catch (err) {
    console.error('[kb] index load failed', (err as Error).message);
    return null;
  }
}

export function indexStats(): { chunks: number; builtAt: string } | null {
  const idx = loadIndex();
  if (!idx) return null;
  return { chunks: idx.chunks.length, builtAt: idx.built_at };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    magA += ai * ai;
    magB += bi * bi;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export type RetrieveOptions = {
  topK?: number;
  /** Restrict to chunks whose category matches one of these. */
  categories?: string[];
  /** Only include chunks scoring above this threshold. */
  minScore?: number;
};

/**
 * Retrieve top-K chunks for a query embedding.
 */
export function retrieve(queryEmbedding: number[], opts: RetrieveOptions = {}): Retrieval[] {
  const idx = loadIndex();
  if (!idx) return [];
  const { topK = 6, categories, minScore = 0.15 } = opts;
  const filtered = categories
    ? idx.chunks.filter((c) => categories.includes(c.category))
    : idx.chunks;

  const scored: Retrieval[] = filtered
    .map((chunk) => ({ chunk, score: cosine(queryEmbedding, chunk.embedding) }))
    .filter((r) => r.score >= minScore);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Keyword-based retrieval for demo / stub mode. Scores each chunk by
 * term-frequency overlap with the query. Lightweight BM25-ish signal:
 * exact token hits + heading-path matches double-weighted. Use when
 * the index was built with stub embeddings (retrieval on random
 * vectors would return noise).
 */
export function retrieveByKeyword(query: string, opts: RetrieveOptions = {}): Retrieval[] {
  const idx = loadIndex();
  if (!idx) return [];
  const { topK = 6, categories } = opts;

  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9£\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

  if (queryTokens.length === 0) return [];

  const filtered = categories
    ? idx.chunks.filter((c) => categories.includes(c.category))
    : idx.chunks;

  const scored: Retrieval[] = filtered.map((chunk) => {
    const haystack = `${chunk.headingPath.join(' ')} ${chunk.text}`.toLowerCase();
    const pathStack = chunk.headingPath.join(' ').toLowerCase();
    let score = 0;
    for (const t of queryTokens) {
      // Count occurrences in full text (capped)
      const textHits = Math.min(5, (haystack.match(new RegExp(`\\b${escapeRe(t)}`, 'g')) ?? []).length);
      score += textHits;
      // Heading path hits are worth more
      if (pathStack.includes(t)) score += 3;
      // Category hit bonus
      if (chunk.category.toLowerCase().includes(t)) score += 2;
    }
    // Normalise by query length so longer queries aren't unfairly penalised
    return { chunk, score: score / Math.sqrt(queryTokens.length) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((r) => r.score > 0).slice(0, topK);
}

export function indexIsStub(): boolean {
  const idx = loadIndex();
  return idx?.embed_model === 'stub-embed-dev';
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const STOPWORDS = new Set([
  'the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had',
  'this', 'that', 'these', 'those', 'what', 'when', 'where', 'which', 'will',
  'with', 'from', 'your', 'about', 'into', 'over', 'only', 'can', 'could',
  'would', 'should', 'there', 'their', 'them', 'they', 'here',
  'how', 'why', 'who', 'whom', 'you', 'yours', 'ours', 'not', 'any', 'all',
  'some', 'more', 'most', 'less', 'much', 'many', 'few', 'been', 'being',
]);

/**
 * Format retrievals into a context block suitable for injecting into
 * the system prompt of the upstream LLM. Each chunk is labelled with
 * its heading path so the model knows what it's reading.
 */
export function formatContext(retrievals: Retrieval[]): string {
  if (retrievals.length === 0) return '';
  const parts = retrievals.map((r, i) => {
    const path = r.chunk.headingPath.join(' › ');
    return `[${i + 1}] ${path} (${r.chunk.file}, score ${r.score.toFixed(2)})\n${r.chunk.text}`;
  });
  return parts.join('\n\n---\n\n');
}
