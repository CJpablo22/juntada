"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { ready, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && currentUser) router.replace("/app");
  }, [ready, currentUser, router]);

  return (
    <main className="min-h-[100svh]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Logo />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/discover" className="text-[var(--mute)] hover:text-[var(--ink)]">
            Descubrir
          </Link>
          <Link href="/enter" className="font-semibold underline decoration-[var(--pop)] underline-offset-4">
            Entrar
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:pt-20">
        <p className="text-[15px] text-[var(--mute)]">Juntada</p>
        <h1 className="mt-3 max-w-xl text-[2.4rem] font-bold leading-[1.12] tracking-tight text-[var(--ink)] sm:text-5xl">
          Los planes del grupo, sin el hilo eterno de WhatsApp.
        </h1>
        <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[var(--mute)]">
          Guardás pelis, sitios y salidas. Cuando toque, votan en secreto o
          tiran el azar. Cada grupo ve de tu ubicación solo lo que vos marques.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            className="h-11 bg-[var(--ink)] px-5 text-white hover:bg-[var(--ink)]/90"
            onClick={() => router.push("/enter")}
          >
            Empezar
          </Button>
          <Button
            variant="outline"
            className="h-11 border-[var(--line)] bg-white"
            onClick={() => router.push("/discover")}
          >
            Ver Descubrir
          </Button>
        </div>

        <div className="mt-16 grid gap-8 border-t border-[var(--line)] pt-10 sm:grid-cols-3">
          <div>
            <p className="font-semibold">Catálogo y Pronto</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--mute)]">
              Una lista para no olvidar. Otra para decidir este finde.
            </p>
          </div>
          <div>
            <p className="font-semibold">Ubicación por grupo</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--mute)]">
              Dirección completa, barrio, provincia o solo país — a tu gusto.
            </p>
          </div>
          <div>
            <p className="font-semibold">Amigos de verdad</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--mute)]">
              Solo gente con la que ya hicieron algo juntos.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
