import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Daily Task Manager",
  description: "A clean and simple PWA to manage your daily tasks.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        {/* Force mobile viewport even when Chrome's "Desktop Mode" is enabled */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var setMobileViewport = function() {
                  var meta = document.querySelector('meta[name="viewport"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = 'viewport';
                    document.head.appendChild(meta);
                  }
                  var content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover';
                  if (window.screen && window.screen.width && window.screen.width < 1024) {
                    meta.setAttribute('content', content);
                  } else {
                    meta.setAttribute('content', content);
                  }
                };
                setMobileViewport();
                window.addEventListener('orientationchange', setMobileViewport);
                window.addEventListener('resize', setMobileViewport);
              } catch (e) {}
            })();
          `
        }} />
        {/* Inline script to prevent dark mode flash — runs before React hydrates */}
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem('darkMode') === 'true') {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          `
        }} />
        <link rel="manifest" href="/manifest.json" />
        {/* Service Worker registration script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js').then(
                  function(reg) {
                    console.log('SW registered with scope:', reg.scope);
                  },
                  function(err) {
                    console.log('SW registration failed:', err);
                  }
                );
              });
            }
          `
        }} />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-[#0F172A] transition-colors">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
