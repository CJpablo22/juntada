import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import { RegionThemeSync } from "@/components/theme/region-theme";
import "./globals.css";

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Juntada",
  description:
    "Guardá planes con tu gente, decidí juntos y controlá qué ven de tu ubicación en cada grupo.",
  applicationName: "Juntada",
};

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-ES" className={`${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-[family-name:var(--font-body)]">
        <AppProvider>
          <RegionThemeSync />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
