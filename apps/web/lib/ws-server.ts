/**
 * Standalone WebSocket server. Boot with `pnpm dlx tsx lib/ws-server.ts`.
 * In prod this runs as its own Node process (separate EKS pod) on port 8081.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'node:http';

type Room = string; // e.g. `ticket:${ticketId}` | `order:${orderId}` | `admin:activity`

const rooms = new Map<Room, Set<WebSocket>>();

function join(room: Room, socket: WebSocket) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(socket);
}
function leave(room: Room, socket: WebSocket) {
  rooms.get(room)?.delete(socket);
}

export function broadcast(room: Room, payload: unknown) {
  const sockets = rooms.get(room);
  if (!sockets) return;
  const frame = JSON.stringify(payload);
  for (const s of sockets) if (s.readyState === WebSocket.OPEN) s.send(frame);
}

const PORT = Number(process.env.WS_PORT ?? 8081);
const wss = new WebSocketServer({ port: PORT });
console.log(`[ws] listening on ${PORT}`);

wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
  let authed = false;
  const joined = new Set<Room>();

  socket.on('message', (raw) => {
    let msg: { type?: string; token?: string; room?: Room; payload?: unknown };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      socket.close(1003, 'bad frame');
      return;
    }

    if (!authed) {
      if (msg.type === 'auth' && msg.token) {
        // TODO: verify JWT against NEXTAUTH_SECRET. Accept in dev for now.
        authed = true;
        socket.send(JSON.stringify({ type: 'auth_ok' }));
        return;
      }
      socket.close(4401, 'unauthenticated');
      return;
    }

    if (msg.type === 'subscribe' && msg.room) {
      join(msg.room, socket);
      joined.add(msg.room);
      return;
    }
    if (msg.type === 'unsubscribe' && msg.room) {
      leave(msg.room, socket);
      joined.delete(msg.room);
      return;
    }
    if (msg.type === 'broadcast' && msg.room) {
      broadcast(msg.room, msg.payload);
      return;
    }
  });

  socket.on('close', () => {
    for (const r of joined) leave(r, socket);
  });
});
