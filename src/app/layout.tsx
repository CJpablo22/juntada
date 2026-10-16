import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import "./globals.css";
import "./landing-mesa.css";

const mesaSans = DM_Sans({
  variable: "--font-mesa-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mesaDisplay = Fraunces({
  variable: "--font-mesa-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Juntada",
  description:
    "Guardá planes con tu gente, decidí juntos y controlá qué ven de tu ubicación en cada grupo.",
  applicationName: "Juntada",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Juntada",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a4d47",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-ES"
      className={`${mesaSans.variable} ${mesaDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-[family-name:var(--font-body)]">
        <AppProvider>
          {children}
          <RegisterServiceWorker />
        </AppProvider>
      </body>
    </html>
  );
}
