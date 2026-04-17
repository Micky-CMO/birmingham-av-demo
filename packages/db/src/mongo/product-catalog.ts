import mongoose, { Schema, model, models, type Model } from 'mongoose';

const StorageDeviceSchema = new Schema(
  {
    kind: { type: String, enum: ['ssd_nvme', 'ssd_sata', 'hdd', 'optane'], required: true },
    capacityGb: Number,
    brand: String,
    model: String,
    interface: String,
    formFactor: String,
  },
  { _id: false },
);

const BenchmarkFrameRateSchema = new Schema(
  { game: String, resolution: String, preset: String, avgFps: Number, onePctLowFps: Number },
  { _id: false },
);

const ProductCatalogSchema = new Schema(
  {
    postgresProductId: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, index: true },
    slug: { type: String, required: true, index: true },
    specs: {
      cpu: {
        brand: String,
        family: String,
        model: String,
        cores: Number,
        threads: Number,
        baseClockGhz: Number,
        boostClockGhz: Number,
      },
      gpu: {
        brand: String,
        model: String,
        vramGb: Number,
        rtx: Boolean,
      },
      memory: {
        sizeGb: Number,
        type: String,
        speedMhz: Number,
        slotsUsed: Number,
        slotsTotal: Number,
      },
      storage: { type: [StorageDeviceSchema], default: [] },
      motherboard: { brand: String, model: String, socket: String, chipset: String, formFactor: String },
      psu: { brand: String, model: String, wattage: Number, rating: String, modular: String },
      cooling: { type: String, brand: String, model: String, radiatorMm: Number, fans: Number },
      case: { brand: String, model: String, formFactor: String, colour: String, windowed: Boolean },
      os: { name: String, version: String, edition: String, activated: Boolean },
      ports: { type: Schema.Types.Mixed, default: {} },
      networking: { wifi: String, bluetooth: String, ethernetGbps: Number },
      dimensions: { heightMm: Number, widthMm: Number, depthMm: Number, weightKg: Number },
    },
    benchmarks: {
      geekbench6Single: Number,
      geekbench6Multi: Number,
      cinebenchR23Single: Number,
      cinebenchR23Multi: Number,
      timespyGraphics: Number,
      frameRates: { type: [BenchmarkFrameRateSchema], default: [] },
    },
    images: { type: [{ url: String, alt: String, width: Number, height: Number, isPrimary: Boolean }], default: [] },
    videos: { type: [{ url: String, title: String, durationSec: Number }], default: [] },
    manuals: { type: [{ url: String, title: String, sizeKb: Number }], default: [] },
    tags: { type: [String], default: [], index: true },
    seo: { metaTitle: String, metaDescription: String, keywords: [String] },
    ebay: {
      listingId: String,
      lastSyncedAt: Date,
      rawTitle: String,
      rawPriceGbp: Number,
    },
  },
  { timestamps: true, collection: 'product_catalog' },
);

ProductCatalogSchema.index({ 'specs.cpu.family': 1 });
ProductCatalogSchema.index({ 'specs.gpu.model': 1 });
ProductCatalogSchema.index({ 'specs.memory.sizeGb': 1 });

export const ProductCatalog: Model<mongoose.InferSchemaType<typeof ProductCatalogSchema>> =
  (models['ProductCatalog'] as Model<mongoose.InferSchemaType<typeof ProductCatalogSchema>>) ??
  model('ProductCatalog', ProductCatalogSchema);
