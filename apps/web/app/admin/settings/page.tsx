import { headers } from 'next/headers';
import { SettingsTabs } from '@/components/admin/SettingsTabs';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  const hdrs = headers();
  const userAgent = hdrs.get('user-agent') ?? 'Unknown browser';
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdrs.get('x-real-ip') ||
    'Unknown';

  return <SettingsTabs sessionInfo={{ userAgent, ip }} />;
}
