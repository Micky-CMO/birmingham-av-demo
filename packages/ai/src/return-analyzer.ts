import { z } from 'zod';
import { anthropic, modelAnalysis } from './client';
import { RETURN_ANALYST_SYSTEM_PROMPT } from './prompts';

export const ReturnAnalysisInput = z.object({
  returnId: z.string(),
  builderId: z.string(),
  productId: z.string(),
  reason: z.string(),
  reasonDetails: z.string().optional(),
  orderContext: z.object({ orderNumber: z.string(), purchasedAt: z.string(), priceGbp: z.number() }),
  builderHistory: z.object({
    unitsBuilt90d: z.number(),
    unitsSold90d: z.number(),
    rmaCount90d: z.number(),
    rmaRate90d: z.number(),
    priorFlags: z.array(z.object({ code: z.string(), severity: z.string(), raisedAt: z.string() })),
    qualityScore: z.number(),
  }),
});
export type ReturnAnalysisInput = z.infer<typeof ReturnAnalysisInput>;

export const ReturnAnalysisOutput = z.object({
  severity: z.number().min(0).max(1),
  rootCauseGuess: z.string(),
  categoryTags: z.array(z.string()),
  builderRiskScore: z.number().min(0).max(1),
  patternFlags: z.array(
    z.object({ patternCode: z.string(), confidence: z.number().min(0).max(1), related: z.array(z.string()) }),
  ),
  recommendedAction: z.enum(['approve_refund', 'approve_replace', 'reject', 'escalate_to_owner', 'request_more_info']),
  rationale: z.string(),
});
export type ReturnAnalysisOutput = z.infer<typeof ReturnAnalysisOutput>;

export async function analyseReturn(input: ReturnAnalysisInput): Promise<{
  analysis: ReturnAnalysisOutput;
  tokensIn: number;
  tokensOut: number;
  model: string;
}> {
  const parsed = ReturnAnalysisInput.parse(input);
  const response = await anthropic.messages.create({
    model: modelAnalysis,
    max_tokens: 1024,
    system: RETURN_ANALYST_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(parsed, null, 2) }],
  });

  const text = response.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { text: string }).text)
    .join('');

  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart < 0 || jsonEnd < 0) throw new Error('Return analyst did not produce JSON');
  const raw = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  const analysis = ReturnAnalysisOutput.parse(raw);

  return {
    analysis,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
    model: response.model,
  };
}
