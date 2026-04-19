import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/orders/[orderNumber]/invoice.pdf
 *
 * Stub route for invoice PDF downloads. The HTML invoice at
 * /account/orders/[orderNumber]/invoice already prints to A4 correctly, so
 * this endpoint is a placeholder until we wire puppeteer (for a headless
 * browser render) or @react-pdf/renderer (for a pure-React PDF tree).
 */
export function GET(
  _request: Request,
  _context: { params: { orderNumber: string } },
) {
  return NextResponse.json(
    {
      error: {
        message: 'PDF invoice generation not implemented',
        note: 'TODO: render via puppeteer or react-pdf',
      },
    },
    { status: 501 },
  );
}
