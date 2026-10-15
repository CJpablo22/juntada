import type { Expense, Idea } from "@/lib/types";

/** El usuario es el festejado de este cumpleaños (miembro del grupo). */
export function isBirthdayCelebrant(
  idea: Pick<Idea, "type" | "celebrantMemberId"> | undefined | null,
  userId: string | undefined | null,
): boolean {
  if (!idea || !userId) return false;
  return (
    idea.type === "birthday" &&
    Boolean(idea.celebrantMemberId) &&
    idea.celebrantMemberId === userId
  );
}

/** Gasto ligado a un cumple propio: el festejado no debe verlo. */
export function isExpenseHiddenFromCelebrant(
  expense: Pick<Expense, "ideaId">,
  ideas: Idea[],
  userId: string | undefined | null,
): boolean {
  if (!expense.ideaId || !userId) return false;
  const idea = ideas.find((i) => i.id === expense.ideaId);
  return isBirthdayCelebrant(idea, userId);
}

export function expensesVisibleToUser(
  expenses: Expense[],
  ideas: Idea[],
  userId: string | undefined | null,
): Expense[] {
  return expenses.filter(
    (e) => !isExpenseHiddenFromCelebrant(e, ideas, userId),
  );
}

/** Ideas a las que este usuario no puede vincular / ver gastos (su propio cumple). */
export function isIdeaExpenseHiddenFromUser(
  idea: Idea,
  userId: string | undefined | null,
): boolean {
  return isBirthdayCelebrant(idea, userId);
}
