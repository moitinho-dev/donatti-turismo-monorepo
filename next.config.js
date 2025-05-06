/** @type {import('next').NextConfig} */

module.exports = {
  env: {
    GOOGLE_SERVICE_PRIVATE_KEY: process.env.GOOGLE_SERVICE_PRIVATE_KEY,
  },
}

module.exports = {
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

const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "images.unsplash.com", "img.freepik.com", "br.freepik.com"],
  },
}

module.exports = nextConfig
