import type { IdeaType } from "@/lib/types";

export type ImportedLink = {
  title: string;
  notes: string;
  link: string;
  type?: IdeaType;
  placeName?: string;
  placeAddress?: string;
};

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
      .replace(/\+/g, " ")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return slug.replace(/[-_]+/g, " ").trim();
  }
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Best-effort parse of Maps / Netflix / Letterboxd / IG / generic URLs.
 * No paid APIs — only URL structure (and optional open-graph later).
 */
export function parseImportLink(raw: string): ImportedLink | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname;

  // Google Maps
  if (
    host.includes("google.") && path.includes("/maps") ||
    host === "maps.app.goo.gl" ||
    host === "goo.gl"
  ) {
    const placeMatch = path.match(/\/place\/([^/]+)/);
    const q = url.searchParams.get("q") || url.searchParams.get("query");
    const name = placeMatch
      ? titleCase(decodeSlug(placeMatch[1]))
      : q
        ? titleCase(decodeSlug(q))
        : "Lugar de Maps";
    return {
      title: name,
      notes: "Importado desde Google Maps",
      link: url.toString(),
      type: "visit",
      placeName: name,
      placeAddress: q?.trim() || name,
    };
  }

  // Netflix
  if (host.includes("netflix.com")) {
    const parts = path.split("/").filter(Boolean);
    const titleIdx = parts.findIndex((p) => p === "title");
    let title = "Serie o peli de Netflix";
    if (titleIdx >= 0 && parts[titleIdx + 2]) {
      title = titleCase(decodeSlug(parts[titleIdx + 2]));
    } else if (parts.length) {
      const last = parts[parts.length - 1];
      if (!/^\d+$/.test(last)) title = titleCase(decodeSlug(last));
    }
    return {
      title,
      notes: "Importado desde Netflix",
      link: url.toString(),
      type: "series",
    };
  }

  // Letterboxd
  if (host.includes("letterboxd.com")) {
    const m = path.match(/\/film\/([^/]+)/);
    const title = m ? titleCase(decodeSlug(m[1])) : "Película";
    return {
      title,
      notes: "Importado desde Letterboxd",
      link: url.toString(),
      type: "movie",
    };
  }

  // Instagram
  if (host.includes("instagram.com")) {
    return {
      title: "Plan de Instagram",
      notes: "Importado desde Instagram — completá el título",
      link: url.toString(),
      type: "plan",
    };
  }

  // YouTube
  if (host.includes("youtube.com") || host === "youtu.be") {
    const v = url.searchParams.get("v") || path.replace(/^\//, "");
    return {
      title: "Video / trailer",
      notes: `Importado desde YouTube${v ? ` (${v})` : ""}`,
      link: url.toString(),
      type: "plan",
    };
  }

  // Generic
  const slug = path.split("/").filter(Boolean).pop();
  const title = slug
    ? titleCase(decodeSlug(slug))
    : titleCase(host.split(".")[0] || "Plan importado");
  return {
    title: title || "Plan importado",
    notes: `Importado desde ${host}`,
    link: url.toString(),
    type: "plan",
  };
}
