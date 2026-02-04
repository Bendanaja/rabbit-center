import type { Metadata, Viewport } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorSuppressor } from "@/components/ErrorSuppressor";
import { BottomNav } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: ["AI", "ChatGPT", "Claude", "Gemini", "แชท AI", "AI หลายโมเดล", "RabbitAI"],
  authors: [{ name: SITE_CONFIG.name }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/logo-rounded.png', type: 'image/png' },
    ],
    apple: '/images/logo-rounded.png',
  },
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    type: "website",
    locale: "th_TH",
    images: ['/images/logo.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_CONFIG.name,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden mobile-scroll">
        <ThemeProvider>
          <ErrorSuppressor />
          {children}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
