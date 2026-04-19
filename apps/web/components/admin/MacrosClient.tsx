'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

export type MacroRow = {
  macroId: string;
  title: string;
  body: string;
  tags: string[];
  timesUsed: number;
  createdAt: string;
  updatedAt: string;
};

export type MacroCategory = { slug: string; label: string; count: number };

interface Props {
  initialMacros: MacroRow[];
  categories: MacroCategory[];
}

const ink = 'var(--ink)';
const ink60 = 'var(--ink-60)';
const ink30 = 'var(--ink-30)';
const ink10 = 'var(--ink-10)';
const paper = 'var(--paper)';
const paper2 = 'var(--paper-2)';

const VARIABLES = [
  { token: '{{customer.firstName}}', desc: 'Customer first name' },
  { token: '{{order.number}}', desc: 'Order number, e.g. BAV-260418-739201' },
  { token: '{{product.title}}', desc: 'Product display title' },
  { token: '{{builder.displayName}}', desc: 'Builder who built or is handling the unit' },
  { token: '{{refund.amount}}', desc: 'Refund amount in GBP' },
  { token: '{{trackingNumber}}', desc: 'DPD tracking number' },
  { token: '{{claim.number}}', desc: 'AV Care claim number' },
  { token: '{{agent.firstName}}', desc: 'Signed-in staff member sending the reply' },
];

function previewFor(body: string) {
  return body
    .replaceAll('{{customer.firstName}}', 'Rebecca')
    .replaceAll('{{order.number}}', 'BAV-260418-739201')
    .replaceAll('{{product.title}}', 'Aegis Ultra RTX 4090')
    .replaceAll('{{builder.displayName}}', 'Alfie Ashworth')
    .replaceAll('{{refund.amount}}', '£2,144.00')
    .replaceAll('{{trackingNumber}}', '15302847119GB')
    .replaceAll('{{claim.number}}', 'AVC-000127')
    .replaceAll('{{agent.firstName}}', 'Hamzah');
}

export function MacrosClient({ initialMacros, categories }: Props) {
  const router = useRouter();
  const [macros, setMacros] = useState<MacroRow[]>(initialMacros);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<{ title: string; body: string; tags: string }>({
    title: '',
    body: '',
    tags: '',
  });

  const selected = useMemo(
    () => (selectedId ? macros.find((m) => m.macroId === selectedId) ?? null : null),
    [macros, selectedId],
  );

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return macros;
    return macros.filter((m) => m.tags.includes(activeCategory));
  }, [macros, activeCategory]);

  const openForEdit = (m: MacroRow) => {
    setSelectedId(m.macroId);
    setIsNewOpen(false);
    setForm({ title: m.title, body: m.body, tags: m.tags.join(', ') });
  };

  const openForNew = () => {
    setSelectedId(null);
    setIsNewOpen(true);
    setForm({ title: '', body: '', tags: '' });
  };

  const closeEditor = () => {
    setSelectedId(null);
    setIsNewOpen(false);
  };

  const handleSave = async () => {
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = { title: form.title, body: form.body, tags };
    try {
      if (selected) {
        const res = await fetch(`/api/admin/macros/${selected.macroId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('save failed');
        const data = (await res.json()) as { macro: MacroRow };
        setMacros((prev) => prev.map((m) => (m.macroId === data.macro.macroId ? data.macro : m)));
      } else {
        const res = await fetch('/api/admin/macros', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('create failed');
        const data = (await res.json()) as { macro: MacroRow };
        setMacros((prev) => [data.macro, ...prev]);
      }
      closeEditor();
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      alert('Save failed — check the console.');
    }
  };

  const handleDelete = async (macroId: string) => {
    if (!confirm('Delete this macro?')) return;
    try {
      const res = await fetch(`/api/admin/macros/${macroId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setMacros((prev) => prev.filter((m) => m.macroId !== macroId));
      if (selectedId === macroId) closeEditor();
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      alert('Delete failed — check the console.');
    }
  };

  const isEditorOpen = Boolean(selected) || isNewOpen;

  return (
    <>
      {/* top action row */}
      <div className="flex flex-wrap items-center justify-end gap-3 px-12 pb-6">
        <button type="button" className="bav-cta" style={{ width: 'auto', padding: '14px 28px' }} onClick={openForNew}>
          New macro
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* category list */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: `1px solid ${ink10}`,
            padding: '32px 0',
          }}
        >
          {categories.map((cat) => {
            const active = cat.slug === activeCategory;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={active ? '' : 'bav-hover-opa'}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: '14px 32px 14px 30px',
                  borderLeft: active ? `2px solid ${ink}` : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: active ? ink : ink60,
                }}
              >
                <span className="bav-label">{cat.label}</span>
                <span className="font-mono tabular-nums" style={{ fontSize: 11, color: ink30 }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* macro table */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(260px, 1.6fr) 160px 120px 120px',
              borderBottom: `1px solid ${ink}`,
              padding: '14px 32px',
              gap: 20,
            }}
          >
            <div className="bav-label" style={{ color: ink60 }}>Title</div>
            <div className="bav-label" style={{ color: ink60 }}>Tags</div>
            <div className="bav-label" style={{ color: ink60, textAlign: 'right' }}>Uses</div>
            <div className="bav-label" style={{ color: ink60, textAlign: 'right' }}>Actions</div>
          </div>

          {filtered.length === 0 && (
            <div className="px-8 py-10 text-[13px]" style={{ color: ink60 }}>
              No macros yet. Click “New macro” to add one.
            </div>
          )}

          {filtered.map((m) => (
            <div
              key={m.macroId}
              onClick={() => openForEdit(m)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(260px, 1.6fr) 160px 120px 120px',
                borderBottom: `1px solid ${ink10}`,
                padding: '20px 32px',
                gap: 20,
                alignItems: 'start',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = paper2;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <div>
                <div
                  className="font-display"
                  style={{ fontWeight: 400, fontSize: 15, marginBottom: 6, fontVariationSettings: "'opsz' 144" }}
                >
                  {m.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: ink60,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {m.body.slice(0, 160)}
                </div>
              </div>
              <div className="font-mono" style={{ fontSize: 11, color: ink60 }}>
                {m.tags.length > 0 ? m.tags.join(', ') : '—'}
              </div>
              <div className="font-mono tabular-nums" style={{ fontSize: 11, color: ink60, textAlign: 'right' }}>
                {m.timesUsed}
              </div>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  className="bav-underline"
                  style={{ fontSize: 11 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openForEdit(m);
                  }}
                >
                  Edit <span className="arrow">→</span>
                </button>
                <button
                  type="button"
                  className="bav-label bav-hover-opa"
                  style={{ color: ink30, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(m.macroId);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* slide-over editor */}
      {isEditorOpen && (
        <>
          <div
            onClick={closeEditor}
            style={{ position: 'fixed', inset: 0, background: 'rgba(23,20,15,0.35)', zIndex: 59 }}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 560,
              maxWidth: '100%',
              height: '100vh',
              background: paper,
              borderLeft: `1px solid ${ink10}`,
              zIndex: 60,
              overflowY: 'auto',
              animation: 'bavSlideInRight 400ms cubic-bezier(0.16, 1, 0.3, 1) backwards',
            }}
          >
            <div style={{ padding: 40 }}>
              <div className="mb-6 flex items-center justify-between">
                <div className="bav-label" style={{ color: ink60 }}>— Editor</div>
                <button
                  type="button"
                  onClick={closeEditor}
                  style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: ink60 }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <h2
                className="font-display font-light"
                style={{
                  fontSize: 32,
                  letterSpacing: '-0.01em',
                  marginBottom: 32,
                  fontVariationSettings: "'opsz' 144",
                }}
              >
                {selected ? (
                  <>
                    Edit <span className="bav-italic">macro</span>.
                  </>
                ) : (
                  <>
                    New <span className="bav-italic">macro</span>.
                  </>
                )}
              </h2>

              <div style={{ borderTop: `1px solid ${ink10}` }}>
                <div style={{ borderBottom: `1px solid ${ink10}`, padding: '16px 0' }}>
                  <div className="bav-label mb-2" style={{ color: ink60 }}>Title</div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Short description of this macro"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      color: ink,
                      padding: 0,
                    }}
                  />
                </div>
                <div style={{ borderBottom: `1px solid ${ink10}`, padding: '16px 0' }}>
                  <div className="bav-label mb-2" style={{ color: ink60 }}>Tags (comma-separated)</div>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="order-status, avcare"
                    className="font-mono"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 13,
                      color: ink,
                      padding: 0,
                    }}
                  />
                </div>
                <div style={{ borderBottom: `1px solid ${ink10}`, padding: '16px 0' }}>
                  <div className="bav-label mb-3" style={{ color: ink60 }}>Body</div>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    rows={12}
                    className="font-mono"
                    style={{
                      width: '100%',
                      background: paper2,
                      border: `1px solid ${ink10}`,
                      outline: 'none',
                      fontSize: 12,
                      color: ink,
                      padding: 14,
                      lineHeight: 1.6,
                      resize: 'vertical',
                    }}
                  />
                  <div className="mt-5">
                    <div className="bav-label mb-3" style={{ color: ink30 }}>— Available variables</div>
                    <div style={{ borderTop: `1px solid ${ink10}` }}>
                      {VARIABLES.map((v) => (
                        <div
                          key={v.token}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '220px 1fr',
                            padding: '8px 0',
                            borderBottom: `1px solid ${ink10}`,
                            gap: 16,
                          }}
                        >
                          <div className="font-mono" style={{ fontSize: 11, color: ink }}>{v.token}</div>
                          <div style={{ fontSize: 12, color: ink60 }}>{v.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {form.body && (
                <div className="mt-8">
                  <div className="bav-label mb-3" style={{ color: ink60 }}>— Preview (with demo values)</div>
                  <div
                    style={{
                      background: paper2,
                      padding: 24,
                      fontSize: 13,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      color: ink,
                    }}
                  >
                    {previewFor(form.body)}
                  </div>
                </div>
              )}

              <div className="mt-10 flex gap-3">
                <button
                  type="button"
                  className="bav-cta"
                  style={{ flex: 1, padding: '14px 28px' }}
                  onClick={handleSave}
                  disabled={isPending || !form.title || !form.body}
                >
                  {isPending ? 'Saving…' : 'Save macro'}
                </button>
                <button
                  type="button"
                  className="bav-cta-secondary"
                  style={{ flex: 1, padding: '14px 28px' }}
                  onClick={closeEditor}
                >
                  Cancel
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
