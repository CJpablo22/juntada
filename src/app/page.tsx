"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, BookmarkPlus, LockKeyhole, MapPinned } from "lucide-react";
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
      <section className="hero-atmosphere relative min-h-[100svh] overflow-hidden">
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col px-4 pb-10 pt-6">
          <header className="flex items-center justify-between border-b border-white/20 pb-4">
            <Logo invert />
            <div className="flex items-center gap-4 text-sm">
              <Link href="/discover" className="text-white/80 hover:text-white">
                Descubrir
              </Link>
              <Link href="/enter" className="text-white/90 hover:text-white">
                Entrar
              </Link>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center py-16 md:max-w-2xl md:py-20">
            <Reveal>
              <p className="region-chip mb-5 border-white/30 bg-white/15 text-white">
                Tradición local · planes en grupo
              </p>
            </Reveal>
            <Reveal delayMs={60}>
              <p className="type-display text-5xl font-semibold leading-[1.05] text-white sm:text-6xl md:text-7xl">
                Juntada
              </p>
            </Reveal>
            <Reveal delayMs={120}>
              <h1 className="mt-5 max-w-xl text-xl font-medium leading-snug text-white/92 sm:text-2xl">
                El catálogo de lo que quieren ver y hacer — con el carácter de
                tu ciudad.
              </h1>
            </Reveal>
            <Reveal delayMs={180}>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75">
                Guardá series y sitios para no olvidar. Cuando toque, pasalos a
                Pronto, votá en secreto o dejá que el azar decida. La apariencia
                cambia si estás en Sevilla, Madrid, Barcelona…
              </p>
            </Reveal>
            <Reveal delayMs={240}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 bg-[var(--brand-pop)] px-5 text-base text-white hover:bg-[var(--brand-pop)]/90"
                  onClick={() => router.push("/enter")}
                >
                  Empezar
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => router.push("/discover")}
                >
                  Ver Descubrir
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delayMs={300}>
            <ul className="grid gap-3 border-t border-white/20 pt-6 sm:grid-cols-3">
              {[
                {
                  icon: BookmarkPlus,
                  title: "Catálogo vivo",
                  text: "Guardá para más adelante, no solo para este finde.",
                },
                {
                  icon: LockKeyhole,
                  title: "Dirección privada",
                  text: "Vos elegís qué ven del grupo: nada, barrio o exacta.",
                },
                {
                  icon: MapPinned,
                  title: "Look local",
                  text: "Tipografía, color y fondo según tu provincia.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="border border-white/20 bg-white/8 px-4 py-3"
                  style={{ borderRadius: "var(--panel-radius)" }}
                >
                  <item.icon className="mb-2 size-4 text-[var(--brand-sun)]" />
                  <p className="type-display text-lg font-semibold text-white">
                    {item.title}
                  </p>
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
