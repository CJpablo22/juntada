"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/landing/reveal";
import { useApp } from "@/components/providers/app-provider";

export default function LandingPage() {
  const { ready, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && currentUser) router.replace("/app");
  }, [ready, currentUser, router]);

  return (
    <main className="landing-mesa">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo className="sr-only" />
        <span className="text-sm font-semibold tracking-tight text-[var(--mesa-ink)]">
          Juntada
        </span>
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Principal">
          <Link href="/discover" className="mesa-nav-link">
            Descubrir
          </Link>
          <Link href="/enter" className="mesa-nav-link mesa-nav-link--strong">
            Entrar
          </Link>
        </nav>
      </header>

      <section className="mesa-hero mx-auto w-full max-w-5xl" aria-labelledby="mesa-brand">
        <p id="mesa-brand" className="mesa-brand">
          Juntada
        </p>

        <div className="mesa-band">
          <h1>Los planes del grupo, sin el hilo eterno de WhatsApp.</h1>
          <p>
            Guardás pelis, sitios y salidas. Cuando toque, votan en secreto o
            tiran el azar.
          </p>
        </div>

        <div>
          <ul className="mesa-chips" aria-label="Qué podés hacer">
            <li className="mesa-chip">Catálogo</li>
            <li className="mesa-chip">Pronto</li>
            <li className="mesa-chip">Voto secreto</li>
          </ul>

          <div className="mesa-cta-row">
            <button
              type="button"
              className="mesa-btn-primary"
              onClick={() => router.push("/enter")}
            >
              Empezar
            </button>
          </div>
        </div>
      </section>

      <section className="mesa-section mx-auto w-full max-w-5xl" aria-labelledby="sec-catalogo">
        <Reveal>
          <div className="mesa-split">
            <div className="mesa-split-copy">
              <p className="mesa-kicker">Catálogo y Pronto</p>
              <h2 id="sec-catalogo">Una lista para no olvidar. Otra para este finde.</h2>
              <p className="mesa-lead">
                Separá lo que querés hacer algún día de lo que hay que decidir ya.
                Sin mezclar propuestas viejas con el plan de hoy.
              </p>
            </div>
            <div className="mesa-split-visual mesa-visual-block" aria-hidden="true">
              <strong>Catálogo → Pronto</strong>
              <span>Pasás una idea cuando el grupo está listo para votar.</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section
        className="mesa-section mesa-section--accent"
        aria-labelledby="sec-ubicacion"
      >
        <Reveal>
          <div className="mesa-split mesa-split--flip mx-auto w-full max-w-5xl">
            <div className="mesa-split-copy">
              <p className="mesa-kicker" style={{ color: "var(--mesa-foam)" }}>
                Ubicación por grupo
              </p>
              <h2 id="sec-ubicacion">Cada grupo ve solo lo que vos marques.</h2>
              <p className="mesa-lead">
                Dirección completa, barrio, provincia o solo país. Vos elegís el
                detalle en cada círculo.
              </p>
            </div>
            <div className="mesa-split-visual mesa-visual-block" aria-hidden="true">
              <strong>País · Provincia · Barrio · Calle</strong>
              <span>Un control por grupo. Nada se filtra al resto.</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mesa-section mx-auto w-full max-w-5xl" aria-labelledby="sec-amigos">
        <Reveal>
          <div className="mesa-split">
            <div className="mesa-split-copy">
              <p className="mesa-kicker">Amigos de verdad</p>
              <h2 id="sec-amigos">Solo gente con la que ya hicieron algo juntos.</h2>
              <p className="mesa-lead">
                Grupos cerrados, votos en secreto y azar cuando nadie se anima a
                elegir. Menos ruido, más planes que salen.
              </p>
            </div>
            <div className="mesa-split-visual mesa-visual-block" aria-hidden="true">
              <strong>Voto secreto · Azar</strong>
              <span>Deciden sin presión del chat grupal.</span>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="mesa-footer mx-auto w-full max-w-5xl">
        <Reveal>
          <h2>Armá el grupo y dejá de pelear el finde en el chat.</h2>
          <p>Creás tu cuenta, invitás a tu gente y arrancan el catálogo.</p>
          <div className="mesa-cta-row" style={{ paddingLeft: 0, paddingTop: "1.25rem" }}>
            <button
              type="button"
              className="mesa-btn-primary"
              onClick={() => router.push("/enter")}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              className="mesa-btn-ghost"
              onClick={() => router.push("/discover")}
            >
              Ver Descubrir
            </button>
          </div>
        </Reveal>
      </footer>
    </main>
  );
}
