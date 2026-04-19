/**
 * AV Care service layer — subscription warranty product.
 *
 * AV Care is a per-account monthly subscription that covers every product the
 * customer owns. Two tiers (`essential` £14.99/mo, `plus` £29.99/mo), a flat
 * £100 excess per claim, and a 30-day free trial at signup.
 *
 * This module defines the typed function signatures for subscription
 * lifecycle, claim submission, claim state transitions, and Stripe webhook
 * reconciliation. Implementations land in follow-up PRs once the Stripe
 * product + prices are created and the claims UI is spec'd.
 */
import type {
  AvCareClaim,
  AvCareClaimStatus,
  AvCareReason,
  AvCareStatus,
  AvCareSubscription,
  AvCareTier,
} from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────
// Subscription lifecycle
// ─────────────────────────────────────────────────────────────────────────

export interface StartSubscriptionInput {
  userId: string;
  tier: AvCareTier;
  /** Stripe payment method id captured during checkout. */
  paymentMethodId: string;
}

/**
 * Create a new AV Care subscription for a user. Enrolls the account in the
 * 30-day trial (status=trialing), creates or reuses a Stripe Customer, and
 * attaches the Stripe Subscription to the price that matches the chosen tier.
 * Fails if the user already has a subscription (one per account).
 */
export declare function startSubscription(
  input: StartSubscriptionInput,
): Promise<AvCareSubscription>;

export interface ChangeTierInput {
  userId: string;
  newTier: AvCareTier;
  /** If true, prorate the current period; otherwise apply at next renewal. */
  prorate?: boolean;
}

/**
 * Upgrade or downgrade the tier for an existing subscription. Delegates the
 * proration math to Stripe and writes back the new monthly price locally.
 */
export declare function changeTier(input: ChangeTierInput): Promise<AvCareSubscription>;

/**
 * Schedule the subscription to cancel at the end of the current billing
 * period (grace access retained until `currentPeriodEnd`). Sets
 * `cancelAtPeriodEnd=true` on both Stripe and the local row.
 */
export declare function cancelAtPeriodEnd(userId: string): Promise<AvCareSubscription>;

/**
 * Reverse a pending cancellation while the subscription is still active.
 * No-op if the subscription is not currently flagged for cancellation.
 */
export declare function resumeSubscription(userId: string): Promise<AvCareSubscription>;

/**
 * Return the current AV Care subscription for a user, or null if they have
 * never subscribed. Callers use this to decide whether to show the claim
 * flow, the upsell, or the cancelled state.
 */
export declare function getSubscriptionForUser(
  userId: string,
): Promise<AvCareSubscription | null>;

/**
 * Whether the user has an active or trialing subscription — i.e. whether
 * they are currently allowed to file a claim. Returns false for past_due,
 * paused, cancelled, or expired.
 */
export declare function isCoverageActive(userId: string): Promise<boolean>;

// ─────────────────────────────────────────────────────────────────────────
// Stripe webhook reconciliation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Apply a verified Stripe subscription event to the local row. Handles
 * `customer.subscription.updated`, `invoice.paid`, `invoice.payment_failed`,
 * and `customer.subscription.deleted`. Called by the Stripe webhook route.
 */
export declare function applyStripeSubscriptionEvent(input: {
  stripeSubscriptionId: string;
  newStatus: AvCareStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}): Promise<AvCareSubscription>;

// ─────────────────────────────────────────────────────────────────────────
// Claims
// ─────────────────────────────────────────────────────────────────────────

export interface SubmitClaimInput {
  userId: string;
  productId: string;
  /** The specific serialised unit, if the customer selected one. */
  unitId?: string;
  reason: AvCareReason;
  description: string;
  /** Uploaded photo URLs (S3 or similar). */
  photoUrls?: string[];
}

/**
 * Create a new AV Care claim in `submitted` state, allocate the next claim
 * number (format `AVC-000127`), and kick off the async AI triage job. The
 * customer is shown a pending status until AI + a human confirm the excess
 * amount, at which point status flips to `awaiting_excess_payment`.
 */
export declare function submitClaim(input: SubmitClaimInput): Promise<AvCareClaim>;

/**
 * Create the Stripe PaymentIntent for the claim excess (flat £100) and
 * return the client_secret for the front-end to confirm. The payment intent
 * id is persisted so the webhook can mark the claim paid on success.
 */
export declare function createExcessPaymentIntent(input: {
  claimId: string;
  userId: string;
}): Promise<{ clientSecret: string; paymentIntentId: string }>;

/**
 * Webhook handler: marks the claim excess as paid and advances status to
 * `awaiting_unit` so logistics can dispatch a return label.
 */
export declare function markExcessPaid(input: {
  claimId: string;
  stripePaymentIntentId: string;
  paidAt: Date;
}): Promise<AvCareClaim>;

/**
 * Assign a claim to a specific builder for repair. Used by support staff
 * after the unit arrives back in the workshop. Transitions status to
 * `in_repair` and stamps `repairStartedAt`.
 */
export declare function assignClaimToBuilder(input: {
  claimId: string;
  builderId: string;
}): Promise<AvCareClaim>;

/**
 * Move a claim forward through its status machine. Enforces the allowed
 * transitions (e.g. cannot jump from `submitted` straight to `resolved`).
 */
export declare function transitionClaimStatus(input: {
  claimId: string;
  next: AvCareClaimStatus;
  actorUserId: string;
  notes?: string;
}): Promise<AvCareClaim>;

/**
 * Persist the AI triage summary + confidence score for a claim. Called
 * from the background worker after the model finishes assessing the photos
 * and description.
 */
export declare function recordAiAssessment(input: {
  claimId: string;
  summary: string;
  confidence: number;
}): Promise<AvCareClaim>;

/**
 * Reject a claim as out-of-scope (not covered by the plan). Records the
 * reason shown to the customer and transitions status to `rejected`.
 */
export declare function rejectClaim(input: {
  claimId: string;
  reason: string;
  actorUserId: string;
}): Promise<AvCareClaim>;

/**
 * List claims for a given user, newest first — powers the "My AV Care"
 * dashboard. Includes product + unit relations for display.
 */
export declare function listClaimsForUser(userId: string): Promise<AvCareClaim[]>;

/**
 * List claims the given builder is responsible for, filtered by any subset
 * of statuses. Powers the builder workbench "AV Care repairs" queue.
 */
export declare function listClaimsForBuilder(input: {
  builderId: string;
  statuses?: AvCareClaimStatus[];
}): Promise<AvCareClaim[]>;
