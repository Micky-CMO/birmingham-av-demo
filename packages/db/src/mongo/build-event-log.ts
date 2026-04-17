import mongoose, { Schema, model, models, type Model } from 'mongoose';

const ComponentScanSchema = new Schema(
  {
    componentType: {
      type: String,
      enum: ['cpu', 'gpu', 'ram', 'storage', 'psu', 'motherboard', 'cooling', 'case', 'nic', 'other'],
      required: true,
    },
    scannedSerial: String,
    scannedBarcode: String,
    partNumber: String,
    manufacturer: String,
    scannedAt: { type: Date, default: Date.now },
    deviceId: String,
  },
  { _id: false },
);

const QcItemSchema = new Schema(
  {
    code: String,
    label: String,
    passed: Boolean,
    notes: String,
    checkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const PhotoSchema = new Schema(
  { url: String, caption: String, takenAt: Date, hash: String },
  { _id: false },
);

const BuildEventLogSchema = new Schema(
  {
    postgresUnitId: { type: String, required: true, index: true },
    postgresBuilderId: { type: String, required: true, index: true },
    postgresOrderId: { type: String, index: true },
    eventType: {
      type: String,
      enum: [
        'build_started',
        'component_scanned',
        'photo_captured',
        'qc_checklist_item',
        'qc_passed',
        'qc_failed',
        'build_completed',
        'packaging_sealed',
      ],
      required: true,
      index: true,
    },
    components: { type: [ComponentScanSchema], default: [] },
    photos: { type: [PhotoSchema], default: [] },
    qcItems: { type: [QcItemSchema], default: [] },
    geo: { lat: Number, lng: Number, accuracyM: Number },
    builderDeviceId: String,
    clientVersion: String,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { collection: 'build_event_log' },
);

BuildEventLogSchema.index({ postgresBuilderId: 1, createdAt: -1 });
BuildEventLogSchema.index({ postgresUnitId: 1, createdAt: 1 });

export const BuildEventLog: Model<mongoose.InferSchemaType<typeof BuildEventLogSchema>> =
  (models['BuildEventLog'] as Model<mongoose.InferSchemaType<typeof BuildEventLogSchema>>) ??
  model('BuildEventLog', BuildEventLogSchema);
