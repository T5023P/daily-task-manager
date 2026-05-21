import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const viewport: Viewport = {
  themeColor: "#0F172A",
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
        {/* Service Worker registration script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
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
