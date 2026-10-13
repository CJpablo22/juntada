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
  | "default";

export type RegionTheme = {
  id: RegionThemeId;
  label: string;
  tagline: string;
  /** Google font CSS variable names already loaded on <html> */
  displayFont: string;
  bodyFont: string;
  vars: Record<string, string>;
};

const THEMES: Record<RegionThemeId, RegionTheme> = {
  madrid: {
    id: "madrid",
    label: "Madrid",
    tagline: "Tradición castiza, granito y sobremesa",
    displayFont: "var(--font-newsreader)",
    bodyFont: "var(--font-source-sans)",
    vars: {
      "--brand-ink": "#1a1f2c",
      "--brand-foam": "#f4f1ea",
      "--brand-mist": "#ddd6c8",
      "--brand-sun": "#b89a2e",
      "--brand-pop": "#9e1b32",
      "--brand-mute": "#5c584f",
      "--brand-line": "#cfc6b6",
      "--brand-panel": "rgba(255,252,246,0.92)",
      "--bg-a": "#e8dfc8",
      "--bg-b": "#d5dce8",
      "--bg-c": "#e2cfc4",
      "--bg-base-1": "#f7f3eb",
      "--bg-base-2": "#efe8dc",
      "--bg-base-3": "#e7e0d4",
      "--hero-ink": "26, 31, 44",
      "--pattern-opacity": "0.09",
      "--btn-radius": "0.35rem",
      "--panel-radius": "0.55rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(26,31,44,0.08)",
    },
  },
  sevilla: {
    id: "sevilla",
    label: "Sevilla",
    tagline: "Patio, azulejo y luz de naranjo",
    displayFont: "var(--font-cormorant)",
    bodyFont: "var(--font-libre-franklin)",
    vars: {
      "--brand-ink": "#2b1d14",
      "--brand-foam": "#fff8ef",
      "--brand-mist": "#ead7bc",
      "--brand-sun": "#d4a017",
      "--brand-pop": "#a33b1f",
      "--brand-mute": "#6d5644",
      "--brand-line": "#d9c3a4",
      "--brand-panel": "rgba(255,248,239,0.93)",
      "--bg-a": "#f0d9a8",
      "--bg-b": "#b9d2c2",
      "--bg-c": "#e8b89a",
      "--bg-base-1": "#fff8ef",
      "--bg-base-2": "#f6ecdd",
      "--bg-base-3": "#efe2cf",
      "--hero-ink": "43, 29, 20",
      "--pattern-opacity": "0.11",
      "--btn-radius": "0.2rem",
      "--panel-radius": "0.4rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(43,29,20,0.1)",
    },
  },
  barcelona: {
    id: "barcelona",
    label: "Barcelona",
    tagline: "Modernisme, mar i sobremesa",
    displayFont: "var(--font-fraunces)",
    bodyFont: "var(--font-source-sans)",
    vars: {
      "--brand-ink": "#132a36",
      "--brand-foam": "#f6f3ee",
      "--brand-mist": "#d5dfe4",
      "--brand-sun": "#c9a227",
      "--brand-pop": "#b4232c",
      "--brand-mute": "#54666f",
      "--brand-line": "#c5d0d6",
      "--brand-panel": "rgba(255,253,249,0.92)",
      "--bg-a": "#c5d9e6",
      "--bg-b": "#e8d5b5",
      "--bg-c": "#e4b8b8",
      "--bg-base-1": "#f6f3ee",
      "--bg-base-2": "#ebe7e0",
      "--bg-base-3": "#e4ecef",
      "--hero-ink": "19, 42, 54",
      "--pattern-opacity": "0.08",
      "--btn-radius": "0.65rem",
      "--panel-radius": "0.85rem",
      "--btn-transform": "none",
      "--ornament": "solid",
      "--surface-shadow": "0 1px 0 rgba(19,42,54,0.08)",
    },
  },
  valencia: {
    id: "valencia",
    label: "Valencia",
    tagline: "Huerta, luz y tradición levantina",
    displayFont: "var(--font-literata)",
    bodyFont: "var(--font-source-sans)",
    vars: {
      "--brand-ink": "#233041",
      "--brand-foam": "#fff8f1",
      "--brand-mist": "#f0dcc4",
      "--brand-sun": "#e09f3e",
      "--brand-pop": "#c7511a",
      "--brand-mute": "#6a5a4b",
      "--brand-line": "#e0cdba",
      "--brand-panel": "rgba(255,248,241,0.93)",
      "--bg-a": "#f2cfa0",
      "--bg-b": "#c5ddd0",
      "--bg-c": "#efbba0",
      "--bg-base-1": "#fff8f1",
      "--bg-base-2": "#f7eee4",
      "--bg-base-3": "#efe4d7",
      "--hero-ink": "35, 48, 65",
      "--pattern-opacity": "0.09",
      "--btn-radius": "0.3rem",
      "--panel-radius": "0.5rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(35,48,65,0.09)",
    },
  },
  bilbao: {
    id: "bilbao",
    label: "Bilbao",
    tagline: "Hierro, verde y tradición vasca",
    displayFont: "var(--font-ibm-serif)",
    bodyFont: "var(--font-ibm-sans)",
    vars: {
      "--brand-ink": "#14241c",
      "--brand-foam": "#f2f4f1",
      "--brand-mist": "#c9d4cb",
      "--brand-sun": "#c4a574",
      "--brand-pop": "#8f2d2d",
      "--brand-mute": "#526058",
      "--brand-line": "#bdc8bf",
      "--brand-panel": "rgba(242,244,241,0.93)",
      "--bg-a": "#b7c9bb",
      "--bg-b": "#c9d0d5",
      "--bg-c": "#d8c4b2",
      "--bg-base-1": "#f2f4f1",
      "--bg-base-2": "#e6ebe7",
      "--bg-base-3": "#dde5e0",
      "--hero-ink": "20, 36, 28",
      "--pattern-opacity": "0.07",
      "--btn-radius": "0.25rem",
      "--panel-radius": "0.4rem",
      "--btn-transform": "none",
      "--ornament": "solid",
      "--surface-shadow": "0 1px 0 rgba(20,36,28,0.1)",
    },
  },
  galicia: {
    id: "galicia",
    label: "Galicia",
    tagline: "Piedra, bruma atlántica y sobremesa",
    displayFont: "var(--font-lora)",
    bodyFont: "var(--font-source-sans)",
    vars: {
      "--brand-ink": "#1a3348",
      "--brand-foam": "#f3f5f4",
      "--brand-mist": "#c8d5da",
      "--brand-sun": "#c9b27c",
      "--brand-pop": "#2f6f66",
      "--brand-mute": "#556872",
      "--brand-line": "#c2d0d5",
      "--brand-panel": "rgba(243,245,244,0.93)",
      "--bg-a": "#a9c2cf",
      "--bg-b": "#c7d8ce",
      "--bg-c": "#d4cfc3",
      "--bg-base-1": "#f3f5f4",
      "--bg-base-2": "#e7eef0",
      "--bg-base-3": "#e2eae6",
      "--hero-ink": "26, 51, 72",
      "--pattern-opacity": "0.08",
      "--btn-radius": "0.3rem",
      "--panel-radius": "0.5rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(26,51,72,0.09)",
    },
  },
  malaga: {
    id: "malaga",
    label: "Málaga",
    tagline: "Cal, mediterráneo y tradición andaluza",
    displayFont: "var(--font-playfair)",
    bodyFont: "var(--font-libre-franklin)",
    vars: {
      "--brand-ink": "#1f3554",
      "--brand-foam": "#fff9f3",
      "--brand-mist": "#f0ddc5",
      "--brand-sun": "#e0a100",
      "--brand-pop": "#c96a17",
      "--brand-mute": "#655f56",
      "--brand-line": "#e2d0b8",
      "--brand-panel": "rgba(255,249,243,0.93)",
      "--bg-a": "#f0d2a8",
      "--bg-b": "#b4cce8",
      "--bg-c": "#efc2a0",
      "--bg-base-1": "#fff9f3",
      "--bg-base-2": "#f7efe5",
      "--bg-base-3": "#ebe7e0",
      "--hero-ink": "31, 53, 84",
      "--pattern-opacity": "0.09",
      "--btn-radius": "0.25rem",
      "--panel-radius": "0.45rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(31,53,84,0.09)",
    },
  },
  zaragoza: {
    id: "zaragoza",
    label: "Zaragoza",
    tagline: "Ladrillo mudéjar y Ebro",
    displayFont: "var(--font-spectral)",
    bodyFont: "var(--font-source-sans)",
    vars: {
      "--brand-ink": "#3a2418",
      "--brand-foam": "#faf6f1",
      "--brand-mist": "#e2d2c2",
      "--brand-sun": "#c9923a",
      "--brand-pop": "#8c1f24",
      "--brand-mute": "#685648",
      "--brand-line": "#d4c3b1",
      "--brand-panel": "rgba(250,246,241,0.93)",
      "--bg-a": "#e0c5a6",
      "--bg-b": "#c9d4c2",
      "--bg-c": "#deb5b5",
      "--bg-base-1": "#faf6f1",
      "--bg-base-2": "#f1e8de",
      "--bg-base-3": "#e8ddd1",
      "--hero-ink": "58, 36, 24",
      "--pattern-opacity": "0.09",
      "--btn-radius": "0.25rem",
      "--panel-radius": "0.4rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(58,36,24,0.1)",
    },
  },
  granada: {
    id: "granada",
    label: "Granada",
    tagline: "Alhambra, carmen y tradición nazarí",
    displayFont: "var(--font-cormorant)",
    bodyFont: "var(--font-libre-franklin)",
    vars: {
      "--brand-ink": "#2a1f2e",
      "--brand-foam": "#f8f4ef",
      "--brand-mist": "#ddd0c4",
      "--brand-sun": "#c9a66b",
      "--brand-pop": "#7a2f45",
      "--brand-mute": "#655a5f",
      "--brand-line": "#d2c4b6",
      "--brand-panel": "rgba(248,244,239,0.93)",
      "--bg-a": "#d8c4a8",
      "--bg-b": "#c5cddd",
      "--bg-c": "#d8b4c0",
      "--bg-base-1": "#f8f4ef",
      "--bg-base-2": "#efe8df",
      "--bg-base-3": "#e7e0d8",
      "--hero-ink": "42, 31, 46",
      "--pattern-opacity": "0.1",
      "--btn-radius": "0.2rem",
      "--panel-radius": "0.4rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(42,31,46,0.1)",
    },
  },
  asturias: {
    id: "asturias",
    label: "Asturias",
    tagline: "Verde, sidra y piedra",
    displayFont: "var(--font-lora)",
    bodyFont: "var(--font-source-sans)",
    vars: {
      "--brand-ink": "#1c2e24",
      "--brand-foam": "#f3f5f2",
      "--brand-mist": "#c7d4c8",
      "--brand-sun": "#c4a35a",
      "--brand-pop": "#4f6f52",
      "--brand-mute": "#55665a",
      "--brand-line": "#c2cfc4",
      "--brand-panel": "rgba(243,245,242,0.93)",
      "--bg-a": "#b5cbb8",
      "--bg-b": "#c9d2d8",
      "--bg-c": "#d8c9b0",
      "--bg-base-1": "#f3f5f2",
      "--bg-base-2": "#e7eee8",
      "--bg-base-3": "#dfe8e1",
      "--hero-ink": "28, 46, 36",
      "--pattern-opacity": "0.08",
      "--btn-radius": "0.3rem",
      "--panel-radius": "0.5rem",
      "--btn-transform": "none",
      "--ornament": "solid",
      "--surface-shadow": "0 1px 0 rgba(28,46,36,0.09)",
    },
  },
  buenos_aires: {
    id: "buenos_aires",
    label: "Buenos Aires",
    tagline: "Barrio, fileteado y juntada de vereda",
    displayFont: "var(--font-libre-baskerville)",
    bodyFont: "var(--font-source-sans)",
    vars: {
      "--brand-ink": "#1f1a24",
      "--brand-foam": "#f7f3ef",
      "--brand-mist": "#ddd2c8",
      "--brand-sun": "#c9956a",
      "--brand-pop": "#b24c3a",
      "--brand-mute": "#645c62",
      "--brand-line": "#d2c6bc",
      "--brand-panel": "rgba(247,243,239,0.93)",
      "--bg-a": "#e4c4c0",
      "--bg-b": "#c9d8d2",
      "--bg-c": "#e2d0b4",
      "--bg-base-1": "#f7f3ef",
      "--bg-base-2": "#efe8e1",
      "--bg-base-3": "#e8e2db",
      "--hero-ink": "31, 26, 36",
      "--pattern-opacity": "0.09",
      "--btn-radius": "0.25rem",
      "--panel-radius": "0.45rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(31,26,36,0.1)",
    },
  },
  default: {
    id: "default",
    label: "España",
    tagline: "Tradición, planes y buena compañía",
    displayFont: "var(--font-literata)",
    bodyFont: "var(--font-source-sans)",
    vars: {
      "--brand-ink": "#1e2a24",
      "--brand-foam": "#f5f2eb",
      "--brand-mist": "#d7d2c6",
      "--brand-sun": "#c9a66b",
      "--brand-pop": "#a33b45",
      "--brand-mute": "#5d635e",
      "--brand-line": "#cfc8bb",
      "--brand-panel": "rgba(255,252,246,0.92)",
      "--bg-a": "#e4d7b8",
      "--bg-b": "#c5d5cb",
      "--bg-c": "#e0c4c4",
      "--bg-base-1": "#f5f2eb",
      "--bg-base-2": "#ebe6dc",
      "--bg-base-3": "#e4dfd5",
      "--hero-ink": "30, 42, 36",
      "--pattern-opacity": "0.08",
      "--btn-radius": "0.35rem",
      "--panel-radius": "0.55rem",
      "--btn-transform": "none",
      "--ornament": "double",
      "--surface-shadow": "0 1px 0 rgba(30,42,36,0.09)",
    },
  },
};

const PROVINCE_THEME: Record<string, RegionThemeId> = {
  madrid: "madrid",
  sevilla: "sevilla",
  barcelona: "barcelona",
  valencia: "valencia",
  bizkaia: "bilbao",
  "a coruña": "galicia",
  pontevedra: "galicia",
  lugo: "galicia",
  ourense: "galicia",
  málaga: "malaga",
  malaga: "malaga",
  zaragoza: "zaragoza",
  granada: "granada",
  asturias: "asturias",
  alicante: "valencia",
  murcia: "valencia",
  "illes balears": "barcelona",
  "las palmas": "malaga",
  caba: "buenos_aires",
  "buenos aires": "buenos_aires",
  córdoba: "buenos_aires",
  cordoba: "buenos_aires",
  "santa fe": "buenos_aires",
  mendoza: "buenos_aires",
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
  root.style.setProperty("--font-display-active", theme.displayFont);
  root.style.setProperty("--font-body-active", theme.bodyFont);
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}

/** Provincias conocidas para un país (desde catálogo de ubicaciones). */
export function provincesForCountry(country: string): string[] {
  return getProvinces(country).map((p) => p.name);
}
