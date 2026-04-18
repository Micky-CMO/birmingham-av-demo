import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropic, modelSupport } from './client.js';
import { SUPPORT_SYSTEM_PROMPT } from './prompts.js';

export const SupportTurnInputSchema = z.object({
  ticketId: z.string(),
  userId: z.string(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    }),
  ),
});

export type SupportToolHandlers = {
  lookup_order?: (args: { order_number: string }) => Promise<unknown> | unknown;
  lookup_product?: (args: { slug_or_sku: string }) => Promise<unknown> | unknown;
  lookup_user_orders?: (args: { user_id: string }) => Promise<unknown> | unknown;
  check_stock?: (args: { product_id: string }) => Promise<unknown> | unknown;
  escalate_to_human?: (args: {
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) => Promise<unknown> | unknown;
};

export type SupportTurnInput = z.infer<typeof SupportTurnInputSchema> & {
  toolHandlers?: SupportToolHandlers;
};

export type SupportTurnOutput = {
  reply: string;
  escalated: boolean;
  tokensIn: number;
  tokensOut: number;
  model: string;
};

// ------------ Provider routing ------------
// Priority: Anthropic Claude (if key) → Google Gemini free tier (if key) → rule-based
// The rule-based fallback always works without any API key so the demo never breaks.

export async function runSupportTurn(input: SupportTurnInput): Promise<SupportTurnOutput> {
  SupportTurnInputSchema.parse({ ticketId: input.ticketId, userId: input.userId, history: input.history });

  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'missing-key-set-ANTHROPIC_API_KEY') {
    try {
      return await runClaude(input);
    } catch (err) {
      console.warn('[support] claude failed, falling back:', (err as Error).message);
    }
  }

  if (process.env.GOOGLE_GENAI_API_KEY) {
    try {
      return await runGemini(input);
    } catch (err) {
      console.warn('[support] gemini failed, falling back:', (err as Error).message);
    }
  }

  return runRuleBased(input);
}

// ------------ Claude (Anthropic) ------------

const TOOL_DEFS: Anthropic.Tool[] = [
  {
    name: 'escalate_to_human',
    description: 'Escalate the ticket to a human agent. Flips ticket status and fires the Telegram webhook.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      },
      required: ['reason', 'severity'],
    },
  },
];

async function runClaude(input: SupportTurnInput): Promise<SupportTurnOutput> {
  const messages: Anthropic.MessageParam[] = input.history.map((m) => ({
    role: m.role === 'system' ? 'user' : m.role,
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: modelSupport,
    max_tokens: 1024,
    system: SUPPORT_SYSTEM_PROMPT,
    tools: TOOL_DEFS,
    messages,
  });

  let reply = '';
  let escalated = false;

  for (const block of response.content) {
    if (block.type === 'text') reply += block.text;
    if (block.type === 'tool_use' && block.name === 'escalate_to_human') {
      escalated = true;
      const handler = input.toolHandlers?.escalate_to_human;
      if (handler) {
        const args = block.input as { reason: string; severity: 'low' | 'medium' | 'high' | 'critical' };
        await handler(args);
      }
    }
  }

  return {
    reply: reply.trim(),
    escalated,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
    model: response.model,
  };
}

// ------------ Gemini (Google free tier) ------------

async function runGemini(input: SupportTurnInput): Promise<SupportTurnOutput> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY!;
  const model = process.env.GOOGLE_GENAI_MODEL ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = input.history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SUPPORT_SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

  // Simple keyword escalation — Gemini can't call tools in v1beta freely, so we check the reply.
  const shouldEscalate = /i(?:'ll| will) raise this with|escalate|human agent|pass you to a team/i.test(reply);
  let escalated = false;
  if (shouldEscalate && input.toolHandlers?.escalate_to_human) {
    escalated = true;
    await input.toolHandlers.escalate_to_human({
      reason: 'AI judged this needs a human.',
      severity: 'medium',
    });
  }

  return {
    reply: reply.trim() || 'Thanks — someone will follow up shortly.',
    escalated,
    tokensIn: data.usageMetadata?.promptTokenCount ?? 0,
    tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0,
    model: `google/${model}`,
  };
}

// ------------ Rule-based responder (ALWAYS works, no API key) ------------
// Matches on keyword patterns and returns on-brand support copy. Not AI,
// but convincing enough for a demo and genuinely useful for common questions.

type Rule = {
  match: RegExp;
  reply: string;
  escalate?: boolean;
};

const RULES: Rule[] = [
  // Greetings
  {
    match: /^(hi|hello|hey|good (?:morning|afternoon|evening)|yo|hiya)\b/i,
    reply:
      'Hi there. I can help with orders, specs, returns, warranty, delivery, or picking the right PC. What do you need?',
  },
  // Delivery / shipping
  {
    match: /\b(delivery|shipping|post|courier|arrive|when will|how long|dispatch)\b/i,
    reply:
      'UK mainland orders placed before 3pm ship same day for next-working-day delivery. Highlands and Islands typically 2 working days. Tracking arrives by email and SMS as soon as your parcel leaves the hub.',
  },
  // Returns
  {
    match: /\b(return|refund|send it back|cancel my order|change.?mind|rma)\b/i,
    reply:
      'No problem. You have 30 days from delivery to return any order under the UK Consumer Contracts Regulations, and our 12-month warranty covers faults beyond that. Start a return from your account or at /returns/new — we arrange courier collection and process refunds within 5 working days.',
  },
  // Warranty
  {
    match: /\b(warranty|guarantee|broken|faulty|stopped working|dead on arrival|doa)\b/i,
    reply:
      'Every Birmingham AV machine ships with a 12-month parts and labour warranty. If something has gone wrong, raise a claim at /warranty or start a return and we will courier it back for diagnosis inside 48 hours. Repair or replace either way — you are covered.',
    escalate: true,
  },
  // Payment methods
  {
    match: /\b(pay|payment|card|stripe|paypal|klarna|apple pay|google pay|finance)\b/i,
    reply:
      'We accept all major cards via Stripe, plus PayPal and Klarna on orders over £100. We never see your full card number — all payments are fully encrypted.',
  },
  // Condition grades
  {
    match: /\b(condition|grade|refurbished|like new|quality|used)\b/i,
    reply:
      'Every unit ships with a condition grade: Like New, Excellent, Very Good, or Good. All pass our 7-stage bench QC (POST, burn-in, thermal, memtest, GPU stress, disk, peripherals). Warranty is identical across every grade — only cosmetic variation changes the price.',
  },
  // Specs / gaming
  {
    match: /\b(gaming|fortnite|valorant|warzone|cod|fps|minecraft|rtx|gtx|spec|performance)\b/i,
    reply:
      'Every gaming build lists benchmark results on its product page — Geekbench, Cinebench, and 3DMark numbers alongside real-game frame rates. Browse /shop/gaming-pc-bundles and click any rig to see full specs and expected FPS at 1080p / 1440p.',
  },
  // Order status
  {
    match: /\b(order (?:status|number|update)|track (?:my|the) order|where is my|my order)\b/i,
    reply:
      'To check order status, sign in and visit /orders — you\'ll see real-time status (paid, queued, in build, QC, shipped, delivered) plus the builder assigned to your unit. If you have a specific order number, share it and I\'ll raise it with the team.',
    escalate: true,
  },
  // Builders
  {
    match: /\b(builder|who built|who is making|hand.?built|assembled by|technician)\b/i,
    reply:
      'Every machine is assembled by one of 22 in-house builders, and their name goes on the warranty card. You can view the full roster at /builders, pick a specific builder at checkout (like choosing a barber), and see their quality score, queue depth, and wait time live.',
  },
  // Upgrades
  {
    match: /\b(upgrade|add more ram|add ssd|change cpu|mod|customise|custom)\b/i,
    reply:
      'Yes — most machines can be spec\'d up after purchase. Share your order number and the upgrade you want (RAM, SSD, GPU) and we\'ll quote the parts + fitting fee. Most upgrades turn around in 3 working days.',
    escalate: true,
  },
  // Pricing / discount / deal
  {
    match: /\b(discount|deal|voucher|code|cheaper|price match|negotiate|bundle)\b/i,
    reply:
      'Use WELCOME10 for 10% off your first order over £50. We also run bundle pricing on peripheral add-ons (monitor + keyboard + mouse) — visible on the gaming bundle pages.',
  },
  // Trade / volume / B2B
  {
    match: /\b(trade|b2b|bulk|volume|quote|business|school|office|charity|procurement)\b/i,
    reply:
      'We run a dedicated trade programme for businesses, schools, and charities. Email trade@birmingham-av.com with your requirement (rough volume, timeline, budget) and the team quotes inside one working day.',
    escalate: true,
  },
  // Contact / human
  {
    match: /\b(human|real person|speak to (?:someone|a person|staff)|manager|complaint|frustrated|angry|legal|lawyer|ombudsman)\b/i,
    reply:
      'Of course — I\'ll raise this with the team right now. Someone will pick up inside working hours and follow up at the email on your account. If it is urgent, ring us or drop a note to support@birmingham-av.com.',
    escalate: true,
  },
  // Generic spec question
  {
    match: /\b(what.?s the best|recommend|which one|help me choose|best pc for|under £|less than)\b/i,
    reply:
      'Happy to help. A quick shape: for general work + light gaming under £600, look at Ryzen 5 / Core i5 builds with a GTX 1660 or better. For serious gaming £900-1500, target Core i7 or Ryzen 7 with an RTX 4060 Ti or above. For video editing and creator work, prioritise RAM (32GB+) and NVMe storage. Share what you do day-to-day and I can narrow it down further.',
  },
];

function runRuleBased(input: SupportTurnInput): SupportTurnOutput {
  const lastUserMessage = [...input.history].reverse().find((m) => m.role === 'user')?.content ?? '';
  const normalized = lastUserMessage.trim();

  // Very short greeting
  if (!normalized) {
    return {
      reply: 'Hi. What can I help with today?',
      escalated: false,
      tokensIn: 0,
      tokensOut: 0,
      model: 'rule-based',
    };
  }

  for (const rule of RULES) {
    if (rule.match.test(normalized)) {
      let escalated = false;
      if (rule.escalate && input.toolHandlers?.escalate_to_human) {
        const severity: 'low' | 'medium' | 'high' | 'critical' = /angry|legal|lawyer|ombudsman|frustrated/i.test(
          normalized,
        )
          ? 'high'
          : 'medium';
        void input.toolHandlers.escalate_to_human({
          reason: `Matched rule "${rule.match.source.slice(0, 60)}"`,
          severity,
        });
        escalated = true;
      }
      return {
        reply: rule.reply,
        escalated,
        tokensIn: Math.ceil(normalized.length / 4),
        tokensOut: Math.ceil(rule.reply.length / 4),
        model: 'rule-based',
      };
    }
  }

  // Unmatched — escalate politely and let staff pick up
  const genericReply =
    'Good question — I want to make sure you get the right answer, so I\'ll raise this with the team. They typically respond within two hours during UK working hours. Could you share a bit more detail so we can help faster?';
  if (input.toolHandlers?.escalate_to_human) {
    void input.toolHandlers.escalate_to_human({
      reason: 'Rule-based responder had no confident match — human pick-up requested.',
      severity: 'low',
    });
  }
  return {
    reply: genericReply,
    escalated: true,
    tokensIn: Math.ceil(normalized.length / 4),
    tokensOut: Math.ceil(genericReply.length / 4),
    model: 'rule-based',
  };
}
