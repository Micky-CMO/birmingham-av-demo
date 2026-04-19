import Link from 'next/link';
import { nextStartNumber } from '@/lib/services/inventory';
import { QrGenerateForm } from './QrGenerateForm';

export const dynamic = 'force-dynamic';

const DEFAULT_PREFIX = 'BAV-INV';

export default async function AdminInventoryQrGeneratePage() {
  const nextStart = await nextStartNumber(DEFAULT_PREFIX);

  return (
    <main className="min-h-screen bg-paper text-ink" style={{ padding: '48px 40px 96px' }}>
      <div className="mx-auto" style={{ maxWidth: 1100 }}>
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
          <span>Generate QR batch</span>
        </div>

        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(32px, 3.5vw, 48px)',
            fontVariationSettings: "'opsz' 144",
            marginBottom: 16,
          }}
        >
          Print a <span className="bav-italic">batch</span>.
        </h1>
        <p
          className="mb-16 max-w-[560px] text-[15px]"
          style={{ color: 'var(--ink-60)', lineHeight: 1.6 }}
        >
          Codes are created unassigned. Each sticker is bound to a physical
          component the first time it's scanned in the workshop.
        </p>

        <QrGenerateForm
          defaultPrefix={DEFAULT_PREFIX}
          nextAvailableStartNumber={nextStart}
        />
      </div>
    </main>
  );
}
