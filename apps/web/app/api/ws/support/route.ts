/**
 * WebSocket placeholder.
 *
 * Next.js App Router does not natively support WebSockets via route handlers.
 * The production architecture is to run `ws` on a dedicated Node process
 * (see `apps/web/lib/ws-server.ts`) behind a reverse proxy. In serverless
 * deployments, use API Gateway WebSocket or a managed service like Ably/Pusher.
 *
 * For local dev, `apps/web/lib/ws-server.ts` can be booted alongside Next
 * via a custom server script, or via Pusher/Ably for dev convenience.
 *
 * This HTTP route returns a 426 Upgrade Required so callers get a clear signal.
 */
export async function GET() {
  return new Response('Upgrade to WebSocket required. See apps/web/lib/ws-server.ts.', {
    status: 426,
    headers: { 'Content-Type': 'text/plain', Connection: 'Upgrade', Upgrade: 'websocket' },
  });
}

export const runtime = 'nodejs';
