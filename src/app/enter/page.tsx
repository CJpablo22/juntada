"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-chip";

export default function EnterPage() {
  const { ready, state, signInAs, createUser, currentUser } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("Madrid");
  const [neighborhood, setNeighborhood] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && currentUser) router.replace("/app");
  }, [ready, currentUser, router]);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      setError("Poné al menos tu nombre y ciudad.");
      return;
    }
    createUser({ name, city, neighborhood });
    router.push("/app");
  }

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col px-4 py-8">
      <LinkHome />
      <Reveal className="mt-10">
        <h1 className="type-display text-3xl font-bold text-[var(--brand-ink)]">
          Entrá a tu Juntada
        </h1>
        <p className="mt-2 text-[var(--brand-mute)]">
          Por ahora es local en este navegador. Más adelante, cuentas reales para
          el mundo.
        </p>
      </Reveal>

      <Reveal delayMs={80} className="mt-8 space-y-3">
        <p className="text-sm font-semibold text-[var(--brand-ink)]">
          Probar con alguien del demo
        </p>
        <div className="grid gap-2">
          {state.users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                signInAs(user.id);
                router.push("/app");
              }}
              className="surface-panel flex items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex items-center gap-3">
                <UserAvatar user={user} />
                <span>
                  <span className="block font-medium text-[var(--brand-ink)]">
                    {user.name}
                  </span>
                  <span className="block text-xs text-[var(--brand-mute)]">
                    {user.neighborhood
                      ? `${user.neighborhood}, ${user.city}`
                      : user.city}
                  </span>
                </span>
              </span>
              <span className="text-sm text-[var(--brand-pop)]">Entrar</span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delayMs={140} className="mt-10">
        <form
          onSubmit={onCreate}
          className="surface-panel space-y-4 rounded-3xl p-5"
        >
          <p className="type-display text-xl font-semibold text-[var(--brand-ink)]">
            O creá tu usuario
          </p>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Valentina"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Madrid"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Barrio (opcional)</Label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Malasaña"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          {error ? (
            <p className="text-sm text-[var(--brand-pop)]">{error}</p>
          ) : null}
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-[var(--brand-ink)]"
          >
            Crear y entrar
          </Button>
        </form>
      </Reveal>
    </main>
  );
}

function LinkHome() {
  return (
    <Link href="/" className="w-fit">
      <Logo />
    </Link>
  );
}
