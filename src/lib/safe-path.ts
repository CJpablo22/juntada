/**
 * Solo rutas relativas internas. Rechaza //evil.com, /\evil, @, etc.
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback = "/app",
): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  if (path.includes("@")) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return fallback;
  if (!/^\/[A-Za-z0-9/_\-?=&%.]*$/.test(path)) return fallback;
  return path;
}
