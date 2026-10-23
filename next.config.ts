import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The stylesheet is written into each page instead of being a separate download, so phones can
  // draw the page as soon as the HTML arrives (mobile PageSpeed)
  experimental: { inlineCss: true },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
}

export default nextConfig
