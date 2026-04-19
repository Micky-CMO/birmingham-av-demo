import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';

export const dynamic = 'force-static';
export const revalidate = 3600;

type JournalFrontmatter = {
  title: string;
  dek?: string;
  description?: string;
  date: string;
  readMinutes?: number;
  author?: string;
  category?: string;
  heroBuildNumber?: string;
};

const CONTENT_DIR = path.join(process.cwd(), '..', '..', 'content', 'journal');

function slugFromFilename(filename: string): string {
  return filename.replace(/\.(mdx|md)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

async function findArticleBySlug(slug: string): Promise<{
  frontmatter: JournalFrontmatter;
  body: string;
} | null> {
  let entries: string[];
  try {
    entries = await readdir(CONTENT_DIR);
  } catch {
    return null;
  }
  const match = entries.find(
    (f) => (f.endsWith('.mdx') || f.endsWith('.md')) && slugFromFilename(f) === slug,
  );
  if (!match) return null;

  const raw = await readFile(path.join(CONTENT_DIR, match), 'utf8');
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  if (!data.title || !data.date) return null;

  return {
    frontmatter: {
      title: String(data.title),
      dek: data.dek ? String(data.dek) : data.description ? String(data.description) : undefined,
      description: data.description ? String(data.description) : undefined,
      date: new Date(String(data.date)).toISOString().slice(0, 10),
      readMinutes: data.readMinutes ? Number(data.readMinutes) : undefined,
      author: data.author ? String(data.author) : undefined,
      category: data.category ? String(data.category) : undefined,
      heroBuildNumber: data.heroBuildNumber ? String(data.heroBuildNumber) : undefined,
    },
    body: parsed.content,
  };
}

export async function generateStaticParams() {
  try {
    const entries = await readdir(CONTENT_DIR);
    return entries
      .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
      .map((f) => ({ slug: slugFromFilename(f) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await findArticleBySlug(params.slug);
  if (!article) {
    return {
      title: 'Article not found — Birmingham AV',
      description: 'This journal entry is no longer available.',
    };
  }
  return {
    title: `${article.frontmatter.title} — Birmingham AV`,
    description: article.frontmatter.dek ?? article.frontmatter.description ?? undefined,
  };
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function JournalArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await findArticleBySlug(params.slug);
  if (!article) notFound();

  const { frontmatter, body } = article;
  const byline = [
    frontmatter.author ? `Written by ${frontmatter.author}` : null,
    frontmatter.readMinutes ? `${frontmatter.readMinutes} minute read` : null,
    formatDateLong(frontmatter.date),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="bg-paper text-ink">
      {/* HERO */}
      <header className="bav-fade mx-auto max-w-[1040px] px-6 pb-16 pt-32 md:px-12">
        {(frontmatter.category || frontmatter.author) && (
          <div className="bav-label mb-8 text-ink-60">
            — Journal{frontmatter.category ? ` · ${frontmatter.category}` : ''}
          </div>
        )}
        <h1 className="m-0 font-display font-light tracking-[-0.02em] text-[clamp(48px,6vw,80px)] leading-[1.02]">
          {frontmatter.title}
        </h1>
        {frontmatter.dek && (
          <p className="mb-0 mt-8 max-w-[720px] text-[17px] leading-[1.6] text-ink-60">
            {frontmatter.dek}
          </p>
        )}
        {byline && (
          <div className="mt-12 border-t border-ink-10 pt-6">
            <span className="bav-label text-ink-30">{byline}</span>
          </div>
        )}
      </header>

      {/* Hero canvas */}
      {frontmatter.heroBuildNumber && (
        <div className="mx-auto max-w-[1040px] px-6 pb-16 md:px-12">
          <div className="bav-canvas grid aspect-[16/9] place-items-center">
            <span className="relative z-[1] font-display font-light tracking-[-0.04em] text-ink text-[clamp(180px,24vw,320px)] leading-[0.8]">
              <span className="bav-italic">№</span>
              {frontmatter.heroBuildNumber}
            </span>
          </div>
        </div>
      )}

      {/* BODY */}
      <section className="mx-auto max-w-[1040px] px-6 pb-24 md:px-12">
        <div className="grid gap-12 md:grid-cols-[4fr_8fr]">
          <aside>
            <div className="sticky top-24">
              <div className="bav-label text-ink-60">— Reading</div>
              {frontmatter.readMinutes && (
                <p className="mt-5 text-[13px] leading-[1.55] text-ink-30">
                  {frontmatter.readMinutes}-minute read. Open in a quiet tab.
                </p>
              )}
            </div>
          </aside>
          <div className="bav-journal-prose">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <MDXRemote source={body} />
          </div>
        </div>
      </section>

      {/* Back to journal */}
      <section className="mx-auto max-w-[1040px] px-6 pb-32 md:px-12">
        <div className="border-t border-ink-10 pt-10">
          <Link href="/journal" className="bav-underline text-[13px] text-ink no-underline">
            <span>← Back to the journal</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
