import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const interDisplay = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-display',
  weight: ['600', '700'],
});

const jetBrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://birmingham-av.com'),
  title: {
    default: 'Birmingham AV',
    template: '%s | Birmingham AV',
  },
  description: 'Refurbished PCs, built by people who know them. Tested, warrantied, and shipped from Birmingham.',
  applicationName: 'Birmingham AV',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Birmingham AV',
    statusBarStyle: 'black-translucent',
    startupImage: ['/apple-touch-icon.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Birmingham AV',
    locale: 'en_GB',
    images: [{ url: '/brand/hero-poster.jpg', width: 1920, height: 1080 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Birmingham AV',
    description: 'Refurbished PCs, built by people who know them.',
    images: ['/brand/hero-poster.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} ${interDisplay.variable} ${jetBrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // Set the theme class before paint so we never flash.
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('bav-theme');
                var dark = saved === 'dark' || (saved === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
                if (saved === null) saved = 'light';
                document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', dark);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-dvh font-sans text-body text-ink-900 antialiased dark:text-ink-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
