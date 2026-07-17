// Placeholder — nanti di-generate lewat Supabase CLI:
//   npx supabase gen types typescript --project-id <id> > lib/types/database.ts
// Setelah schema dibuat di Supabase, ganti isi file ini dengan hasil generate.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
