/**
 * Inventory + QR service layer.
 *
 * Hamzah's physical workflow: a fresh batch of printed QR stickers arrives;
 * components land on the bench; each component is scanned, registered, and
 * later bound to a specific build. Every scan writes an immutable
 * `InventoryMovement` audit row so we can trace a component from arrival
 * to dispatch.
 */
import type {
  Component,
  ComponentType,
  InventoryAction,
  InventoryMovement,
  QrBatch,
  QrCode,
} from '@prisma/client';
import { prisma } from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────
// Component taxonomy
// ─────────────────────────────────────────────────────────────────────────

/**
 * Return every ComponentType in the taxonomy. Powers dropdowns on the
 * "register component" screen.
 */
export async function listComponentTypes(): Promise<ComponentType[]> {
  return prisma.componentType.findMany({ orderBy: { label: 'asc' } });
}

/**
 * Insert a new ComponentType. Reserved for admin tooling — the set of
 * codes ("cpu","gpu",…) rarely changes once the workshop is live.
 */
export async function createComponentType(input: {
  code: string;
  label: string;
}): Promise<ComponentType> {
  return prisma.componentType.create({ data: input });
}

// ─────────────────────────────────────────────────────────────────────────
// QR batches
// ─────────────────────────────────────────────────────────────────────────

export interface CreateQrBatchInput {
  /** Sticker prefix — defaults to "BAV-INV" so IDs look like BAV-INV-000001. */
  prefix?: string;
  /** First integer in the batch. The previous batch's max + 1 is typical. */
  startNumber: number;
  /** Number of stickers in this print run. */
  count: number;
  /** User who initiated the print (admin or Hamzah himself). */
  createdBy?: string;
}

const QR_PAD = 6;
const pad = (n: number) => n.toString().padStart(QR_PAD, '0');

/**
 * Reserve a new block of QR codes. Pre-creates the `QrCode` rows with
 * `componentId = null`; they get claimed on first scan. PDF generation
 * is stubbed — returns a placeholder URL for now.
 */
export async function createQrBatch(
  input: CreateQrBatchInput,
): Promise<{ batch: QrBatch; pdfUrl: string }> {
  const prefix = input.prefix ?? 'BAV-INV';
  const { startNumber, count, createdBy } = input;

  if (count < 1 || count > 500) {
    throw new Error('count must be between 1 and 500');
  }
  if (startNumber < 1) {
    throw new Error('startNumber must be >= 1');
  }

  // TODO: generate PDF via jsPDF or similar — returning a placeholder URL
  // for now. When PDF generation lands, write to S3/Vercel Blob and stamp
  // the URL on the batch row.
  const pdfUrl = `/admin/inventory/qr/${startNumber}-${count}.pdf`;

  const batch = await prisma.$transaction(async (tx) => {
    const newBatch = await tx.qrBatch.create({
      data: {
        prefix,
        startNumber,
        count,
        pdfUrl,
        createdBy: createdBy ?? null,
      },
    });
    const rows = Array.from({ length: count }, (_, i) => ({
      qrId: `${prefix}-${pad(startNumber + i)}`,
      batchId: newBatch.batchId,
    }));
    await tx.qrCode.createMany({ data: rows, skipDuplicates: true });
    return newBatch;
  });

  return { batch, pdfUrl };
}

/**
 * List printed batches in reverse-chronological order for the inventory
 * admin dashboard.
 */
export async function listQrBatches(limit = 20): Promise<QrBatch[]> {
  return prisma.qrBatch.findMany({
    orderBy: { printedAt: 'desc' },
    take: limit,
  });
}

/**
 * Return the next start number to use when creating a batch — scans the
 * highest numeric suffix among existing QR codes for the same prefix.
 */
export async function nextStartNumber(prefix = 'BAV-INV'): Promise<number> {
  const last = await prisma.qrCode.findMany({
    where: { qrId: { startsWith: `${prefix}-` } },
    orderBy: { qrId: 'desc' },
    take: 1,
    select: { qrId: true },
  });
  if (last.length === 0) return 1;
  const tail = last[0]!.qrId.split('-').pop() ?? '';
  const n = Number.parseInt(tail, 10);
  return Number.isFinite(n) ? n + 1 : 1;
}

// ─────────────────────────────────────────────────────────────────────────
// Component registration + scanning
// ─────────────────────────────────────────────────────────────────────────

export interface RegisterComponentInput {
  qrId: string;
  componentTypeCode: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  conditionGrade?: string;
  costGbp?: number;
  supplier?: string;
  notes?: string;
  initialLocation?: string;
  actorId?: string;
}

/**
 * Atomically: create a `Component`, claim the scanned `QrCode` to it, and
 * write an `InventoryMovement` with action=`registered`. Throws if the QR
 * is already bound to a different component.
 */
export async function registerComponent(
  input: RegisterComponentInput,
): Promise<{ component: Component; qr: QrCode; movement: InventoryMovement }> {
  return prisma.$transaction(async (tx) => {
    const qr = await tx.qrCode.findUnique({ where: { qrId: input.qrId } });
    if (!qr) throw new Error(`QR ${input.qrId} not found`);
    if (qr.componentId) throw new Error(`QR ${input.qrId} already claimed`);

    const type = await tx.componentType.findUnique({
      where: { code: input.componentTypeCode },
    });
    if (!type) throw new Error(`Unknown component type: ${input.componentTypeCode}`);

    const component = await tx.component.create({
      data: {
        componentTypeId: type.componentTypeId,
        manufacturer: input.manufacturer ?? null,
        model: input.model ?? null,
        serialNumber: input.serialNumber || null,
        conditionGrade: input.conditionGrade ?? null,
        costGbp: input.costGbp ?? null,
        supplier: input.supplier ?? null,
        notes: input.notes ?? null,
        currentLocation: input.initialLocation ?? null,
      },
    });

    const updatedQr = await tx.qrCode.update({
      where: { qrId: input.qrId },
      data: { componentId: component.componentId, claimedAt: new Date() },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        componentId: component.componentId,
        qrId: input.qrId,
        action: 'registered',
        toLocation: input.initialLocation ?? null,
        actorId: input.actorId ?? null,
        notes: input.notes ?? null,
      },
    });

    return { component, qr: updatedQr, movement };
  });
}

/**
 * Look up the component currently bound to a scanned QR — used by the
 * scanner UI to show "what is this?" before any action.
 */
export async function lookupByQr(qrId: string): Promise<{
  qr: QrCode;
  component: Component | null;
}> {
  const qr = await prisma.qrCode.findUnique({
    where: { qrId },
    include: { component: true },
  });
  if (!qr) throw new Error(`QR ${qrId} not found`);
  const { component, ...rest } = qr;
  return { qr: rest as QrCode, component: component ?? null };
}

export interface MoveComponentInput {
  qrId: string;
  toLocation: string;
  actorId?: string;
  notes?: string;
}

/**
 * Record a location change for the component (bench → shelf, etc).
 */
export async function moveComponent(
  input: MoveComponentInput,
): Promise<InventoryMovement> {
  return prisma.$transaction(async (tx) => {
    const qr = await tx.qrCode.findUnique({
      where: { qrId: input.qrId },
      include: { component: true },
    });
    if (!qr?.component) throw new Error(`QR ${input.qrId} has no component`);
    const from = qr.component.currentLocation;
    await tx.component.update({
      where: { componentId: qr.component.componentId },
      data: { currentLocation: input.toLocation },
    });
    return tx.inventoryMovement.create({
      data: {
        componentId: qr.component.componentId,
        qrId: input.qrId,
        action: 'moved',
        fromLocation: from,
        toLocation: input.toLocation,
        actorId: input.actorId ?? null,
        notes: input.notes ?? null,
      },
    });
  });
}

export interface BindComponentToBuildInput {
  qrId: string;
  unitId: string;
  actorId?: string;
  notes?: string;
}

/**
 * Bind a component to a specific Unit (build-in-progress).
 */
export async function bindComponentToBuild(
  input: BindComponentToBuildInput,
): Promise<InventoryMovement> {
  return prisma.$transaction(async (tx) => {
    const qr = await tx.qrCode.findUnique({
      where: { qrId: input.qrId },
      include: { component: true },
    });
    if (!qr?.component) throw new Error(`QR ${input.qrId} has no component`);
    if (qr.component.boundToUnitId && qr.component.boundToUnitId !== input.unitId) {
      throw new Error('component is already bound to a different unit');
    }
    await tx.component.update({
      where: { componentId: qr.component.componentId },
      data: { boundToUnitId: input.unitId },
    });
    return tx.inventoryMovement.create({
      data: {
        componentId: qr.component.componentId,
        qrId: input.qrId,
        action: 'bound_to_build',
        fromLocation: qr.component.currentLocation,
        toLocation: `unit:${input.unitId}`,
        actorId: input.actorId ?? null,
        notes: input.notes ?? null,
      },
    });
  });
}

/**
 * Release a component from its current unit.
 */
export async function unbindComponent(input: {
  qrId: string;
  actorId?: string;
  notes?: string;
}): Promise<InventoryMovement> {
  return prisma.$transaction(async (tx) => {
    const qr = await tx.qrCode.findUnique({
      where: { qrId: input.qrId },
      include: { component: true },
    });
    if (!qr?.component) throw new Error(`QR ${input.qrId} has no component`);
    await tx.component.update({
      where: { componentId: qr.component.componentId },
      data: { boundToUnitId: null },
    });
    return tx.inventoryMovement.create({
      data: {
        componentId: qr.component.componentId,
        qrId: input.qrId,
        action: 'unbound',
        fromLocation: qr.component.boundToUnitId ? `unit:${qr.component.boundToUnitId}` : null,
        actorId: input.actorId ?? null,
        notes: input.notes ?? null,
      },
    });
  });
}

/**
 * Mark a component as written off (DOA from supplier, damaged in handling, …).
 */
export async function writeOffComponent(input: {
  qrId: string;
  actorId?: string;
  reason: string;
}): Promise<InventoryMovement> {
  return prisma.$transaction(async (tx) => {
    const qr = await tx.qrCode.findUnique({
      where: { qrId: input.qrId },
      include: { component: true },
    });
    if (!qr?.component) throw new Error(`QR ${input.qrId} has no component`);
    return tx.inventoryMovement.create({
      data: {
        componentId: qr.component.componentId,
        qrId: input.qrId,
        action: 'written_off',
        actorId: input.actorId ?? null,
        notes: input.reason,
      },
    });
  });
}

/**
 * Put a component back into general stock after an unbind or return.
 */
export async function returnToStock(input: {
  qrId: string;
  toLocation: string;
  actorId?: string;
  notes?: string;
}): Promise<InventoryMovement> {
  return prisma.$transaction(async (tx) => {
    const qr = await tx.qrCode.findUnique({
      where: { qrId: input.qrId },
      include: { component: true },
    });
    if (!qr?.component) throw new Error(`QR ${input.qrId} has no component`);
    const from = qr.component.currentLocation;
    await tx.component.update({
      where: { componentId: qr.component.componentId },
      data: { currentLocation: input.toLocation, boundToUnitId: null },
    });
    return tx.inventoryMovement.create({
      data: {
        componentId: qr.component.componentId,
        qrId: input.qrId,
        action: 'returned_to_stock',
        fromLocation: from,
        toLocation: input.toLocation,
        actorId: input.actorId ?? null,
        notes: input.notes ?? null,
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Queries / audit
// ─────────────────────────────────────────────────────────────────────────

export interface ListComponentsFilter {
  typeCode?: string;
  typeCodes?: string[];
  supplier?: string;
  location?: string;
  locations?: string[];
  conditions?: string[];
  query?: string;
  unboundOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Paginated search over components — powers the "stock on hand" screen.
 */
export async function listComponents(
  filter: ListComponentsFilter = {},
): Promise<{ items: (Component & { type: ComponentType; qrCodes: QrCode[] })[]; total: number }> {
  const take = filter.limit ?? 48;
  const skip = filter.offset ?? 0;
  const where: Record<string, unknown> = {};

  if (filter.typeCode) {
    where.type = { code: filter.typeCode };
  } else if (filter.typeCodes && filter.typeCodes.length > 0) {
    where.type = { code: { in: filter.typeCodes } };
  }
  if (filter.supplier) where.supplier = filter.supplier;
  if (filter.location) where.currentLocation = filter.location;
  else if (filter.locations && filter.locations.length > 0) {
    where.currentLocation = { in: filter.locations };
  }
  if (filter.conditions && filter.conditions.length > 0) {
    where.conditionGrade = { in: filter.conditions };
  }
  if (filter.unboundOnly) where.boundToUnitId = null;
  if (filter.query) {
    const q = filter.query.trim();
    where.OR = [
      { manufacturer: { contains: q, mode: 'insensitive' } },
      { model: { contains: q, mode: 'insensitive' } },
      { serialNumber: { contains: q, mode: 'insensitive' } },
      { qrCodes: { some: { qrId: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.component.count({ where }),
    prisma.component.findMany({
      where,
      include: { type: true, qrCodes: { take: 1 } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return { items, total };
}

/**
 * Full audit trail for a single component — every scan, every move.
 */
export async function getComponentHistory(
  componentId: string,
): Promise<InventoryMovement[]> {
  return prisma.inventoryMovement.findMany({
    where: { componentId },
    orderBy: { occurredAt: 'desc' },
  });
}

/**
 * List every component bound to a given unit.
 */
export async function listComponentsForUnit(unitId: string): Promise<Component[]> {
  return prisma.component.findMany({
    where: { boundToUnitId: unitId },
  });
}

/**
 * Arbitrary audit-trail append — escape hatch.
 */
export async function recordMovement(input: {
  componentId: string;
  qrId: string;
  action: InventoryAction;
  fromLocation?: string;
  toLocation?: string;
  actorId?: string;
  notes?: string;
}): Promise<InventoryMovement> {
  return prisma.inventoryMovement.create({
    data: {
      componentId: input.componentId,
      qrId: input.qrId,
      action: input.action,
      fromLocation: input.fromLocation ?? null,
      toLocation: input.toLocation ?? null,
      actorId: input.actorId ?? null,
      notes: input.notes ?? null,
    },
  });
}
