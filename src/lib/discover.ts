import type { Idea, Review } from "@/lib/types";

/** Normaliza título para unificar la misma peli/plan entre grupos. */
export function normalizeDiscoverTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function discoverKey(idea: Pick<Idea, "type" | "title">): string {
  return `${idea.type}::${normalizeDiscoverTitle(idea.title)}`;
}

export type DiscoverCluster = {
  key: string;
  type: Idea["type"];
  title: string;
  canonicalIdeaId: string;
  ideaIds: string[];
  reviews: Review[];
  avg: number;
};

/** Agrupa ideas hechas con el mismo tipo + título (opiniones públicas). */
export function clusterDiscoverEntries(
  ideas: Idea[],
  reviews: Review[],
): DiscoverCluster[] {
  const done = ideas.filter((i) => i.status === "done");
  const byKey = new Map<
    string,
    { type: Idea["type"]; title: string; ideas: Idea[] }
  >();

  for (const idea of done) {
    const key = discoverKey(idea);
    const existing = byKey.get(key);
    if (existing) {
      existing.ideas.push(idea);
      // Preferir el título con más capitalización “bonita” (más larga / original)
      if (idea.title.trim().length > existing.title.length) {
        existing.title = idea.title.trim();
      }
    } else {
      byKey.set(key, {
        type: idea.type,
        title: idea.title.trim(),
        ideas: [idea],
      });
    }
  }

  const clusters: DiscoverCluster[] = [];
  for (const [key, bucket] of byKey) {
    const ideaIds = bucket.ideas.map((i) => i.id);
    const idSet = new Set(ideaIds);
    const publicReviews = reviews.filter(
      (r) => idSet.has(r.ideaId) && r.publicVisible,
    );
    if (publicReviews.length === 0) continue;
    const avg =
      publicReviews.reduce((a, b) => a + b.rating, 0) / publicReviews.length;
    // Canónico: la idea con más opiniones públicas
    const counts = new Map<string, number>();
    for (const r of publicReviews) {
      counts.set(r.ideaId, (counts.get(r.ideaId) ?? 0) + 1);
    }
    let canonicalIdeaId = ideaIds[0];
    let best = -1;
    for (const id of ideaIds) {
      const n = counts.get(id) ?? 0;
      if (n > best) {
        best = n;
        canonicalIdeaId = id;
      }
    }
    clusters.push({
      key,
      type: bucket.type,
      title: bucket.title,
      canonicalIdeaId,
      ideaIds,
      reviews: publicReviews.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
      avg,
    });
  }

  return clusters.sort(
    (a, b) => b.avg - a.avg || b.reviews.length - a.reviews.length,
  );
}
