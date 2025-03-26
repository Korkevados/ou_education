/** @format */

"use server";

import createClient from "@/lib/supabase/supabase-server";

// Function to get all target audiences
export async function getTargetAudiences() {
  try {
    console.log("Fetching target audiences");
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    const { data, error } = await supabase
      .from("target_audiences")
      .select("*")
      .order("grade", { ascending: true });

    if (error) {
      console.error("Error fetching target audiences:", error);
      return { error: "שגיאה בטעינת קהלי יעד" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in getTargetAudiences:", error);
    return { error: "שגיאה בטעינת קהלי יעד" };
  }
}

// Function to link material with target audiences
export async function linkMaterialToTargetAudiences(
  materialId,
  targetAudienceIds
) {
  try {
    console.log(
      `Linking material ${materialId} to target audiences:`,
      targetAudienceIds
    );
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    if (!materialId || !targetAudienceIds || targetAudienceIds.length === 0) {
      return { error: "חסרים פרטים לקישור" };
    }

    // Create entries in the junction table
    const entries = targetAudienceIds.map((audienceId) => ({
      material_id: materialId,
      target_audience_id: audienceId,
    }));

    const { error } = await supabase
      .from("material_target_audiences")
      .insert(entries);

    if (error) {
      console.error("Error linking material to target audiences:", error);
      return { error: "שגיאה בקישור החומר לקהלי היעד" };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception in linkMaterialToTargetAudiences:", error);
    return { error: "שגיאה בקישור החומר לקהלי היעד" };
  }
}
