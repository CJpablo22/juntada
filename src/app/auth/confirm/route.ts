import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Canjea el magic link (token_hash PKCE) y escribe la sesión en cookies
 * sobre la respuesta de redirect (patrón recomendado @supabase/ssr).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextPath = searchParams.get("next") ?? "/app";
  const next = nextPath.startsWith("/") ? nextPath : "/app";

  const success = NextResponse.redirect(new URL(next, origin));
  const failure = NextResponse.redirect(new URL("/enter?error=auth", origin));

  if (!token_hash || !type) {
    return failure;
  }

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          success.cookies.set(name, value, options);
          failure.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          success.headers.set(key, value);
          failure.headers.set(key, value);
        });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    failure.headers.set("x-juntada-auth-error", error.message.slice(0, 120));
    return failure;
  }

  return success;
}
