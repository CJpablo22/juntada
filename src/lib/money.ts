/** Spain-first, EUR only in MVP. Keep helpers ready for more locales later. */
export const APP_LOCALE = "es-ES";
export const APP_CURRENCY = "EUR";
export const APP_MARKET = "ES";

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency: APP_CURRENCY,
  }).format(cents / 100);
}

export function parseEuroToCents(value: string): number | null {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const amount = Number.parseFloat(normalized);
  if (Number.isNaN(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}
