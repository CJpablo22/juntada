"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Apple, Mail, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-chip";
import {
  isValidUsernameFormat,
  normalizeUsername,
} from "@/lib/display-name";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";
type Channel = "email" | "phone" | "apple";

const cloudConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function EnterForm() {
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
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [channel, setChannel] = useState<Channel>("email");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [phone, setPhone] = useState("+34 ");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const nextPath = searchParams.get("next") || "/app";

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      setError("No se pudo validar la sesión. Probá de nuevo.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!ready || !currentUser) return;
    if (!currentUser.profileComplete) {
      router.replace("/app/onboarding");
      return;
    }
    router.replace(nextPath.startsWith("/") ? nextPath : "/app");
  }, [ready, currentUser, router, nextPath]);

  function goAfterAuth(profileComplete: boolean) {
    router.push(profileComplete ? nextPath : "/app/onboarding");
  }

  async function onSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    const uname = normalizeUsername(username);
    if (!isValidUsernameFormat(uname)) {
      setError("Usuario: 3–20 caracteres, solo letras, números, . y _");
      return;
    }
    if (!email.includes("@")) {
      setError("El correo es obligatorio y tiene que ser válido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!cloudConfigured) {
      signInWithEmail({ email, name: uname });
      goAfterAuth(false);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data: available, error: availErr } = await supabase.rpc(
        "is_username_available",
        { p_username: uname },
      );
      if (availErr) {
        setError(availErr.message);
        return;
      }
      if (!available) {
        setError("Ese nombre de usuario ya está tomado.");
        return;
      }

      const { data, error: signErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { username: uname, name: uname },
        },
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      if (!data.session) {
        setInfo(
          "Cuenta creada. Si Supabase pide confirmar el correo, mirá tu bandeja; si no, iniciá sesión.",
        );
        setMode("login");
        setLoginId(email.trim().toLowerCase());
        return;
      }
      goAfterAuth(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    const id = loginId.trim();
    if (!id || password.length < 1) {
      setError("Completá usuario/correo y contraseña.");
      return;
    }

    if (!cloudConfigured) {
      if (id.includes("@")) signInWithEmail({ email: id });
      else signInWithEmail({ email: `${id}@demo.local`, name: id });
      goAfterAuth(true);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      let emailToUse = id.toLowerCase();
      if (!id.includes("@")) {
        const { data: resolved, error: resolveErr } = await supabase.rpc(
          "login_email_for_username",
          { p_username: normalizeUsername(id) },
        );
        if (resolveErr || !resolved) {
          setError("No encontramos ese usuario.");
          return;
        }
        emailToUse = String(resolved);
      }

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      // AppProvider escucha SIGNED_IN y carga perfil; onboarding lo decide el layout
      router.push("/app");
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  function onPhone(e: FormEvent) {
    e.preventDefault();
    if (cloudConfigured) {
      setError(
        "Teléfono/SMS queda pendiente (coste). Por ahora registrate con correo + usuario.",
      );
      return;
    }
    signInWithPhone({ phone });
    goAfterAuth(false);
  }

  function onApple() {
    if (cloudConfigured) {
      setError(
        "Apple / iCloud queda pendiente (cuenta Developer de pago). Usá correo + usuario.",
      );
      return;
    }
    signInWithApple();
    goAfterAuth(false);
  }

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col px-4 py-6 sm:px-5 sm:py-8">
      <Link href="/" className="w-fit">
        <Logo />
      </Link>

      <div className="mt-8 sm:mt-10">
        <h1 className="type-display text-2xl text-[var(--ink)] sm:text-3xl">
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--mute)] sm:text-base">
          Obligatoria. Usuario único + correo + contraseña. Teléfono y Apple
          llegan después; el correo siempre queda asociado.
        </p>
      </div>

      <div className="mt-6 flex gap-1 border-b border-[var(--line)]">
        {(
          [
            { id: "login" as const, label: "Entrar" },
            { id: "signup" as const, label: "Registrarse" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setMode(item.id);
              setError("");
              setInfo("");
            }}
            className={cn(
              "flex-1 px-2 py-2.5 text-sm font-semibold",
              mode === item.id
                ? "border-b-2 border-[var(--ink)] text-[var(--ink)]"
                : "text-[var(--mute)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-1 border-b border-[var(--line)]">
        {(
          [
            { id: "email" as const, label: "Correo", icon: Mail },
            { id: "phone" as const, label: "Teléfono", icon: Phone },
            { id: "apple" as const, label: "Apple", icon: Apple },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setChannel(item.id);
              setError("");
            }}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold sm:text-sm",
              channel === item.id
                ? "border-b-2 border-[var(--pop)] text-[var(--ink)]"
                : "text-[var(--mute)]",
            )}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="surface-panel mt-4 space-y-4 p-4">
        {channel === "email" && mode === "signup" ? (
          <form onSubmit={onSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu_usuario"
                className="field-input"
                autoComplete="username"
                required
              />
              <p className="text-xs text-[var(--mute)]">
                Único. Nadie más puede tener el mismo @.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo (obligatorio)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@email.com"
                className="field-input"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}
            {info ? <p className="text-sm text-[var(--ink)]">{info}</p> : null}
            <Button type="submit" disabled={busy} className="h-10 w-full">
              {busy ? "Creando…" : "Crear cuenta"}
            </Button>
          </form>
        ) : null}

        {channel === "email" && mode === "login" ? (
          <form onSubmit={onLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="loginId">Usuario o correo</Label>
              <Input
                id="loginId"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="@usuario o vos@email.com"
                className="field-input"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loginPassword">Contraseña</Label>
              <Input
                id="loginPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}
            {info ? <p className="text-sm text-[var(--ink)]">{info}</p> : null}
            <Button type="submit" disabled={busy} className="h-10 w-full">
              {busy ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        ) : null}

        {channel === "phone" ? (
          <form onSubmit={onPhone} className="space-y-4">
            <p className="text-sm text-[var(--mute)]">
              SMS real queda pendiente (coste). Igual vas a necesitar un correo
              asociado a la cuenta.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Número</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="field-input"
                disabled={cloudConfigured}
              />
            </div>
            {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}
            <Button
              type="submit"
              className="h-10 w-full"
              disabled={cloudConfigured}
            >
              Continuar con teléfono
            </Button>
          </form>
        ) : null}

        {channel === "apple" ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--mute)]">
              Sign in with Apple / iCloud pendiente (cuenta Developer). El correo
              asociado se pedirá igual.
            </p>
            {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}
            <Button
              type="button"
              onClick={onApple}
              className="h-10 w-full bg-black text-white hover:bg-black/90"
              disabled={cloudConfigured}
            >
              <Apple className="size-4" />
              Continuar con Apple
            </Button>
          </div>
        ) : null}
      </div>

      {!cloudConfigured ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm font-semibold text-[var(--ink)]">
            Demo local
          </p>
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {state.users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  signInAs(user.id);
                  goAfterAuth(user.profileComplete);
                }}
                className="flex w-full items-center justify-between py-3 text-left hover:bg-white/50"
              >
                <span className="flex items-center gap-3">
                  <UserAvatar user={user} />
                  <span>
                    <span className="block font-medium text-[var(--ink)]">
                      {user.name}
                      {user.username ? (
                        <span className="ml-1 text-[var(--mute)]">
                          @{user.username}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-[var(--mute)]">
                      {user.city}
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
      ) : null}
    </main>
  );
}

export default function EnterPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-10 text-[var(--mute)]">
          Cargando…
        </main>
      }
    >
      <EnterForm />
    </Suspense>
  );
}
