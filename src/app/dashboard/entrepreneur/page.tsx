import NotificationBell from "../components/NotificationBell";
import Link from "next/link";
import LogoutButton from "../LogoutButton";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConnectionRequests from "./ConnectionRequests";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VendorDashboard() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  
if (profileError || !profile) {
  console.error("Failed to load profile:", profileError);
  redirect("/login");
}

const role = String(profile.role ?? "").trim().toLowerCase();

if (role !== "vendor" && role !== "entrepreneur") {
  redirect("/dashboard");
}

  // Get Vendor's businesses
  const { data: businesses, error: businessesError } =
    await supabase
      .from("businesses")
      .select(
        `
        id,
        business_name,
        description,
        business_type,
        food_category,
        city,
        state,
        years_of_experience,
        monthly_revenue,
        monthly_expenses,
        funding_required,
        funding_purpose,
        verification_status,
        verification_notes,
        is_active,
        created_at
        
      `)
      
  .eq("entrepreneur_id", user.id)
  .is("archived_at", null)
  .order("created_at", { ascending: false });



  if (businessesError) {
    console.error(
      "Failed to load businesses:",
      businessesError
    );
  }

  const businessList = businesses ?? [];

  const totalBusinesses = businessList.length;

  const verifiedBusinesses = businessList.filter(
    (business) =>
      business.verification_status === "verified"
  ).length;

  const pendingBusinesses = businessList.filter(
    (business) =>
      business.verification_status === "pending" ||
      business.verification_status === "under_review"
  ).length;
    // Get connection requests
  const { data: connectionRequests, error: connectionError } =
    await supabase
      .from("connection_requests")
      .select(`
        id,
        funder_id,
        business_id,
        status,
        funder_message,
        businesses (
          business_name
        )
      `)
      .in(
        "business_id",
        businessList.map((business) => business.id)
      )
      .order("created_at", { ascending: false });

  if (connectionError) {
    console.error(
      "Failed to load connection requests:",
      connectionError
    );
  }

  // Get funder names
  // Get funder names
const formattedConnectionRequests = await Promise.all(
  (connectionRequests ?? []).map(async (request: any) => {
    const { data: funderProfile, error: funderError } =
      await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", request.funder_id)
        .single();

    if (funderError) {
      console.error(
        "Failed to load funder profile:",
        funderError
      );
    }

    return {
      id: request.id,
      funder_id: request.funder_id,
      business_id: request.business_id,
      status: request.status,
      funder_message: request.funder_message,
      business_name:
        request.businesses?.business_name ||
        "Business",
      funder_name:
        funderProfile?.full_name ||
        "Unknown Funder",
    };
  })
);
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              STALLUP
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Welcome, {profile.full_name || "Vendor"} 👋
            </h1>

            <p className="mt-2 text-gray-600">
              Build your business profile, get verified and
              connect with the right funders.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
  {businessList.length === 0 && (

<Link
  href="/dashboard/entrepreneur/business"
  className="rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
>
  Register Business
</Link>
)}





  <div className="flex items-center gap-3">
  <NotificationBell />
  <LogoutButton />
</div>
</div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              My Businesses
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalBusinesses}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Registered businesses
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Verified
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {verifiedBusinesses}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Businesses verified by StallUp
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending Review
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-500">
              {pendingBusinesses}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Awaiting verification
            </p>
          </div>

        </div>

        {/* Business section */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                My Businesses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your registered food businesses and
                track verification status.
              </p>
            </div>

            
{businesses?.length === 0 && (
  <Link
    href="/dashboard/entrepreneur/business"
    className="inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
  >
    Register Business
  </Link>
)}
          </div>

          {businessList.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">🏪</span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No business registered yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Register your business to start the StallUp
                verification and funding journey.
              </p>

              <Link
                href="/dashboard/entrepreneur/business"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Register My Business
              </Link>

            </div>
          ) : (
            <div className="mt-6 space-y-4">

              {businessList.map((business) => (
                <div
                  key={business.id}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">

                    <div>
                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-bold text-gray-900">
                          {business.business_name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            business.verification_status ===
                            "verified"
                              ? "bg-green-100 text-green-700"
                              : business.verification_status ===
                                "rejected"
                              ? "bg-red-100 text-red-700"
                              : business.verification_status ===
                                "flagged"
                              ? "bg-red-100 text-red-700"
                              : business.verification_status ===
                                "under_review"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {business.verification_status
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (letter: string) =>
                              letter.toUpperCase()
                            )}
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {business.food_category || "Food business"}
                        {" • "}
                        {business.city}
                        {business.state
                          ? `, ${business.state}`
                          : ""}
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        {business.description ||
                          "No description provided."}
                      </p>
                    </div>

                    <div className="min-w-[180px]">

                      <p className="text-xs text-gray-500">
                        Funding Required
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        ₹
                        {Number(
                          business.funding_required || 0
                        ).toLocaleString("en-IN")}
                      </p>

                      <p className="mt-3 text-xs text-gray-500">
                        Monthly Revenue
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        ₹
                        {Number(
                          business.monthly_revenue || 0
                        ).toLocaleString("en-IN")}
                      </p>

                    </div>

                  </div>

                  {business.verification_notes && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-500">
                        Verification Note
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {business.verification_notes}
                      </p>
                    </div>
                  )}

                </div>
              ))}

            </div>
          )}

        </div>
        <ConnectionRequests
  requests={formattedConnectionRequests}
/>

        {/* Journey */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Your StallUp Journey
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <JourneyStep
              number="1"
              title="Register"
              description="Create your business profile."
              active={totalBusinesses === 0}
            />

            <JourneyStep
              number="2"
              title="Verify"
              description="Submit information for review."
              active={pendingBusinesses > 0}
            />

            <JourneyStep
              number="3"
              title="Analyze"
              description="Understand your business metrics."
              active={verifiedBusinesses > 0}
            />

            <JourneyStep
              number="4"
              title="Match"
              description="Get matched with funders."
              active={false}
            />

            <JourneyStep
              number="5"
              title="Scale"
              description="Connect and grow."
              active={false}
            />

          </div>

        </div>

      </div>
    </main>
  );
}

function JourneyStep({
  number,
  title,
  description,
  active,
}: {
  number: string;
  title: string;
  description: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-blue-200 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
            active
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {number}
        </div>

        <h3 className="font-semibold text-gray-900">
          {title}
        </h3>

      </div>

      <p className="mt-3 text-xs leading-5 text-gray-500">
        {description}
      </p>
    </div>
  );
}