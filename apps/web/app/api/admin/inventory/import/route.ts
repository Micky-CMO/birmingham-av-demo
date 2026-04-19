import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { handleError, ok } from '@/lib/json';
import { ValidationError } from '@/lib/json';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

const Mapping = z.record(z.string(), z.string());

type ParsedRow = Record<string, string>;

function parseCsv(text: string): { columns: string[]; rows: ParsedRow[] } {
  // Minimal CSV parser — splits on newlines and commas. Upgrade to papaparse
  // once the dependency is approved. This handles the happy-path intake CSV
  // Hamzah is exporting from his spreadsheet.
  // TODO: switch to `papaparse` for quoted fields + escape handling.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { columns: [], rows: [] };
  const columns = (lines[0] ?? '').split(',').map((c) => c.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row: ParsedRow = {};
    columns.forEach((col, i) => {
      row[col] = cells[i] ?? '';
    });
    return row;
  });
  return { columns, rows };
}

function currentUserId(): string | undefined {
  const session = cookies().get('bav_session')?.value;
  return session?.startsWith('user:') ? session.slice(5) : undefined;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) {
      return handleError(
        new ValidationError(
          new ZodError([
            {
              code: 'custom',
              message: 'file is required',
              path: ['file'],
            },
          ]),
        ),
      );
    }
    const mappingRaw = form.get('mapping');
    const allocationMode = (form.get('allocationMode') as string) ?? 'existing';

    let mapping: Record<string, string>;
    try {
      mapping = Mapping.parse(JSON.parse(String(mappingRaw ?? '{}')));
    } catch (err) {
      if (err instanceof ZodError) throw new ValidationError(err);
      throw new ValidationError(
        new ZodError([{ code: 'custom', message: 'invalid mapping', path: ['mapping'] }]),
      );
    }

    const text = await file.text();
    const { rows } = parseCsv(text);
    const types = await prisma.componentType.findMany();
    const typeByCode = new Map(types.map((t) => [t.code, t]));

    const actorId = currentUserId();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [idx, row] of rows.entries()) {
      const lineNo = idx + 2;
      const pick = (key: string): string | undefined => {
        const col = mapping[key];
        if (!col) return undefined;
        const v = row[col];
        return v && v.length > 0 ? v : undefined;
      };

      const qrId = pick('qrId');
      const typeCode = pick('componentType');
      const manufacturer = pick('manufacturer');
      const model = pick('model');
      const serial = pick('serialNumber');
      const condition = pick('conditionGrade');
      const costRaw = pick('costGbp');
      const supplier = pick('supplier');
      const location = pick('currentLocation');

      const required = { typeCode, manufacturer, model, condition, location };
      const missing = Object.entries(required)
        .filter(([, v]) => !v)
        .map(([k]) => k);
      if (missing.length > 0) {
        skipped += 1;
        errors.push(`line ${lineNo}: missing ${missing.join(', ')}`);
        continue;
      }
      const type = typeByCode.get(typeCode as string);
      if (!type) {
        skipped += 1;
        errors.push(`line ${lineNo}: unknown type "${typeCode}"`);
        continue;
      }

      if (allocationMode === 'existing' && !qrId) {
        skipped += 1;
        errors.push(`line ${lineNo}: qr_id required in existing-binding mode`);
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          let claimedQrId: string | null = null;
          if (allocationMode === 'existing' && qrId) {
            const qr = await tx.qrCode.findUnique({ where: { qrId } });
            if (!qr) throw new Error(`unknown QR ${qrId}`);
            if (qr.componentId) throw new Error(`already claimed ${qrId}`);
            claimedQrId = qr.qrId;
          } else {
            const qr = await tx.qrCode.findFirst({
              where: { componentId: null },
              orderBy: { qrId: 'asc' },
            });
            if (!qr) throw new Error('no unclaimed QR codes available');
            claimedQrId = qr.qrId;
          }

          const component = await tx.component.create({
            data: {
              componentTypeId: type.componentTypeId,
              manufacturer,
              model,
              serialNumber: serial ?? null,
              conditionGrade: condition ?? null,
              costGbp: costRaw ? Number.parseFloat(costRaw) || null : null,
              supplier: supplier ?? null,
              currentLocation: location ?? null,
            },
          });
          await tx.qrCode.update({
            where: { qrId: claimedQrId! },
            data: { componentId: component.componentId, claimedAt: new Date() },
          });
          await tx.inventoryMovement.create({
            data: {
              componentId: component.componentId,
              qrId: claimedQrId!,
              action: 'registered',
              toLocation: location,
              actorId: actorId ?? null,
              notes: 'bulk import',
            },
          });
        });
        imported += 1;
      } catch (err) {
        skipped += 1;
        errors.push(
          `line ${lineNo}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    return ok({
      imported,
      skipped,
      errors: errors.slice(0, 200),
      // TODO: write the full error list to a downloadable CSV report.
      errorReportUrl: undefined,
    });
  } catch (err) {
    return handleError(err);
  }
}
