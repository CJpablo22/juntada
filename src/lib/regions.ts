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
  vars: Record<string, string>;
};

/** Paletas sobrias por provincia — papel + tinta + un acento. */
const THEMES: Record<RegionThemeId, RegionTheme> = {
  madrid: {
    id: "madrid",
    label: "Madrid",
    tagline: "Madrid",
    vars: {
      "--ink": "#1c1917",
      "--paper": "#f7f5f2",
      "--mute": "#57534e",
      "--line": "#ddd6cb",
      "--pop": "#b91c1c",
      "--pop-soft": "#f5e5e5",
      "--wash": "#efece7",
      "--hero": "#1c1917",
    },
  },
  sevilla: {
    id: "sevilla",
    label: "Sevilla",
    tagline: "Sevilla",
    vars: {
      "--ink": "#292018",
      "--paper": "#faf6ef",
      "--mute": "#6b5c4d",
      "--line": "#e4d8c6",
      "--pop": "#9a3412",
      "--pop-soft": "#f0e4d6",
      "--wash": "#f3ebe0",
      "--hero": "#3f2a1e",
    },
  },
  barcelona: {
    id: "barcelona",
    label: "Barcelona",
    tagline: "Barcelona",
    vars: {
      "--ink": "#1e293b",
      "--paper": "#f5f7f9",
      "--mute": "#475569",
      "--line": "#d7dee6",
      "--pop": "#b91c1c",
      "--pop-soft": "#f3e5e5",
      "--wash": "#eef2f6",
      "--hero": "#0f172a",
    },
  },
  valencia: {
    id: "valencia",
    label: "Valencia",
    tagline: "Valencia",
    vars: {
      "--ink": "#1c1917",
      "--paper": "#faf6ee",
      "--mute": "#57534e",
      "--line": "#e6dccb",
      "--pop": "#c2410c",
      "--pop-soft": "#f5e8d8",
      "--wash": "#f4ebe0",
      "--hero": "#292524",
    },
  },
  bilbao: {
    id: "bilbao",
    label: "Bilbao",
    tagline: "Bilbao",
    vars: {
      "--ink": "#1a2e22",
      "--paper": "#f4f7f4",
      "--mute": "#3f4f44",
      "--line": "#d2ddd4",
      "--pop": "#9f1239",
      "--pop-soft": "#f3e4e8",
      "--wash": "#e9f0eb",
      "--hero": "#14532d",
    },
  },
  galicia: {
    id: "galicia",
    label: "Galicia",
    tagline: "Galicia",
    vars: {
      "--ink": "#163842",
      "--paper": "#f4f7f8",
      "--mute": "#4b626c",
      "--line": "#d0dce1",
      "--pop": "#0f766e",
      "--pop-soft": "#ddecea",
      "--wash": "#e8f0f2",
      "--hero": "#134e4a",
    },
  },
  malaga: {
    id: "malaga",
    label: "Málaga",
    tagline: "Málaga",
    vars: {
      "--ink": "#1e3a5f",
      "--paper": "#faf6f1",
      "--mute": "#5c5a56",
      "--line": "#e2d8cd",
      "--pop": "#c2410c",
      "--pop-soft": "#f3e6d6",
      "--wash": "#f3ebe2",
      "--hero": "#1e3a5f",
    },
  },
  zaragoza: {
    id: "zaragoza",
    label: "Zaragoza",
    tagline: "Zaragoza",
    vars: {
      "--ink": "#3a2a20",
      "--paper": "#f7f3ef",
      "--mute": "#6b5b4f",
      "--line": "#ddd2c6",
      "--pop": "#9f1239",
      "--pop-soft": "#f1e4e8",
      "--wash": "#efe6dd",
      "--hero": "#3f2a1e",
    },
  },
  granada: {
    id: "granada",
    label: "Granada",
    tagline: "Granada",
    vars: {
      "--ink": "#3a2430",
      "--paper": "#f7f3f1",
      "--mute": "#645656",
      "--line": "#ddd2cd",
      "--pop": "#9f1239",
      "--pop-soft": "#f1e4ec",
      "--wash": "#efe6e2",
      "--hero": "#3b1f2b",
    },
  },
  asturias: {
    id: "asturias",
    label: "Asturias",
    tagline: "Asturias",
    vars: {
      "--ink": "#1a2e22",
      "--paper": "#f4f7f4",
      "--mute": "#4d5c52",
      "--line": "#d0dbd2",
      "--pop": "#166534",
      "--pop-soft": "#e0ede4",
      "--wash": "#e8f0ea",
      "--hero": "#1a2e22",
    },
  },
  buenos_aires: {
    id: "buenos_aires",
    label: "Buenos Aires",
    tagline: "Buenos Aires",
    vars: {
      "--ink": "#1f1a17",
      "--paper": "#f6f3ef",
      "--mute": "#5c5652",
      "--line": "#ddd6cd",
      "--pop": "#b45309",
      "--pop-soft": "#f0e6d8",
      "--wash": "#eee7df",
      "--hero": "#1f1a17",
    },
  },
  default: {
    id: "default",
    label: "España",
    tagline: "España",
    vars: {
      "--ink": "#1a1a1a",
      "--paper": "#f7f6f3",
      "--mute": "#5a5a5a",
      "--line": "#ddd9d0",
      "--pop": "#b45309",
      "--pop-soft": "#f3e8d8",
      "--wash": "#efece6",
      "--hero": "#1a1a1a",
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
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.style.setProperty("--brand-ink", theme.vars["--ink"]);
  root.style.setProperty("--brand-foam", theme.vars["--paper"]);
  root.style.setProperty("--brand-mute", theme.vars["--mute"]);
  root.style.setProperty("--brand-line", theme.vars["--line"]);
  root.style.setProperty("--brand-pop", theme.vars["--pop"]);
  root.style.setProperty("--brand-sun", theme.vars["--pop"]);
  root.style.setProperty("--brand-panel", "#ffffff");
  root.style.setProperty("--accent", theme.vars["--pop-soft"]);
}

export function provincesForCountry(country: string): string[] {
  return getProvinces(country).map((p) => p.name);
}
