const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");

const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.dropbox.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "dl.dropboxusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
};

module.exports = withPWA({
  disable: isDev, // Disable PWA in development mode
  dest: "public", // Destination folder for PWA files
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 }, // Cache for 7 days
          fallback: {
            document: '/offline.html', // Ensure you have this file in /public
          },
        },
      },
    ],
  },
})(nextConfig);
