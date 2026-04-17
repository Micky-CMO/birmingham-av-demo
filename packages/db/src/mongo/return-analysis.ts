import mongoose, { Schema, model, models, type Model } from 'mongoose';

const PatternFlagSchema = new Schema(
  {
    patternCode: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    related: { type: [String], default: [] },
  },
  { _id: false },
);

const ReturnAnalysisSchema = new Schema(
  {
    postgresReturnId: { type: String, required: true, unique: true, index: true },
    postgresBuilderId: { type: String, required: true, index: true },
    postgresProductId: { type: String, required: true, index: true },
    model: { type: String, required: true },
    severity: { type: Number, min: 0, max: 1, required: true },
    rootCauseGuess: String,
    categoryTags: { type: [String], default: [] },
    builderRiskScore: { type: Number, min: 0, max: 1 },
    patternFlags: { type: [PatternFlagSchema], default: [] },
    recommendedAction: {
      type: String,
      enum: ['approve_refund', 'approve_replace', 'reject', 'escalate_to_owner', 'request_more_info'],
    },
    rationale: String,
    evidenceLinks: { type: [String], default: [] },
    tokensIn: Number,
    tokensOut: Number,
    analysedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: 'return_analysis', timestamps: true },
);

ReturnAnalysisSchema.index({ postgresBuilderId: 1, analysedAt: -1 });
ReturnAnalysisSchema.index({ severity: -1, analysedAt: -1 });

export const ReturnAnalysis: Model<mongoose.InferSchemaType<typeof ReturnAnalysisSchema>> =
  (models['ReturnAnalysis'] as Model<mongoose.InferSchemaType<typeof ReturnAnalysisSchema>>) ??
  model('ReturnAnalysis', ReturnAnalysisSchema);
