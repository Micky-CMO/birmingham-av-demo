import type { Metadata } from 'next';
import {
  EditorialTemplate,
  type EditorialTemplateProps,
} from '@/components/editorial/EditorialTemplate';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Birmingham AV is a workshop in the Jewellery Quarter building PCs by hand, running a 24-hour soak test on each unit, and shipping with a birth certificate in the box.',
};

// Content ported from the artefact 25 demo invocation. In production, move this
// to the CMS or a route-specific content module.
const content: EditorialTemplateProps = {
  eyebrow: 'About',
  title: 'Computers,',
  titleItalic: 'considered',
  lede:
    'Birmingham AV is a workshop in the Jewellery Quarter that builds PCs by hand, tests them for twenty-four hours, and puts a birth certificate in the box. Twenty-two builders. Roughly two hundred units in flight at any given moment. No shortcuts anyone outside the shop would notice, which is most of the work.',
  byline: null,
  hero: { kind: 'canvas', buildNumber: '042' },
  blocks: [
    {
      kind: 'dropcap-p',
      text:
        'We started in 2011 out of a first-floor unit on Vyse Street with three benches and a DPD account. Twelve years on, the benches moved to a larger workshop, the DPD account got a dedicated collection, and the team grew. The shape of the work did not change: one builder per unit, from first screw to boot, and nobody ships a machine they would not run at home.',
    },
    {
      kind: 'p',
      text:
        'We sold on eBay for most of that period because eBay put us in front of buyers. It also put us next to shops that drop-ship from Shenzhen, skip the burn-in, and photograph a generic tower instead of the one they\u2019re sending. Our returns rate was a third of theirs. Our reviews were different. Our margin was compressed by the same fees that subsidised them. Building our own storefront was the next honest step.',
    },
    { kind: 'h2', text: 'What we build' },
    {
      kind: 'p',
      text:
        'Gaming towers are the biggest slice, but it\u2019s not most of the work. The rest is what gets bracketed as "other": silent workstations for audio engineers, multi-GPU rigs for small render farms, locked-down fleets for accountancy practices, projector and AV gear for schools and churches, refurbished laptops for buyers who want repairability over thinness. The shop floor has a water-loop bench and a screwdriver-only bench, and they get roughly equal traffic.',
    },
    {
      kind: 'pullquote',
      text:
        'No one sees the twenty-four-hour soak test. That\u2019s the point. They see a machine that still works in year five.',
      cite: 'Alfie Ashworth, BLD-004',
    },
    { kind: 'h2', text: 'How we\u2019re set up' },
    {
      kind: 'p',
      text:
        'Twenty-two builders, each with a tier and a track record. Every machine carries the builder\u2019s code on the birth certificate in the box, and their profile page is public. If one of our builders has a bad month, the numbers show it and they get pulled off the queue. This isn\u2019t generous to them; it\u2019s fair to you.',
    },
    {
      kind: 'gallery',
      items: [
        { buildNumber: '073', caption: 'Aegis Ultra · BLD-004 · water-cooled 5090 tower' },
        { buildNumber: '089', caption: 'Silent workstation · BLD-011 · Noctua fanless CPU block' },
        { buildNumber: '114', caption: 'Refurbished ThinkPad T14s · BLD-019 · G2 refurb programme' },
      ],
    },
    { kind: 'h2', text: 'Where we are' },
    {
      kind: 'p',
      text:
        'The workshop is in the Jewellery Quarter, five minutes\u2019 walk from Jewellery Quarter station. Collection is possible by appointment; we are not open for walk-in browsing, but most people who ask to see the bench get a tour of where their unit will actually be built. The trade counter for schools, procurement, and print-and-sign outfits is a separate door.',
    },
  ],
  cta: { label: 'Meet the builders', href: '/builders' },
};

export default function AboutPage() {
  return <EditorialTemplate {...content} />;
}
