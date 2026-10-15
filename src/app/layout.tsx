import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
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
};

export const viewport: Viewport = {
  themeColor: "#0a4d47",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-ES"
      className={`${mesaSans.variable} ${mesaDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-[family-name:var(--font-body)]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
