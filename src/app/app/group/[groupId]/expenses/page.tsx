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
import {
  buildEqualShares,
  computeBalances,
  expenseShares,
  normalizeShares,
  suggestSettlements,
} from "@/lib/balances";
import {
  expensesVisibleToUser,
  isBirthdayCelebrant,
  isIdeaExpenseHiddenFromUser,
} from "@/lib/birthday-privacy";
import { formatEuro, parseEuroToCents } from "@/lib/money";
import type { ExpenseSplitMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ExpensesPage() {
  const params = useParams<{ groupId: string }>();
  const { ready, state, currentUser, addExpense } = useApp();
  const group = state.groups.find((g) => g.id === params.groupId);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [split, setSplit] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>("equal");
  const [customDraft, setCustomDraft] = useState<Record<string, string>>({});
  const [ideaId, setIdeaId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser || !group) return;
    setPaidBy((prev) => prev || currentUser.id);
    setSplit((prev) => (prev.length ? prev : group.memberIds));
  }, [currentUser, group]);

  const expenses = useMemo(() => {
    if (!group || !currentUser) return [];
    return expensesVisibleToUser(
      state.expenses.filter((e) => e.groupId === group.id),
      state.ideas,
      currentUser.id,
    );
  }, [state.expenses, state.ideas, group, currentUser]);

  const linkableIdeas = useMemo(() => {
    if (!group || !currentUser) return [];
    return state.ideas.filter(
      (i) =>
        i.groupId === group.id &&
        !isIdeaExpenseHiddenFromUser(i, currentUser.id) &&
        (i.status === "chosen" ||
          i.status === "in_progress" ||
          i.status === "done" ||
          i.timing === "soon"),
    );
  }, [state.ideas, group, currentUser]);

  const selectedIdea = useMemo(
    () => (ideaId ? state.ideas.find((i) => i.id === ideaId) : undefined),
    [ideaId, state.ideas],
  );

  const celebrantIdForSelected =
    selectedIdea?.type === "birthday"
      ? selectedIdea.celebrantMemberId
      : undefined;

  useEffect(() => {
    if (!celebrantIdForSelected) return;
    setSplit((prev) => prev.filter((id) => id !== celebrantIdForSelected));
  }, [celebrantIdForSelected]);

  const amountCents = parseEuroToCents(amount) ?? 0;

  const previewShares = useMemo(() => {
    if (amountCents <= 0) return {};
    if (splitMode === "custom") {
      const draft: Record<string, number> = {};
      for (const id of split) {
        const cents = parseEuroToCents(customDraft[id] ?? "");
        if (cents != null && cents > 0) draft[id] = cents;
      }
      return normalizeShares(amountCents, draft);
    }
    return buildEqualShares(amountCents, split);
  }, [amountCents, splitMode, split, customDraft]);

  const previewSum = Object.values(previewShares).reduce((s, n) => s + n, 0);

  const balances = useMemo(
    () => (group ? computeBalances(expenses, group.memberIds) : {}),
    [expenses, group],
  );
  const settlements = useMemo(
    () => suggestSettlements(balances),
    [balances],
  );

  const hiddenBirthdayPlans = useMemo(() => {
    if (!group || !currentUser) return [];
    return state.ideas.filter(
      (i) =>
        i.groupId === group.id && isBirthdayCelebrant(i, currentUser.id),
    );
  }, [state.ideas, group, currentUser]);

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
    if (celebrantIdForSelected && userId === celebrantIdForSelected) return;
    setSplit((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const cents = parseEuroToCents(amount);
    if (!title.trim() || cents == null || cents <= 0) {
      setError("Revisá título e importe en euros.");
      return;
    }
    if (!paidBy) {
      setError("Elegí quién pagó.");
      return;
    }
    if (
      selectedIdea &&
      currentUser &&
      isBirthdayCelebrant(selectedIdea, currentUser.id)
    ) {
      setError("No podés cargar gastos de tu propio cumpleaños.");
      return;
    }

    let splitBetween = celebrantIdForSelected
      ? split.filter((id) => id !== celebrantIdForSelected)
      : [...split];
    let splitShares: Record<string, number> | undefined;

    if (splitMode === "custom") {
      const draft: Record<string, number> = {};
      for (const id of splitBetween) {
        const part = parseEuroToCents(customDraft[id] ?? "");
        if (part != null && part > 0) draft[id] = part;
      }
      if (Object.keys(draft).length === 0) {
        setError("Poné cuánto le toca a cada uno.");
        return;
      }
      const sum = Object.values(draft).reduce((s, n) => s + n, 0);
      if (Math.abs(sum - cents) > 1) {
        setError(
          `Los importes suman ${formatEuro(sum)} y el gasto es ${formatEuro(cents)}. Ajustalos.`,
        );
        return;
      }
      splitShares = normalizeShares(cents, draft);
      splitBetween = Object.keys(splitShares);
    } else {
      if (splitBetween.length === 0) {
        setError("Elegí entre quiénes se parte.");
        return;
      }
      splitShares = buildEqualShares(cents, splitBetween);
    }

    const result = await addExpense({
      groupId: group!.id,
      ideaId: ideaId || undefined,
      title,
      amountCents: cents,
      paidBy,
      splitBetween,
      splitShares,
    });
    if (!result.synced) {
      setError(result.error ?? "No se pudo guardar el gasto en la nube.");
      return;
    }
    setTitle("");
    setAmount("");
    setIdeaId("");
    setCustomDraft({});
    setSplitMode("equal");
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
          Solo euros por ahora (España). Partí por igual o con importes a mano.
        </p>
        {hiddenBirthdayPlans.length > 0 ? (
          <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--mute)]">
            Hay un cumpleaños tuyo en el grupo:{" "}
            <strong className="text-[var(--ink)]">
              no ves cuánto gastaron
            </strong>{" "}
            en ese plan (sorpresa).
          </p>
        ) : null}
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
                  {idea.type === "birthday" ? " (cumple)" : ""}
                </option>
              ))}
            </select>
            {celebrantIdForSelected ? (
              <p className="text-xs text-[var(--mute)]">
                Cumpleaños: el festejado no ve estos gastos y no entra en el
                reparto.
              </p>
            ) : null}
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
            <Label>Cómo se parte</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["equal", "Por igual"],
                  ["custom", "A mano"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSplitMode(mode)}
                  className={cn(
                    "min-h-11 border px-2 py-2 text-xs font-semibold sm:text-sm",
                    splitMode === mode
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--mute)]">
              {splitMode === "equal"
                ? "Mismo importe para cada persona marcada (si son 2, queda a medias)."
                : "Poné el importe de cada uno (tienen que sumar el total)."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Se parte entre</Label>
            <div className="flex flex-wrap gap-2">
              {group.memberIds.map((id) => {
                const user = state.users.find((u) => u.id === id);
                if (!user) return null;
                const isCelebrant = celebrantIdForSelected === id;
                const active = !isCelebrant && split.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={isCelebrant}
                    onClick={() => toggleSplit(id)}
                    title={
                      isCelebrant
                        ? "El festejado no entra en el reparto"
                        : undefined
                    }
                    className={
                      isCelebrant
                        ? "inline-flex items-center gap-2 rounded-full bg-[var(--wash)] px-3 py-1.5 text-xs text-[var(--mute)] opacity-60 ring-1 ring-[var(--line)]"
                        : active
                          ? "inline-flex items-center gap-2 rounded-full bg-[var(--brand-ink)] px-3 py-1.5 text-xs text-white"
                          : "inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-[var(--brand-mute)] ring-1 ring-[var(--brand-line)]"
                    }
                  >
                    <UserAvatar user={user} size="sm" className="size-5 text-[10px]" />
                    {user.name}
                    {isCelebrant ? " · festejado" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {splitMode === "custom" && split.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--wash)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
                Importe por persona
              </p>
              <ul className="space-y-2">
                {split.map((id) => {
                  const user = state.users.find((u) => u.id === id);
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-[var(--ink)]">
                        {user?.name ?? id}
                      </span>
                      <Input
                        value={customDraft[id] ?? ""}
                        onChange={(e) =>
                          setCustomDraft((prev) => ({
                            ...prev,
                            [id]: e.target.value,
                          }))
                        }
                        placeholder="0,00"
                        inputMode="decimal"
                        className="h-9 w-28 rounded-lg text-right"
                        aria-label={`Importe de ${user?.name ?? id}`}
                      />
                    </li>
                  );
                })}
              </ul>
              {amountCents > 0 ? (
                <p
                  className={cn(
                    "text-xs",
                    Math.abs(previewSum - amountCents) <= 1
                      ? "text-[var(--mute)]"
                      : "text-[var(--pop)]",
                  )}
                >
                  Suma: {formatEuro(previewSum)} / total{" "}
                  {formatEuro(amountCents)}
                </p>
              ) : null}
            </div>
          ) : null}

          {amountCents > 0 && Object.keys(previewShares).length > 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--mute)]">
              <p className="font-semibold text-[var(--ink)]">Vista previa</p>
              <ul className="mt-1 space-y-0.5">
                {Object.entries(previewShares).map(([id, cents]) => (
                  <li key={id} className="flex justify-between gap-2">
                    <span>
                      {state.users.find((u) => u.id === id)?.name ?? id}
                    </span>
                    <span>{formatEuro(cents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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
              const shares = expenseShares(expense);
              const shareLabel = Object.entries(shares)
                .map(([id, cents]) => {
                  const name =
                    state.users.find((u) => u.id === id)?.name ?? id;
                  return `${name} ${formatEuro(cents)}`;
                })
                .join(" · ");
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
                      Pagó {payer?.name ?? "—"}
                      {linked ? ` · ${linked.title}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--mute)]">
                      {shareLabel}
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
