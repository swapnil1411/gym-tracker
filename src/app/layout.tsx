import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Hanken_Grotesk, Geist, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import "./globals.css";

/*
 * The two Stitch design systems use different stacks, so fonts are wired
 * through theme-switched CSS vars in globals.css rather than bound here:
 *   dark  (High-Performance Technical): Space Grotesk display · Hanken body
 *   light (Luminous Precision):         Hanken display · Geist body ·
 *                                       JetBrains Mono labels
 */
const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GYM·LOG — Daily Tracker",
  description: "Personal gym and mobility tracker",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GYM·LOG" },
};

export const viewport: Viewport = {
  themeColor: "#15181e",
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
      className={`${space.variable} ${hanken.variable} ${geist.variable} ${mono.variable}`}
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
