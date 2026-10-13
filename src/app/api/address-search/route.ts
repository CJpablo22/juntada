import { NextResponse } from "next/server";

export type AddressSuggestion = {
  id: string;
  label: string;
  addressLine: string;
  postalCode: string;
  neighborhood: string;
  city: string;
  province: string;
};

type NominatimHit = {
  place_id?: number;
  display_name?: string;
  address?: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    house_number?: string;
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    province?: string;
  };
};

/**
 * Búsqueda de calle vía Nominatim (OSM).
 * Al elegir sugerencia se rellenan calle+número y CP; piso/puerta queda aparte.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const country = (searchParams.get("country") ?? "ES").toUpperCase();
  const city = (searchParams.get("city") ?? "").trim();
  const province = (searchParams.get("province") ?? "").trim();

  if (q.length < 3) {
    return NextResponse.json({ results: [] as AddressSuggestion[] });
  }

  const queryParts = [q];
  if (city) queryParts.push(city);
  if (province) queryParts.push(province);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", queryParts.join(", "));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", country.toLowerCase());

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Juntada/1.0 (address assist; local demo)",
      },
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: "search_failed" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as NominatimHit[];
    const results: AddressSuggestion[] = [];
    const seen = new Set<string>();

    for (const hit of data) {
      const a = hit.address ?? {};
      const road = a.road || a.pedestrian || a.footway || "";
      if (!road) continue;
      const number = a.house_number ? ` ${a.house_number}` : "";
      const addressLine = `${road}${number}`.trim();
      const postalCode = a.postcode || "";
      const neighborhood =
        a.neighbourhood || a.suburb || a.quarter || a.city_district || "";
      const placeCity =
        a.city || a.town || a.village || a.municipality || "";
      const placeProvince = a.state || a.province || "";
      const key = `${addressLine}|${postalCode}|${placeCity}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        id: String(hit.place_id ?? results.length),
        label: hit.display_name || addressLine,
        addressLine,
        postalCode,
        neighborhood,
        city: placeCity,
        province: placeProvince,
      });
      if (results.length >= 6) break;
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { results: [], error: "search_unavailable" },
      { status: 503 },
    );
  }
}
