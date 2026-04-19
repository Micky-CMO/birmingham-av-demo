import Link from 'next/link';
import { prisma } from '@/lib/db';
import { AddProductForm } from './AddProductForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add product · Admin' };

export default async function NewProductPage() {
  const [categories, builders] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.builder.findMany({
      where: { status: 'active' },
      orderBy: { displayName: 'asc' },
      select: { builderId: true, builderCode: true, displayName: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-[960px] px-6 py-16 md:px-12">
      <div className="mb-10 border-b border-ink-10 pb-8">
        <Link href="/admin/products" className="bav-label bav-hover-opa text-ink-60 no-underline">
          ← Products
        </Link>
        <div className="bav-label mt-8 text-ink-60">— Admin · Add product</div>
        <h1 className="m-0 mt-4 font-display text-[48px] font-light leading-[1] tracking-[-0.025em]">
          New <span className="bav-italic">product</span>.
        </h1>
        <p className="mt-4 max-w-[560px] text-[14px] leading-[1.55] text-ink-60">
          Add a single item. For bulk upload, use Import CSV on the products
          list. Fields marked required must be set before saving as Active.
        </p>
      </div>
      <AddProductForm
        categories={categories.map((c) => ({ slug: c.slug, name: c.name, categoryId: c.categoryId }))}
        builders={builders}
      />
    </main>
  );
}
