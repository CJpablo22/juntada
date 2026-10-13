export type RegionThemeId =
  | "madrid"
  | "sevilla"
  | "barcelona"
  | "valencia"
  | "bilbao"
  | "galicia"
  | "malaga"
  | "zaragoza"
  | "buenos_aires"
  | "default";

export type RegionTheme = {
  id: RegionThemeId;
  label: string;
  tagline: string;
  country: string;
  province: string;
  /** CSS custom properties applied to <html> */
  vars: Record<string, string>;
};

const THEMES: Record<RegionThemeId, RegionTheme> = {
  madrid: {
    id: "madrid",
    label: "Madrid",
    tagline: "Granito, cielo alto y planes a mil",
    country: "ES",
    province: "Madrid",
    vars: {
      "--brand-ink": "#1c2333",
      "--brand-foam": "#f3f5f8",
      "--brand-mist": "#d7dde8",
      "--brand-sun": "#c9a227",
      "--brand-pop": "#c8102e",
      "--brand-mute": "#5c6578",
      "--brand-line": "#c8d0dc",
      "--brand-panel": "rgba(255,255,255,0.78)",
      "--bg-a": "#dfe7f5",
      "--bg-b": "#f7e8d4",
      "--bg-c": "#f0d5d8",
      "--bg-base-1": "#f5f7fb",
      "--bg-base-2": "#eef1f6",
      "--bg-base-3": "#f7f3ee",
      "--hero-ink": "28, 35, 51",
      "--pattern-opacity": "0.07",
    },
  },
  sevilla: {
    id: "sevilla",
    label: "Sevilla",
    tagline: "Cal, naranjos y luz de patio",
    country: "ES",
    province: "Sevilla",
    vars: {
      "--brand-ink": "#2a1810",
      "--brand-foam": "#fff8f1",
      "--brand-mist": "#f0e0cc",
      "--brand-sun": "#f0a202",
      "--brand-pop": "#c45c26",
      "--brand-mute": "#6e5648",
      "--brand-line": "#e2d0b8",
      "--brand-panel": "rgba(255,248,241,0.82)",
      "--bg-a": "#ffe2a8",
      "--bg-b": "#c8e6d0",
      "--bg-c": "#f5c4a8",
      "--bg-base-1": "#fff9f2",
      "--bg-base-2": "#f7efe4",
      "--bg-base-3": "#f3e7d8",
      "--hero-ink": "42, 24, 16",
      "--pattern-opacity": "0.08",
    },
  },
  barcelona: {
    id: "barcelona",
    label: "Barcelona",
    tagline: "Mar, vermell i cap de setmana",
    country: "ES",
    province: "Barcelona",
    vars: {
      "--brand-ink": "#0b2a3a",
      "--brand-foam": "#f3f8fb",
      "--brand-mist": "#cfe0ea",
      "--brand-sun": "#f2c14e",
      "--brand-pop": "#d62828",
      "--brand-mute": "#4f6672",
      "--brand-line": "#c5d5df",
      "--brand-panel": "rgba(255,255,255,0.78)",
      "--bg-a": "#b8d9ef",
      "--bg-b": "#f7d7a8",
      "--bg-c": "#f2b5b5",
      "--bg-base-1": "#f4f9fc",
      "--bg-base-2": "#eaf3f8",
      "--bg-base-3": "#f7f1e8",
      "--hero-ink": "11, 42, 58",
      "--pattern-opacity": "0.07",
    },
  },
  valencia: {
    id: "valencia",
    label: "Valencia",
    tagline: "Naranja, luz y terraza",
    country: "ES",
    province: "Valencia",
    vars: {
      "--brand-ink": "#1f2d3d",
      "--brand-foam": "#fff7f0",
      "--brand-mist": "#ffe1c4",
      "--brand-sun": "#ff9f1c",
      "--brand-pop": "#e85d04",
      "--brand-mute": "#6b5b4e",
      "--brand-line": "#ecd4bc",
      "--brand-panel": "rgba(255,247,240,0.82)",
      "--bg-a": "#ffd19a",
      "--bg-b": "#b8e0d2",
      "--bg-c": "#ffb4a2",
      "--bg-base-1": "#fff8f2",
      "--bg-base-2": "#fff1e4",
      "--bg-base-3": "#f7ebe0",
      "--hero-ink": "31, 45, 61",
      "--pattern-opacity": "0.08",
    },
  },
  bilbao: {
    id: "bilbao",
    label: "Bilbao",
    tagline: "Verde, acero y pintxos",
    country: "ES",
    province: "Bizkaia",
    vars: {
      "--brand-ink": "#10241c",
      "--brand-foam": "#f2f6f3",
      "--brand-mist": "#c9d9cf",
      "--brand-sun": "#d4a373",
      "--brand-pop": "#b33a3a",
      "--brand-mute": "#55665c",
      "--brand-line": "#c2d0c7",
      "--brand-panel": "rgba(242,246,243,0.82)",
      "--bg-a": "#b7d3c4",
      "--bg-b": "#cfd6dc",
      "--bg-c": "#e2c4b0",
      "--bg-base-1": "#f3f7f4",
      "--bg-base-2": "#e8f0eb",
      "--bg-base-3": "#eef1f0",
      "--hero-ink": "16, 36, 28",
      "--pattern-opacity": "0.06",
    },
  },
  galicia: {
    id: "galicia",
    label: "Galicia",
    tagline: "Atlántico, bruma y buen plan",
    country: "ES",
    province: "A Coruña",
    vars: {
      "--brand-ink": "#16324f",
      "--brand-foam": "#f4f7f8",
      "--brand-mist": "#c9d8df",
      "--brand-sun": "#e9c46a",
      "--brand-pop": "#2a9d8f",
      "--brand-mute": "#5a6b74",
      "--brand-line": "#c5d3da",
      "--brand-panel": "rgba(244,247,248,0.82)",
      "--bg-a": "#a8c5d4",
      "--bg-b": "#cfe3d8",
      "--bg-c": "#d7cfc0",
      "--bg-base-1": "#f3f7f8",
      "--bg-base-2": "#e8f0f3",
      "--bg-base-3": "#eef3f0",
      "--hero-ink": "22, 50, 79",
      "--pattern-opacity": "0.07",
    },
  },
  malaga: {
    id: "malaga",
    label: "Málaga",
    tagline: "Sol, playa y tapeo",
    country: "ES",
    province: "Málaga",
    vars: {
      "--brand-ink": "#1d3557",
      "--brand-foam": "#fff9f4",
      "--brand-mist": "#ffe5cc",
      "--brand-sun": "#ffb703",
      "--brand-pop": "#fb8500",
      "--brand-mute": "#6a655c",
      "--brand-line": "#e8d5c0",
      "--brand-panel": "rgba(255,249,244,0.82)",
      "--bg-a": "#ffd6a5",
      "--bg-b": "#a0c4ff",
      "--bg-c": "#ffc6a0",
      "--bg-base-1": "#fff9f4",
      "--bg-base-2": "#fff2e6",
      "--bg-base-3": "#f5f0ea",
      "--hero-ink": "29, 53, 87",
      "--pattern-opacity": "0.07",
    },
  },
  zaragoza: {
    id: "zaragoza",
    label: "Zaragoza",
    tagline: "Ebro, ladrillo y sobremesa",
    country: "ES",
    province: "Zaragoza",
    vars: {
      "--brand-ink": "#3d2314",
      "--brand-foam": "#faf6f2",
      "--brand-mist": "#e4d4c4",
      "--brand-sun": "#e09f3e",
      "--brand-pop": "#9b2226",
      "--brand-mute": "#6b5748",
      "--brand-line": "#d8c7b6",
      "--brand-panel": "rgba(250,246,242,0.82)",
      "--bg-a": "#e6c9a8",
      "--bg-b": "#c9d5c2",
      "--bg-c": "#e2b4b4",
      "--bg-base-1": "#faf6f2",
      "--bg-base-2": "#f3ebe3",
      "--bg-base-3": "#efe6dc",
      "--hero-ink": "61, 35, 20",
      "--pattern-opacity": "0.07",
    },
  },
  buenos_aires: {
    id: "buenos_aires",
    label: "Buenos Aires",
    tagline: "Barrio, vereda y juntada",
    country: "AR",
    province: "CABA",
    vars: {
      "--brand-ink": "#1b1a2a",
      "--brand-foam": "#f7f3f8",
      "--brand-mist": "#e0d4e8",
      "--brand-sun": "#f4a261",
      "--brand-pop": "#e76f51",
      "--brand-mute": "#655f70",
      "--brand-line": "#d5cbd9",
      "--brand-panel": "rgba(247,243,248,0.82)",
      "--bg-a": "#f2c6de",
      "--bg-b": "#c9e4de",
      "--bg-c": "#f6d4a8",
      "--bg-base-1": "#f8f4f9",
      "--bg-base-2": "#f1ebf4",
      "--bg-base-3": "#f7f0e9",
      "--hero-ink": "27, 26, 42",
      "--pattern-opacity": "0.07",
    },
  },
  default: {
    id: "default",
    label: "España",
    tagline: "Planes con tu gente, sin tanto WhatsApp",
    country: "ES",
    province: "",
    vars: {
      "--brand-ink": "#0c3029",
      "--brand-foam": "#f4f7f2",
      "--brand-mist": "#d9ebe3",
      "--brand-sun": "#f3c16b",
      "--brand-pop": "#e23e57",
      "--brand-mute": "#5b6b64",
      "--brand-line": "#c9d8d0",
      "--brand-panel": "rgba(255,255,255,0.72)",
      "--bg-a": "#ffe8b5",
      "--bg-b": "#b8e0d2",
      "--bg-c": "#f7c4cb",
      "--bg-base-1": "#f7faf6",
      "--bg-base-2": "#eef5f0",
      "--bg-base-3": "#f6f1ea",
      "--hero-ink": "12, 48, 41",
      "--pattern-opacity": "0.06",
    },
  },
};

const CITY_ALIASES: Record<string, RegionThemeId> = {
  madrid: "madrid",
  sevilla: "sevilla",
  barcelona: "barcelona",
  valencia: "valencia",
  bilbao: "bilbao",
  "a coruña": "galicia",
  coruna: "galicia",
  coruña: "galicia",
  santiago: "galicia",
  vigo: "galicia",
  pontevedra: "galicia",
  lugo: "galicia",
  ourense: "galicia",
  malaga: "malaga",
  málaga: "malaga",
  zaragoza: "zaragoza",
  "buenos aires": "buenos_aires",
  caba: "buenos_aires",
  palermo: "buenos_aires",
};

const PROVINCE_ALIASES: Record<string, RegionThemeId> = {
  madrid: "madrid",
  sevilla: "sevilla",
  barcelona: "barcelona",
  valencia: "valencia",
  bizkaia: "bilbao",
  vizcaya: "bilbao",
  "a coruña": "galicia",
  "la coruña": "galicia",
  pontevedra: "galicia",
  lugo: "galicia",
  ourense: "galicia",
  málaga: "malaga",
  malaga: "malaga",
  zaragoza: "zaragoza",
  caba: "buenos_aires",
  "ciudad autónoma de buenos aires": "buenos_aires",
  "buenos aires": "buenos_aires",
};

export const REGION_OPTIONS: {
  country: string;
  countryLabel: string;
  provinces: { value: string; label: string; themeId: RegionThemeId; cities: string[] }[];
}[] = [
  {
    country: "ES",
    countryLabel: "España",
    provinces: [
      { value: "Madrid", label: "Madrid", themeId: "madrid", cities: ["Madrid", "Alcalá de Henares", "Getafe"] },
      { value: "Sevilla", label: "Sevilla", themeId: "sevilla", cities: ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra"] },
      { value: "Barcelona", label: "Barcelona", themeId: "barcelona", cities: ["Barcelona", "Hospitalet", "Badalona"] },
      { value: "Valencia", label: "Valencia", themeId: "valencia", cities: ["Valencia", "Torrent", "Paterna"] },
      { value: "Bizkaia", label: "Bizkaia", themeId: "bilbao", cities: ["Bilbao", "Barakaldo", "Getxo"] },
      { value: "A Coruña", label: "A Coruña", themeId: "galicia", cities: ["A Coruña", "Santiago de Compostela", "Ferrol"] },
      { value: "Málaga", label: "Málaga", themeId: "malaga", cities: ["Málaga", "Marbella", "Torremolinos"] },
      { value: "Zaragoza", label: "Zaragoza", themeId: "zaragoza", cities: ["Zaragoza", "Calatayud"] },
    ],
  },
  {
    country: "AR",
    countryLabel: "Argentina",
    provinces: [
      {
        value: "CABA",
        label: "CABA",
        themeId: "buenos_aires",
        cities: ["Buenos Aires", "Palermo", "San Telmo"],
      },
      {
        value: "Buenos Aires",
        label: "Buenos Aires (provincia)",
        themeId: "buenos_aires",
        cities: ["La Plata", "Mar del Plata"],
      },
    ],
  },
];

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
  const city = norm(input.city ?? "");
  const province = norm(input.province ?? "");
  const country = (input.country ?? "ES").toUpperCase();

  if (city && CITY_ALIASES[city]) return getRegionTheme(CITY_ALIASES[city]);
  if (province && PROVINCE_ALIASES[province])
    return getRegionTheme(PROVINCE_ALIASES[province]);

  // fuzzy contains
  for (const [key, id] of Object.entries(CITY_ALIASES)) {
    if (city.includes(key) || key.includes(city)) return getRegionTheme(id);
  }
  for (const [key, id] of Object.entries(PROVINCE_ALIASES)) {
    if (province.includes(key) || key.includes(province))
      return getRegionTheme(id);
  }

  if (country === "AR") return getRegionTheme("buenos_aires");
  return getRegionTheme("default");
}

export function applyRegionTheme(theme: RegionTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.region = theme.id;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}
