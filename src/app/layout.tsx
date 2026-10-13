import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Fraunces,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
  Libre_Baskerville,
  Libre_Franklin,
  Literata,
  Lora,
  Newsreader,
  Playfair_Display,
  Source_Sans_3,
  Spectral,
} from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import { RegionThemeSync } from "@/components/theme/region-theme";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const ibmSerif = IBM_Plex_Serif({
  variable: "--font-ibm-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const ibmSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Juntada — catálogo y planes con tu gente",
  description:
    "Guardá planes, decidí en grupo y descubrí con un look que se adapta a tu ciudad.",
  applicationName: "Juntada",
};

export const viewport: Viewport = {
  themeColor: "#1e2a24",
  width: "device-width",
  initialScale: 1,
};

const fontVars = [
  newsreader.variable,
  cormorant.variable,
  fraunces.variable,
  literata.variable,
  ibmSerif.variable,
  ibmSans.variable,
  lora.variable,
  playfair.variable,
  spectral.variable,
  libreBaskerville.variable,
  libreFranklin.variable,
  sourceSans.variable,
].join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-ES" className={`${fontVars} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-[family-name:var(--font-body-active)]">
        <AppProvider>
          <RegionThemeSync />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
