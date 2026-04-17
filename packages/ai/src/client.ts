import Anthropic from '@anthropic-ai/sdk';

// Lazy client. Never throw at import time - route handlers that never call the SDK
// (e.g. during Next's "collect page data" phase) would crash the build. Errors surface
// when a handler actually tries to use the client.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? 'missing-key-set-ANTHROPIC_API_KEY',
});

export const modelSupport = process.env.CLAUDE_MODEL_SUPPORT ?? 'claude-opus-4-7';
export const modelAnalysis = process.env.CLAUDE_MODEL_ANALYSIS ?? 'claude-sonnet-4-6';
