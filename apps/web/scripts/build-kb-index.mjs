#!/usr/bin/env node
/**
 * Pure-ESM KB index builder. Lives inside apps/web/ so it can resolve
 * the gray-matter dep from apps/web/node_modules without needing tsx.
 *
 * Run with:
 *   node apps/web/scripts/build-kb-index.mjs
 *
 * Env:
 *   BAV_EMBED_URL    default http://localhost:11434 (Mickai engine)
 *   BAV_EMBED_MODEL  default mickai-embed:latest
 *   BAV_EMBED_SCHEMA 'ollama' (default) | 'openai'
 *   BAV_EMBED_MODE   'stub' to skip upstream calls (demo only)
 *   BAV_BRAIN_TOKEN  optional bearer
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import matter from 'gray-matter';

const EMBED_DIM = 768;

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..', '..');
const KB_DIR = path.join(REPO_ROOT, 'content', 'kb');
const INDEX_PATH = path.join(REPO_ROOT, 'content', 'kb-index.json');

// ---------- chunker (inlined from apps/web/lib/brain/chunker.ts) ----------

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function chunkMarkdown(fileName, raw) {
  const parsed = matter(raw);
  const fm = parsed.data ?? {};
  const content = parsed.content.trim();
  const fileSlug = fileName.replace(/\.md$/, '');
  const category = String(fm.category ?? 'uncategorised');
  const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];
  const chunks = [];

  const h2Parts = content.split(/\n(?=## )/);
  const intro = h2Parts[0];
  if (intro && !intro.startsWith('## ')) {
    const introText = intro.trim();
    if (introText.length > 40) {
      chunks.push({
        id: `${fileSlug}::intro`,
        file: fileName,
        category,
        tags,
        headingPath: [String(fm.title ?? fileSlug)],
        text: `# ${fm.title ?? fileSlug}\n\n${introText}`,
        tokens: estimateTokens(introText),
      });
    }
    h2Parts.shift();
  }

  for (const h2Block of h2Parts) {
    const h2Match = h2Block.match(/^## (.+?)$/m);
    if (!h2Match || !h2Match[1]) continue;
    const h2Title = h2Match[1].trim();
    const h2Slug = slugify(h2Title);
    const h2Body = h2Block.replace(/^## .+?$\n?/m, '').trim();

    const h3Parts = h2Body.split(/\n(?=### )/);
    const h3First = h3Parts[0];
    const leadText = h3First && !h3First.startsWith('### ') ? (h3Parts.shift() ?? '') : '';

    if (leadText.trim().length > 40) {
      chunks.push({
        id: `${fileSlug}::${h2Slug}`,
        file: fileName,
        category,
        tags,
        headingPath: [String(fm.title ?? fileSlug), h2Title],
        text: `## ${h2Title}\n\n${leadText.trim()}`,
        tokens: estimateTokens(leadText),
      });
    } else if (h3Parts.length === 0) {
      chunks.push({
        id: `${fileSlug}::${h2Slug}`,
        file: fileName,
        category,
        tags,
        headingPath: [String(fm.title ?? fileSlug), h2Title],
        text: `## ${h2Title}`,
        tokens: estimateTokens(h2Title),
      });
    }

    for (const h3Block of h3Parts) {
      const h3Match = h3Block.match(/^### (.+?)$/m);
      if (!h3Match || !h3Match[1]) continue;
      const h3Title = h3Match[1].trim();
      const h3Slug = slugify(h3Title);
      const h3Body = h3Block.replace(/^### .+?$\n?/m, '').trim();
      chunks.push({
        id: `${fileSlug}::${h2Slug}::${h3Slug}`,
        file: fileName,
        category,
        tags,
        headingPath: [String(fm.title ?? fileSlug), h2Title, h3Title],
        text: `### ${h3Title} (under ${h2Title})\n\n${h3Body}`,
        tokens: estimateTokens(h3Body),
      });
    }
  }

  return chunks;
}

// ---------- embed client ----------

function stubEmbed(text) {
  const vec = new Array(EMBED_DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    vec[i % EMBED_DIM] = (vec[i % EMBED_DIM] + (c / 128 - 0.5)) / 2;
  }
  const mag = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / mag);
}

async function embedUpstream(text, cfg) {
  const headers = { 'Content-Type': 'application/json' };
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
  if (!res.ok) throw new Error(`embed ${res.status}: ${await res.text().catch(() => '')}`);
  const json = await res.json();
  const vec = json.embedding ?? json.data?.[0]?.embedding;
  if (!vec || vec.length !== EMBED_DIM) {
    throw new Error(`embed dim mismatch: got ${vec?.length ?? 0}, expected ${EMBED_DIM}`);
  }
  return vec;
}

// ---------- main ----------

async function main() {
  const useStub = process.env.BAV_EMBED_MODE === 'stub';
  const cfg = {
    url: process.env.BAV_EMBED_URL ?? 'http://localhost:11434',
    model: process.env.BAV_EMBED_MODEL ?? 'mickai-embed:latest',
    schema: process.env.BAV_EMBED_SCHEMA === 'openai' ? 'openai' : 'ollama',
    token: process.env.BAV_BRAIN_TOKEN,
  };

  console.log(`[kb] reading ${KB_DIR}`);
  const files = fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ fileName: f, raw: fs.readFileSync(path.join(KB_DIR, f), 'utf8') }));
  console.log(`[kb] ${files.length} markdown files`);

  const allChunks = [];
  for (const f of files) {
    const chunks = chunkMarkdown(f.fileName, f.raw);
    console.log(`[kb]   ${f.fileName} → ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }
  console.log(`[kb] total ${allChunks.length} chunks; embedding via ${useStub ? 'STUB' : cfg.url}…`);

  const embeddings = new Array(allChunks.length);
  const started = Date.now();
  if (useStub) {
    for (let i = 0; i < allChunks.length; i++) embeddings[i] = stubEmbed(allChunks[i].text);
    console.log('[kb] (stub embeddings — NOT for production retrieval)');
  } else {
    const CONCURRENCY = 4;
    for (let i = 0; i < allChunks.length; i += CONCURRENCY) {
      const slice = allChunks.slice(i, i + CONCURRENCY);
      const results = await Promise.all(slice.map((c) => embedUpstream(c.text, cfg)));
      for (let j = 0; j < results.length; j++) embeddings[i + j] = results[j];
      process.stdout.write(`.`);
    }
    process.stdout.write('\n');
  }
  console.log(`[kb] embedded in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  const indexed = allChunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));
  const index = {
    version: 1,
    built_at: new Date().toISOString(),
    embed_model: useStub ? 'stub-embed-dev' : cfg.model,
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
