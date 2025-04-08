const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_SERVICE_PRIVATE_KEY: process.env.GOOGLE_SERVICE_PRIVATE_KEY,
  },
  images: {
    domains: ["lh3.googleusercontent.com", "images.unsplash.com"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallbacks for Node.js modules that aren't needed in the browser
      config.resolve.fallback.fs = false;
      config.resolve.fallback.tls = false;
      config.resolve.fallback.net = false;
      config.resolve.fallback.child_process = false;

      // Set up the @ alias for Webpack
      config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    }

    return config;
  },
};

module.exports = nextConfig;