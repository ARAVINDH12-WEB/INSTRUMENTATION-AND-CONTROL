import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ControlForge — Instrumentation & Control Engineering Platform",
  description:
    "Measure. Model. Control. Automate. An engineering platform combining interactive simulators, calculators, and technical case studies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body className="bg-bg text-text antialiased min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
