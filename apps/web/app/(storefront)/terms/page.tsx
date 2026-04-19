import type { Metadata } from 'next';
import {
  LegalTemplate,
  type LegalTemplateProps,
} from '@/components/editorial/LegalTemplate';

export const metadata: Metadata = {
  title: 'Terms & conditions',
  description:
    'Terms of service for Birmingham AV Ltd: ordering, pricing, warranty, returns, liability, and governing law.',
};

// LEGAL COPY PENDING — placeholder clauses ported from the artefact 26 demo.
// Replace with the signed-off legal copy before launch. The structure is
// deliberately aligned to the LegalTemplate schema so the swap is a data-only
// edit.
const content: LegalTemplateProps = {
  eyebrow: 'Terms',
  title: 'Terms &',
  titleItalic: 'conditions',
  lastUpdatedIso: '2026-03-14',
  effectiveIso: '2026-04-01',
  versionLabel: 'v3.2',
  intro:
    'These terms govern your purchase of hardware and services from Birmingham AV Limited. They are written plainly on purpose; if any clause is unclear, the contact line at the bottom is a real inbox and a real person will reply.',
  clauses: [
    {
      n: '1',
      id: 'about',
      title: 'About these terms',
      // LEGAL COPY PENDING
      body: [
        'Birmingham AV Limited ("we", "us") is a company registered in England and Wales, company number 07431029, with its registered office in Birmingham B16. These terms apply whenever you place an order through birminghamav.co.uk or any channel operated by us.',
        'By placing an order you accept these terms. If you do not accept them, do not place the order.',
      ],
      sub: [
        {
          n: '1.1',
          title: 'Changes to these terms',
          // LEGAL COPY PENDING
          body: [
            'We may revise these terms from time to time. The version that applies to any order is the one in force on the date the order is placed. Historic versions are available on request.',
          ],
        },
        {
          n: '1.2',
          title: 'Trade orders',
          // LEGAL COPY PENDING
          body: [
            'Orders placed under a trade account are additionally governed by the trade agreement signed between us. Where the two documents conflict, the trade agreement takes precedence.',
          ],
        },
      ],
    },
    {
      n: '2',
      id: 'orders',
      title: 'Orders and contracts',
      // LEGAL COPY PENDING
      body: [
        'Placing an order is an offer to buy. The contract between us is formed when we confirm dispatch by email, not at the point of payment.',
        'We reserve the right to refuse an order or cancel a confirmed order before dispatch, for example where we have reason to believe the payment method is fraudulent, where stock has been mispriced by a significant margin, or where the shipping address is outside our serviceable area.',
      ],
      sub: [
        {
          n: '2.1',
          title: 'Custom and configured builds',
          // LEGAL COPY PENDING
          body: [
            'Orders for machines built to a specific configuration are taken on a bespoke basis. You may cancel a custom order at no charge up to the point we begin component staging; after that, a pro-rata charge applies to cover parts ordered and labour started.',
          ],
        },
        {
          n: '2.2',
          title: 'Pricing and VAT',
          // LEGAL COPY PENDING
          body: [
            'All prices are shown in pounds sterling and include VAT at the prevailing UK rate unless you are ordering under a trade account with net-of-VAT pricing agreed.',
          ],
        },
        {
          n: '2.3',
          title: 'Stock',
          // LEGAL COPY PENDING
          body: [
            'Listed stock levels are indicative and may change between the time a page is loaded and an order is placed. Where an item is unexpectedly out of stock, we will contact you within one working day.',
          ],
        },
      ],
    },
    {
      n: '3',
      id: 'delivery',
      title: 'Delivery',
      // LEGAL COPY PENDING
      body: [
        'Standard delivery within mainland UK is by DPD next-day on a signed-for service. Typical dispatch timelines are set out at /shipping and are a guide, not a guarantee.',
        {
          list: [
            'Delivery days are working days; weekends and public holidays are excluded.',
            'Risk passes on delivery. Loss or damage in transit is our responsibility until the parcel is signed for.',
            'We do not currently deliver to the Channel Islands, the Isle of Man, BFPO addresses, or outside the United Kingdom via our standard service.',
          ],
        },
      ],
    },
    {
      n: '4',
      id: 'warranty',
      title: 'Warranty',
      // LEGAL COPY PENDING
      body: [
        'Every unit ships with a minimum twelve-month return-to-workshop warranty covering parts and labour. Specific products may carry longer terms; where they do, the product page is definitive.',
        'AV Care is a separate subscription that extends and broadens cover; it is governed by its own terms linked from /warranty.',
      ],
    },
    {
      n: '5',
      id: 'returns',
      title: 'Returns and cancellation',
      // LEGAL COPY PENDING
      body: [
        'Your right to cancel a standard order under the Consumer Contracts Regulations is thirty days from delivery. Custom-configured orders are excluded from this right once build has begun, except where the unit is faulty or not as described.',
        'The returns process is at /returns-policy and routed through /account/returns. Items must be returned in their original packaging and condition; a restocking fee may apply to non-faulty returns of unboxed goods.',
      ],
    },
    {
      n: '6',
      id: 'liability',
      title: 'Liability',
      // LEGAL COPY PENDING
      body: [
        'Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for any matter in respect of which it would be unlawful to limit liability.',
        'Subject to the above, our liability under any single contract is limited to the price you paid for the goods giving rise to the claim. We are not liable for loss of data, loss of profits, or any indirect or consequential loss.',
      ],
    },
    {
      n: '7',
      id: 'law',
      title: 'Governing law',
      // LEGAL COPY PENDING
      body: [
        'These terms and any contract formed under them are governed by the laws of England and Wales. The courts of England and Wales have exclusive jurisdiction over any dispute.',
      ],
    },
  ],
  contactLine:
    'Questions about these terms: write to legal@birminghamav.co.uk, or by post to Birmingham AV Ltd, 14 Vittoria Street, Birmingham B1 3ND.',
  downloadHref: '/legal/terms-v3.2.pdf',
};

export default function TermsPage() {
  return <LegalTemplate {...content} />;
}
