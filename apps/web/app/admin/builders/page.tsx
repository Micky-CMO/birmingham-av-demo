import { Badge, GlassCard } from '@/components/ui';
import { getBuilderSummary } from '@/lib/services/builders';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export default async function BuildersPage() {
  const summary = await getBuilderSummary();

  return (
    <div>
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-h2 font-display">Builders</h1>
          <p className="mt-1 text-small text-ink-500">
            {summary.totals.totalBuilders} active · overall RMA {(summary.totals.overallRmaRate * 100).toFixed(2)}%
          </p>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
        <Totals label="Builders" value={summary.totals.totalBuilders.toString()} />
        <Totals label="Units 90d" value={summary.totals.totalUnitsSold.toLocaleString('en-GB')} />
        <Totals label="Revenue 90d" value={formatGbp(summary.totals.totalRevenueGbp)} tone="positive" />
        <Totals label="Margin 90d" value={formatGbp(summary.totals.totalMarginGbp)} tone="positive" />
        <Totals
          label="RMA rate"
          value={`${(summary.totals.overallRmaRate * 100).toFixed(2)}%`}
          tone={summary.totals.overallRmaRate > 0.04 ? 'critical' : undefined}
        />
        <Totals
          label="Flagged"
          value={summary.totals.flaggedCount.toString()}
          tone={summary.totals.flaggedCount > 0 ? 'critical' : undefined}
        />
      </div>

      <GlassCard className="mt-6 overflow-x-auto">
        <table className="w-full text-small">
          <thead className="border-b border-ink-300/50 text-caption text-ink-500 dark:border-obsidian-500/40">
            <tr>
              <th className="px-4 py-3 text-left">Builder</th>
              <th className="px-4 py-3 text-left">Tier</th>
              <th className="px-4 py-3 text-right">Units 90d</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Margin</th>
              <th className="px-4 py-3 text-right">ROI</th>
              <th className="px-4 py-3 text-right">RMA rate</th>
              <th className="px-4 py-3 text-right">Quality</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {summary.items.map((r) => (
              <tr key={r.builderId} className="border-b border-ink-300/40 last:border-0 hover:bg-ink-50/60 dark:border-obsidian-500/30 dark:hover:bg-obsidian-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-ink-100 dark:bg-obsidian-800" />
                    <div>
                      <div className="font-medium">{r.displayName}</div>
                      <div className="font-mono text-caption text-ink-500">{r.builderCode} · {r.warehouseNodeCode}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={`tier-${r.tier}` as 'tier-standard'}>{r.tier}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono">{r.unitsSold90d}</td>
                <td className="px-4 py-3 text-right font-mono">{formatGbp(r.revenueGbp90d)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatGbp(r.marginGbp90d)}</td>
                <td className="px-4 py-3 text-right font-mono">{r.roiPct90d.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right font-mono">
                  <span
                    className={
                      r.rmaRate90d > 0.04
                        ? 'text-semantic-critical'
                        : r.rmaRate90d > 0.02
                          ? 'text-semantic-warning'
                          : 'text-brand-green'
                    }
                  >
                    {(r.rmaRate90d * 100).toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{r.qualityScore.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  {r.flagged ? <Badge tone="critical">review</Badge> : <Badge tone="positive">healthy</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

function Totals({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'warning' | 'critical' }) {
  return (
    <GlassCard className="p-4">
      <div className="text-caption text-ink-500">{label}</div>
      <div
        className={`mt-1 font-display text-h3 ${
          tone === 'positive'
            ? 'text-brand-green'
            : tone === 'warning'
              ? 'text-semantic-warning'
              : tone === 'critical'
                ? 'text-semantic-critical'
                : ''
        }`}
      >
        {value}
      </div>
    </GlassCard>
  );
}
