import Link from 'next/link';
import { listComponentTypes } from '@/lib/services/inventory';
import { ImportWizard } from './ImportWizard';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryImportPage() {
  const componentTypes = await listComponentTypes();

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ padding: '48px 40px 96px' }}
    >
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
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
          <span>Import</span>
        </div>

        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(32px, 3.5vw, 48px)',
            fontVariationSettings: "'opsz' 144",
            marginBottom: 12,
          }}
        >
          Import a <span className="bav-italic">spreadsheet</span>.
        </h1>
        <p
          className="mb-14 max-w-[560px] text-[15px]"
          style={{ color: 'var(--ink-60)', lineHeight: 1.6 }}
        >
          Upload a CSV of components. Map the columns. Rows with errors are
          skipped and logged — the rest are imported.
        </p>

        <ImportWizard
          componentTypes={componentTypes.map((t) => ({
            code: t.code,
            label: t.label,
          }))}
          csvTemplateHref="/admin/inventory/import/template.csv"
        />
      </div>
    </main>
  );
}
