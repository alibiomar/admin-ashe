const withPWA = require("next-pwa");

const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.dropbox.com',
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
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // PWA Configuration
  pwa: {
    disable: isDev, // Disable PWA in development mode
    dest: 'public', // Destination folder for PWA files
    sw: 'service-worker.js', // Custom service worker file
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot|otf|json|html|js|css|map)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'assets-cache',
          expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 30, // Cache assets for 30 days
          },
        },
      },
      {
        urlPattern: /^https:\/\/your-api-url\.com\/api\//, // Replace with your API URL
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxAgeSeconds: 60 * 60 * 24, // Cache API responses for 1 day
          },
        },
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
