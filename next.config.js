/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bxgybzakvdmmltmvdwwk.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        canvas: false,
        child_process: false,
        os: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
