'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('bav-theme') as ThemeMode | null) ?? 'light';
  });
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveMode(mode));

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem('bav-theme', next);
    const r = resolveMode(next);
    setResolved(r);
    applyTheme(r);
  }, []);

  // Respond to OS changes when mode === 'system'
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r = mq.matches ? 'dark' : 'light';
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
