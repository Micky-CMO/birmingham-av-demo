/**
 * Build the BAV brain KB index.
 *
 * Walks content/kb/*.md, chunks each file by H2/H3, embeds each chunk
 * via the upstream embedding service (mickai-embed by default), and
 * writes content/kb-index.json with all chunks + their embeddings.
 *
 * Run with:
 *   BAV_EMBED_URL=http://brain.local:11434 \
 *   BAV_EMBED_MODEL=mickai-embed:latest \
 *   pnpm tsx scripts/kb/build-index.ts
 *
 * Or, for local dev without an LLM server, use the deterministic stub:
 *   BAV_EMBED_MODE=stub pnpm tsx scripts/kb/build-index.ts
 *
 * The stub is unsuitable for production retrieval — it's only there so
 * the rest of the pipeline compiles + loads during development.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chunkMarkdown, type KbChunk } from '../../apps/web/lib/brain/chunker.ts';
import { embedBatch, shouldStub, stubEmbed, EMBED_DIM } from '../../apps/web/lib/brain/embed.ts';

type IndexedChunk = KbChunk & { embedding: number[] };

type KbIndex = {
  version: number;
  built_at: string;
  embed_model: string;
  embed_dim: number;
  chunks: IndexedChunk[];
};

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const KB_DIR = path.join(REPO_ROOT, 'content', 'kb');
const INDEX_PATH = path.join(REPO_ROOT, 'content', 'kb-index.json');

function readKbFiles(): Array<{ fileName: string; raw: string }> {
  if (!fs.existsSync(KB_DIR)) {
    throw new Error(`KB directory not found: ${KB_DIR}`);
  }
  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ fileName: f, raw: fs.readFileSync(path.join(KB_DIR, f), 'utf8') }));
}

async function main() {
  console.log('[kb] reading files from', KB_DIR);
  const files = readKbFiles();
  console.log(`[kb] found ${files.length} markdown files`);

  const allChunks: KbChunk[] = [];
  for (const f of files) {
    const chunks = chunkMarkdown(f.fileName, f.raw);
    console.log(`[kb]   ${f.fileName} → ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  console.log(`[kb] total ${allChunks.length} chunks; embedding…`);

  const useStub = shouldStub();
  const model = useStub
    ? 'stub-embed-dev'
    : process.env.BAV_EMBED_MODEL ?? 'mickai-embed:latest';

  let embeddings: number[][];
  const started = Date.now();
  if (useStub) {
    embeddings = allChunks.map((c) => stubEmbed(c.text));
    console.log('[kb] (stub embeddings — NOT for production)');
  } else {
    embeddings = await embedBatch(allChunks.map((c) => c.text));
  }
  console.log(`[kb] embedded ${embeddings.length} chunks in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  const indexed: IndexedChunk[] = allChunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));
  const index: KbIndex = {
    version: 1,
    built_at: new Date().toISOString(),
    embed_model: model,
    embed_dim: EMBED_DIM,
    chunks: indexed,
  };

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 0));
  const sizeMb = (fs.statSync(INDEX_PATH).size / 1e6).toFixed(2);
  console.log(`[kb] wrote ${INDEX_PATH} (${sizeMb} MB, ${indexed.length} chunks)`);
}

main().catch((err) => {
  console.error('[kb] build failed:', err);
  process.exit(1);
});
