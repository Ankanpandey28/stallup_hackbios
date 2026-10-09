import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // Load notifications
    const { data: notifications, error } =
      await supabase
        .from("notifications")
        .select(`
          id,
          type,
          title,
          message,
          related_id,
          is_read,
          created_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Count unread notifications
    const unreadCount =
      notifications?.filter(
        (notification) => !notification.is_read
      ).length ?? 0;

    return NextResponse.json({
      success: true,
      notifications: notifications ?? [],
      unreadCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const notificationId = body.notificationId;

    if (!notificationId) {
      return NextResponse.json(
        {
          error: "Notification ID is required.",
        },
        { status: 400 }
      );
    }

    // Mark notification as read
    const { data, error } =
      await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notificationId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}