import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carrier Service Lookup",
  description: "Find carrier services operating between specific port pairs",
  keywords: ["carrier", "shipping", "logistics", "POL", "POD", "transit time"],
  authors: [{ name: "Carrier Service Lookup Team" }],
  openGraph: {
    title: "Carrier Service Lookup",
    description: "Find carrier services operating between specific port pairs",
    url: "https://carrierlookup.com",
    siteName: "Carrier Service Lookup",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carrier Service Lookup",
    description: "Find carrier services operating between specific port pairs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
