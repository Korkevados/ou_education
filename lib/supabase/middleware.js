/** @format */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  console.log("updateSession - התחלת תהליך עדכון מצב משתמש");
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow unauthenticated users to access "/" and "/verify"
  const publicPaths = [
    "/",
    "/verify",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth",
  ];
  const isPublicPath = publicPaths.some((path) => {
    // Check for an exact match for the root path
    if (path === "/" && request.nextUrl.pathname === "/") {
      return true;
    }
    // Check for paths that start with the specified path (for non-root paths)
    return path !== "/" && request.nextUrl.pathname.startsWith(path);
  });

  if (!user && !isPublicPath) {
    // Redirect to /verify if user is not authenticated and path is not public
    return NextResponse.redirect(new URL("/verify", request.nextUrl));
  }

  // Check role-based access for content approval page
  if (request.nextUrl.pathname.startsWith("/dashboard/content/approve")) {
    if (!user) {
      return NextResponse.redirect(new URL("/verify", request.nextUrl));
    }

    // Get user role from the users table
    const { data: userData, error } = await supabase
      .from("users")
      .select("user_type")
      .eq("supabase_id", user.id)
      .single();

    if (error || !userData) {
      console.error("Error fetching user role:", error);
      return NextResponse.redirect(new URL("/verify", request.nextUrl));
    }

    // Check if user has required role
    if (!["ADMIN", "TRAINING_MANAGER"].includes(userData.user_type)) {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
  }

  return supabaseResponse;
}
