import { z } from 'zod';

export const AddressSchema = z.object({
  label: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().optional(),
  postcode: z.string().min(2),
  countryIso2: z.string().length(2).default('GB'),
});
export type Address = z.infer<typeof AddressSchema>;

export const ProductListQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  condition: z.string().optional(),
  cpuFamily: z.string().optional(),
  gpuFamily: z.string().optional(),
  minRamGb: z.coerce.number().optional(),
  minStorageGb: z.coerce.number().optional(),
  builderCode: z.string().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'bestseller']).default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
  q: z.string().optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(1).max(10),
});

export const CreateCheckoutSchema = z.object({
  shipping: AddressSchema,
  billing: AddressSchema.optional(),
  customerNotes: z.string().max(500).optional(),
  paymentMethod: z.enum(['stripe_card', 'paypal']),
});

export const CreateReturnSchema = z.object({
  orderItemId: z.string().uuid(),
  reason: z.enum([
    'dead_on_arrival',
    'hardware_fault',
    'not_as_described',
    'damaged_in_transit',
    'changed_mind',
    'wrong_item',
    'other',
  ]),
  reasonDetails: z.string().max(2000).optional(),
  photos: z.array(z.string().url()).max(10).default([]),
});

export const CreateReviewSchema = z.object({
  productId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(140).optional(),
  body: z.string().min(10).max(5000),
  photoUrls: z.array(z.string().url()).max(5).default([]),
});

export const SupportMessageSchema = z.object({
  ticketId: z.string().uuid().optional(),
  subject: z.string().min(2).max(140).optional(),
  body: z.string().min(1).max(4000),
  orderNumber: z.string().optional(),
});

export const ScanSubmitSchema = z.object({
  unitId: z.string().uuid(),
  orderId: z.string().uuid(),
  events: z
    .array(
      z.object({
        eventType: z.enum([
          'build_started',
          'component_scanned',
          'photo_captured',
          'qc_checklist_item',
          'qc_passed',
          'qc_failed',
          'build_completed',
          'packaging_sealed',
        ]),
        components: z
          .array(
            z.object({
              componentType: z.enum(['cpu', 'gpu', 'ram', 'storage', 'psu', 'motherboard', 'cooling', 'case', 'nic', 'other']),
              scannedSerial: z.string().optional(),
              scannedBarcode: z.string().optional(),
              partNumber: z.string().optional(),
              manufacturer: z.string().optional(),
            }),
          )
          .default([]),
        photos: z.array(z.object({ url: z.string().url(), caption: z.string().optional() })).default([]),
      }),
    )
    .min(1),
  deviceId: z.string().optional(),
  clientVersion: z.string().optional(),
});
