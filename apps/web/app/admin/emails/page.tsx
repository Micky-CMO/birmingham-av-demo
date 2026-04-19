import { EmailPreviewer } from '@/components/admin/EmailPreviewer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email previewer · Admin' };

export default function AdminEmailsPage() {
  return <EmailPreviewer />;
}
