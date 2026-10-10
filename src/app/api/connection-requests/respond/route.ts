
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, status } = body;

    if (
      typeof requestId !== "string" ||
      !["accepted", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid request ID or status." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch the connection request.
    const { data: connection, error: fetchError } = await admin
      .from("connection_requests")
      .select("id, funder_id, business_id, status")
      .eq("id", requestId)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection request not found." },
        { status: 404 }
      );
    }

    // Verify that the signed-in user owns the business.
    const { data: business, error: businessError } = await admin
      .from("businesses")
      .select("id, Vendor_id, business_name")
      .eq("id", connection.business_id)
      .single();

    if (
      businessError ||
      !business ||
      business.Vendor_id !== user.id
    ) {
      return NextResponse.json(
        { error: "You cannot respond to this request." },
        { status: 403 }
      );
    }

    if (connection.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been answered." },
        { status: 409 }
      );
    }

    const VendorResponse =
      status === "accepted"
        ? "I accept your connection request and would be happy to discuss funding opportunities."
        : "Thank you for your interest. I am not accepting your connection request at this time.";

    // Update the connection request.
    const { data: updated, error: updateError } = await admin
      .from("connection_requests")
      .update({
        status,
        Vendor_response: VendorResponse,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error(
        "Connection response update failed:",
        updateError.message
      );

      return NextResponse.json(
        { error: "Could not update the connection request." },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { error: "This request has already been answered." },
        { status: 409 }
      );
    }

    // Notify the funder.
    const accepted = status === "accepted";

    const notificationCreated = await createNotification({
      userId: connection.funder_id,
      type: accepted
        ? "connection_accepted"
        : "connection_rejected",
      title: accepted
        ? "Connection Request Accepted"
        : "Connection Request Declined",
      message: `${business.business_name}: the Vendor has ${
        accepted ? "accepted" : "declined"
      } your connection request.`,
      relatedId: connection.id,
    });

    if (!notificationCreated) {
      console.error(
        "Connection status updated, but funder notification could not be created."
      );
    }

    return NextResponse.json({
      success: true,
      status,
      notificationCreated,
    });
  } catch (error) {
    console.error(
      "Respond to connection request error:",
      error
    );

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
