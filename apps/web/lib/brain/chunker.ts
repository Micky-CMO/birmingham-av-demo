/**
 * Markdown KB chunker.
 *
 * Reads a file from content/kb/*.md and returns an array of retrievable
 * chunks, one per H2 or H3 section. Each chunk is self-contained — it
 * carries the file's frontmatter context (title, category, tags) so
 * retrieval can use it without a second lookup.
 *
 * Chunk IDs are stable and deterministic: `<file-slug>::<slug-path>`.
 * Re-running the builder on an unchanged file produces the same IDs.
 */

import matter from 'gray-matter';

export type KbFrontmatter = {
  title: string;
  category: string;
  updated?: string;
  tags?: string[];
};

export type KbChunk = {
  id: string;
  file: string;
  category: string;
  tags: string[];
  headingPath: string[];
  text: string;
  tokens: number;
};

const SLUG_RE = /[^a-z0-9]+/g;

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(SLUG_RE, '-').replace(/^-|-$/g, '');
}

/**
 * Rough token estimate. Good enough for budgeting retrieval context —
 * we don't need tokenizer-exact since chunks are soft-capped at H2/H3
 * boundaries the KB brief enforced.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Parse a markdown file into chunks. One chunk per H2 block; if an H2
 * contains H3 subsections, each H3 becomes its own chunk and the H2
 * lead paragraph (before the first H3) becomes a separate chunk tagged
 * as the H2 summary.
 */
export function chunkMarkdown(fileName: string, raw: string): KbChunk[] {
  const parsed = matter(raw);
  const fm = parsed.data as Partial<KbFrontmatter>;
  const content = parsed.content.trim();

  const fileSlug = fileName.replace(/\.md$/, '');
  const category = String(fm.category ?? 'uncategorised');
  const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];

  const chunks: KbChunk[] = [];

  // Split on H2 boundaries. Lines starting with `## ` open a new section.
  const h2Parts = content.split(/\n(?=## )/);

  // Intro chunk — everything before the first H2, if any.
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

    // Split further on H3 within this H2.
    const h3Parts = h2Body.split(/\n(?=### )/);
    const h3First = h3Parts[0];
    const leadText = h3First && !h3First.startsWith('### ') ? (h3Parts.shift() ?? '') : '';

    // H2 lead chunk — the paragraph before any H3, if meaningful.
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
      // H2 with no body and no H3s — keep anyway for completeness.
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
