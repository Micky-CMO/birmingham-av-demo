import { prisma } from '@/lib/db';
import { SupportInbox, type SupportTicketRow } from '@/components/admin/SupportInbox';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Support · Admin' };

function mapStatus(s: string): string {
  // TicketStatus → UI buckets used by the inbox
  if (s === 'ai_handling') return 'ai_handling';
  if (s === 'open' || s === 'escalated_human') return 'awaiting_staff';
  if (s === 'awaiting_customer') return 'awaiting_customer';
  if (s === 'resolved' || s === 'closed') return 'resolved';
  return s;
}

export default async function AdminSupportPage() {
  const rows = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      order: { select: { orderNumber: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const tickets: SupportTicketRow[] = rows.map((t) => {
    const firstName = t.user.firstName ?? '';
    const lastName = t.user.lastName ?? '';
    const customerName =
      [firstName, lastName].filter(Boolean).join(' ') || t.user.email.split('@')[0] || 'Customer';
    const lastMessage = t.messages[0];
    return {
      ticketId: t.ticketId,
      ticketNumber: t.ticketNumber,
      customerName,
      customerEmail: t.user.email,
      orderNumber: t.order?.orderNumber ?? null,
      subject: t.subject,
      lastSnippet: lastMessage ? String(lastMessage.body ?? '').slice(0, 200) : '',
      lastAt: t.updatedAt.toISOString(),
      status: mapStatus(t.status),
      unread: t.status === 'open' || t.status === 'escalated_human',
      aiTurns: 0,
    };
  });

  return <SupportInbox tickets={tickets} />;
}
