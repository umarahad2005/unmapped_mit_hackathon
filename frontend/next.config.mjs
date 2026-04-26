/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix Turbopack root for paths with spaces
  turbopack: {
    root: process.cwd(),
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
