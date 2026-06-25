import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Çeviri Odası",
  description: "Gerçek zamanlı sesli çeviri uygulaması",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="app-version">v1.0.8</div>
        {children}
      </body>
    </html>
  );
}
