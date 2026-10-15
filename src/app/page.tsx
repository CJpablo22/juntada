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
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
        <Logo />
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link
            href="/discover"
            className="text-[var(--mute)] hover:text-[var(--ink)]"
          >
            Descubrir
          </Link>
          <Link
            href="/enter"
            className="border-b-2 border-[var(--pop)] font-semibold text-[var(--ink)]"
          >
            Entrar / Registro
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-5 sm:pb-20 sm:pt-16">
        <p className="text-sm text-[var(--mute)] sm:text-[15px]">Juntada</p>
        <h1 className="mt-3 max-w-xl text-[2rem] font-bold leading-[1.12] tracking-tight text-[var(--ink)] sm:text-5xl">
          Los planes del grupo, sin el hilo eterno de WhatsApp.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[var(--mute)] sm:mt-5 sm:text-[17px]">
          Guardás pelis, sitios y salidas. Cuando toque, votan en secreto o
          tiran el azar. Cada grupo ve de tu ubicación solo lo que vos marques.
        </p>
        <div className="btn-stack mt-7 sm:mt-8">
          <Button size="lg" onClick={() => router.push("/enter")}>
            Empezar
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/discover")}
          >
            Ver Descubrir
          </Button>
        </div>

        <div className="mt-12 grid gap-6 border-t border-[var(--line)] pt-8 sm:mt-16 sm:grid-cols-3 sm:gap-8 sm:pt-10">
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
