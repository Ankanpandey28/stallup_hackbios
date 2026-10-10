
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

type VerificationStatus = "verified" | "rejected";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    // 1. Authenticate the user.
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to continue." },
        { status: 401 }
      );
    }

    // 2. Verify the user's admin role.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    // 3. Validate the requested decision and notes.
    const body = await request.json();
    const status = body?.status;
    const notes =
      typeof body?.notes === "string" ? body.notes.trim() : "";

    if (status !== "verified" && status !== "rejected") {
      return NextResponse.json(
        { error: "Status must be verified or rejected." },
        { status: 400 }
      );
    }

    if (notes.length > 1000) {
      return NextResponse.json(
        { error: "Verification notes must be 1000 characters or fewer." },
        { status: 400 }
      );
    }

    if (status === "rejected" && !notes) {
      return NextResponse.json(
        { error: "Please provide a reason for rejection." },
        { status: 400 }
      );
    }

    const { businessId } = await params;

    // 4. Load the business using the server-only admin client.
    const admin = createAdminClient();

    const { data: business, error: businessError } = await admin
      .from("businesses")
      .select("id, business_name, Vendor_id, verification_status")
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
      business.verification_status !== "pending" &&
      business.verification_status !== "under_review"
    ) {
      return NextResponse.json(
        { error: "This business is no longer awaiting review." },
        { status: 409 }
      );
    }

    // 5. Save the decision, timestamp, reviewer, and notes.
    const decisionTime = new Date().toISOString();

    const { data: updatedBusiness, error: updateError } = await admin
      .from("businesses")
      .update({
        verification_status: status,
        verification_notes: notes || null,
        verified_at: decisionTime,
        verified_by: user.id,
        updated_at: decisionTime,
      })
      .eq("id", businessId)
      .in("verification_status", ["pending", "under_review"])
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Verification update failed:", updateError.message);
      return NextResponse.json(
        { error: "Could not save the verification decision." },
        { status: 500 }
      );
    }

    if (!updatedBusiness) {
      return NextResponse.json(
        { error: "This business has already been reviewed." },
        { status: 409 }
      );
    }

    // 6. Notify the Vendor after a successful update.
    const approved = status === "verified";

    const notificationSent = await createNotification({
      userId: business.Vendor_id,
      type: approved ? "business_verified" : "business_rejected",
      title: approved ? "Business Verified" : "Business Rejected",
      message: approved
        ? `${business.business_name} has been verified and approved on StallUp.`
        : `${business.business_name} was rejected. Reason: ${notes}`,
      relatedId: business.id,
    });

    return NextResponse.json({
      success: true,
      status,
      notificationSent,
    });
  } catch (error) {
    console.error("Verification API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}