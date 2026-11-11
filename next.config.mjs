/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Next.js 16 expects protocol + host (no path). Both www and apex are
      // accepted so the reverse proxy origin always matches.
      allowedOrigins: [
        "https://invenzoapp.com",
        "https://www.invenzoapp.com",
      ],
    },
  },
};


export default nextConfig;