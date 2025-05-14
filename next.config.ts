import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@uppy"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        eventsource: require.resolve("eventsource"),
      };
    }
    return config;
  },
};

export default nextConfig;
