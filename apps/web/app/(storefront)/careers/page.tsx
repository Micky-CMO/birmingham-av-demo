import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Work on the bench at Birmingham AV. Open roles across workshop, quality, support, and logistics. We hire workshop first, CV second.',
};

export const dynamic = 'force-static';

const ROLES = [
  {
    code: 'BLD-2026',
    title: 'PC Builder · Senior',
    location: 'Digbeth, Birmingham',
    type: 'Full-time · On-site',
    summary:
      'Lead assembly, burn-in, and sign-off on bespoke builds. Mentor junior builders through the first eighteen months. Minimum three years on a workshop bench.',
  },
  {
    code: 'QCT-2026',
    title: 'Quality Control Technician',
    location: 'Digbeth, Birmingham',
    type: 'Full-time · On-site',
    summary:
      'Run the seven-stage bench test. Catch what the builder missed. Write the birth certificate. Previous refurb or service-centre experience preferred.',
  },
  {
    code: 'SUP-2026',
    title: 'Customer Support Lead',
    location: 'Remote, United Kingdom',
    type: 'Full-time · Remote',
    summary:
      'Own escalated tickets. Partner with the support AI. Coach two junior agents. Write the macros that save everyone time. Strong writing required.',
  },
  {
    code: 'LOG-2026',
    title: 'Warehouse + Logistics',
    location: 'Digbeth, Birmingham',
    type: 'Full-time · On-site',
    summary:
      'Inbound refurb stock. Outbound QC-passed units. Royal Mail, DPD, and Evri liaison. Forklift licence a plus but we can train.',
  },
];

const VALUES = [
  {
    title: 'Made by people, not machines.',
    body: 'Every unit carries the name of the builder who finished it. That signature is the standard — it means someone puts their reputation on the seven-stage bench, not a checklist.',
  },
  {
    title: 'Refurbished is not a second-tier word.',
    body: 'We built this company on the idea that a year-old GPU with a known temperature history is a safer bet than a new one pulled off a pallet. That conviction shows up in how we hire.',
  },
  {
    title: 'Workshop first, CV second.',
    body: 'The interview includes a bench session. Experience matters, but the way you hold a screwdriver, plan cable runs, and talk through a thermal problem matters more than where you trained.',
  },
  {
    title: 'Twelve months, then you own it.',
    body: 'Every role has an eighteen-month plan. After that you choose your next step — team lead, speciality track, workshop-floor rotation, or something we have not thought of yet.',
  },
];

export default function CareersPage() {
  return (
    <>
      {/* HERO */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:pt-32 md:pb-40">
          <div className="bav-fade">
            <div className="bav-label mb-16 text-ink-60">
              — Careers at Birmingham AV · Digbeth, United Kingdom
            </div>
            <h1 className="m-0 mb-14 font-display text-[clamp(56px,9vw,140px)] font-light leading-[0.95] tracking-[-0.035em]">
              Work on the <span className="bav-italic">bench</span>.
            </h1>
            <div className="max-w-[560px]">
              <p className="mb-12 text-[21px] leading-[1.5] text-ink-60">
                Four roles open at the workshop in Digbeth. We hire for the bench first and
                the paperwork second. If you have built, tested, or dispatched machines and
                care about how they leave the door, read on.
              </p>
              <Link href="#roles" className="bav-underline text-[14px] text-ink no-underline">
                <span>See the open roles</span>
                <span className="arrow font-mono">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-b border-ink-10 bg-paper-2">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
          <div className="bav-label mb-16 text-ink-60">— What we believe</div>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-x-16 md:gap-y-20">
            {VALUES.map((v) => (
              <div key={v.title}>
                <h2 className="m-0 mb-6 font-display text-[34px] font-light leading-[1.1] tracking-[-0.025em]">
                  {v.title}
                </h2>
                <p className="m-0 text-[17px] leading-[1.55] text-ink-60">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="bav-label mb-5 text-ink-60">— Open roles</div>
              <h2 className="m-0 font-display text-[48px] font-light leading-[1.05] tracking-[-0.025em]">
                {ROLES.length} positions.
              </h2>
            </div>
            <div className="bav-label hidden text-ink-30 md:block">
              Updated 19 April 2026
            </div>
          </div>

          <ul className="list-none space-y-0 p-0">
            {ROLES.map((role, idx) => (
              <li
                key={role.code}
                className={`grid grid-cols-1 gap-4 border-ink-10 py-10 md:grid-cols-[100px_1fr_auto] md:items-start md:gap-10 ${
                  idx < ROLES.length - 1 ? 'border-b' : ''
                } ${idx === 0 ? 'border-t' : ''}`}
              >
                <div className="bav-label font-mono text-ink-30">№{role.code}</div>
                <div>
                  <h3 className="m-0 mb-2 font-display text-[28px] font-light leading-[1.15] tracking-[-0.02em]">
                    {role.title}
                  </h3>
                  <div className="bav-label mb-5 text-ink-60">
                    {role.location} · {role.type}
                  </div>
                  <p className="m-0 max-w-[640px] text-[16px] leading-[1.6] text-ink-60">
                    {role.summary}
                  </p>
                </div>
                <a
                  href={`mailto:careers@birmingham-av.com?subject=Application — ${role.title} (${role.code})`}
                  className="bav-underline self-center whitespace-nowrap text-[14px] text-ink no-underline"
                >
                  <span>Apply</span>
                  <span className="arrow font-mono">→</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* APPLICATION GUIDANCE */}
      <section>
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20">
            <div>
              <div className="bav-label mb-8 text-ink-60">— How to apply</div>
              <ul className="list-none space-y-4 p-0 text-[16px] leading-[1.6] text-ink">
                <li>Email with the role code in the subject — short and direct works.</li>
                <li>A CV is welcome but a paragraph on a build you are proud of is better.</li>
                <li>Expect a reply within five working days, yes or no.</li>
                <li>If we progress you, the second stage is two hours on a bench.</li>
                <li>Travel reimbursed. Lunch on us. No unpaid work, ever.</li>
              </ul>
            </div>
            <div>
              <div className="bav-label mb-8 text-ink-60">— Speculative applications</div>
              <p className="m-0 mb-7 text-[17px] leading-[1.55] text-ink-60">
                We keep a file of speculative applications and we do go back to it when a role
                opens. If none of the current four fits, send a note anyway. Tell us what you
                would want to be doing, and when you could start.
              </p>
              <a
                href="mailto:careers@birmingham-av.com?subject=Speculative application"
                className="bav-underline text-[14px] text-ink no-underline"
              >
                <span>careers@birmingham-av.com</span>
                <span className="arrow font-mono">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
