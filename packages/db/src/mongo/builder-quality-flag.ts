import mongoose, { Schema, model, models, type Model } from 'mongoose';

const BuilderQualityFlagSchema = new Schema(
  {
    postgresBuilderId: { type: String, required: true, index: true },
    flagCode: { type: String, required: true, index: true },
    severity: { type: String, enum: ['info', 'warn', 'critical'], required: true, index: true },
    message: { type: String, required: true },
    evidence: { type: Schema.Types.Mixed },
    raisedAt: { type: Date, default: Date.now, index: true },
    acknowledgedAt: Date,
    acknowledgedBy: String,
    resolvedAt: Date,
    resolutionNotes: String,
  },
  { collection: 'builder_quality_flags', timestamps: true },
);

BuilderQualityFlagSchema.index({ postgresBuilderId: 1, raisedAt: -1 });
BuilderQualityFlagSchema.index({ severity: 1, resolvedAt: 1 });

export const BuilderQualityFlag: Model<mongoose.InferSchemaType<typeof BuilderQualityFlagSchema>> =
  (models['BuilderQualityFlag'] as Model<mongoose.InferSchemaType<typeof BuilderQualityFlagSchema>>) ??
  model('BuilderQualityFlag', BuilderQualityFlagSchema);
