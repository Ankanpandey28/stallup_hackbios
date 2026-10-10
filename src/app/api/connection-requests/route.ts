
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the user.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // 2. Validate the request body.
    let body: { businessId?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const businessId = body.businessId;

    if (
      typeof businessId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        businessId
      )
    ) {
      return NextResponse.json(
        { error: "A valid business ID is required." },
        { status: 400 }
      );
    }

    // 3. Verify that the user is a funder.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Funder profile not found." },
        { status: 403 }
      );
    }

    if (profile.role !== "funder") {
      return NextResponse.json(
        { error: "Only funders can send connection requests." },
        { status: 403 }
      );
    }

    // 4. Load the business and check its eligibility.
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select(
        "id, business_name, Vendor_id, verification_status, is_active"
      )
      .eq("id", businessId)
      .maybeSingle();

    if (businessError) {
      console.error("Business lookup failed:", businessError.message);

      return NextResponse.json(
        { error: "Could not load the business." },
        { status: 500 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 }
      );
    }

    if (
      business.verification_status !== "verified" ||
      business.is_active !== true
    ) {
      return NextResponse.json(
        { error: "This business is not currently available for funding requests." },
        { status: 409 }
      );
    }

    if (business.Vendor_id === user.id) {
      return NextResponse.json(
        { error: "You cannot request a connection with your own business." },
        { status: 403 }
      );
    }

    // 5. Prevent an existing pending or accepted request.
    const { data: existingConnection, error: existingError } =
      await supabase
        .from("connection_requests")
        .select("id, status")
        .eq("funder_id", user.id)
        .eq("business_id", businessId)
        .in("status", ["pending", "accepted"])
        .limit(1)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Existing connection lookup failed:",
        existingError.message
      );

      return NextResponse.json(
        { error: "Could not check existing connection requests." },
        { status: 500 }
      );
    }

    if (existingConnection) {
      return NextResponse.json(
        {
          error:
            existingConnection.status === "accepted"
              ? "You are already connected to this business."
              : "You already have a pending request for this business.",
        },
        { status: 409 }
      );
    }

    // 6. Create the connection request.
    const { data: connection, error: connectionError } = await supabase
      .from("connection_requests")
      .insert({
        funder_id: user.id,
        business_id: businessId,
        status: "pending",
        funder_message:
          "I am interested in learning more about your business and discussing potential funding opportunities.",
      })
      .select("id, business_id, status")
      .single();

    if (connectionError || !connection) {
      console.error(
        "Connection request insert failed:",
        connectionError?.message
      );

      return NextResponse.json(
        { error: "Failed to create connection request." },
        { status: 500 }
      );
    }

    // 7. Notify the Vendor.
    const notificationCreated = await createNotification({
      userId: business.Vendor_id,
      type: "connection_request",
      title: "New Connection Request",
      message: `${profile.full_name || "A funder"} wants to connect with your business.`,
      relatedId: connection.id,
    });

    if (!notificationCreated) {
      console.error(
        "Connection request was created, but the Vendor notification failed."
      );
    }

    return NextResponse.json(
      {
        success: true,
        connection,
        notificationCreated: Boolean(notificationCreated),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Connection request API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}