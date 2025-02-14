const withPWA = require("next-pwa");

const nextConfig = {
  devIndicators: {
    buildActivity: false, // Keep this in the main Next.js config
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
        hostname: 'firebasestorage.googleapis.com', // Firebase Storage
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google user content
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
};

module.exports = withPWA({
  dest: "public", // PWA specific options
  register: true,
  skipWaiting: true,
})(nextConfig);
