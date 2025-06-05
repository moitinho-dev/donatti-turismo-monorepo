/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "images.unsplash.com", "source.unsplash.com"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        tls: false,
        net: false,
        child_process: false,
      }
    }
    return config
  },
  env: {
    GOOGLE_SERVICE_PRIVATE_KEY: process.env.GOOGLE_SERVICE_PRIVATE_KEY,
  },
}

module.exports = nextConfig

