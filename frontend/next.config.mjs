/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix Turbopack root for paths with spaces
  turbopack: {
    root: process.cwd(),
  },

  // Hide the floating Next.js dev indicator (the "N" pop-up bottom-right).
  // We disable every sub-indicator individually to cover Next 14/15/16 versions.
  // A CSS belt-and-suspenders rule in globals.css also nukes the <nextjs-portal>
  // element in case the config keys differ on a future minor.
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
    position: 'bottom-right',
  },

  // Proxy /backend/* to FastAPI server (Python backend)
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/backend/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/backend-health',
        destination: `${backendUrl}/`,
      },
    ];
  },
};

export default nextConfig;
