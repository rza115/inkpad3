import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server client — dipakai di server components & server actions.
// `cookies()` async di Next.js versi ini, jadi factory ini juga async.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari server component (tanpa akses tulis cookie) —
            // aman diabaikan selama proxy.ts me-refresh session.
          }
        },
      },
    }
  );
}
