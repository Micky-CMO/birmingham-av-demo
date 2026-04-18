/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bav/ai', '@bav/db', '@bav/lib', '@bav/ui'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'i1.ebayimg.com' },
      { protocol: 'https', hostname: 'i2.ebayimg.com' },
      { protocol: 'https', hostname: 'thumbs.ebaystatic.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 's3.*.amazonaws.com' },
    ],
  },
  poweredByHeader: false,
};
export default nextConfig;
