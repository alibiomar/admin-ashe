const withPWA = require("next-pwa");

const nextConfig = {
  devIndicators: {
    buildActivity: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.dropbox.com', // Wildcard for subdomains
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'dl.dropboxusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Add Firebase Storage
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google user content
      },
    ],
  },

  // Additional security enhancements
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // PWA Configuration
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development", // Disable PWA in development
  },
};

module.exports = withPWA(nextConfig);