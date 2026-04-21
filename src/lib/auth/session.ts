import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthUserWithRole extends AuthUser {
  role: UserRole;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email! };
}

export async function getAuthUserWithRole(): Promise<AuthUserWithRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { id: user.id, email: user.email!, role: profile.role as UserRole };
}
