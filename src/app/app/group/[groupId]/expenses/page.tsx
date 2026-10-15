"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-chip";
import { computeBalances, suggestSettlements } from "@/lib/balances";
import { formatEuro, parseEuroToCents } from "@/lib/money";

export default function ExpensesPage() {
  const params = useParams<{ groupId: string }>();
  const { ready, state, currentUser, addExpense } = useApp();
  const group = state.groups.find((g) => g.id === params.groupId);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [split, setSplit] = useState<string[]>([]);
  const [ideaId, setIdeaId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser || !group) return;
    setPaidBy((prev) => prev || currentUser.id);
    setSplit((prev) => (prev.length ? prev : group.memberIds));
  }, [currentUser, group]);

  const expenses = useMemo(
    () =>
      group
        ? state.expenses.filter((e) => e.groupId === group.id)
        : [],
    [state.expenses, group],
  );

  const linkableIdeas = useMemo(
    () =>
      group
        ? state.ideas.filter(
            (i) =>
              i.groupId === group.id &&
              (i.status === "chosen" ||
                i.status === "in_progress" ||
                i.status === "done" ||
                i.timing === "soon"),
          )
        : [],
    [state.ideas, group],
  );

  const balances = useMemo(
    () => (group ? computeBalances(expenses, group.memberIds) : {}),
    [expenses, group],
  );
  const settlements = useMemo(
    () => suggestSettlements(balances),
    [balances],
  );

  if (!ready || !currentUser) {
    return (
      <div className="surface-panel rounded-3xl p-6 text-[var(--brand-mute)]">
        Cargando gastos…
      </div>
    );
  }

  if (!group) {
    return (
      <div className="surface-panel rounded-3xl p-6">
        Grupo no encontrado.{" "}
        <Link href="/app" className="text-[var(--brand-pop)] underline">
          Volver
        </Link>
      </div>
    );
  }

  function toggleSplit(userId: string) {
    setSplit((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const cents = parseEuroToCents(amount);
    if (!title.trim() || cents == null || cents <= 0) {
      setError("Revisá título e importe en euros.");
      return;
    }
    if (!paidBy || split.length === 0) {
      setError("Elegí quién pagó y entre quiénes se parte.");
      return;
    }
    addExpense({
      groupId: group!.id,
      ideaId: ideaId || undefined,
      title,
      amountCents: cents,
      paidBy,
      splitBetween: split,
    });
    setTitle("");
    setAmount("");
    setIdeaId("");
    setError("");
  }

  return (
    <main className="space-y-8">
      <Reveal>
        <Link
          href={`/app/group/${group.id}`}
          className="text-sm text-[var(--brand-mute)] hover:text-[var(--brand-ink)]"
        >
          ← {group.name}
        </Link>
        <h1 className="type-display mt-2 text-3xl font-bold text-[var(--brand-ink)]">
          Gastos del grupo
        </h1>
        <p className="mt-2 text-[var(--brand-mute)]">
          Solo euros por ahora (España). Gastos de un plan o sueltos.
        </p>
      </Reveal>

      <Reveal delayMs={70} className="grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={onSubmit}
          className="surface-panel space-y-4 rounded-3xl p-5"
        >
          <p className="type-display text-xl font-semibold">Nuevo gasto</p>
          <div className="space-y-2">
            <Label htmlFor="title">Concepto</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cena, Uber, entradas…"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Importe (EUR)</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="24,50"
              className="h-11 rounded-xl"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ideaId">Plan (opcional)</Label>
            <select
              id="ideaId"
              value={ideaId}
              onChange={(e) => setIdeaId(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--brand-line)] bg-white px-3 text-sm"
            >
              <option value="">Gasto suelto</option>
              {linkableIdeas.map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {idea.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paidBy">Pagó</Label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--brand-line)] bg-white px-3 text-sm"
            >
              {group.memberIds.map((id) => {
                const user = state.users.find((u) => u.id === id);
                return (
                  <option key={id} value={id}>
                    {user?.name ?? id}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Se parte entre</Label>
            <div className="flex flex-wrap gap-2">
              {group.memberIds.map((id) => {
                const user = state.users.find((u) => u.id === id);
                if (!user) return null;
                const active = split.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSplit(id)}
                    className={
                      active
                        ? "inline-flex items-center gap-2 rounded-full bg-[var(--brand-ink)] px-3 py-1.5 text-xs text-white"
                        : "inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-[var(--brand-mute)] ring-1 ring-[var(--brand-line)]"
                    }
                  >
                    <UserAvatar user={user} size="sm" className="size-5 text-[10px]" />
                    {user.name}
                  </button>
                );
              })}
            </div>
          </div>
          {error ? (
            <p className="text-sm text-[var(--brand-pop)]">{error}</p>
          ) : null}
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-[var(--brand-pop)] text-white"
          >
            Guardar gasto
          </Button>
        </form>

        <div className="space-y-4">
          <div className="surface-panel rounded-3xl p-5">
            <p className="type-display text-xl font-semibold">Saldos</p>
            <ul className="mt-4 space-y-3">
              {group.memberIds.map((id) => {
                const user = state.users.find((u) => u.id === id);
                if (!user) return null;
                const bal = balances[id] ?? 0;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <UserAvatar user={user} size="sm" />
                      {user.name}
                    </span>
                    <span
                      className={
                        bal >= 0
                          ? "font-semibold text-[var(--brand-ink)]"
                          : "font-semibold text-[var(--brand-pop)]"
                      }
                    >
                      {bal >= 0 ? "+" : ""}
                      {formatEuro(bal)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="surface-panel rounded-3xl p-5">
            <p className="type-display text-xl font-semibold">Para quedar a mano</p>
            {settlements.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--brand-mute)]">
                Nadie se debe nada. Impecable.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {settlements.map((edge) => {
                  const from = state.users.find((u) => u.id === edge.from)?.name;
                  const to = state.users.find((u) => u.id === edge.to)?.name;
                  return (
                    <li
                      key={`${edge.from}-${edge.to}`}
                      className="rounded-2xl bg-white/70 px-3 py-2 text-sm"
                    >
                      <strong>{from}</strong> le debe a <strong>{to}</strong>{" "}
                      {formatEuro(edge.amountCents)}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Reveal>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand-mute)]">
          Historial
        </h2>
        {expenses.length === 0 ? (
          <div className="surface-panel rounded-3xl p-5 text-[var(--brand-mute)]">
            Todavía no hay gastos.
          </div>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense) => {
              const payer = state.users.find((u) => u.id === expense.paidBy);
              const linked = expense.ideaId
                ? state.ideas.find((i) => i.id === expense.ideaId)
                : undefined;
              return (
                <li
                  key={expense.id}
                  className="surface-panel flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-[var(--brand-ink)]">
                      {expense.title}
                    </p>
                    <p className="text-xs text-[var(--brand-mute)]">
                      Pagó {payer?.name ?? "—"} ·{" "}
                      {expense.splitBetween.length} personas
                      {linked ? ` · ${linked.title}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold">{formatEuro(expense.amountCents)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
