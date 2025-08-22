import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ui/theme";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

import { env } from "../env";
import { QueryProvider } from "../providers/query-client-provider";

// Force dynamic rendering for entire app (see explanation below)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://app.example.com"
      : "http://localhost:3000",
  ),
  title: "Management Platform",
  description: "Modern platform for managing your business operations",
  openGraph: {
    title: "Management Platform",
    description: "Modern platform for managing your business operations",
    url: "https://app.example.com",
    siteName: "Management Platform",
  },
  twitter: {
    card: "summary_large_image",
    site: "@jullerino",
    creator: "@jullerino",
  },
};

export const viewport: Viewport = {
  themeColor: "white",
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light" disableTransitionOnChange>
          <QueryProvider>
            {props.children}
          </QueryProvider>
    
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
