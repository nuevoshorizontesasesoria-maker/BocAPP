import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL no está configurada");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada");
}

// Cliente para frontend y operaciones normales
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Cliente administrador para API Routes
export function getSupabaseAdmin() {

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada");
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey
  );
}
