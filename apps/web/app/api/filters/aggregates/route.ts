import { connectMongo, ProductCatalog } from '@/lib/db';
import { handleError, ok } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectMongo();
    const [cpuFamilies, gpuModels, ramSizes] = await Promise.all([
      ProductCatalog.distinct('specs.cpu.family'),
      ProductCatalog.distinct('specs.gpu.model'),
      ProductCatalog.distinct('specs.memory.sizeGb'),
    ]);
    return ok({
      cpuFamilies: cpuFamilies.filter(Boolean).sort(),
      gpuModels: gpuModels.filter(Boolean).sort(),
      ramSizes: (ramSizes as number[]).filter((r) => typeof r === 'number').sort((a, b) => a - b),
    });
  } catch (err) {
    return handleError(err);
  }
}
