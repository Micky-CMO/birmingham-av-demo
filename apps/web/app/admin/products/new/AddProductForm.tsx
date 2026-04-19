'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Category = { slug: string; name: string; categoryId: string };
type Builder = { builderId: string; builderCode: string; displayName: string };

const input =
  'w-full border-0 border-b border-ink-10 bg-transparent px-0 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-30';

export function AddProductForm({
  categories,
  builders,
}: {
  categories: Category[];
  builders: Builder[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    sku: '',
    categoryId: categories[0]?.categoryId ?? '',
    builderId: builders[0]?.builderId ?? '',
    priceGbp: '',
    compareAtGbp: '',
    conditionGrade: 'new',
    warrantyMonths: '12',
    stockQty: '1',
    imageUrl: '',
    isActive: true,
    isFeatured: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          sku: form.sku.trim(),
          categoryId: form.categoryId,
          builderId: form.builderId,
          priceGbp: Number(form.priceGbp),
          compareAtGbp: form.compareAtGbp ? Number(form.compareAtGbp) : null,
          conditionGrade: form.conditionGrade,
          warrantyMonths: Number(form.warrantyMonths),
          stockQty: Number(form.stockQty),
          imageUrl: form.imageUrl.trim() || null,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      const { productId } = await res.json();
      router.push(`/admin/products/${productId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <section className="grid gap-8">
        <div>
          <label htmlFor="title" className="bav-label mb-2 block text-ink-60">
            Title (required)
          </label>
          <input
            id="title"
            required
            className={input}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ryzen 7 · RTX 4070 gaming build"
          />
        </div>
        <div>
          <label htmlFor="subtitle" className="bav-label mb-2 block text-ink-60">
            Subtitle
          </label>
          <input
            id="subtitle"
            className={input}
            value={form.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            placeholder="1440p ready · quiet build · 12-month warranty"
          />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <label htmlFor="sku" className="bav-label mb-2 block text-ink-60">
              SKU (required)
            </label>
            <input
              id="sku"
              required
              className={`${input} font-mono`}
              value={form.sku}
              onChange={(e) => set('sku', e.target.value.toUpperCase())}
              placeholder="BAV-GPC-4120"
            />
          </div>
          <div>
            <label htmlFor="category" className="bav-label mb-2 block text-ink-60">
              Category
            </label>
            <select
              id="category"
              className={input}
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="builder" className="bav-label mb-2 block text-ink-60">
              Builder
            </label>
            <select
              id="builder"
              className={input}
              value={form.builderId}
              onChange={(e) => set('builderId', e.target.value)}
            >
              {builders.map((b) => (
                <option key={b.builderId} value={b.builderId}>
                  {b.builderCode} · {b.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div>
          <label htmlFor="price" className="bav-label mb-2 block text-ink-60">
            Price GBP (required)
          </label>
          <input
            id="price"
            required
            type="number"
            step="0.01"
            min="0"
            className={`${input} font-mono`}
            value={form.priceGbp}
            onChange={(e) => set('priceGbp', e.target.value)}
            placeholder="1849.00"
          />
        </div>
        <div>
          <label htmlFor="compareAt" className="bav-label mb-2 block text-ink-60">
            Compare at
          </label>
          <input
            id="compareAt"
            type="number"
            step="0.01"
            min="0"
            className={`${input} font-mono`}
            value={form.compareAtGbp}
            onChange={(e) => set('compareAtGbp', e.target.value)}
            placeholder="1999.00"
          />
        </div>
        <div>
          <label htmlFor="stock" className="bav-label mb-2 block text-ink-60">
            Stock qty
          </label>
          <input
            id="stock"
            type="number"
            min="0"
            className={`${input} font-mono`}
            value={form.stockQty}
            onChange={(e) => set('stockQty', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="warranty" className="bav-label mb-2 block text-ink-60">
            Warranty (months)
          </label>
          <input
            id="warranty"
            type="number"
            min="0"
            className={`${input} font-mono`}
            value={form.warrantyMonths}
            onChange={(e) => set('warrantyMonths', e.target.value)}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <label htmlFor="condition" className="bav-label mb-2 block text-ink-60">
            Condition
          </label>
          <select
            id="condition"
            className={input}
            value={form.conditionGrade}
            onChange={(e) => set('conditionGrade', e.target.value)}
          >
            <option value="new">New</option>
            <option value="like_new">Like new</option>
            <option value="excellent">Excellent (refurbished)</option>
            <option value="very_good">Very good</option>
            <option value="good">Good</option>
          </select>
        </div>
        <div>
          <label htmlFor="image" className="bav-label mb-2 block text-ink-60">
            Primary image URL
          </label>
          <input
            id="image"
            type="url"
            className={input}
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://…"
          />
        </div>
      </section>

      <section className="flex flex-wrap gap-8 border-t border-ink-10 pt-8">
        <label className="flex items-center gap-3 text-[14px]">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
          />
          Active (visible in shop)
        </label>
        <label className="flex items-center gap-3 text-[14px]">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
          />
          Featured (homepage + category highlight)
        </label>
      </section>

      {error && (
        <div className="border border-[#B94040] bg-[rgba(185,64,64,0.04)] px-4 py-3 text-[13px] text-[#B94040]">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-ink-10 pt-8">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="bav-label border border-ink-10 px-5 py-3 text-ink transition-colors hover:border-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bav-label bg-ink px-6 py-3 text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Saving…' : 'Save product'}
        </button>
      </div>
    </form>
  );
}
