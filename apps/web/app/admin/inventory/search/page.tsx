import Link from 'next/link';
import { prisma } from '@/lib/db';
import { listComponents } from '@/lib/services/inventory';
import { SearchFilters } from './SearchFilters';

export const dynamic = 'force-dynamic';

const CONDITIONS = ['New', 'Like New', 'Excellent', 'Very Good', 'Good'];
const PAGE_SIZE = 48;

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  in_stock: { color: 'var(--accent)', label: 'In stock' },
  at_workbench: { color: '#B98A40', label: 'Workbench' },
  bound: { color: 'var(--ink-30)', label: 'Bound' },
  dispatched: { color: 'var(--ink-30)', label: 'Dispatched' },
};

function deriveStatus(row: {
  currentLocation: string | null;
  boundToUnitId: string | null;
}): keyof typeof STATUS_DOT {
  if (row.boundToUnitId) return 'bound';
  const loc = row.currentLocation?.toLowerCase() ?? '';
  if (loc.startsWith('workbench') || loc.includes('bench')) return 'at_workbench';
  return 'in_stock';
}

function parseList(v: string | undefined): string[] {
  return (v ?? '').split(',').filter(Boolean);
}

export default async function AdminInventorySearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const types = parseList(
    Array.isArray(searchParams.types) ? searchParams.types[0] : searchParams.types,
  );
  const locs = parseList(
    Array.isArray(searchParams.locs) ? searchParams.locs[0] : searchParams.locs,
  );
  const conds = parseList(
    Array.isArray(searchParams.conds) ? searchParams.conds[0] : searchParams.conds,
  );
  const stockStatus =
    typeof searchParams.status === 'string' ? searchParams.status : 'all';
  const pageNum = Math.max(
    1,
    Number.parseInt(
      (Array.isArray(searchParams.page)
        ? searchParams.page[0]
        : searchParams.page) ?? '1',
      10,
    ) || 1,
  );

  const unboundOnly = stockStatus === 'in_stock';

  const [{ items, total }, componentTypesFacet, locationsFacet] =
    await Promise.all([
      listComponents({
        typeCodes: types,
        locations: locs,
        conditions: conds,
        query: q,
        unboundOnly,
        limit: PAGE_SIZE,
        offset: (pageNum - 1) * PAGE_SIZE,
      }),
      prisma.componentType.findMany({
        include: { _count: { select: { components: true } } },
        orderBy: { label: 'asc' },
      }),
      prisma.component.groupBy({
        by: ['currentLocation'],
        _count: { _all: true },
        where: { currentLocation: { not: null } },
        orderBy: { currentLocation: 'asc' },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const typesFacet = componentTypesFacet.map((t) => ({
    code: t.code,
    label: t.label,
    count: t._count.components,
  }));
  const locsFacet = locationsFacet
    .filter((l) => l.currentLocation)
    .map((l) => ({
      code: l.currentLocation!,
      label: l.currentLocation!,
      count: l._count._all,
    }));

  const baseParams = new URLSearchParams();
  if (q) baseParams.set('q', q);
  if (types.length) baseParams.set('types', types.join(','));
  if (locs.length) baseParams.set('locs', locs.join(','));
  if (conds.length) baseParams.set('conds', conds.join(','));
  if (stockStatus !== 'all') baseParams.set('status', stockStatus);
  const hrefFor = (p: number) => {
    const next = new URLSearchParams(baseParams);
    if (p > 1) next.set('page', p.toString());
    const qs = next.toString();
    return qs ? `?${qs}` : '';
  };

  const activeFilterCount =
    (q ? 1 : 0) +
    types.length +
    locs.length +
    conds.length +
    (stockStatus !== 'all' ? 1 : 0);

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ padding: '48px 40px 96px' }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400 }}>
        {/* Breadcrumb */}
        <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
          <Link
            href="/admin/inventory"
            className="bav-hover-opa no-underline"
            style={{ color: 'inherit' }}
          >
            Inventory
          </Link>
          <span className="mx-2.5" style={{ color: 'var(--ink-30)' }}>
            /
          </span>
          <span>Search</span>
        </div>

        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(32px, 3.5vw, 48px)',
            fontVariationSettings: "'opsz' 144",
            marginBottom: 40,
          }}
        >
          Components, <span className="bav-italic">searchable</span>.
        </h1>

        <div
          className="grid gap-16"
          style={{
            gridTemplateColumns: '240px minmax(0, 1fr)',
          }}
        >
          {/* Filter rail */}
          <div>
            <SearchFilters
              componentTypes={typesFacet}
              locations={locsFacet}
              conditions={CONDITIONS}
            />
          </div>

          {/* Results */}
          <section>
            <div className="mb-8 flex items-baseline justify-between">
              <div>
                <div
                  className="font-mono tabular-nums"
                  style={{ fontSize: 14 }}
                >
                  {total.toLocaleString()}{' '}
                  <span style={{ color: 'var(--ink-60)' }}>components</span>
                </div>
                {activeFilterCount > 0 && (
                  <div
                    className="bav-label mt-1"
                    style={{ color: 'var(--ink-30)' }}
                  >
                    {activeFilterCount} active filter
                    {activeFilterCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>

            {items.length > 0 ? (
              <>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(280px, 1fr))',
                  }}
                >
                  {items.map((c) => {
                    const statusKey = deriveStatus(c);
                    const s = STATUS_DOT[statusKey] ?? STATUS_DOT.in_stock!;
                    const qr = c.qrCodes[0]?.qrId;
                    const cost =
                      c.costGbp != null
                        ? `£${Number(c.costGbp).toFixed(2)}`
                        : '—';
                    if (!qr) return null;
                    return (
                      <Link
                        key={c.componentId}
                        href={`/admin/inventory/${qr}`}
                        className="bav-hover-opa block border border-ink-10 no-underline"
                        style={{
                          padding: '20px 22px',
                          background: 'var(--paper)',
                          color: 'var(--ink)',
                        }}
                      >
                        <div className="mb-3.5 flex items-center justify-between">
                          <span
                            className="font-mono tabular-nums"
                            style={{ fontSize: 11 }}
                          >
                            {qr}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              aria-hidden
                              style={{
                                display: 'inline-block',
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: s.color,
                              }}
                            />
                            <span
                              className="bav-label"
                              style={{ color: 'var(--ink-60)', fontSize: 10 }}
                            >
                              {s.label}
                            </span>
                          </span>
                        </div>
                        <div
                          className="bav-label mb-2"
                          style={{ color: 'var(--ink-30)' }}
                        >
                          {c.type.label}
                        </div>
                        <div
                          className="mb-1"
                          style={{ fontSize: 14, lineHeight: 1.35 }}
                        >
                          <span style={{ color: 'var(--ink-60)' }}>
                            {c.manufacturer ?? '—'}
                          </span>{' '}
                          <span>{c.model ?? '—'}</span>
                        </div>
                        <div
                          className="mt-4 flex items-baseline justify-between border-t border-ink-10 pt-3.5"
                        >
                          <span
                            className="font-mono tabular-nums"
                            style={{ fontSize: 11, color: 'var(--ink-60)' }}
                          >
                            {c.currentLocation ?? '—'}
                          </span>
                          <span
                            className="font-mono tabular-nums"
                            style={{ fontSize: 13 }}
                          >
                            {cost}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div
                  className="mt-14 flex items-center justify-between border-t border-ink-10 pt-8"
                >
                  {pageNum > 1 ? (
                    <Link
                      href={hrefFor(pageNum - 1)}
                      className="bav-label bav-hover-opa no-underline"
                      style={{ color: 'var(--ink)' }}
                    >
                      ← Prev
                    </Link>
                  ) : (
                    <span
                      className="bav-label"
                      style={{ color: 'var(--ink-30)' }}
                    >
                      ← Prev
                    </span>
                  )}
                  <span
                    className="font-mono tabular-nums"
                    style={{ fontSize: 13 }}
                  >
                    {pageNum.toString().padStart(2, '0')} /{' '}
                    {totalPages.toString().padStart(2, '0')}
                  </span>
                  {pageNum < totalPages ? (
                    <Link
                      href={hrefFor(pageNum + 1)}
                      className="bav-underline text-[12px] no-underline"
                      style={{ color: 'var(--ink)' }}
                    >
                      Next <span className="arrow">→</span>
                    </Link>
                  ) : (
                    <span
                      className="bav-label"
                      style={{ color: 'var(--ink-30)' }}
                    >
                      Next →
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div
                className="bav-canvas text-center"
                style={{
                  border: '1px solid var(--ink-10)',
                  padding: '72px 40px',
                }}
              >
                <div
                  className="mb-2.5 font-display font-light"
                  style={{
                    fontSize: 28,
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  No components <span className="bav-italic">match</span>.
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-60)' }}>
                  Try removing a filter.
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
