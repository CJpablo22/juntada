export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Detecta URLs de Google Maps / Apple Maps / geo: para no duplicar con “casa de”. */
export function isMapsLink(raw?: string | null): boolean {
  if (!raw?.trim()) return false;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProto);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (
      host === "maps.google.com" ||
      (host.endsWith(".google.com") && url.pathname.includes("/maps"))
    ) {
      return true;
    }
    if (host === "maps.app.goo.gl" || host === "goo.gl") return true;
    if (host === "maps.apple.com") return true;
    if (url.protocol === "geo:") return true;
    return false;
  } catch {
    return /maps\.google|maps\.app\.goo|maps\.apple|goo\.gl\/maps/i.test(raw);
  }
}
