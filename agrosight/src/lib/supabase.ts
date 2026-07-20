import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseEnv() {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
  return { url, anon, configured: Boolean(url && anon) }
}

/** Lazy singleton — null when env not set (localStorage fallback). */
export function getSupabase(): SupabaseClient | null {
  const { url, anon, configured } = getSupabaseEnv()
  if (!configured || !url || !anon) return null
  if (!client) {
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}
