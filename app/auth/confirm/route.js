/** @format */

import createClient from "@/lib/supabase/supabase-server";
import { redirect } from "next/navigation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const redirectTo = request.nextUrl.clone();
  // console.log(redirectTo);
  redirectTo.pathname = next;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      console.log("NotError");
      console.log("Redirect: ", redirectTo);
      return redirect(redirectTo);
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = "error";
  return redirect(redirectTo);
}
