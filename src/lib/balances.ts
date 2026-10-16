import type { Expense } from "@/lib/types";

/** Partes iguales; el resto de céntimos va a los primeros. */
export function buildEqualShares(
  amountCents: number,
  userIds: string[],
): Record<string, number> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0 || amountCents <= 0) return {};
  const base = Math.floor(amountCents / ids.length);
  const rem = amountCents - base * ids.length;
  const out: Record<string, number> = {};
  ids.forEach((id, i) => {
    out[id] = base + (i < rem ? 1 : 0);
  });
  return out;
}

/** 50/50 entre dos personas. */
export function buildHalfShares(
  amountCents: number,
  a: string,
  b: string,
): Record<string, number> {
  if (!a || !b || a === b) return buildEqualShares(amountCents, [a, b].filter(Boolean));
  const first = Math.floor(amountCents / 2);
  return { [a]: first, [b]: amountCents - first };
}

/**
 * Ajusta shares para que sumen exactamente amountCents.
 * Ignora ceros/negativos; si no queda nadie, {}.
 */
export function normalizeShares(
  amountCents: number,
  draft: Record<string, number>,
): Record<string, number> {
  const entries = Object.entries(draft).filter(
    ([, v]) => Number.isFinite(v) && v > 0,
  );
  if (entries.length === 0 || amountCents <= 0) return {};
  const sum = entries.reduce((s, [, v]) => s + Math.round(v), 0);
  if (sum === amountCents) {
    return Object.fromEntries(entries.map(([id, v]) => [id, Math.round(v)]));
  }
  // Escalar proporcionalmente y corregir resto
  const scaled = entries.map(([id, v]) => ({
    id,
    raw: (Math.round(v) / sum) * amountCents,
  }));
  const floors = scaled.map((s) => ({
    id: s.id,
    share: Math.floor(s.raw),
    frac: s.raw - Math.floor(s.raw),
  }));
  let used = floors.reduce((s, x) => s + x.share, 0);
  let rem = amountCents - used;
  floors
    .slice()
    .sort((a, b) => b.frac - a.frac)
    .forEach((row) => {
      if (rem <= 0) return;
      row.share += 1;
      rem -= 1;
    });
  return Object.fromEntries(floors.map((f) => [f.id, f.share]));
}

/** Shares efectivos de un gasto (custom o iguales). */
export function expenseShares(expense: Expense): Record<string, number> {
  const custom = expense.splitShares;
  if (custom && Object.keys(custom).length > 0) {
    const cleaned = Object.fromEntries(
      Object.entries(custom).filter(([, v]) => Number.isFinite(v) && v > 0),
    );
    if (Object.keys(cleaned).length > 0) {
      return normalizeShares(expense.amountCents, cleaned);
    }
  }
  return buildEqualShares(expense.amountCents, expense.splitBetween);
}

/** Simplified pairwise balances: positive = others owe this user. */
export function computeBalances(
  expenses: Expense[],
  memberIds: string[],
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const id of memberIds) balances[id] = 0;

  for (const expense of expenses) {
    const shares = expenseShares(expense);
    const ids = Object.keys(shares).filter((id) => memberIds.includes(id));
    if (ids.length === 0) continue;
    for (const id of ids) {
      balances[id] = (balances[id] ?? 0) - (shares[id] ?? 0);
    }
    if (memberIds.includes(expense.paidBy)) {
      balances[expense.paidBy] =
        (balances[expense.paidBy] ?? 0) + expense.amountCents;
    }
  }

  return balances;
}

export type DebtEdge = {
  from: string;
  to: string;
  amountCents: number;
};

/** Greedy settlement suggestions. */
export function suggestSettlements(
  balances: Record<string, number>,
): DebtEdge[] {
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -1)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 1)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const edges: DebtEdge[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0) {
      edges.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amountCents: pay,
      });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount <= 1) i += 1;
    if (creditors[j].amount <= 1) j += 1;
  }
  return edges;
}
