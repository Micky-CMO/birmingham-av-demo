/**
 * Inventory + QR service layer.
 *
 * Hamzah's physical workflow: a fresh batch of printed QR stickers arrives;
 * components land on the bench; each component is scanned, registered, and
 * later bound to a specific build. Every scan writes an immutable
 * `InventoryMovement` audit row so we can trace a component from arrival
 * to dispatch.
 *
 * This module defines the typed service signatures; implementations are
 * filled in alongside the scanner UI (mobile app + tablet on the workshop
 * floor).
 */
import type {
  Component,
  ComponentType,
  InventoryAction,
  InventoryMovement,
  QrBatch,
  QrCode,
} from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────
// Component taxonomy
// ─────────────────────────────────────────────────────────────────────────

/**
 * Return every ComponentType in the taxonomy. Powers dropdowns on the
 * "register component" screen.
 */
export declare function listComponentTypes(): Promise<ComponentType[]>;

/**
 * Insert a new ComponentType. Reserved for admin tooling — the set of
 * codes ("cpu","gpu",…) rarely changes once the workshop is live.
 */
export declare function createComponentType(input: {
  code: string;
  label: string;
}): Promise<ComponentType>;

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

/**
 * Reserve a new block of QR codes, generate the PDF (A4 sheet ready for a
 * sticker printer), and return the batch plus the URL to the PDF. The
 * `QrCode` rows are pre-created with `componentId = null`; they get
 * claimed on first scan.
 */
export declare function createQrBatch(
  input: CreateQrBatchInput,
): Promise<{ batch: QrBatch; pdfUrl: string }>;

/**
 * List printed batches in reverse-chronological order for the inventory
 * admin dashboard.
 */
export declare function listQrBatches(limit?: number): Promise<QrBatch[]>;

// ─────────────────────────────────────────────────────────────────────────
// Component registration + scanning
// ─────────────────────────────────────────────────────────────────────────

export interface RegisterComponentInput {
  /** The QR id scanned from the sticker (e.g. "BAV-INV-000127"). */
  qrId: string;
  componentTypeCode: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  conditionGrade?: string;
  costGbp?: number;
  supplier?: string;
  notes?: string;
  /** Scan location — e.g. bin / shelf / workbench. */
  initialLocation?: string;
  /** User performing the scan (builder or admin). */
  actorId?: string;
}

/**
 * Atomically: create a `Component`, claim the scanned `QrCode` to it, and
 * write an `InventoryMovement` with action=`registered`. Throws if the QR
 * is already bound to a different component.
 */
export declare function registerComponent(
  input: RegisterComponentInput,
): Promise<{ component: Component; qr: QrCode; movement: InventoryMovement }>;

/**
 * Look up the component currently bound to a scanned QR — used by the
 * scanner UI to show "what is this?" before any action.
 */
export declare function lookupByQr(qrId: string): Promise<{
  qr: QrCode;
  component: Component | null;
}>;

export interface MoveComponentInput {
  qrId: string;
  toLocation: string;
  actorId?: string;
  notes?: string;
}

/**
 * Record a location change for the component (bench → shelf, etc). Updates
 * `currentLocation` on the component and writes a movement with
 * action=`moved`.
 */
export declare function moveComponent(input: MoveComponentInput): Promise<InventoryMovement>;

export interface BindComponentToBuildInput {
  qrId: string;
  unitId: string;
  actorId?: string;
  notes?: string;
}

/**
 * Bind a component to a specific Unit (build-in-progress). Sets
 * `Component.boundToUnitId`, writes a movement with action=`bound_to_build`,
 * and stamps the component location as the unit's chassis. Throws if the
 * component is already bound to a different unit.
 */
export declare function bindComponentToBuild(
  input: BindComponentToBuildInput,
): Promise<InventoryMovement>;

/**
 * Release a component from its current unit — used when a build is
 * cancelled or a wrong part was scanned. Clears `boundToUnitId` and logs
 * action=`unbound`.
 */
export declare function unbindComponent(input: {
  qrId: string;
  actorId?: string;
  notes?: string;
}): Promise<InventoryMovement>;

/**
 * Mark a component as written off (DOA from supplier, damaged in handling,
 * etc). Terminal — component is excluded from future build bindings.
 */
export declare function writeOffComponent(input: {
  qrId: string;
  actorId?: string;
  reason: string;
}): Promise<InventoryMovement>;

/**
 * Put a component back into general stock after an unbind or return. Logs
 * action=`returned_to_stock` with the destination location.
 */
export declare function returnToStock(input: {
  qrId: string;
  toLocation: string;
  actorId?: string;
  notes?: string;
}): Promise<InventoryMovement>;

// ─────────────────────────────────────────────────────────────────────────
// Queries / audit
// ─────────────────────────────────────────────────────────────────────────

export interface ListComponentsFilter {
  typeCode?: string;
  supplier?: string;
  /** Only components currently in the given location. */
  location?: string;
  /** If true, only components not yet bound to a unit. */
  unboundOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Paginated search over components — powers the "stock on hand" screen.
 */
export declare function listComponents(
  filter?: ListComponentsFilter,
): Promise<{ items: Component[]; total: number }>;

/**
 * Full audit trail for a single component — every scan, every move, every
 * bind/unbind. Newest first.
 */
export declare function getComponentHistory(componentId: string): Promise<InventoryMovement[]>;

/**
 * List every component bound to a given unit. Populates the build card on
 * the builder workbench.
 */
export declare function listComponentsForUnit(unitId: string): Promise<Component[]>;

/**
 * Arbitrary audit-trail append — escape hatch for actions that do not fit
 * the helpers above. Prefer the named helpers when possible.
 */
export declare function recordMovement(input: {
  componentId: string;
  qrId: string;
  action: InventoryAction;
  fromLocation?: string;
  toLocation?: string;
  actorId?: string;
  notes?: string;
}): Promise<InventoryMovement>;
