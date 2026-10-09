import { createAdminClient } from "@/lib/supabase/admin";

type CreateNotificationParams = {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string | null;
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId = null,
}: CreateNotificationParams) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId,
    });

  if (error) {
    console.error(
      "Failed to create notification:",
      error.message
    );

    return false;
  }

  return true;
}