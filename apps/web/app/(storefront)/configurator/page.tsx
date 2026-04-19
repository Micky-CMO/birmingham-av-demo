import type { Metadata } from 'next';
import { ConfiguratorClient } from './ConfiguratorClient';

export const metadata: Metadata = {
  title: 'Build-a-PC configurator — Birmingham AV',
  description:
    'Specify your machine step by step. Every component hand-chosen, every build hand-assembled in Birmingham. No upsells, no drift, no surprises on the invoice.',
};

export const dynamic = 'force-dynamic';

export default function ConfiguratorPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <ConfiguratorClient />
    </main>
  );
}
