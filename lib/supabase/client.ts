import { createBrowserClient } from "@supabase/ssr";

// Browser client — dipakai di client components. Jangan pernah expose lewat
// global/window; selalu import eksplisit dari file ini.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
