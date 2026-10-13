import { getProvinces } from "@/lib/locations";

export type RegionThemeId =
  | "madrid"
  | "sevilla"
  | "barcelona"
  | "valencia"
  | "bilbao"
  | "galicia"
  | "malaga"
  | "zaragoza"
  | "granada"
  | "asturias"
  | "buenos_aires"
  | "ar_interior"
  | "default";

export type ButtonStyle = "block" | "tile" | "soft" | "slab" | "ink";
export type PatternStyle =
  | "plain"
  | "grid"
  | "azulejo"
  | "modernista"
  | "niebla"
  | "sol"
  | "rioplata"
  | "pampa";

export type RegionTheme = {
  id: RegionThemeId;
  country: "ES" | "AR";
  label: string;
  tagline: string;
  /** CSS variable name already defined on html from next/font */
  bodyFont: string;
  displayFont: string;
  btn: ButtonStyle;
  pattern: PatternStyle;
  vars: Record<string, string>;
};

/**
 * Temas con tipografía, botones y fondos claramente distintos.
 * País (ES vs AR) cambia el “idioma visual”; provincia afina.
 */
const THEMES: Record<RegionThemeId, RegionTheme> = {
  madrid: {
    id: "madrid",
    country: "ES",
    label: "Madrid",
    tagline: "Capital, directa",
    bodyFont: "var(--font-es-sans)",
    displayFont: "var(--font-es-sans)",
    btn: "block",
    pattern: "grid",
    vars: {
      "--ink": "#1a1512",
      "--paper": "#f3efe8",
      "--mute": "#5c534c",
      "--line": "#d9d0c4",
      "--pop": "#c41e3a",
      "--pop-soft": "#f6e4e7",
      "--wash": "#ebe4da",
      "--hero": "#1a1512",
      "--btn-radius": "0.12rem",
      "--btn-tracking": "-0.01em",
      "--btn-transform": "none",
      "--heading-tracking": "-0.03em",
      "--heading-weight": "750",
      "--surface-radius": "0.15rem",
    },
  },
  sevilla: {
    id: "sevilla",
    country: "ES",
    label: "Sevilla",
    tagline: "Andalucía cálida",
    bodyFont: "var(--font-es-sans)",
    displayFont: "var(--font-andalucia)",
    btn: "tile",
    pattern: "azulejo",
    vars: {
      "--ink": "#3b2416",
      "--paper": "#fff6e8",
      "--mute": "#7a5c42",
      "--line": "#e8d2b0",
      "--pop": "#c2410c",
      "--pop-soft": "#f7e4cc",
      "--wash": "#f5e6d0",
      "--hero": "#5c2e14",
      "--btn-radius": "0.05rem",
      "--btn-tracking": "0.04em",
      "--btn-transform": "uppercase",
      "--heading-tracking": "-0.01em",
      "--heading-weight": "700",
      "--surface-radius": "0.1rem",
    },
  },
  malaga: {
    id: "malaga",
    country: "ES",
    label: "Málaga",
    tagline: "Costa andaluza",
    bodyFont: "var(--font-es-sans)",
    displayFont: "var(--font-andalucia)",
    btn: "tile",
    pattern: "sol",
    vars: {
      "--ink": "#16324f",
      "--paper": "#fff8ef",
      "--mute": "#5f6b78",
      "--line": "#e5d5c0",
      "--pop": "#ea580c",
      "--pop-soft": "#ffe7d1",
      "--wash": "#f7ebdc",
      "--hero": "#1e3a5f",
      "--btn-radius": "0.05rem",
      "--btn-tracking": "0.03em",
      "--btn-transform": "uppercase",
      "--heading-tracking": "-0.005em",
      "--heading-weight": "700",
      "--surface-radius": "0.12rem",
    },
  },
  granada: {
    id: "granada",
    country: "ES",
    label: "Granada",
    tagline: "Alhambra",
    bodyFont: "var(--font-es-sans)",
    displayFont: "var(--font-andalucia)",
    btn: "tile",
    pattern: "azulejo",
    vars: {
      "--ink": "#3c1d2e",
      "--paper": "#faf3f0",
      "--mute": "#6d5560",
      "--line": "#e3cfcf",
      "--pop": "#9f1239",
      "--pop-soft": "#f8e4ec",
      "--wash": "#f1e4e6",
      "--hero": "#4a1830",
      "--btn-radius": "0.05rem",
      "--btn-tracking": "0.035em",
      "--btn-transform": "uppercase",
      "--heading-tracking": "0",
      "--heading-weight": "700",
      "--surface-radius": "0.1rem",
    },
  },
  barcelona: {
    id: "barcelona",
    country: "ES",
    label: "Barcelona",
    tagline: "Modernista",
    bodyFont: "var(--font-catalunya)",
    displayFont: "var(--font-catalunya)",
    btn: "soft",
    pattern: "modernista",
    vars: {
      "--ink": "#0f172a",
      "--paper": "#eef3f8",
      "--mute": "#475569",
      "--line": "#c9d5e4",
      "--pop": "#e11d48",
      "--pop-soft": "#ffe4e9",
      "--wash": "#e2eaf3",
      "--hero": "#0b1220",
      "--btn-radius": "999px",
      "--btn-tracking": "0.01em",
      "--btn-transform": "none",
      "--heading-tracking": "-0.04em",
      "--heading-weight": "650",
      "--surface-radius": "1.1rem",
    },
  },
  valencia: {
    id: "valencia",
    country: "ES",
    label: "Valencia",
    tagline: "Levante",
    bodyFont: "var(--font-levante)",
    displayFont: "var(--font-levante)",
    btn: "soft",
    pattern: "sol",
    vars: {
      "--ink": "#292017",
      "--paper": "#fff7e8",
      "--mute": "#6b5b4a",
      "--line": "#edd8b5",
      "--pop": "#f97316",
      "--pop-soft": "#ffedd5",
      "--wash": "#f8e8cf",
      "--hero": "#3f2a16",
      "--btn-radius": "0.85rem",
      "--btn-tracking": "0.02em",
      "--btn-transform": "none",
      "--heading-tracking": "-0.02em",
      "--heading-weight": "700",
      "--surface-radius": "0.9rem",
    },
  },
  bilbao: {
    id: "bilbao",
    country: "ES",
    label: "Bilbao",
    tagline: "Norte",
    bodyFont: "var(--font-norte)",
    displayFont: "var(--font-norte)",
    btn: "ink",
    pattern: "niebla",
    vars: {
      "--ink": "#123524",
      "--paper": "#eef4ef",
      "--mute": "#3f5548",
      "--line": "#c5d4c9",
      "--pop": "#be123c",
      "--pop-soft": "#fce7ef",
      "--wash": "#e0ebe3",
      "--hero": "#0f291c",
      "--btn-radius": "0.2rem",
      "--btn-tracking": "0.06em",
      "--btn-transform": "uppercase",
      "--heading-tracking": "0.01em",
      "--heading-weight": "600",
      "--surface-radius": "0.25rem",
    },
  },
  galicia: {
    id: "galicia",
    country: "ES",
    label: "Galicia",
    tagline: "Atlántico",
    bodyFont: "var(--font-norte)",
    displayFont: "var(--font-norte)",
    btn: "ink",
    pattern: "niebla",
    vars: {
      "--ink": "#0f3d4a",
      "--paper": "#eef5f6",
      "--mute": "#4a6670",
      "--line": "#c5d7dc",
      "--pop": "#0f766e",
      "--pop-soft": "#ccfbf1",
      "--wash": "#ddecef",
      "--hero": "#113f4a",
      "--btn-radius": "0.2rem",
      "--btn-tracking": "0.05em",
      "--btn-transform": "uppercase",
      "--heading-tracking": "0.015em",
      "--heading-weight": "600",
      "--surface-radius": "0.3rem",
    },
  },
  asturias: {
    id: "asturias",
    country: "ES",
    label: "Asturias",
    tagline: "Verde norte",
    bodyFont: "var(--font-norte)",
    displayFont: "var(--font-norte)",
    btn: "ink",
    pattern: "niebla",
    vars: {
      "--ink": "#163322",
      "--paper": "#f0f5f0",
      "--mute": "#4d6154",
      "--line": "#c8d6cb",
      "--pop": "#15803d",
      "--pop-soft": "#dcfce7",
      "--wash": "#e2ede4",
      "--hero": "#14291c",
      "--btn-radius": "0.2rem",
      "--btn-tracking": "0.05em",
      "--btn-transform": "uppercase",
      "--heading-tracking": "0.01em",
      "--heading-weight": "600",
      "--surface-radius": "0.25rem",
    },
  },
  zaragoza: {
    id: "zaragoza",
    country: "ES",
    label: "Zaragoza",
    tagline: "Ebro",
    bodyFont: "var(--font-es-sans)",
    displayFont: "var(--font-es-sans)",
    btn: "block",
    pattern: "grid",
    vars: {
      "--ink": "#3a2418",
      "--paper": "#f6f0e9",
      "--mute": "#6a574a",
      "--line": "#ddd0c2",
      "--pop": "#a16207",
      "--pop-soft": "#fef3c7",
      "--wash": "#ebe1d5",
      "--hero": "#3a2418",
      "--btn-radius": "0.15rem",
      "--btn-tracking": "0",
      "--btn-transform": "none",
      "--heading-tracking": "-0.025em",
      "--heading-weight": "700",
      "--surface-radius": "0.2rem",
    },
  },
  buenos_aires: {
    id: "buenos_aires",
    country: "AR",
    label: "Buenos Aires",
    tagline: "Río de la Plata",
    bodyFont: "var(--font-ar-body)",
    displayFont: "var(--font-ar-display)",
    btn: "slab",
    pattern: "rioplata",
    vars: {
      "--ink": "#0c1220",
      "--paper": "#f2eee6",
      "--mute": "#5a5348",
      "--line": "#c9b8a0",
      "--pop": "#74acdf",
      "--pop-soft": "#d6e8f7",
      "--wash": "#e6e0d4",
      "--hero": "#0a1628",
      "--btn-radius": "0",
      "--btn-tracking": "0.1em",
      "--btn-transform": "uppercase",
      "--heading-tracking": "0.02em",
      "--heading-weight": "400",
      "--surface-radius": "0",
    },
  },
  ar_interior: {
    id: "ar_interior",
    country: "AR",
    label: "Interior AR",
    tagline: "Argentina",
    bodyFont: "var(--font-ar-body)",
    displayFont: "var(--font-ar-display)",
    btn: "slab",
    pattern: "pampa",
    vars: {
      "--ink": "#1c140c",
      "--paper": "#f6edd8",
      "--mute": "#6d5a40",
      "--line": "#d4c09a",
      "--pop": "#c2410c",
      "--pop-soft": "#fde8c8",
      "--wash": "#ebe0c8",
      "--hero": "#2a1c10",
      "--btn-radius": "0",
      "--btn-tracking": "0.09em",
      "--btn-transform": "uppercase",
      "--heading-tracking": "0.03em",
      "--heading-weight": "400",
      "--surface-radius": "0",
    },
  },
  default: {
    id: "default",
    country: "ES",
    label: "España",
    tagline: "España",
    bodyFont: "var(--font-es-sans)",
    displayFont: "var(--font-es-sans)",
    btn: "block",
    pattern: "plain",
    vars: {
      "--ink": "#1a1a1a",
      "--paper": "#f7f6f3",
      "--mute": "#5a5a5a",
      "--line": "#ddd9d0",
      "--pop": "#b45309",
      "--pop-soft": "#f3e8d8",
      "--wash": "#efece6",
      "--hero": "#1a1a1a",
      "--btn-radius": "0.15rem",
      "--btn-tracking": "-0.01em",
      "--btn-transform": "none",
      "--heading-tracking": "-0.02em",
      "--heading-weight": "700",
      "--surface-radius": "0.2rem",
    },
  },
};

/** Claves ya normalizadas (minúsculas, sin tildes) */
const PROVINCE_THEME: Record<string, RegionThemeId> = {
  madrid: "madrid",
  sevilla: "sevilla",
  barcelona: "barcelona",
  valencia: "valencia",
  bizkaia: "bilbao",
  "a coruna": "galicia",
  pontevedra: "galicia",
  lugo: "galicia",
  ourense: "galicia",
  malaga: "malaga",
  zaragoza: "zaragoza",
  granada: "granada",
  asturias: "asturias",
  alicante: "valencia",
  murcia: "valencia",
  "illes balears": "barcelona",
  "las palmas": "malaga",
  caba: "buenos_aires",
  "ciudad autonoma de buenos aires": "buenos_aires",
  "buenos aires": "buenos_aires",
  cordoba: "ar_interior",
  "santa fe": "ar_interior",
  mendoza: "ar_interior",
  tucuman: "ar_interior",
  salta: "ar_interior",
};

function norm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function getRegionTheme(id: RegionThemeId): RegionTheme {
  return THEMES[id] ?? THEMES.default;
}

export function resolveRegionTheme(input: {
  country?: string;
  province?: string;
  city?: string;
}): RegionTheme {
  const province = norm(input.province ?? "");
  const city = norm(input.city ?? "");
  const country = (input.country ?? "ES").toUpperCase();

  if (province && PROVINCE_THEME[province]) {
    return getRegionTheme(PROVINCE_THEME[province]);
  }
  for (const [key, id] of Object.entries(PROVINCE_THEME)) {
    if (province.includes(key) || city.includes(key)) {
      return getRegionTheme(id);
    }
  }
  if (country === "AR") return getRegionTheme("buenos_aires");
  return getRegionTheme("default");
}

export function applyRegionTheme(theme: RegionTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.region = theme.id;
  root.dataset.country = theme.country;
  root.dataset.btn = theme.btn;
  root.dataset.pattern = theme.pattern;

  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }

  root.style.setProperty("--font-body", theme.bodyFont);
  root.style.setProperty("--font-display", theme.displayFont);
  root.style.setProperty("--brand-ink", theme.vars["--ink"]);
  root.style.setProperty("--brand-foam", theme.vars["--paper"]);
  root.style.setProperty("--brand-mute", theme.vars["--mute"]);
  root.style.setProperty("--brand-line", theme.vars["--line"]);
  root.style.setProperty("--brand-pop", theme.vars["--pop"]);
  root.style.setProperty("--brand-sun", theme.vars["--pop"]);
  root.style.setProperty("--brand-panel", "#ffffff");
  root.style.setProperty("--accent", theme.vars["--pop-soft"]);
  root.style.setProperty("--radius", theme.vars["--surface-radius"] ?? "0.2rem");
}

export function provincesForCountry(country: string): string[] {
  return getProvinces(country).map((p) => p.name);
}
