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
  runtimeCaching: [
    ...runtimeCaching,
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        fallback: {
          document: "/offline.html", // Ensure this file exists in /public
        },
      },
    },
  ],
})(nextConfig);
