import { formatGbp } from '@bav/lib';
import {
  getDashboardKpis,
  getRevenueChart,
  getTopBuilders,
  getRecentActivity,
  getReturnsReasons,
  getLowStockAlerts,
  getShippingCities,
} from '@/lib/services/dashboard';
import { KpiTile } from '@/components/admin/KpiTile';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { TopBuildersList } from '@/components/admin/TopBuildersList';
import { BuildQueueGauge } from '@/components/admin/BuildQueueGauge';
import { ReturnsDonut } from '@/components/admin/ReturnsDonut';
import { StockAlerts } from '@/components/admin/StockAlerts';
import { CitiesMap } from '@/components/admin/CitiesMap';
import { AiBrief } from '@/components/admin/AiBrief';
import { QuickActions } from '@/components/admin/QuickActions';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [kpis, chart, topBuilders, activity, reasons, lowStock, cities] = await Promise.all([
    getDashboardKpis(),
    getRevenueChart(30),
    getTopBuilders(5),
    getRecentActivity(14),
    getReturnsReasons(),
    getLowStockAlerts(),
    getShippingCities(8),
  ]);

  const brief = {
    headline:
      kpis.flaggedReturns > 0
        ? `${kpis.flaggedReturns} flagged return${kpis.flaggedReturns === 1 ? '' : 's'} need a decision today.`
        : kpis.openTickets > 5
          ? `${kpis.openTickets} support tickets open.`
          : 'Quiet morning. Build queue running healthy.',
    bullets: [
      `Revenue 7d ${formatGbp(kpis.revenue7d.value)} (${kpis.revenue7d.deltaPct >= 0 ? '+' : ''}${kpis.revenue7d.deltaPct.toFixed(1)}% vs prior week).`,
      `${kpis.pendingFulfilment} orders awaiting build or QC. Queue at ${Math.round(kpis.buildQueueLoad * 100)}% capacity.`,
      kpis.inventoryAlerts > 0
        ? `${kpis.inventoryAlerts} SKUs at or below reorder threshold.`
        : 'Stock levels comfortable across the catalog.',
    ],
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">Today</p>
          <h1 className="mt-1 font-display text-h2 font-semibold tracking-[-0.02em]">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h1>
        </div>
        <div className="hidden items-center gap-2 font-mono text-caption uppercase tracking-[0.2em] text-ink-500 md:flex">
          <span className="inline-block h-1.5 w-1.5 animate-pulse-green rounded-full bg-brand-green" />
          Live data
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile
          label="Revenue · 24h"
          value={formatGbp(kpis.revenueToday.value)}
          deltaPct={kpis.revenueToday.deltaPct}
          tone={kpis.revenueToday.deltaPct < 0 ? 'critical' : 'positive'}
        />
        <KpiTile
          label="Revenue · 7d"
          value={formatGbp(kpis.revenue7d.value)}
          deltaPct={kpis.revenue7d.deltaPct}
          spark={kpis.revenue7d.sparkline}
          tone="positive"
        />
        <KpiTile
          label="Orders · 24h"
          value={kpis.ordersToday.value.toLocaleString('en-GB')}
          deltaPct={kpis.ordersToday.deltaPct}
        />
        <KpiTile label="AOV · 30d" value={formatGbp(kpis.aov30d.value)} deltaPct={kpis.aov30d.deltaPct} />
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile label="Pending fulfilment" value={String(kpis.pendingFulfilment)} hint="queued · in build · QC" />
        <KpiTile
          label="Open returns"
          value={String(kpis.refundsOpen)}
          tone={kpis.flaggedReturns > 0 ? 'critical' : 'warning'}
          hint={`${kpis.flaggedReturns} AI-flagged`}
        />
        <KpiTile label="Open tickets" value={String(kpis.openTickets)} tone={kpis.openTickets > 20 ? 'warning' : 'default'} />
        <KpiTile
          label="Stock alerts"
          value={String(kpis.inventoryAlerts)}
          tone={kpis.inventoryAlerts > 5 ? 'critical' : kpis.inventoryAlerts > 0 ? 'warning' : 'default'}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={chart} />
        </div>
        <AiBrief brief={brief} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <ActivityFeed items={activity} />
        </div>
        <div className="space-y-4">
          <BuildQueueGauge load={kpis.buildQueueLoad} />
          <QuickActions />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TopBuildersList builders={topBuilders} />
        <ReturnsDonut slices={reasons} />
        <StockAlerts alerts={lowStock} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CitiesMap cities={cities} />
      </section>
    </div>
  );
}
