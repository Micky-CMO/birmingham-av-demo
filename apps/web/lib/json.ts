import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type z } from 'zod';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function bad(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { message, ...extra } }, { status });
}

export function parseQuery<S extends ZodTypeAny>(request: Request, schema: S): z.infer<S> {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) raw[k] = v;
  try {
    return schema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) throw new ValidationError(err);
    throw err;
  }
}

export async function parseBody<S extends ZodTypeAny>(request: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError(new ZodError([{ code: 'custom', message: 'invalid JSON', path: [] }]));
  }
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) throw new ValidationError(err);
    throw err;
  }
}

export class ValidationError extends Error {
  constructor(public zod: ZodError) {
    super('validation failed');
  }
}

export function handleError(err: unknown): Response {
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: { message: 'validation failed', details: err.zod.flatten() } }, { status: 400 });
  }
  console.error('[api] unhandled', err);
  return NextResponse.json({ error: { message: 'internal error' } }, { status: 500 });
}
