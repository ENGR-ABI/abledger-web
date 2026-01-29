import type React from "react"
import "@/styles/globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { AppAuthProvider } from "@/providers/auth-provider"
import { TenantSettingsProvider } from "@/contexts/tenant-settings-context"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "abLedger - Business Management Platform for African SMEs",
    template: "%s | abLedger",
  },
  description: "Manage inventory, customers, sales, and operations in one unified platform. Built for African businesses - track stock, generate invoices, and grow your business with confidence.",
  keywords: [
    "business management",
    "inventory management",
    "point of sale",
    "invoicing",
    "SME software",
    "African business software",
    "Nigeria business software",
    "Ghana business software",
    "Kenya business software",
    "South Africa business software",
    "retail management",
    "wholesale management",
    "stock management",
    "customer management",
  ],
  authors: [{ name: "abLedger Team" }],
  creator: "abLedger",
  publisher: "abLedger",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://abledger.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "abLedger",
    title: "abLedger - Business Management Platform for African SMEs",
    description: "Manage inventory, customers, sales, and operations in one unified platform. Built for African businesses - track stock, generate invoices, and grow your business with confidence.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "abLedger - Business Management Platform",
        type: "image/png",
      },
      {
        url: "/abledger-ui.png",
        width: 512,
        height: 512,
        alt: "abLedger Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "abLedger - Business Management Platform for African SMEs",
    description: "Manage inventory, customers, sales, and operations in one unified platform. Built for African businesses.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "abLedger - Business Management Platform",
      },
      {
        url: "/abledger-ui.png",
        alt: "abLedger Logo",
      },
    ],
    creator: "@abledger",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.ico", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: light)" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon.ico",
  },
  manifest: "/site.webmanifest",
  generator: "Next.js",
  applicationName: "abLedger",
  referrer: "origin-when-cross-origin",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#28a2fd" },
    { media: "(prefers-color-scheme: dark)", color: "#093c93" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppAuthProvider>
            <TenantSettingsProvider>
              {children}
              <Toaster position="top-right" richColors />
            </TenantSettingsProvider>
          </AppAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
