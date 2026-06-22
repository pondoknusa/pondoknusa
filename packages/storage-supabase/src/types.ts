export interface SupabaseDiskConfig {
  driver: 'supabase';
  /** Supabase project URL, e.g. https://your-project.supabase.co */
  url: string;
  /** Service role key for server-side storage access */
  key: string;
  bucket: string;
  /** Optional public URL base override for url() */
  publicUrl?: string;
}