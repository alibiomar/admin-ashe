// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Default title for all pages */}
        <title>ASHE™ Admin</title>

        {/* PWA and SEO meta tags */}
        <link rel="manifest" href="/public/manifest.json" />
        <meta name="application-name" content="ASHE™ Admin" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ASHE™ Admin" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="192x192" href="/logo192.png" />
        <link rel="icon" type="image/png" sizes="72x72" href="/logo72.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logo192.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#ffffff" />

        {/* Custom font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}