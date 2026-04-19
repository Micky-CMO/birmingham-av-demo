import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { listComponentTypes } from '@/lib/services/inventory';
import { RegisterForm } from './RegisterForm';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryRegisterPage({
  params,
}: {
  params: { qrId: string };
}) {
  const qrId = decodeURIComponent(params.qrId);

  const [qr, componentTypes] = await Promise.all([
    prisma.qrCode.findUnique({
      where: { qrId },
      include: { batch: true },
    }),
    listComponentTypes(),
  ]);

  if (!qr) {
    return (
      <main className="min-h-screen bg-paper text-ink" style={{ padding: '48px 40px 96px' }}>
        <div className="mx-auto" style={{ maxWidth: 640 }}>
          <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
            — Unknown sticker
          </div>
          <h1
            className="m-0 font-display font-light"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontVariationSettings: "'opsz' 144",
              marginBottom: 16,
            }}
          >
            That QR isn't <span className="bav-italic">on record</span>.
          </h1>
          <p
            className="mb-8 text-[14px]"
            style={{ color: 'var(--ink-60)', lineHeight: 1.6 }}
          >
            <span className="font-mono tabular-nums">{qrId}</span> doesn't match any
            printed batch. Check the sticker or generate a new batch.
          </p>
          <Link href="/admin/inventory/qr-generate" className="bav-cta no-underline">
            Generate a batch
          </Link>
        </div>
      </main>
    );
  }

  if (qr.componentId) {
    redirect(`/admin/inventory/${qrId}`);
  }

  const qrCreatedAt = qr.createdAt.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ padding: '56px 32px 80px' }}
    >
      <div className="mx-auto" style={{ maxWidth: 640 }}>
        {/* QR context */}
        <div
          className="bav-canvas mb-12"
          style={{ border: '1px solid var(--ink-10)', padding: '20px 24px' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Scanned QR
            </div>
            <div
              className="font-mono tabular-nums"
              style={{ fontSize: 11, color: 'var(--ink-30)' }}
            >
              Unclaimed
            </div>
          </div>
          <div
            className="font-mono tabular-nums"
            style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}
          >
            {qr.qrId}
          </div>
          <div
            className="mt-1.5 font-mono tabular-nums"
            style={{ fontSize: 11, color: 'var(--ink-60)' }}
          >
            Batch {qr.batch.batchId.slice(0, 10)}… · printed {qrCreatedAt}
          </div>
        </div>

        {/* Heading */}
        <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>
          — Register component
        </div>
        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontVariationSettings: "'opsz' 144",
            marginBottom: 12,
          }}
        >
          What's in your <span className="bav-italic">hand</span>?
        </h1>
        <p
          className="mb-12 text-[14px]"
          style={{ color: 'var(--ink-60)', lineHeight: 1.6 }}
        >
          Fill in what you know. Serial number and photo are optional but
          helpful. Cost and supplier are needed for books.
        </p>

        <RegisterForm qrId={qr.qrId} componentTypes={componentTypes} />
      </div>
    </main>
  );
}
