import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SITE_CONFIG } from "@/lib/constants";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorSuppressor } from "@/components/ErrorSuppressor";
import { BottomNav } from "@/components/layout";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "AI", "ChatGPT", "Claude", "Gemini", "DeepSeek",
    "แชท AI", "AI หลายโมเดล", "RabbitHub",
    "สร้างรูปภาพ AI", "สร้างวิดีโอ AI",
    "AI ภาษาไทย", "แพลตฟอร์ม AI",
    "Image Generation", "Video Generation",
  ],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  metadataBase: new URL(SITE_CONFIG.url),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/logo-rounded.png', type: 'image/png' },
    ],
    apple: '/images/logo-rounded.png',
  },
  openGraph: {
    title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    type: "website",
    locale: "th_TH",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: '/images/logo.jpg',
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: ['/images/logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'GOOGLE_SITE_VERIFICATION',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_CONFIG.name,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
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

const jsonLdString = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_CONFIG.url}/#organization`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/images/logo.jpg`,
      },
      description: SITE_CONFIG.description,
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_CONFIG.url}/#webapp`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      description: SITE_CONFIG.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '1499',
        priceCurrency: 'THB',
        offerCount: '3',
      },
      provider: {
        '@type': 'Organization',
        '@id': `${SITE_CONFIG.url}/#organization`,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_CONFIG.url}/#website`,
      url: SITE_CONFIG.url,
      name: SITE_CONFIG.name,
      description: SITE_CONFIG.description,
      inLanguage: 'th-TH',
      publisher: {
        '@type': 'Organization',
        '@id': `${SITE_CONFIG.url}/#organization`,
      },
    },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {jsonLdString}
        </Script>
      </head>
      <body className="antialiased overflow-x-hidden mobile-scroll">
        <ThemeProvider>
          <ErrorSuppressor />
          {children}
          <BottomNav />
          <Toaster
            position="top-center"
            toastOptions={{
              className: 'dark:bg-neutral-800 dark:text-white dark:border-neutral-700',
            }}
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
