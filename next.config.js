const withPWA = require("next-pwa");

const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  devIndicators: {
    buildActivity: false, // Keep this in the main Next.js config
  },
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
};

module.exports = withPWA({
  disable: isDev, // Disable PWA in development mode
  dest: 'public', // Destination folder for PWA files
  register: true,  // Automatically register the service worker
  sw: 'sw.js',   // Service worker file
})(nextConfig);
