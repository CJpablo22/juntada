import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import {
  Archivo_Black,
  Barlow_Condensed,
  DM_Sans,
  Fraunces,
  Nunito,
  Outfit,
  Rubik,
  Source_Sans_3,
} from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
import { RegionThemeSync } from "@/components/theme/region-theme";
import "./globals.css";
import "./landing-mesa.css";

/** España — capital / meseta: sans limpia */
const esSans = Source_Sans_3({
  variable: "--font-es-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Landing «Mesa puesta» — cuerpo */
const mesaSans = DM_Sans({
  variable: "--font-mesa-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Andalucía — display con carácter (también landing Mesa) */
const andalucia = Fraunces({
  variable: "--font-andalucia",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/** Catalunya — geométrica moderna */
const catalunya = Outfit({
  variable: "--font-catalunya",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Levante — redonda y cálida */
const levante = Nunito({
  variable: "--font-levante",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

/** Norte — condensada industrial */
const norte = Barlow_Condensed({
  variable: "--font-norte",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Argentina — cuerpo */
const arBody = Rubik({
  variable: "--font-ar-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Argentina — titulares slab/display */
const arDisplay = Archivo_Black({
  variable: "--font-ar-display",
  subsets: ["latin"],
  weight: ["400"],
});

const fontVars = [
  esSans.variable,
  mesaSans.variable,
  andalucia.variable,
  catalunya.variable,
  levante.variable,
  norte.variable,
  arBody.variable,
  arDisplay.variable,
].join(" ");

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
    <html
      lang="es-ES"
      data-country="ES"
      data-region="default"
      data-btn="block"
      data-pattern="plain"
      className={`${fontVars} h-full antialiased`}
      style={
        {
          "--font-body": "var(--font-es-sans)",
          "--font-display": "var(--font-es-sans)",
        } as CSSProperties
      }
    >
      <body className="flex min-h-full flex-col font-[family-name:var(--font-body)]">
        <AppProvider>
          <RegionThemeSync />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
