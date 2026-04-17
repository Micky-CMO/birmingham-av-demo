import mongoose, { Schema, model, models, type Model } from 'mongoose';

const TranscriptMessageSchema = new Schema(
  {
    senderType: { type: String, enum: ['user', 'ai', 'staff', 'system'], required: true },
    senderUserId: String,
    body: String,
    model: String,
    tokensIn: Number,
    tokensOut: Number,
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const EscalationEventSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    reason: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    channel: { type: String, enum: ['telegram', 'email', 'inbox'] },
    delivered: Boolean,
  },
  { _id: false },
);

const ChatTranscriptSchema = new Schema(
  {
    postgresTicketId: { type: String, required: true, unique: true, index: true },
    postgresUserId: { type: String, required: true, index: true },
    messages: { type: [TranscriptMessageSchema], default: [] },
    escalations: { type: [EscalationEventSchema], default: [] },
    sentimentRolling: { type: Number, min: -1, max: 1 },
    lastAiTurnAt: Date,
    lastHumanTurnAt: Date,
    closedAt: Date,
  },
  { collection: 'chat_transcripts', timestamps: true },
);

export const ChatTranscript: Model<mongoose.InferSchemaType<typeof ChatTranscriptSchema>> =
  (models['ChatTranscript'] as Model<mongoose.InferSchemaType<typeof ChatTranscriptSchema>>) ??
  model('ChatTranscript', ChatTranscriptSchema);
