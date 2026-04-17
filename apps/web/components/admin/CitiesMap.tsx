import { GlassCard } from '@/components/ui';
import type { CityCount } from '@/lib/services/dashboard';

export function CitiesMap({ cities }: { cities: CityCount[] }) {
  const max = Math.max(...cities.map((c) => c.orders), 1);
  return (
    <GlassCard className="p-6">
      <p className="font-mono text-caption uppercase tracking-widest text-ink-500">Where it ships</p>
      <ul className="mt-4 space-y-3">
        {cities.length === 0 && <li className="text-small text-ink-500">No shipping data yet.</li>}
        {cities.map((c) => (
          <li key={c.city}>
            <div className="flex items-baseline justify-between">
              <span className="text-small">{c.city}</span>
              <span className="font-mono text-caption text-ink-500 tabular-nums">{c.orders}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-100 dark:bg-obsidian-800">
              <div
                className="h-full rounded-full bg-brand-green transition-all duration-700 ease-unfold"
                style={{ width: `${(c.orders / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
