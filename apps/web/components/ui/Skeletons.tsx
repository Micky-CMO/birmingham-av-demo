import type { CSSProperties } from 'react';

// ============================================================================
// Loading skeletons (artefact 33)
//
// Three compositions:
//   - GridSkeleton            → /shop · /shop/[slug]
//   - ProductDetailSkeleton   → /product/[slug]
//   - OrderTimelineSkeleton   → /account/orders/[orderNumber]
//
// All use `.bav-canvas` as the warm paper shimmer base with a very subtle
// animated highlight sweep — no flashy pulse, no greyscale placeholders.
// Hairlines stay visible. The keyframe itself lives in globals.css under
// the `/* Loading skeletons (artefact 33) */` section.
// ============================================================================

function Line({
  w = '100%',
  h = 10,
  mt = 0,
}: {
  w?: string | number;
  h?: number;
  mt?: number;
}) {
  const style: CSSProperties = {
    width: typeof w === 'number' ? `${w}px` : w,
    height: h,
    background: 'rgba(23,20,15,0.08)',
    marginTop: mt,
  };
  return <div className="bav-shimmer" style={style} />;
}

function Block({
  ratio = '4 / 5',
  className = '',
}: {
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      className={`bav-canvas bav-shimmer relative w-full ${className}`.trim()}
      style={{ aspectRatio: ratio }}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div>
      <Block ratio="4 / 5" />
      <div className="mt-4">
        <Line w="72%" h={12} />
        <Line w="48%" h={12} mt={10} />
        <Line w="28%" h={12} mt={18} />
      </div>
    </div>
  );
}

// ---- 1. Grid skeleton (filter rail + card grid) ----
export function GridSkeleton() {
  return (
    <section
      className="grid gap-12"
      style={{ gridTemplateColumns: '240px 1fr' }}
      aria-label="Loading product grid"
      aria-busy="true"
    >
      {/* Filter rail */}
      <aside className="bav-skeleton-rail">
        <Line w="60%" h={11} />
        <div className="mt-6 border-t border-ink-10 pt-5">
          {[60, 45, 70, 38, 54, 48, 62].map((w, i) => (
            <Line key={i} w={`${w}%`} h={11} mt={i === 0 ? 0 : 18} />
          ))}
        </div>
        <div className="mt-10 border-t border-ink-10 pt-5">
          <Line w="50%" h={11} />
          {[70, 55, 65, 40, 48].map((w, i) => (
            <Line key={i} w={`${w}%`} h={11} mt={18} />
          ))}
        </div>
      </aside>

      {/* Card grid */}
      <div>
        <div className="mb-6 flex justify-between">
          <Line w={140} h={11} />
          <Line w={100} h={11} />
        </div>
        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- 2. Product-detail skeleton (gallery + info column) ----
export function ProductDetailSkeleton() {
  return (
    <section aria-label="Loading product detail" aria-busy="true">
      {/* breadcrumb */}
      <Line w={240} h={11} />

      <div
        className="mt-8 grid items-start gap-16"
        style={{ gridTemplateColumns: '1.4fr 1fr' }}
      >
        {/* gallery */}
        <div>
          <Block ratio="4 / 5" />
          <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Block key={i} ratio="1 / 1" />
            ))}
          </div>
        </div>

        {/* info */}
        <div>
          <Line w="42%" h={11} />
          <Line w="86%" h={28} mt={22} />
          <Line w="64%" h={28} mt={14} />
          <Line w="48%" h={14} mt={28} />

          <div className="mt-12 border-t border-ink-10 pt-7">
            <Line w="22%" h={11} />
            {[92, 78, 88, 82, 70, 84, 76].map((w, i) => (
              <Line key={i} w={`${w}%`} h={12} mt={i === 0 ? 24 : 16} />
            ))}
          </div>

          <div className="mt-12 grid gap-3.5">
            <Line w="100%" h={56} />
            <Line w="100%" h={52} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- 3. Order-timeline skeleton (status rail + items + summary) ----
export function OrderTimelineSkeleton() {
  return (
    <section aria-label="Loading order timeline" aria-busy="true">
      <Line w={200} h={11} />
      <Line w="38%" h={36} mt={22} />

      {/* 8-step status rail */}
      <div className="mt-12 border-t border-ink-10 pt-7">
        <Line w="20%" h={11} />
        <div
          className="mt-8 grid items-start gap-0"
          style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="px-2"
              style={{ borderLeft: i === 0 ? 'none' : '1px solid var(--ink-10)' }}
            >
              <div
                className="bav-shimmer mb-4"
                style={{
                  width: 10,
                  height: 10,
                  border: '1px solid var(--ink-30)',
                  background: i < 4 ? 'var(--ink-30)' : 'transparent',
                }}
              />
              <Line w="74%" h={10} />
              <Line w="52%" h={9} mt={10} />
            </div>
          ))}
        </div>
      </div>

      {/* items + summary split */}
      <div
        className="mt-[72px] grid items-start gap-16 border-t border-ink-10 pt-10"
        style={{ gridTemplateColumns: '1.6fr 1fr' }}
      >
        <div>
          <Line w="16%" h={11} />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="grid gap-6"
              style={{
                gridTemplateColumns: '120px 1fr',
                marginTop: i === 0 ? 28 : 32,
                paddingTop: i === 0 ? 0 : 32,
                borderTop: i === 0 ? 'none' : '1px solid var(--ink-10)',
              }}
            >
              <Block ratio="1 / 1" />
              <div>
                <Line w="80%" h={14} />
                <Line w="56%" h={11} mt={12} />
                <Line w="42%" h={11} mt={10} />
                <Line w="28%" h={12} mt={20} />
              </div>
            </div>
          ))}
        </div>

        <aside className="border border-ink-10 p-8">
          <Line w="40%" h={11} />
          <div className="mt-6">
            {[70, 55, 45, 80, 60].map((w, i) => (
              <div
                key={i}
                className="flex justify-between"
                style={{ marginTop: i === 0 ? 0 : 16 }}
              >
                <Line w={`${w}%`} h={11} />
                <Line w="18%" h={11} />
              </div>
            ))}
          </div>
          <div className="mt-7 flex justify-between border-t border-ink-10 pt-6">
            <Line w="32%" h={14} />
            <Line w="24%" h={14} />
          </div>
        </aside>
      </div>
    </section>
  );
}
