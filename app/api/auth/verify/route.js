/** @format */
import { NextResponse } from "next/server";
import supabase from "@/lib/supabase/supabase";

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();

    // בשלב זה נשתמש בקוד קבוע 123456
    if (otp !== "123456") {
      return NextResponse.json({ error: "קוד לא תקין" }, { status: 400 });
    }

    // בדוק אם המשתמש קיים
    const { data: user, error: userError } = await supabase
      .from("users")
      .select()
      .eq("phone", phone)
      .single();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    if (!user) {
      // צור משתמש חדש
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            phone,
            role: "GUIDE",
            is_active: true,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      return NextResponse.json({ user: newUser });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in verify:", error);
    return NextResponse.json({ error: "שגיאה בתהליך האימות" }, { status: 500 });
  }
}
