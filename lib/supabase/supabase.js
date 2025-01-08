/** @format */

import { createBrowserClient } from "@supabase/ssr";

export default async function createSupaClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createBrowserClient(supabaseUrl, supabaseKey);
}
