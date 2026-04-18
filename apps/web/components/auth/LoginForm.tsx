'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@/components/ui';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeySupported, setPasskeySupported] = useState<boolean>(false);

  useEffect(() => {
    setPasskeySupported(
      typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function',
    );
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = (await res.json()) as { ok?: boolean; role?: string; error?: { message: string } };
      if (!res.ok || !data.ok) {
        setError(data.error?.message ?? 'Sign-in failed');
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError('Network error. Try again.');
      setLoading(false);
    }
  }

  async function signInWithPasskey() {
    setError(null);
    setPasskeyLoading(true);
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');

      // If the identifier looks like an email we pass it along so the server
      // can pre-populate allowCredentials; otherwise we do a usernameless flow.
      const maybeEmail = identifier.includes('@') ? identifier.trim().toLowerCase() : undefined;

      const optsRes = await fetch('/api/auth/passkey/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maybeEmail ? { email: maybeEmail } : {}),
      });
      const optsData = (await optsRes.json()) as {
        options?: Parameters<typeof startAuthentication>[0]['optionsJSON'];
        error?: { message: string };
      };
      if (!optsRes.ok || !optsData.options) {
        throw new Error(optsData.error?.message ?? 'Could not start passkey sign-in');
      }

      const assertion = await startAuthentication({ optionsJSON: optsData.options });

      const verifyRes = await fetch('/api/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: assertion }),
      });
      const verifyData = (await verifyRes.json()) as {
        userId?: string;
        role?: string;
        error?: { message: string };
      };
      if (!verifyRes.ok || !verifyData.userId) {
        throw new Error(verifyData.error?.message ?? 'Passkey sign-in failed');
      }

      const isStaff = ['support_staff', 'admin', 'super_admin', 'builder'].includes(
        verifyData.role ?? '',
      );
      // Respect ?next= for staff; for customers send them to their account page.
      const destination = isStaff ? next : '/account';
      router.push(destination);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Passkey sign-in failed';
      if (/cancelled|NotAllowedError|aborted/i.test(msg)) {
        // User dismissed the native prompt — stay silent.
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block font-mono text-caption uppercase tracking-[0.2em] text-ink-500">
          Username or email
        </span>
        <Input
          type="text"
          autoComplete="username webauthn"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Hamza2026"
          required
          autoFocus
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-mono text-caption uppercase tracking-[0.2em] text-ink-500">Password</span>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </label>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-semantic-critical/30 bg-semantic-critical/10 px-3 py-2 text-small text-semantic-critical"
        >
          {error}
        </motion.div>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Sign in
      </Button>

      {passkeySupported && (
        <>
          <div className="flex items-center gap-3 text-caption text-ink-500">
            <span className="h-px flex-1 bg-ink-300/60 dark:bg-obsidian-500/60" />
            <span className="font-mono uppercase tracking-[0.2em]">or</span>
            <span className="h-px flex-1 bg-ink-300/60 dark:bg-obsidian-500/60" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            loading={passkeyLoading}
            onClick={signInWithPasskey}
            className="w-full"
          >
            Sign in with passkey
          </Button>
          <p className="text-center text-caption text-ink-500">
            Use Touch ID, Face ID, Windows Hello, or a security key.
          </p>
        </>
      )}

      <p className="pt-2 text-center text-caption text-ink-500">
        Need access? Talk to Micky.
      </p>
    </form>
  );
}
