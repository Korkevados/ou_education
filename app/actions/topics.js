/** @format */

"use server";

import createClient from "@/lib/supabase/supabase-server";

// Function to get all main topics
export async function getMainTopics() {
  try {
    console.log("Fetching main topics");
    const supabase = createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !session?.session) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    const { data, error } = await supabase
      .from("main_topics")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching main topics:", error);
      return { error: "שגיאה בטעינת נושאים ראשיים" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in getMainTopics:", error);
    return { error: "שגיאה בטעינת נושאים ראשיים" };
  }
}

// Function to get all sub topics
export async function getSubTopics() {
  try {
    console.log("Fetching sub topics");
    const supabase = createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !session?.session) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    const { data, error } = await supabase
      .from("sub_topics")
      .select("*, main_topic:main_topic_id(name)")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching sub topics:", error);
      return { error: "שגיאה בטעינת תתי נושאים" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in getSubTopics:", error);
    return { error: "שגיאה בטעינת תתי נושאים" };
  }
}

// Function to get sub topics by main topic ID
export async function getSubTopicsByMainTopicId(mainTopicId) {
  try {
    console.log(`Fetching sub topics for main topic ID: ${mainTopicId}`);
    const supabase = createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !session?.session) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    if (!mainTopicId) {
      return { error: "יש לציין נושא ראשי" };
    }

    const { data, error } = await supabase
      .from("sub_topics")
      .select("*")
      .eq("main_topic_id", mainTopicId)
      .order("name", { ascending: true });

    if (error) {
      console.error(
        `Error fetching sub topics for main topic ID ${mainTopicId}:`,
        error
      );
      return { error: "שגיאה בטעינת תתי נושאים" };
    }

    return { data };
  } catch (error) {
    console.error(
      `Exception in getSubTopicsByMainTopicId for ID ${mainTopicId}:`,
      error
    );
    return { error: "שגיאה בטעינת תתי נושאים" };
  }
}
