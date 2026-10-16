import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import { safeInternalPath } from "@/lib/safe-path";

type Body = {
  id?: string;
  password?: string;
  next?: string;
};

/**
 * Login server-side: si el id es @usuario, resuelve el email con service role
 * (nunca se lo devolvemos al cliente) y abre sesión con cookies.
 */
export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  const password = body.password ?? "";
  if (!id || !password) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let emailToUse = id.toLowerCase();
  if (!id.includes("@")) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "username_login_unavailable",
          message:
            "Login con @usuario no está configurado. Entrá con tu correo o pedile al admin la SERVICE_ROLE en el server.",
        },
        { status: 503 },
      );
    }
    const admin = createAdminClient(supabaseUrl(), serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const username = id.replace(/^@/, "").trim().toLowerCase();
    const { data: row, error } = await admin
      .from("profiles")
      .select("email")
      .ilike("username", username)
      .not("email", "is", null)
      .maybeSingle();
    if (error || !row?.email) {
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 },
      );
    }
    emailToUse = String(row.email).toLowerCase();
  }

  const nextPath = safeInternalPath(body.next, "/app");
  const response = NextResponse.json({ ok: true, next: nextPath });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (signErr) {
    const msg = signErr.message.toLowerCase();
    const confirmed =
      msg.includes("email not confirmed") || msg.includes("not confirmed");
    return NextResponse.json(
      {
        ok: false,
        error: confirmed ? "email_not_confirmed" : "invalid_credentials",
        message: signErr.message,
      },
      { status: 401 },
    );
  }

  return response;
}
