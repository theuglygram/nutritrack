import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@nutritrack/core";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font; variable names match the tokens in globals.css.
const fontDisplay = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1410" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-NG"
      // Smooth in-page anchor scrolling; Next turns it off during route changes.
      data-scroll-behavior="smooth"
      className={`${fontDisplay.variable} ${fontBody.variable} h-full antialiased`}
      // The inline script below adds the "js" class before hydration.
      suppressHydrationWarning
    >
      <head>
        {/* Enables scroll-reveal animations only when JavaScript runs; content is visible without it. */}
        <script
          // Static string, no user input.
          dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add("js")` }}
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
