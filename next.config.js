/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_SERVICE_PRIVATE_KEY: process.env.GOOGLE_SERVICE_PRIVATE_KEY,
  },
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "images.unsplash.com",
      "sempjntlabpgaqhnbbfs.supabase.co",
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false
      config.resolve.fallback.tls = false
      config.resolve.fallback.net = false
      config.resolve.fallback.child_process = false
    }
    return config
  },
}

module.exports = nextConfig
