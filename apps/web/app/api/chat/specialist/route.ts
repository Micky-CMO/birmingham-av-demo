import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { embedText, shouldStub, stubEmbed } from '@/lib/brain/embed';
import { retrieve, retrieveByKeyword, formatContext, loadIndex, indexIsStub } from '@/lib/brain/retrieve';
import { detectPriceIntent } from '@/lib/brain/price-intent';
import { defaultImageFor } from '@/lib/services/products';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/chat/specialist
 *
 * Streaming specialist chat endpoint over the 18-file KB + live catalogue.
 *
 * Request body:
 *   { query: string, history?: {role:'user'|'assistant', content:string}[] }
 *
 * Response:
 *   Server-Sent Events (text/event-stream):
 *     event: retrieval  — debug: which KB chunks + products were selected
 *     event: token      — a single delta from the upstream LLM
 *     event: done       — end of stream
 *     event: error      — upstream failure
 *
 * Upstream LLM:
 *   BAV_BRAIN_URL        base URL (default http://localhost:11434)
 *   BAV_BRAIN_MODEL      default 'mickai-medium:latest'
 *   BAV_BRAIN_SCHEMA     'ollama' (default) | 'openai-chat'
 *   BAV_BRAIN_TOKEN      optional bearer
 */

type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string };

const BRAIN_URL = process.env.BAV_BRAIN_URL ?? 'http://localhost:11434';
const BRAIN_MODEL = process.env.BAV_BRAIN_MODEL ?? 'mickai-medium:latest';
const BRAIN_SCHEMA = (process.env.BAV_BRAIN_SCHEMA as 'openai-chat' | 'ollama' | 'anthropic' | undefined) ?? 'ollama';
const BRAIN_TOKEN = process.env.BAV_BRAIN_TOKEN;

const SYSTEM_PROMPT = `You are the Birmingham AV PC specialist. You help customers with:
- Hardware questions (CPUs, GPUs, RAM, storage, PSUs, cooling, cases)
- Networking (routers, switches, WiFi, cabling)
- Displays (monitors, projectors)
- Windows + Linux technical support, error codes, BSOD, boot repair
- Software troubleshooting
- BAV policies (returns, warranty, AV Care, shipping, trade-in, gift cards)
- Product recommendations from the BAV catalogue

Rules:
- British English (colour, catalogue, organisation, licence, realise).
- Plain, direct language. Short sentences. Active voice.
- When you recommend a specific product, say "from £X" based on the live catalogue context provided, never make up exact prices.
- If you don't know, say so. Escalate to human support via the /support form.
- Never fabricate error codes, registry keys, or shell commands.
- Use British examples (DPD, Royal Mail, John Lewis) over American ones.
- Refer to the KB context provided when relevant. Do not quote it verbatim — synthesise.
- Never tell users to run destructive commands (rm -rf /, format C:, etc.).

Response format:
- Answer directly in 1–3 short paragraphs for simple questions.
- For troubleshooting, use a numbered checklist.
- For product recommendations, list 2–3 options with brief justification.
- Finish with a single follow-up prompt if more info would help.`;

type RetrievedProduct = {
  slug: string;
  title: string;
  subtitle: string | null;
  priceGbp: number;
  categorySlug: string;
  stockQty: number;
  imageUrl: string;
};

async function queryLiveCatalogue(
  intent: ReturnType<typeof detectPriceIntent>,
  limit = 5,
): Promise<RetrievedProduct[]> {
  if (!intent.isPriceQuery) return [];
  try {
    const where: Record<string, unknown> = { isActive: true };
    if (intent.categories.length > 0) {
      where.category = { slug: { in: intent.categories } };
    }
    if (intent.keywords.length > 0) {
      where.OR = intent.keywords.map((k) => ({
        title: { contains: k, mode: 'insensitive' },
      }));
    }
    if (intent.maxGbp !== undefined) {
      where.priceGbp = { ...(where.priceGbp as object), lte: intent.maxGbp };
    }
    if (intent.minGbp !== undefined) {
      where.priceGbp = { ...(where.priceGbp as object), gte: intent.minGbp };
    }
    const rows = await prisma.product.findMany({
      where: where as never,
      orderBy: [{ isFeatured: 'desc' }, { priceGbp: 'asc' }],
      take: limit,
      include: {
        category: { select: { slug: true } },
        inventory: { select: { stockQty: true } },
      },
    });
    return rows.map((p) => ({
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle ?? null,
      priceGbp: Number(p.priceGbp),
      categorySlug: p.category?.slug ?? 'other',
      stockQty: p.inventory?.stockQty ?? 0,
      imageUrl: p.primaryImageUrl ?? defaultImageFor(p.category?.slug),
    }));
  } catch (err) {
    console.warn('[specialist] live catalogue query failed', (err as Error).message);
    return [];
  }
}

function formatProducts(products: RetrievedProduct[]): string {
  if (products.length === 0) return '';
  const lines = products.map((p, i) => {
    const stock = p.stockQty > 0 ? `${p.stockQty} in stock` : 'out of stock';
    return `[P${i + 1}] ${p.title}${p.subtitle ? ` — ${p.subtitle}` : ''}\n    £${p.priceGbp.toLocaleString('en-GB')} · ${stock} · /product/${p.slug}`;
  });
  return `Live catalogue matches:\n${lines.join('\n')}`;
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function streamFromUpstream(
  messages: ChatMsg[],
  onToken: (tok: string) => Promise<void>,
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (BRAIN_TOKEN) headers.Authorization = `Bearer ${BRAIN_TOKEN}`;

  if (BRAIN_SCHEMA === 'anthropic') {
    // Anthropic fallback path — used for Vercel demo when Mickai server
    // is unreachable. Uses the @anthropic-ai/sdk already in deps.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing for anthropic schema');
    const client = new Anthropic({ apiKey });
    const systemMsg = messages.find((m) => m.role === 'system')?.content ?? '';
    const convo = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    const stream = await client.messages.stream({
      model: process.env.BAV_BRAIN_ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemMsg,
      messages: convo,
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        await onToken(event.delta.text);
      }
    }
    return;
  }

  if (BRAIN_SCHEMA === 'openai-chat') {
    const res = await fetch(`${BRAIN_URL}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: BRAIN_MODEL, messages, stream: true, temperature: 0.3 }),
    });
    if (!res.ok || !res.body) throw new Error(`brain upstream ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) await onToken(delta);
        } catch {
          // skip malformed chunks — upstream buffering artifact
        }
      }
    }
    return;
  }

  // Ollama native chat streaming
  const res = await fetch(`${BRAIN_URL}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: BRAIN_MODEL, messages, stream: true, options: { temperature: 0.3 } }),
  });
  if (!res.ok || !res.body) throw new Error(`brain upstream ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        const content = parsed.message?.content ?? '';
        if (content) await onToken(content);
        if (parsed.done) return;
      } catch {
        // skip malformed
      }
    }
  }
}

export async function POST(request: Request) {
  let body: { query?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) return new Response('missing query', { status: 400 });

  const history: ChatMsg[] = Array.isArray(body.history)
    ? (body.history as ChatMsg[]).filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string',
      )
    : [];

  const index = loadIndex();
  const intent = detectPriceIntent(query);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      try {
        // 1) Retrieve KB chunks.
        // In stub mode (index built without a real embed server),
        // cosine over random vectors is noise, so fall back to
        // keyword-based retrieval. Both use the same chunk structure.
        let kbHits = [] as ReturnType<typeof retrieve>;
        if (index) {
          if (indexIsStub() || shouldStub()) {
            kbHits = retrieveByKeyword(query, { topK: 6 });
          } else {
            try {
              const queryVec = await embedText(query);
              kbHits = retrieve(queryVec, { topK: 6 });
            } catch (err) {
              console.warn('[specialist] embed upstream down, keyword fallback', (err as Error).message);
              kbHits = retrieveByKeyword(query, { topK: 6 });
            }
          }
        }

        // 2) Live catalogue lookup if this is a price query
        const products = await queryLiveCatalogue(intent);

        send('retrieval', {
          kbChunks: kbHits.map((r) => ({
            id: r.chunk.id,
            headingPath: r.chunk.headingPath,
            score: r.score,
          })),
          products: products.map((p) => ({ slug: p.slug, title: p.title, priceGbp: p.priceGbp })),
          intent: {
            isPriceQuery: intent.isPriceQuery,
            categories: intent.categories,
            keywords: intent.keywords,
            confidence: intent.confidence,
          },
        });

        // 3) Compose system prompt with retrieved context
        const kbContext = formatContext(kbHits);
        const productContext = formatProducts(products);
        const contextBlocks: string[] = [];
        if (kbContext) contextBlocks.push(`KB context:\n${kbContext}`);
        if (productContext) contextBlocks.push(productContext);

        const systemContent =
          contextBlocks.length > 0
            ? `${SYSTEM_PROMPT}\n\n---\n\n${contextBlocks.join('\n\n---\n\n')}`
            : SYSTEM_PROMPT;

        const messages: ChatMsg[] = [
          { role: 'system', content: systemContent },
          ...history.slice(-6), // cap recent history
          { role: 'user', content: query },
        ];

        // 4) Stream response
        await streamFromUpstream(messages, async (delta) => {
          send('token', { text: delta });
        });

        send('done', { ok: true });
      } catch (err) {
        console.error('[specialist] stream error', (err as Error).message);
        send('error', { message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export async function GET() {
  const index = loadIndex();
  return Response.json({
    ready: Boolean(index),
    chunks: index?.chunks.length ?? 0,
    builtAt: index?.built_at ?? null,
    embedModel: index?.embed_model ?? null,
    brainUrl: BRAIN_URL,
    brainModel: BRAIN_MODEL,
  });
}
