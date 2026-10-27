import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Public_Sans } from "next/font/google";
import { CookieNotice } from "@/components/cookie-notice";
import { DevEnvironmentBadge } from "@/components/dev-environment-badge";
import { MuiProvider } from "@/components/providers/mui-provider";
import { ACCENT_BOOT_SCRIPT } from "@/lib/accents";
import { SPLASH_BOOT_SCRIPT } from "@/lib/route-loader";
import { MOTION_BOOT_SCRIPT } from "@/lib/motion-pref";
import { MODE_BOOT_SCRIPT } from "@/lib/color-mode";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// Portal/admin typeface (the "Minimal dashboard" look) — see globals.css.
const publicSans = Public_Sans({
  variable: "--font-dashboard",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const TITLE = "Alchemica | Chemistry & Materials Advisory";
const DESCRIPTION =
  "Alchemica turns formulation data, characterisation results and chemical mechanisms into clear next experiments — for teams building bio-based, polymeric and industrial material systems.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alchemica.dk"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Alchemica",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The boot scripts may set data-accent / data-motion / data-mode before React hydrates.
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${publicSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCENT_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: MODE_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <MuiProvider>
          {children}
          <CookieNotice />
          <DevEnvironmentBadge />
        </MuiProvider>
      </body>
    </html>
  );
}
