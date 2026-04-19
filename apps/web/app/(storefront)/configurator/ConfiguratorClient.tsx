'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

/**
 * Build-a-PC configurator (A95).
 *
 * Five-step wizard: use-case → chassis → compute → storage & memory → finish.
 * All state is client-only; committing persists a Quote via /api/configurator/save
 * so an account manager can follow up.
 */

type UseCase = 'gaming' | 'workstation' | 'creator' | 'lab';

type ChassisKey = 'tower' | 'midi' | 'sff';
type CpuKey = 'r7' | 'r9' | 'i7' | 'i9';
type GpuKey = 'none' | '5070' | '5080' | '5090';
type RamKey = '32' | '64' | '128';
type StorageKey = '1tb' | '2tb' | '4tb' | '8tb';

type Selection = {
  useCase: UseCase;
  chassis: ChassisKey;
  cpu: CpuKey;
  gpu: GpuKey;
  ram: RamKey;
  storage: StorageKey;
  name: string;
  contactEmail: string;
  contactName: string;
  notes: string;
};

const INITIAL: Selection = {
  useCase: 'gaming',
  chassis: 'midi',
  cpu: 'r9',
  gpu: '5080',
  ram: '64',
  storage: '2tb',
  name: '',
  contactEmail: '',
  contactName: '',
  notes: '',
};

const USE_CASES: Array<{ key: UseCase; title: string; blurb: string; meta: string }> = [
  {
    key: 'gaming',
    title: 'Gaming',
    blurb: 'High refresh, low latency, quiet under load. Tuned for 1440p and 4K at sensible settings.',
    meta: 'From £1,899',
  },
  {
    key: 'workstation',
    title: 'Workstation',
    blurb: 'Multi-core throughput for compilation, CAD, and simulation. ECC memory where the platform allows.',
    meta: 'From £2,499',
  },
  {
    key: 'creator',
    title: 'Creator',
    blurb: 'Colour-accurate, timeline-scrub smooth. Fast storage, generous RAM, silent enclosures.',
    meta: 'From £2,299',
  },
  {
    key: 'lab',
    title: 'Lab / homelab',
    blurb: 'Virtualisation, ML experimentation, storage density. Built for uptime, not benchmarks.',
    meta: 'From £1,999',
  },
];

const CHASSIS: Array<{ key: ChassisKey; title: string; blurb: string; meta: string }> = [
  {
    key: 'sff',
    title: 'Small-form-factor',
    blurb: '12 to 18 litres. Desk-side, airline-friendly, the one that surprises people.',
    meta: '+ £0',
  },
  {
    key: 'midi',
    title: 'Mid-tower',
    blurb: 'The honest default. Room for a triple fan GPU, an AIO, and thoughtful cable routing.',
    meta: '+ £0',
  },
  {
    key: 'tower',
    title: 'Full tower',
    blurb: 'For dual-GPU, a full-size AIO, multi-drive arrays, and hot-running silicon.',
    meta: '+ £180',
  },
];

const CPUS: Array<{ key: CpuKey; title: string; blurb: string; priceGbp: number }> = [
  { key: 'r7', title: 'AMD Ryzen 7 9700X', blurb: '8-core, 16-thread. The efficiency choice. Quiet at load.', priceGbp: 0 },
  { key: 'r9', title: 'AMD Ryzen 9 9900X', blurb: '12-core, 24-thread. Sweet spot for creator and mixed loads.', priceGbp: 260 },
  { key: 'i7', title: 'Intel Core i7-14700K', blurb: '8P + 12E cores. Strong single-thread, great gaming.', priceGbp: 120 },
  { key: 'i9', title: 'Intel Core i9-14900KS', blurb: '8P + 16E cores. Our top-of-chart option. Hot, fast, honest.', priceGbp: 540 },
];

const GPUS: Array<{ key: GpuKey; title: string; blurb: string; priceGbp: number }> = [
  { key: 'none', title: 'Integrated graphics', blurb: 'No discrete GPU. Best for dev, servers, and office work.', priceGbp: 0 },
  { key: '5070', title: 'NVIDIA RTX 5070', blurb: '12GB GDDR7. 1440p at high refresh, 4K at sensible settings.', priceGbp: 720 },
  { key: '5080', title: 'NVIDIA RTX 5080', blurb: '16GB GDDR7. 4K high refresh. DLSS 4 handles the rest.', priceGbp: 1180 },
  { key: '5090', title: 'NVIDIA RTX 5090', blurb: '32GB GDDR7. The top of the chart, for people who know.', priceGbp: 2140 },
];

const RAM: Array<{ key: RamKey; title: string; blurb: string; priceGbp: number }> = [
  { key: '32', title: '32GB DDR5-6000', blurb: 'Enough for gaming and most creator pipelines.', priceGbp: 0 },
  { key: '64', title: '64GB DDR5-6000', blurb: 'The honest default for pro workloads.', priceGbp: 140 },
  { key: '128', title: '128GB DDR5-5600', blurb: 'For virtualisation, large models, and NLE timelines.', priceGbp: 420 },
];

const STORAGE: Array<{ key: StorageKey; title: string; blurb: string; priceGbp: number }> = [
  { key: '1tb', title: '1TB NVMe (PCIe 5.0)', blurb: 'Fast enough for one project at a time.', priceGbp: 0 },
  { key: '2tb', title: '2TB NVMe (PCIe 5.0)', blurb: 'The sensible default. Two years of raw footage.', priceGbp: 120 },
  { key: '4tb', title: '4TB NVMe (PCIe 5.0)', blurb: 'For creators and lab builds with a healthy cache tier.', priceGbp: 360 },
  { key: '8tb', title: '8TB NVMe (PCIe 4.0)', blurb: 'Mixed-tier storage. Where you keep the whole archive.', priceGbp: 780 },
];

const STEPS = ['Use', 'Chassis', 'Compute', 'Memory', 'Finish'] as const;

// Baseline build price (chassis + PSU + motherboard + case fans + labour).
const BASE_GBP = 1199;

export function ConfiguratorClient() {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<Selection>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ quoteNumber: string } | null>(null);
  const [error, setError] = useState('');

  const totalGbp = useMemo(() => {
    const chassisMod = CHASSIS.find((c) => c.key === sel.chassis);
    const cpu = CPUS.find((c) => c.key === sel.cpu);
    const gpu = GPUS.find((c) => c.key === sel.gpu);
    const ram = RAM.find((c) => c.key === sel.ram);
    const storage = STORAGE.find((c) => c.key === sel.storage);
    const chassisDelta = chassisMod?.key === 'tower' ? 180 : 0;
    return (
      BASE_GBP + chassisDelta + (cpu?.priceGbp ?? 0) + (gpu?.priceGbp ?? 0) + (ram?.priceGbp ?? 0) + (storage?.priceGbp ?? 0)
    );
  }, [sel]);

  function patch<K extends keyof Selection>(k: K, v: Selection[K]) {
    setSel((s) => ({ ...s, [k]: v }));
  }

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/configurator/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection: sel,
          totalGbp,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? 'Save failed');
      }
      const data = (await res.json()) as { quoteNumber: string };
      setDone({ quoteNumber: data.quoteNumber });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="mx-auto max-w-page px-12 py-32">
        <div className="bav-label mb-6 text-ink-60">— Quote saved</div>
        <h1 className="mb-10 font-display font-light leading-[0.98] tracking-[-0.03em] text-[clamp(48px,5vw,72px)]">
          Noted, in <span className="bav-italic">ink</span>.
        </h1>
        <p className="mb-10 max-w-[560px] text-[17px] leading-[1.6] text-ink-60">
          Reference <span className="font-mono">{done.quoteNumber}</span>. An account manager will pick this up within one working
          day. If you need to amend anything before then, reply to the confirmation email and we will reopen the draft.
        </p>
        <div className="flex gap-8">
          <Link href="/" className="bav-underline text-[14px] text-ink no-underline">
            <span>Back to home</span>
            <span className="arrow">→</span>
          </Link>
          <Link href="/shop" className="bav-underline text-[14px] text-ink-60 no-underline">
            <span>Shop the catalogue</span>
            <span className="arrow">→</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-page px-12 pb-24 pt-20">
      <div className="bav-label mb-5 text-ink-60">— Configurator · Birmingham · made to spec</div>
      <h1 className="mb-4 font-display font-light leading-[0.98] tracking-[-0.03em] text-[clamp(44px,5vw,72px)]">
        Spec the <span className="bav-italic">machine</span>.
      </h1>
      <p className="mb-16 max-w-[680px] text-[17px] leading-[1.65] text-ink-60">
        Five steps. No upsells, no drift, no surprises on the invoice. Every build is hand-assembled in Birmingham, burned-in for
        twenty-four hours, and shipped with a signed birth certificate. Prices update as you go.
      </p>

      <div className="grid grid-cols-12 gap-16">
        {/* Stepper rail */}
        <aside className="col-span-3">
          <div className="sticky top-24">
            <div className="bav-label mb-4 text-ink-60">— Steps</div>
            <ol className="space-y-[10px]">
              {STEPS.map((label, i) => {
                const active = i === step;
                const done = i < step;
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className="group flex w-full items-baseline gap-4 bg-transparent text-left"
                    >
                      <span className={`font-mono tabular-nums text-[12px] ${active ? 'text-ink' : done ? 'text-ink-60' : 'text-ink-30'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-display text-[22px] tracking-[-0.01em] transition-opacity ${
                          active ? 'text-ink' : done ? 'text-ink-60 opacity-70' : 'text-ink-30 opacity-60'
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-10 border-t border-ink-10 pt-6">
              <div className="bav-label mb-2 text-ink-60">— Running total</div>
              <div className="font-mono text-[32px] tabular-nums tracking-[-0.01em]">{gbp(totalGbp)}</div>
              <div className="bav-label mt-1 text-ink-60">from · inc. VAT · ex. shipping</div>
            </div>
          </div>
        </aside>

        {/* Step body */}
        <div className="col-span-9">
          {step === 0 && (
            <StepUseCase value={sel.useCase} onChange={(v) => patch('useCase', v)} />
          )}
          {step === 1 && (
            <StepChassis value={sel.chassis} onChange={(v) => patch('chassis', v)} />
          )}
          {step === 2 && (
            <StepCompute
              cpu={sel.cpu}
              gpu={sel.gpu}
              onCpu={(v) => patch('cpu', v)}
              onGpu={(v) => patch('gpu', v)}
            />
          )}
          {step === 3 && (
            <StepMemory
              ram={sel.ram}
              storage={sel.storage}
              onRam={(v) => patch('ram', v)}
              onStorage={(v) => patch('storage', v)}
            />
          )}
          {step === 4 && (
            <StepFinish
              sel={sel}
              onName={(v) => patch('name', v)}
              onContactName={(v) => patch('contactName', v)}
              onContactEmail={(v) => patch('contactEmail', v)}
              onNotes={(v) => patch('notes', v)}
              totalGbp={totalGbp}
              submitting={submitting}
              error={error}
              onSubmit={submit}
            />
          )}

          <div className="mt-16 flex items-center justify-between border-t border-ink-10 pt-6">
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="bav-underline text-[13px] text-ink-60 no-underline disabled:opacity-30"
            >
              <span>Back</span>
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="border border-ink bg-ink px-8 py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90"
              >
                Next step →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepUseCase({ value, onChange }: { value: UseCase; onChange: (v: UseCase) => void }) {
  return (
    <div>
      <div className="bav-label mb-4 text-ink-60">— 01 · Use</div>
      <h2 className="mb-10 font-display font-light leading-[1] tracking-[-0.025em] text-[clamp(32px,3.5vw,44px)]">
        What is it for?
      </h2>
      <div className="grid grid-cols-2 gap-5">
        {USE_CASES.map((u) => (
          <OptionCard
            key={u.key}
            selected={value === u.key}
            onClick={() => onChange(u.key)}
            title={u.title}
            blurb={u.blurb}
            meta={u.meta}
          />
        ))}
      </div>
    </div>
  );
}

function StepChassis({ value, onChange }: { value: ChassisKey; onChange: (v: ChassisKey) => void }) {
  return (
    <div>
      <div className="bav-label mb-4 text-ink-60">— 02 · Chassis</div>
      <h2 className="mb-10 font-display font-light leading-[1] tracking-[-0.025em] text-[clamp(32px,3.5vw,44px)]">
        The enclosure.
      </h2>
      <div className="grid grid-cols-3 gap-5">
        {CHASSIS.map((c) => (
          <OptionCard
            key={c.key}
            selected={value === c.key}
            onClick={() => onChange(c.key)}
            title={c.title}
            blurb={c.blurb}
            meta={c.meta}
          />
        ))}
      </div>
    </div>
  );
}

function StepCompute({
  cpu,
  gpu,
  onCpu,
  onGpu,
}: {
  cpu: CpuKey;
  gpu: GpuKey;
  onCpu: (v: CpuKey) => void;
  onGpu: (v: GpuKey) => void;
}) {
  return (
    <div>
      <div className="bav-label mb-4 text-ink-60">— 03 · Compute</div>
      <h2 className="mb-10 font-display font-light leading-[1] tracking-[-0.025em] text-[clamp(32px,3.5vw,44px)]">
        Silicon choices.
      </h2>
      <div className="mb-10">
        <div className="bav-label mb-4 text-ink-60">CPU</div>
        <div className="grid grid-cols-2 gap-5">
          {CPUS.map((c) => (
            <OptionCard
              key={c.key}
              selected={cpu === c.key}
              onClick={() => onCpu(c.key)}
              title={c.title}
              blurb={c.blurb}
              meta={c.priceGbp === 0 ? 'Included' : `+ ${gbp(c.priceGbp)}`}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="bav-label mb-4 text-ink-60">GPU</div>
        <div className="grid grid-cols-2 gap-5">
          {GPUS.map((g) => (
            <OptionCard
              key={g.key}
              selected={gpu === g.key}
              onClick={() => onGpu(g.key)}
              title={g.title}
              blurb={g.blurb}
              meta={g.priceGbp === 0 ? 'Included' : `+ ${gbp(g.priceGbp)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepMemory({
  ram,
  storage,
  onRam,
  onStorage,
}: {
  ram: RamKey;
  storage: StorageKey;
  onRam: (v: RamKey) => void;
  onStorage: (v: StorageKey) => void;
}) {
  return (
    <div>
      <div className="bav-label mb-4 text-ink-60">— 04 · Memory</div>
      <h2 className="mb-10 font-display font-light leading-[1] tracking-[-0.025em] text-[clamp(32px,3.5vw,44px)]">
        Memory and storage.
      </h2>
      <div className="mb-10">
        <div className="bav-label mb-4 text-ink-60">RAM</div>
        <div className="grid grid-cols-3 gap-5">
          {RAM.map((r) => (
            <OptionCard
              key={r.key}
              selected={ram === r.key}
              onClick={() => onRam(r.key)}
              title={r.title}
              blurb={r.blurb}
              meta={r.priceGbp === 0 ? 'Included' : `+ ${gbp(r.priceGbp)}`}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="bav-label mb-4 text-ink-60">Primary storage</div>
        <div className="grid grid-cols-2 gap-5">
          {STORAGE.map((s) => (
            <OptionCard
              key={s.key}
              selected={storage === s.key}
              onClick={() => onStorage(s.key)}
              title={s.title}
              blurb={s.blurb}
              meta={s.priceGbp === 0 ? 'Included' : `+ ${gbp(s.priceGbp)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepFinish({
  sel,
  onName,
  onContactName,
  onContactEmail,
  onNotes,
  totalGbp,
  submitting,
  error,
  onSubmit,
}: {
  sel: Selection;
  onName: (v: string) => void;
  onContactName: (v: string) => void;
  onContactEmail: (v: string) => void;
  onNotes: (v: string) => void;
  totalGbp: number;
  submitting: boolean;
  error: string;
  onSubmit: () => void;
}) {
  const cpuLabel = CPUS.find((c) => c.key === sel.cpu)?.title ?? '';
  const gpuLabel = GPUS.find((g) => g.key === sel.gpu)?.title ?? '';
  const ramLabel = RAM.find((r) => r.key === sel.ram)?.title ?? '';
  const storageLabel = STORAGE.find((s) => s.key === sel.storage)?.title ?? '';
  const chassisLabel = CHASSIS.find((c) => c.key === sel.chassis)?.title ?? '';

  const canSubmit =
    sel.contactEmail.trim().length > 3 && sel.contactEmail.includes('@') && sel.contactName.trim().length > 0 && !submitting;

  return (
    <div>
      <div className="bav-label mb-4 text-ink-60">— 05 · Finish</div>
      <h2 className="mb-10 font-display font-light leading-[1] tracking-[-0.025em] text-[clamp(32px,3.5vw,44px)]">
        Hand it over.
      </h2>

      {/* Receipt */}
      <div className="mb-10 border border-ink-10 bg-paper-2 p-8">
        <div className="bav-label mb-4 text-ink-60">— Your build</div>
        <dl className="grid grid-cols-[180px_1fr] gap-y-3 text-[14px]">
          <dt className="text-ink-60">Use case</dt>
          <dd className="capitalize">{sel.useCase}</dd>
          <dt className="text-ink-60">Chassis</dt>
          <dd>{chassisLabel}</dd>
          <dt className="text-ink-60">CPU</dt>
          <dd>{cpuLabel}</dd>
          <dt className="text-ink-60">GPU</dt>
          <dd>{gpuLabel}</dd>
          <dt className="text-ink-60">Memory</dt>
          <dd>{ramLabel}</dd>
          <dt className="text-ink-60">Storage</dt>
          <dd>{storageLabel}</dd>
        </dl>
        <div className="mt-6 flex items-baseline justify-between border-t border-ink-10 pt-4">
          <span className="bav-label text-ink-60">Total · ex. shipping</span>
          <span className="font-mono text-[28px] tabular-nums">{gbp(totalGbp)}</span>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-8">
        <label className="flex flex-col gap-2">
          <span className="bav-label text-ink-60">Name</span>
          <input
            value={sel.contactName}
            onChange={(e) => onContactName(e.target.value)}
            className="border-0 border-b border-ink-10 bg-transparent py-3 text-[14px] outline-none focus:border-ink"
            placeholder="Your name"
            autoComplete="name"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="bav-label text-ink-60">Email</span>
          <input
            type="email"
            value={sel.contactEmail}
            onChange={(e) => onContactEmail(e.target.value)}
            className="border-0 border-b border-ink-10 bg-transparent py-3 text-[14px] outline-none focus:border-ink"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-2">
          <span className="bav-label text-ink-60">Build nickname (optional)</span>
          <input
            value={sel.name}
            onChange={(e) => onName(e.target.value)}
            className="border-0 border-b border-ink-10 bg-transparent py-3 text-[14px] outline-none focus:border-ink"
            placeholder="Machine name for your records"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-2">
          <span className="bav-label text-ink-60">Notes</span>
          <textarea
            value={sel.notes}
            onChange={(e) => onNotes(e.target.value)}
            rows={4}
            className="resize-y border border-ink-10 bg-transparent p-4 text-[14px] leading-[1.55] outline-none focus:border-ink"
            placeholder="Anything else the builder should know — chassis colour, quiet preference, Linux distro, deadlines."
          />
        </label>
      </div>

      {error && <div className="mt-4 font-mono text-[12px] text-red-700">{error}</div>}

      <div className="mt-10 flex items-center justify-between">
        <div className="bav-label text-ink-60">— No payment required. We reply within one working day.</div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="border border-ink bg-ink px-10 py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Saving quote…' : 'Save quote →'}
        </button>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  blurb,
  meta,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  blurb: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-3 border bg-transparent p-6 text-left transition-colors hover:border-ink"
      style={{
        borderColor: selected ? 'var(--ink)' : 'var(--ink-10)',
        background: selected ? 'var(--paper-2)' : 'transparent',
      }}
    >
      <div className="flex w-full items-baseline justify-between gap-3">
        <span className="font-display text-[20px] tracking-[-0.01em]">{title}</span>
        <span className="font-mono text-[11px] tabular-nums uppercase tracking-[0.1em] text-ink-60">{meta}</span>
      </div>
      <span className="text-[13px] leading-[1.55] text-ink-60">{blurb}</span>
    </button>
  );
}

function gbp(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}
