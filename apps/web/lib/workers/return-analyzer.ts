import { analyseReturn } from '@bav/ai';
import { prisma } from '../db';
import { connectMongo, ReturnAnalysis, BuilderQualityFlag } from '../db';

export async function analyseReturnWorker(payload: { returnId?: string }): Promise<void> {
  const returnId = payload.returnId;
  if (!returnId) return;

  const r = await prisma.return.findUnique({
    where: { returnId },
    include: {
      builder: true,
      product: true,
      order: true,
    },
  });
  if (!r) return;

  const now = new Date();
  const ninety = new Date(now.getTime() - 90 * 86_400_000);

  const [unitsBuilt90d, rmaCount90d, priorFlags] = await Promise.all([
    prisma.unit.count({ where: { builderId: r.builderId, buildCompletedAt: { gte: ninety } } }),
    prisma.return.count({ where: { builderId: r.builderId, createdAt: { gte: ninety } } }),
    prisma.return.findMany({
      where: { builderId: r.builderId, createdAt: { gte: ninety }, aiFlaggedPattern: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { aiFlaggedPattern: true, aiSeverity: true, createdAt: true },
    }),
  ]);

  try {
    const { analysis, tokensIn, tokensOut, model } = await analyseReturn({
      returnId: r.returnId,
      builderId: r.builderId,
      productId: r.productId,
      reason: r.reason,
      reasonDetails: r.reasonDetails ?? undefined,
      orderContext: {
        orderNumber: r.order.orderNumber,
        purchasedAt: r.order.createdAt.toISOString(),
        priceGbp: Number(r.order.totalGbp),
      },
      builderHistory: {
        unitsBuilt90d,
        unitsSold90d: unitsBuilt90d,
        rmaCount90d,
        rmaRate90d: unitsBuilt90d === 0 ? 0 : rmaCount90d / unitsBuilt90d,
        priorFlags: priorFlags.map((f) => ({
          code: f.aiFlaggedPattern ?? 'unknown',
          severity: String(f.aiSeverity ?? '0'),
          raisedAt: f.createdAt.toISOString(),
        })),
        qualityScore: Number(r.builder.qualityScore),
      },
    });

    await connectMongo();
    await ReturnAnalysis.findOneAndUpdate(
      { postgresReturnId: r.returnId },
      {
        $set: {
          postgresReturnId: r.returnId,
          postgresBuilderId: r.builderId,
          postgresProductId: r.productId,
          model,
          severity: analysis.severity,
          rootCauseGuess: analysis.rootCauseGuess,
          categoryTags: analysis.categoryTags,
          builderRiskScore: analysis.builderRiskScore,
          patternFlags: analysis.patternFlags,
          recommendedAction: analysis.recommendedAction,
          rationale: analysis.rationale,
          tokensIn,
          tokensOut,
          analysedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    await prisma.return.update({
      where: { returnId: r.returnId },
      data: {
        aiSeverity: analysis.severity,
        aiFlaggedPattern: analysis.patternFlags[0]?.patternCode ?? null,
        aiAnalysis: analysis as never,
      },
    });

    if (analysis.severity > 0.7 || analysis.patternFlags.length > 0) {
      await BuilderQualityFlag.create({
        postgresBuilderId: r.builderId,
        flagCode: analysis.patternFlags[0]?.patternCode ?? 'high_severity_return',
        severity: analysis.severity > 0.85 ? 'critical' : 'warn',
        message: analysis.rootCauseGuess,
        evidence: { returnId: r.returnId, rationale: analysis.rationale },
      });
      await prisma.builder.update({
        where: { builderId: r.builderId },
        data: { flaggedByAi: true, lastFlagReason: analysis.rootCauseGuess },
      });
    }
  } catch (err) {
    console.error('[return-analyzer] failed', err);
  }
}
