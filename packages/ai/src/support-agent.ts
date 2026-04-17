import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropic, modelSupport } from './client';
import { SUPPORT_SYSTEM_PROMPT } from './prompts';

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

const TOOL_DEFS: Anthropic.Tool[] = [
  {
    name: 'lookup_order',
    description: "Look up an order by its public order number. Returns status, items, and assigned builder.",
    input_schema: {
      type: 'object',
      properties: { order_number: { type: 'string' } },
      required: ['order_number'],
    },
  },
  {
    name: 'lookup_product',
    description: 'Look up a product by slug or SKU. Returns title, price, condition, and full specs.',
    input_schema: {
      type: 'object',
      properties: { slug_or_sku: { type: 'string' } },
      required: ['slug_or_sku'],
    },
  },
  {
    name: 'lookup_user_orders',
    description: "Fetch the current user's recent orders. Caller must pass the authenticated user id.",
    input_schema: {
      type: 'object',
      properties: { user_id: { type: 'string' } },
      required: ['user_id'],
    },
  },
  {
    name: 'check_stock',
    description: 'Check live stock level for a product id.',
    input_schema: {
      type: 'object',
      properties: { product_id: { type: 'string' } },
      required: ['product_id'],
    },
  },
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

export async function runSupportTurn(input: SupportTurnInput): Promise<SupportTurnOutput> {
  SupportTurnInputSchema.parse({ ticketId: input.ticketId, userId: input.userId, history: input.history });
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
