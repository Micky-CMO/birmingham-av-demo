import { Badge, GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { user: { select: { email: true, firstName: true } } },
  });

  return (
    <div>
      <h1 className="text-h2 font-display">Support inbox</h1>
      <GlassCard className="mt-6 overflow-x-auto">
        <table className="w-full text-small">
          <thead className="border-b border-ink-300/50 text-caption text-ink-500 dark:border-obsidian-500/40">
            <tr>
              <th className="px-4 py-3 text-left">Ticket</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Channel</th>
              <th className="px-4 py-3 text-right">Status</th>
              <th className="px-4 py-3 text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.ticketId} className="border-b border-ink-300/40 last:border-0 dark:border-obsidian-500/30">
                <td className="px-4 py-3 font-mono">{t.ticketNumber}</td>
                <td className="px-4 py-3">{t.subject}</td>
                <td className="px-4 py-3">{t.user.firstName ?? t.user.email}</td>
                <td className="px-4 py-3">{t.channel}</td>
                <td className="px-4 py-3 text-right">
                  <Badge tone={t.status === 'escalated_human' ? 'critical' : t.status === 'resolved' ? 'positive' : 'info'}>
                    {t.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-caption text-ink-500">
                  {t.updatedAt.toLocaleString('en-GB')}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-ink-500">No tickets yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
