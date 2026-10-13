import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import { RegionThemeSync } from "@/components/theme/region-theme";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Juntada — decidí planes sin tanto WhatsApp",
  description:
    "Proponé, votá en secreto, sorteá y liquidá gastos con tu pareja o tu grupo. Hecho para España, pensado para crecer al mundo.",
  applicationName: "Juntada",
  keywords: [
    "planes",
    "pareja",
    "amigos",
    "votos",
    "gastos",
    "España",
    "quedadas",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0c3029",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-ES"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)]">
        <AppProvider>
          <RegionThemeSync />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
