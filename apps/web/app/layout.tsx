import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument-sans',
  weight: ['400', '500', '600', '700'],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://birmingham-av.com'),
  title: {
    default: 'Birmingham AV',
    template: '%s | Birmingham AV',
  },
  description: 'PCs and tech, new and refurbished, built by people who know them. Tested, warrantied, shipped worldwide from the United Kingdom.',
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
  other: {
    'mobile-web-app-capable': 'yes',
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
      className={`${fraunces.variable} ${instrumentSans.variable} ${jetBrainsMono.variable}`}
    >
      <body className="min-h-dvh bg-paper font-sans text-body text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
