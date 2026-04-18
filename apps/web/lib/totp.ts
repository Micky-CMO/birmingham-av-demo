import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Minimal RFC 6238 TOTP helper (HMAC-SHA1, 30s step, 6 digits).
 *
 * We avoid the `otpauth` dependency to keep the dep surface small. The algorithm
 * is a textbook implementation suitable for a single-server admin console. Secrets
 * are stored as plain base32 in `user.mfaSecret`; production should encrypt at rest.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // RFC 4648 base32

export function generateBase32Secret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

/** Build an otpauth:// URL (scan with Google Authenticator, 1Password, etc). */
export function buildOtpAuthUrl(params: {
  secret: string;
  label: string;
  issuer: string;
}): string {
  const { secret, label, issuer } = params;
  const encodedLabel = encodeURIComponent(`${issuer}:${label}`);
  const search = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${encodedLabel}?${search.toString()}`;
}

/** Return the 6-digit TOTP code for the given secret + unix time. */
export function totp(secret: string, atMs: number = Date.now()): string {
  const counter = Math.floor(atMs / 1000 / 30);
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  // 64-bit big-endian counter
  msg.writeUInt32BE(Math.floor(counter / 0x1_0000_0000), 0);
  msg.writeUInt32BE(counter & 0xffff_ffff, 4);
  const h = createHmac('sha1', key).update(msg).digest();
  // Dynamic truncation per RFC 4226 §5.3. Byte accesses are guaranteed in
  // range for a 20-byte SHA1 digest, but noUncheckedIndexedAccess requires
  // local assertions.
  const last = h[h.length - 1];
  if (last === undefined) throw new Error('totp: empty hmac');
  const offset = last & 0x0f;
  const b0 = h[offset];
  const b1 = h[offset + 1];
  const b2 = h[offset + 2];
  const b3 = h[offset + 3];
  if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) {
    throw new Error('totp: hmac shorter than expected');
  }
  const code = ((b0 & 0x7f) << 24) | ((b1 & 0xff) << 16) | ((b2 & 0xff) << 8) | (b3 & 0xff);
  return (code % 1_000_000).toString().padStart(6, '0');
}

/** Verify a user-entered code against a secret with ±1 step tolerance (~30s drift). */
export function verifyTotp(secret: string, code: string, atMs: number = Date.now()): boolean {
  const cleaned = code.replace(/\D/g, '');
  if (cleaned.length !== 6) return false;
  const tolerance = [-1, 0, 1];
  for (const step of tolerance) {
    const expected = totp(secret, atMs + step * 30_000);
    const a = Buffer.from(expected);
    const b = Buffer.from(cleaned);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

// --- base32 (RFC 4648, no padding on encode) ---

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, '').toUpperCase().replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
