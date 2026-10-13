import catalog from "@/lib/data/locations-catalog.json";

export type CountryCode = "ES" | "AR";

export type LocationCity = {
  name: string;
  neighborhoods: string[];
};

export type LocationProvince = {
  name: string;
  cities: LocationCity[];
};

export type LocationCountry = {
  code: CountryCode;
  name: string;
  provinces: LocationProvince[];
};

/** Catálogo completo: provincias y localidades de ES (municipios) y AR (municipios/localidades). */
export const LOCATIONS = catalog as LocationCountry[];

export function getCountry(code: string): LocationCountry | undefined {
  return LOCATIONS.find((c) => c.code === code);
}

export function getProvinces(countryCode: string): LocationProvince[] {
  return getCountry(countryCode)?.provinces ?? [];
}

export function getCities(
  countryCode: string,
  provinceName: string,
): LocationCity[] {
  return (
    getProvinces(countryCode).find((p) => p.name === provinceName)?.cities ??
    []
  );
}

export function getNeighborhoods(
  countryCode: string,
  provinceName: string,
  cityName: string,
): string[] {
  return (
    getCities(countryCode, provinceName).find((c) => c.name === cityName)
      ?.neighborhoods ?? []
  );
}

/** Filtra localidades por texto (para combobox). */
export function filterCities(
  countryCode: string,
  provinceName: string,
  query: string,
  limit = 80,
): LocationCity[] {
  const cities = getCities(countryCode, provinceName);
  const q = query.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (!q) return cities.slice(0, limit);
  const scored: { city: LocationCity; score: number }[] = [];
  for (const city of cities) {
    const n = city.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    if (n.startsWith(q)) scored.push({ city, score: 0 });
    else if (n.includes(q)) scored.push({ city, score: 1 });
  }
  scored.sort((a, b) => a.score - b.score || a.city.name.localeCompare(b.city.name));
  return scored.slice(0, limit).map((s) => s.city);
}

export function isValidLocation(input: {
  country: string;
  province: string;
  city: string;
  neighborhood?: string;
}): boolean {
  const cities = getCities(input.country, input.province);
  const city = cities.find((c) => c.name === input.city);
  if (!city) return false;
  if (!input.neighborhood) return true;
  return city.neighborhoods.includes(input.neighborhood);
}
