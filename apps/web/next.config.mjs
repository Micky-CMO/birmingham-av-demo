/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bav/ai', '@bav/db', '@bav/lib', '@bav/ui'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  images: {
    // DiceBear returns SVG avatars. Next Image rejects SVG by default, so
    // builder avatars silently 400 in production. Enable SVG and lock down
    // the CSP so it stays safe.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'i1.ebayimg.com' },
      { protocol: 'https', hostname: 'i2.ebayimg.com' },
      { protocol: 'https', hostname: 'thumbs.ebaystatic.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      { protocol: 'https', hostname: 'images.nvidia.com' },
      { protocol: 'https', hostname: 'www.nvidia.com' },
      { protocol: 'https', hostname: 'store.storeimages.cdn-apple.com' },
      { protocol: 'https', hostname: 'www.apple.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 's3.*.amazonaws.com' },
    ],
  },
  poweredByHeader: false,
};
export default nextConfig;
