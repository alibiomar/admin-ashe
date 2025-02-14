module.exports = {
  
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
      { protocol: 'https',
        hostname: 'dl.dropboxusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Add Firebase Storage
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google user content
      }
    ],
  },

  // Additional security enhancements
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
};
const withPWA = require("next-pwa");

module.exports = withPWA({
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
});
