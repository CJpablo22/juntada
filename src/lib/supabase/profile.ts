import type { User as AuthUser } from "@supabase/supabase-js";
import type { AuthProvider, GroupLocationVisibility, User } from "@/lib/types";
import type { createClient } from "@/lib/supabase/client";

type Supabase = ReturnType<typeof createClient>;

export type ProfileRow = {
  id: string;
  name: string;
  country: string;
  province: string;
  city: string;
  neighborhood: string | null;
  address_line: string | null;
  floor_unit: string | null;
  postal_code: string | null;
  group_location_visibility: Record<string, GroupLocationVisibility> | null;
  email: string | null;
  phone: string | null;
  auth_provider: string;
  avatar_hue: number;
  created_at: string;
  updated_at?: string;
};

/** Cómo entró: email, teléfono o Apple (iCloud). */
export function authProviderFromUser(authUser: AuthUser): AuthProvider {
  const providers = new Set<string>();
  const appProvider = authUser.app_metadata?.provider;
  if (typeof appProvider === "string") providers.add(appProvider.toLowerCase());
  const list = authUser.app_metadata?.providers;
  if (Array.isArray(list)) {
    for (const p of list) {
      if (typeof p === "string") providers.add(p.toLowerCase());
    }
  }
  for (const identity of authUser.identities ?? []) {
    if (identity.provider) providers.add(identity.provider.toLowerCase());
  }

  if (providers.has("apple")) return "apple";
  if (providers.has("phone") || (authUser.phone && !authUser.email)) return "phone";
  if (providers.has("email") || authUser.email) return "email";
  return "email";
}

export function identityFromAuth(authUser: AuthUser): {
  email?: string;
  phone?: string;
  authProvider: AuthProvider;
  suggestedName: string;
} {
  const authProvider = authProviderFromUser(authUser);
  const email =
    authUser.email?.trim().toLowerCase() ||
    (typeof authUser.user_metadata?.email === "string"
      ? authUser.user_metadata.email.trim().toLowerCase()
      : undefined) ||
    undefined;
  const phone =
    authUser.phone?.trim() ||
    (typeof authUser.user_metadata?.phone === "string"
      ? authUser.user_metadata.phone.trim()
      : undefined) ||
    undefined;

  const metaName = authUser.user_metadata?.name ?? authUser.user_metadata?.full_name;
  const suggestedName =
    (typeof metaName === "string" && metaName.trim()) ||
    email?.split("@")[0] ||
    (phone ? `User ${phone.replace(/\D/g, "").slice(-4)}` : "") ||
    "Alguien";

  return { email, phone, authProvider, suggestedName };
}

export function userFromAuth(authUser: AuthUser, base?: Partial<User>): User {
  const identity = identityFromAuth(authUser);
  const hue =
    base?.avatarHue ??
    Math.abs([...authUser.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) %
      360;

  return {
    id: authUser.id,
    name: base?.name?.trim() || identity.suggestedName,
    country: base?.country || "ES",
    province: base?.province || "Madrid",
    city: base?.city || "Madrid",
    neighborhood: base?.neighborhood,
    addressLine: base?.addressLine,
    floorUnit: base?.floorUnit,
    postalCode: base?.postalCode,
    groupLocationVisibility: base?.groupLocationVisibility ?? {},
    email: identity.email,
    phone: identity.phone,
    authProvider: identity.authProvider,
    avatarHue: hue,
    createdAt: base?.createdAt || new Date().toISOString(),
  };
}

export function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name || "Alguien",
    country: row.country || "ES",
    province: row.province || "",
    city: row.city || "",
    neighborhood: row.neighborhood ?? undefined,
    addressLine: row.address_line ?? undefined,
    floorUnit: row.floor_unit ?? undefined,
    postalCode: row.postal_code ?? undefined,
    groupLocationVisibility: row.group_location_visibility ?? {},
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    authProvider: (["email", "phone", "apple", "demo"].includes(row.auth_provider)
      ? row.auth_provider
      : "email") as AuthProvider,
    avatarHue: row.avatar_hue ?? 180,
    createdAt: row.created_at,
  };
}

/**
 * Crea o actualiza el perfil en Postgres con el email / teléfono / Apple
 * con el que acaba de autenticarse. No pisa nombre/ubicación si ya existen.
 */
export async function ensureProfileFromAuth(
  supabase: Supabase,
  authUser: AuthUser,
): Promise<User> {
  const identity = identityFromAuth(authUser);

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (readError) {
    console.error("profiles read", readError.message);
  }

  const existingRow = existing as ProfileRow | null;

  const payload = {
    id: authUser.id,
    name:
      existingRow?.name?.trim() ||
      identity.suggestedName,
    country: existingRow?.country || "ES",
    province: existingRow?.province || "Madrid",
    city: existingRow?.city || "Madrid",
    neighborhood: existingRow?.neighborhood ?? null,
    address_line: existingRow?.address_line ?? null,
    floor_unit: existingRow?.floor_unit ?? null,
    postal_code: existingRow?.postal_code ?? null,
    group_location_visibility: existingRow?.group_location_visibility ?? {},
    email: identity.email ?? existingRow?.email ?? null,
    phone: identity.phone ?? existingRow?.phone ?? null,
    auth_provider: identity.authProvider,
    avatar_hue:
      existingRow?.avatar_hue ??
      Math.abs([...authUser.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) %
        360,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    console.error("profiles upsert", error.message);
    if (existingRow) {
      return {
        ...rowToUser(existingRow),
        email: identity.email ?? existingRow.email ?? undefined,
        phone: identity.phone ?? existingRow.phone ?? undefined,
        authProvider: identity.authProvider,
      };
    }
    return userFromAuth(authUser);
  }

  return rowToUser(data as ProfileRow);
}

export async function updateProfileRow(
  supabase: Supabase,
  userId: string,
  input: {
    name: string;
    country: string;
    province: string;
    city: string;
    neighborhood?: string;
    addressLine?: string;
    floorUnit?: string;
    postalCode?: string;
    groupLocationVisibility?: Record<string, GroupLocationVisibility>;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {
    name: input.name.trim(),
    country: input.country.trim() || "ES",
    province: input.province.trim(),
    city: input.city.trim(),
    neighborhood: input.neighborhood?.trim() || null,
    address_line: input.addressLine?.trim() || null,
    floor_unit: input.floorUnit?.trim() || null,
    postal_code: input.postalCode?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (input.groupLocationVisibility) {
    patch.group_location_visibility = input.groupLocationVisibility;
  }

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);

  if (error) console.error("profiles update", error.message);
}

export function authMethodLabel(provider: AuthProvider): string {
  switch (provider) {
    case "email":
      return "Correo";
    case "phone":
      return "Teléfono";
    case "apple":
      return "Apple / iCloud";
    default:
      return "Demo local";
  }
}
