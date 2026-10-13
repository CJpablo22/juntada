"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Dices, LockKeyhole, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { ready, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && currentUser) router.replace("/app");
  }, [ready, currentUser, router]);

  return (
    <main className="flex flex-1 flex-col">
      <section className="hero-atmosphere relative min-h-[100svh] overflow-hidden text-[var(--brand-foam)]">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-24 top-24 size-72 rounded-full bg-[var(--brand-sun)] blur-3xl" />
          <div className="absolute -right-16 bottom-10 size-80 rounded-full bg-[var(--brand-pop)] blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-5xl flex-col px-4 pb-10 pt-6">
          <header className="flex items-center justify-between">
            <Logo className="[&_span:last-child]:text-[var(--brand-foam)] [&_span:first-child]:bg-white/15 [&_span:first-child]:text-[var(--brand-foam)]" />
            <Link
              href="/enter"
              className="text-sm font-medium text-white/85 transition hover:text-white"
            >
              Entrar
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center py-16 md:py-20">
            <Reveal>
              <p className="type-display mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
                Juntada
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <h1 className="max-w-xl text-2xl font-semibold leading-snug text-white/95 sm:text-3xl">
                Decidí planes con tu gente sin 40 mensajes de ida y vuelta.
              </h1>
            </Reveal>
            <Reveal delayMs={140}>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
                Guardá un catálogo para no olvidar. Cuando quieran, pasalo a
                Pronto, votá en secreto o que decida el azar. Después, cuentas
                claras en euros.
              </p>
            </Reveal>
            <Reveal delayMs={200}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="h-12 rounded-2xl bg-[var(--brand-pop)] px-5 text-base text-white hover:bg-[var(--brand-pop)]/90"
                  onClick={() => router.push("/enter")}
                >
                  Empezar ahora
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-2xl text-white hover:bg-white/10 hover:text-white"
                  onClick={() => router.push("/discover")}
                >
                  Ver Descubrir
                </Button>
              </div>
              <p className="mt-3 text-sm text-white/65">
                Demo local · España · EUR · correo / teléfono / Apple
              </p>
            </Reveal>
          </div>

          <Reveal delayMs={260}>
            <ul className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: LockKeyhole,
                  title: "Voto secreto",
                  text: "Nadie se copia. Se revela cuando toca.",
                },
                {
                  icon: Dices,
                  title: "Azar con criterio",
                  text: "Sortea entre los finalistas, no a ciegas.",
                },
                {
                  icon: Wallet,
                  title: "Cuentas claras",
                  text: "Quién pagó, quién debe, sin Excel.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 backdrop-blur-sm"
                >
                  <item.icon className="mb-2 size-4 text-[var(--brand-sun)]" />
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/70">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
