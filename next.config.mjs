/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "invenzoapp.com",
        "www.invenzoapp.com",
      ],
    },
  },
};


export default nextConfig;