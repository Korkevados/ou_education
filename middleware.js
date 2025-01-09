/** @format */

import { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // "/homepage/:path*",
    // "/profile/:path*",
    // Add other protected routes here
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
