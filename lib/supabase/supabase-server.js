/** @format */
"use server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Creates a Supabase client configured for server-side usage.
 *
 * @async
 * @returns {Promise<Object>} A configured Supabase client instance.
 */
export default async function createClient() {
  // Await the cookies dynamic API
  const cookieStore = await cookies();

  // Return the Supabase client with cookie handlers
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Get all cookies
        async getAll() {
          return cookieStore.getAll();
        },
        // Set multiple cookies
        async setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle errors gracefully
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware refreshes user sessions.
          }
        },
      },
    }
  );
}
