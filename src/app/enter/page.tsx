"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Apple, Mail, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
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
    <main className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col px-4 py-6 sm:px-5 sm:py-8">
      <Link href="/" className="w-fit">
        <Logo />
      </Link>

      <div className="mt-8 sm:mt-10">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          Entrá a tu Juntada
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--mute)] sm:text-base">
          Correo, teléfono o Apple. En local es demo del navegador.
        </p>
      </div>

      <div className="mt-8">
        <div className="flex gap-1 border-b border-[var(--line)]">
          {(
            [
              { id: "email", label: "Correo", icon: Mail },
              { id: "phone", label: "Teléfono", icon: Phone },
              { id: "apple", label: "Apple", icon: Apple },
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
                "inline-flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold",
                tab === item.id
                  ? "border-b-2 border-[var(--ink)] text-[var(--ink)]"
                  : "text-[var(--mute)]",
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="surface-panel mt-4 space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre (opcional la primera vez)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cómo te dicen"
              className="field-input"
            />
          </div>

          {tab === "email" ? (
            <form onSubmit={onEmail} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@email.com"
                  className="field-input"
                  autoComplete="email"
                />
              </div>
              {error ? (
                <p className="text-sm text-[var(--pop)]">{error}</p>
              ) : null}
              <Button
                type="submit"
                className="h-10 w-full bg-[var(--ink)] text-white hover:bg-[var(--ink)]/90"
              >
                Continuar con correo
              </Button>
            </form>
          ) : null}

          {tab === "phone" ? (
            <form onSubmit={onPhone} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Número</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="field-input"
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-[var(--mute)]">
                Demo local: no mandamos SMS. El número queda en tu navegador.
              </p>
              {error ? (
                <p className="text-sm text-[var(--pop)]">{error}</p>
              ) : null}
              <Button
                type="submit"
                className="h-10 w-full bg-[var(--ink)] text-white hover:bg-[var(--ink)]/90"
              >
                Continuar con teléfono
              </Button>
            </form>
          ) : null}

          {tab === "apple" ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--mute)]">
                En local simulamos la sesión; en producción irá Sign in with
                Apple.
              </p>
              <Button
                type="button"
                onClick={onApple}
                className="h-10 w-full bg-black text-white hover:bg-black/90"
              >
                <Apple className="size-4" />
                Continuar con Apple
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-sm font-semibold text-[var(--ink)]">O probar el demo</p>
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {state.users
            .filter((u) => u.authProvider !== "apple" || u.email?.includes("demo"))
            .map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  signInAs(user.id);
                  goApp();
                }}
                className="flex w-full items-center justify-between py-3 text-left hover:bg-white/50"
              >
                <span className="flex items-center gap-3">
                  <UserAvatar user={user} />
                  <span>
                    <span className="block font-medium text-[var(--ink)]">
                      {user.name}
                    </span>
                    <span className="block text-xs text-[var(--mute)]">
                      {user.city}, {user.province} · {user.country}
                    </span>
                  </span>
                </span>
                <span className="text-sm font-semibold text-[var(--pop)]">
                  Entrar
                </span>
              </button>
            ))}
        </div>
      </div>
    </main>
  );
}
