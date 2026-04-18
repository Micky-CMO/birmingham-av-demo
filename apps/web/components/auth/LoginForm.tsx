'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@/components/ui';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block font-mono text-caption uppercase tracking-[0.2em] text-ink-500">
          Username or email
        </span>
        <Input
          type="text"
          autoComplete="username"
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

      <p className="pt-2 text-center text-caption text-ink-500">
        Need access? Talk to Micky.
      </p>
    </form>
  );
}
