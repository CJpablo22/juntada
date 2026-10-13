"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Apple, Mail, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-chip";
import { cn } from "@/lib/utils";

type AuthTab = "email" | "phone" | "apple";

export default function EnterPage() {
  const {
    ready,
    state,
    signInAs,
    signInWithEmail,
    signInWithPhone,
    signInWithApple,
    currentUser,
  } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+34 ");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && currentUser) router.replace("/app");
  }, [ready, currentUser, router]);

  function goApp() {
    router.push("/app");
  }

  function onEmail(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Poné un correo válido.");
      return;
    }
    signInWithEmail({ email, name: name || undefined });
    goApp();
  }

  function onPhone(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      setError("Poné un número con prefijo, ej. +34 600 000 000.");
      return;
    }
    signInWithPhone({ phone, name: name || undefined });
    goApp();
  }

  function onApple() {
    signInWithApple({ name: name || undefined });
    goApp();
  }

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col px-4 py-8">
      <Link href="/" className="w-fit">
        <Logo />
      </Link>

      <Reveal className="mt-10">
        <h1 className="type-display text-3xl font-bold text-[var(--brand-ink)]">
          Entrá a tu Juntada
        </h1>
        <p className="mt-2 text-[var(--brand-mute)]">
          Correo, teléfono o iCloud/Apple. En local es demo del navegador; el
          login real llega con el backend.
        </p>
      </Reveal>

      <Reveal delayMs={70} className="mt-8">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/60 p-1">
          {(
            [
              { id: "email", label: "Correo", icon: Mail },
              { id: "phone", label: "Teléfono", icon: Phone },
              { id: "apple", label: "iCloud", icon: Apple },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setError("");
              }}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm",
                tab === item.id
                  ? "bg-[var(--brand-ink)] text-white"
                  : "text-[var(--brand-mute)] hover:text-[var(--brand-ink)]",
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="surface-panel mt-4 space-y-4 rounded-3xl p-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre (opcional la primera vez)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cómo te dicen"
              className="h-11 rounded-xl"
            />
          </div>

          {tab === "email" ? (
            <form onSubmit={onEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@email.com"
                  className="h-11 rounded-xl"
                  autoComplete="email"
                />
              </div>
              {error ? (
                <p className="text-sm text-[var(--brand-pop)]">{error}</p>
              ) : null}
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[var(--brand-ink)]"
              >
                Continuar con correo
              </Button>
            </form>
          ) : null}

          {tab === "phone" ? (
            <form onSubmit={onPhone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="h-11 rounded-xl"
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-[var(--brand-mute)]">
                Demo local: no mandamos SMS todavía. El número queda en tu
                navegador.
              </p>
              {error ? (
                <p className="text-sm text-[var(--brand-pop)]">{error}</p>
              ) : null}
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[var(--brand-ink)]"
              >
                Continuar con teléfono
              </Button>
            </form>
          ) : null}

          {tab === "apple" ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--brand-mute)]">
                Preparado para Sign in with Apple / iCloud. En local simulamos la
                sesión; en producción irá el flujo oficial de Apple.
              </p>
              <Button
                type="button"
                onClick={onApple}
                className="h-11 w-full rounded-xl bg-black text-white hover:bg-black/90"
              >
                <Apple className="size-4" />
                Continuar con Apple
              </Button>
            </div>
          ) : null}
        </div>
      </Reveal>

      <Reveal delayMs={120} className="mt-8 space-y-3">
        <p className="text-sm font-semibold text-[var(--brand-ink)]">
          O probar el demo
        </p>
        <div className="grid gap-2">
          {state.users
            .filter((u) => u.authProvider !== "apple" || u.email?.includes("demo"))
            .slice(0, 3)
            .map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  signInAs(user.id);
                  goApp();
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
                      {user.email ?? user.phone ?? user.city}
                    </span>
                  </span>
                </span>
                <span className="text-sm text-[var(--brand-pop)]">Entrar</span>
              </button>
            ))}
        </div>
      </Reveal>
    </main>
  );
}
