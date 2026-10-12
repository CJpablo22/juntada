import type { Expense } from "@/lib/types";

/** Simplified pairwise balances: positive = others owe this user. */
export function computeBalances(
  expenses: Expense[],
  memberIds: string[],
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const id of memberIds) balances[id] = 0;

  for (const expense of expenses) {
    const split = expense.splitBetween.filter((id) => memberIds.includes(id));
    if (split.length === 0) continue;
    const share = Math.round(expense.amountCents / split.length);
    for (const id of split) {
      balances[id] = (balances[id] ?? 0) - share;
    }
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amountCents;
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
