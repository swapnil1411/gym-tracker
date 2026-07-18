import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GYM·LOG — Daily Tracker",
  description: "Personal gym and mobility tracker",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GYM·LOG" },
};

export const viewport: Viewport = {
  themeColor: "#0E1114",
  width: "device-width",
  initialScale: 1,
  // Don't trap users who need to zoom; just don't auto-zoom on input focus.
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the init script sets data-theme before React runs,
    // so the server-rendered <html> intentionally differs from the client's.
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
